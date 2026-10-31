// Which AI engines a request may use, and keeping count.
//
//   1. The customer's own key for an engine (if they connected one) always
//      comes first and never counts toward their monthly answers.
//   2. Otherwise our keys answer, up to the plan's monthly allowance.
//   3. Signed-out visitors, and anyone past their allowance without their own
//      key, get the built-in analyst. Nobody ever gets an empty screen.
import type { Request } from 'express';
import { PRICING_TIERS } from '../../../client/src/lib/pricing';
import { configuredEngines, makeAdapter, DEFAULT_MODELS, type LLMEngineId, type EngineAdapter } from '../ai/engines';
import type { EngineSet } from '../ai/intelligence-router';
import { config, HttpError } from './config';
import { admin, getBillingProfile, optionalUser, type SignedInUser } from './supabase-admin';
import { open, seal, last4 } from './secrets';

export const ENGINES: LLMEngineId[] = ['claude', 'openai', 'gemini'];
export const ENGINE_LABEL: Record<LLMEngineId, string> = { claude: 'Claude', openai: 'ChatGPT', gemini: 'Gemini' };

/** Answers included per month. Trials get a taste; Enterprise is set per contract. */
export const TRIAL_ANSWERS = 50;
export function monthlyAllowance(plan: string): number | null {
  if (plan === 'trial') return TRIAL_ANSWERS;
  if (plan === 'enterprise') return null; // unlimited (fair use)
  return PRICING_TIERS.find((t) => t.id === plan)?.aiAnswers ?? TRIAL_ANSWERS;
}

export const thisMonth = (d = new Date()) => d.toISOString().slice(0, 7);

interface StoredKey { provider: LLMEngineId; secret: string; key_last4: string; model: string | null; created_at: string }

async function storedKeys(userId: string): Promise<StoredKey[]> {
  if (!config.serviceRoleKey) return [];
  return (await admin('/rest/v1/ai_keys', { query: { select: 'provider,secret,key_last4,model,created_at', user_id: `eq.${userId}` } })) ?? [];
}

export async function listKeys(userId: string) {
  const rows = await storedKeys(userId);
  return ENGINES.map((id) => {
    const r = rows.find((x) => x.provider === id);
    return { provider: id, label: ENGINE_LABEL[id], connected: !!r, last4: r?.key_last4 ?? null, model: r?.model ?? null, addedAt: r?.created_at ?? null, defaultModel: DEFAULT_MODELS[id] };
  });
}

/** Tries the key with a tiny request before saving it, so a typo shows up now, not mid-analysis. */
export async function testKey(provider: LLMEngineId, key: string, model?: string): Promise<void> {
  const adapter = makeAdapter(provider, key, model);
  try {
    const out = await adapter.complete('Reply with the JSON {"ok":true} and nothing else.', 'ping', 20);
    if (!out) throw new Error('empty reply');
  } catch (e: any) {
    const msg = String(e?.message || e);
    const why = /401|403|invalid|incorrect|unauthor|permission/i.test(msg) ? 'The key was rejected. Check you copied all of it.'
      : /404|model/i.test(msg) ? 'That model isn’t available on this key. Leave the model blank to use the default.'
      : /429|quota|billing|credit/i.test(msg) ? 'The key works, but that account is out of credit or over its rate limit.'
      : 'We couldn’t reach the AI provider with that key. Try again in a moment.';
    throw new HttpError(400, why, 'key_rejected');
  }
}

export async function saveKey(user: SignedInUser, provider: LLMEngineId, key: string, model?: string) {
  const clean = key.trim();
  if (clean.length < 20 || clean.length > 400 || /\s/.test(clean)) throw new HttpError(400, 'That doesn’t look like an API key.', 'bad_key');
  await testKey(provider, clean, model);
  await admin('/rest/v1/ai_keys', {
    method: 'POST',
    query: { on_conflict: 'user_id,provider' },
    body: { user_id: user.id, provider, secret: seal(clean), key_last4: last4(clean), model: model?.trim() || null },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

export async function deleteKey(user: SignedInUser, provider: LLMEngineId) {
  await admin('/rest/v1/ai_keys', { method: 'DELETE', query: { user_id: `eq.${user.id}`, provider: `eq.${provider}` }, prefer: 'return=minimal' });
}

export async function usageFor(userId: string, plan: string) {
  const month = thisMonth();
  let used = 0;
  if (config.serviceRoleKey) {
    const rows = await admin('/rest/v1/ai_usage', { query: { select: 'answers', user_id: `eq.${userId}`, month: `eq.${month}` } });
    used = rows?.[0]?.answers ?? 0;
  }
  return { month, used, limit: monthlyAllowance(plan) };
}

async function countAnswer(userId: string) {
  await admin('/rest/v1/rpc/increment_ai_usage', { method: 'POST', body: { p_user: userId, p_month: thisMonth() } });
}

export interface AiAccess {
  engines: EngineSet;
  /** Call after an answer is sent. Counts it only when our keys produced it. */
  record: (generatedBy: string | undefined) => void;
  /** Shown to the person when they're getting the built-in analyst instead of AI. */
  notice?: 'signed_out' | 'limit_reached';
  /** On "Auto", the customer's own key goes first so it's used before their allowance. */
  ownFirst?: LLMEngineId;
}

const NONE: EngineSet = { claude: null, openai: null, gemini: null };

/** Works out the engines for this request. Never throws: on any problem it falls back safely. */
export async function aiAccessFor(req: Request): Promise<AiAccess> {
  const ours = configuredEngines();
  const user = await optionalUser(req);
  // Running locally with no account system: keep the old behaviour.
  if (!user) {
    const anon = process.env.AI_ALLOW_SIGNED_OUT === 'true' || (!config.serviceRoleKey && process.env.NODE_ENV !== 'production');
    return { engines: anon ? ours : NONE, record: () => {}, notice: anon ? undefined : 'signed_out' };
  }
  try {
    const [keys, profile] = await Promise.all([storedKeys(user.id), getBillingProfile(user.id)]);
    const own: Partial<Record<LLMEngineId, EngineAdapter>> = {};
    for (const k of keys) {
      try { own[k.provider] = makeAdapter(k.provider, open(k.secret), k.model || undefined); } catch { /* unreadable key: skip it */ }
    }
    const plan = profile?.plan || 'trial';
    // Included AI on the free trial lasts 14 days. Someone whose paid plan has
    // ended (cancelled, unpaid) is back on 'trial' with a subscription status,
    // and gets no included AI either; their own keys still work.
    const trialOver = plan === 'trial' && (
      Boolean(profile?.subscription_status)
      || (!!profile?.trial_started_at && Date.now() - new Date(profile.trial_started_at).getTime() > 14 * 86_400_000)
    );
    const { used, limit } = await usageFor(user.id, plan);
    const allowance = !trialOver && (limit === null || used < limit);
    const engines: EngineSet = {
      claude: own.claude ?? (allowance ? ours.claude : null),
      openai: own.openai ?? (allowance ? ours.openai : null),
      gemini: own.gemini ?? (allowance ? ours.gemini : null),
    };
    const ownIds = new Set(Object.keys(own));
    return {
      engines,
      ownFirst: ENGINES.find((id) => ownIds.has(id)),
      notice: !allowance && !ownIds.size ? 'limit_reached' : undefined,
      record: (by) => {
        if (!by || by === 'rule-based' || ownIds.has(by)) return;
        countAnswer(user.id).catch((e) => console.warn('[ai] usage count failed', e?.message ?? e));
      },
    };
  } catch (e: any) {
    console.warn('[ai] access check failed, using built-in analyst', e?.message ?? e);
    return { engines: NONE, record: () => {} };
  }
}
