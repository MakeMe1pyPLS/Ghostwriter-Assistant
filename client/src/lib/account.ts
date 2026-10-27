// Account, billing and AI-key calls to our API, plus the small bits of
// browser state they need (a checkout someone started before signing up).
import { apiJson, ApiError } from '@/lib/api';
import { getSession } from '@/lib/supabase';
import { useDashboardStore, type PlanTier } from '@/hooks/use-dashboard-store';

export type Billing = 'monthly' | 'yearly';
export type PaidPlan = 'starter' | 'professional' | 'business';
export type EngineId = 'claude' | 'openai' | 'gemini';

export interface AccountStatus {
  plan: PlanTier;
  trialStartedAt: string | null;
  subscription: { status: string; renewsAt: string | null; interval: Billing | null } | null;
  usage: { month: string; used: number; limit: number | null };
  ready: { payments: boolean; ownKeys: boolean; stripeMode: 'test' | 'live' | null };
}

export interface ConnectedKey {
  provider: EngineId;
  label: string;
  connected: boolean;
  last4: string | null;
  model: string | null;
  addedAt: string | null;
  defaultModel: string;
}

const PLANS: PlanTier[] = ['trial', 'starter', 'professional', 'business', 'enterprise'];

export async function getAccountStatus(): Promise<AccountStatus> {
  const s = await apiJson<AccountStatus>('GET', '/api/me/status');
  // Keep the app's plan in step with what billing says.
  if (PLANS.includes(s.plan)) {
    const { currentUser, setPlan } = useDashboardStore.getState();
    if (currentUser && currentUser.plan !== s.plan) setPlan(s.plan);
  }
  return s;
}

// ---- checkout

const PENDING_KEY = 'ciq_pending_checkout';

export function rememberCheckout(plan: PaidPlan, billing: Billing) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ plan, billing, at: Date.now() })); } catch { /* ignore */ }
}
export function pendingCheckout(): { plan: PaidPlan; billing: Billing } | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    return v && Date.now() - v.at < 6 * 3600_000 ? { plan: v.plan, billing: v.billing } : null;
  } catch { return null; }
}
export function clearPendingCheckout() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

export type CheckoutResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'sign-up' }
  | { kind: 'not-ready' }
  | { kind: 'already' }
  | { kind: 'error'; message: string };

/** Starts Stripe Checkout, or says what has to happen first. */
export async function startCheckout(plan: PaidPlan, billing: Billing): Promise<CheckoutResult> {
  if (!getSession()) { rememberCheckout(plan, billing); return { kind: 'sign-up' }; }
  try {
    const { url } = await apiJson<{ url: string }>('POST', '/api/billing/checkout', { plan, billing });
    clearPendingCheckout();
    return { kind: 'redirect', url };
  } catch (e) {
    const err = e as ApiError;
    if (err.code === 'signed_out') { rememberCheckout(plan, billing); return { kind: 'sign-up' }; }
    if (err.code === 'not_configured' || err.code === 'no_server') return { kind: 'not-ready' };
    if (err.code === 'already_subscribed') return { kind: 'already' };
    return { kind: 'error', message: err.message };
  }
}

export async function openBillingPortal(): Promise<string> {
  const { url } = await apiJson<{ url: string }>('POST', '/api/billing/portal');
  return url;
}

// ---- customers' own AI keys

export const listAiKeys = () => apiJson<{ keys: ConnectedKey[]; ready: boolean }>('GET', '/api/ai/keys');
export const saveAiKey = (provider: EngineId, key: string, model?: string) =>
  apiJson<{ keys: ConnectedKey[] }>('PUT', `/api/ai/keys/${provider}`, { key, model: model || undefined }, 45_000);
export const removeAiKey = (provider: EngineId) => apiJson<{ keys: ConnectedKey[] }>('DELETE', `/api/ai/keys/${provider}`);

/** Where each provider's keys are made, for the "Get a key" links. */
export const KEY_HELP: Record<EngineId, { url: string; looksLike: string }> = {
  claude: { url: 'https://console.anthropic.com/settings/keys', looksLike: 'sk-ant-…' },
  openai: { url: 'https://platform.openai.com/api-keys', looksLike: 'sk-…' },
  gemini: { url: 'https://aistudio.google.com/app/apikey', looksLike: 'AIza…' },
};
