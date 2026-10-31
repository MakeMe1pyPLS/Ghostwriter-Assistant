// Server-side database access and sign-in checks, over Supabase's REST API
// (no SDK needed).
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { config, HttpError } from './config';

export interface SignedInUser { id: string; email: string }

// Short cache so one page load's several API calls don't each re-check the token.
const seen = new Map<string, { user: SignedInUser; until: number }>();

/** The signed-in user behind the request's bearer token, or null if there isn't one. */
export async function optionalUser(req: Request): Promise<SignedInUser | null> {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token || token.length > 4096) return null;
  const k = createHash('sha256').update(token).digest('hex');
  const hit = seen.get(k);
  if (hit && hit.until > Date.now()) return hit.user;
  try {
    const res = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const u = await res.json();
    if (!u?.id) return null;
    const user = { id: String(u.id), email: String(u.email || '') };
    if (seen.size > 500) seen.clear();
    seen.set(k, { user, until: Date.now() + 60_000 });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(req: Request): Promise<SignedInUser> {
  const u = await optionalUser(req);
  if (!u) throw new HttpError(401, 'Sign in to do that.', 'signed_out');
  return u;
}

/** REST call with the service-role key. Bypasses row-level security, so only call it for the signed-in user's own rows. */
export async function admin(path: string, init: { method?: string; body?: unknown; query?: Record<string, string>; prefer?: string } = {}): Promise<any> {
  if (!config.serviceRoleKey) throw new HttpError(503, 'The database connection isn’t set up yet.', 'not_configured');
  const url = new URL(`${config.supabaseUrl}${path}`);
  for (const [k, v] of Object.entries(init.query || {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init.method || 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[db] ${init.method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 300)}`);
    throw new HttpError(502, 'The database didn’t accept that. Try again in a moment.', 'db_error');
  }
  return text ? JSON.parse(text) : null;
}

export interface BillingProfile {
  id: string;
  plan: string;
  trial_started_at: string;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  billing_interval: string | null;
}

export async function getBillingProfile(userId: string): Promise<BillingProfile | null> {
  const rows = await admin('/rest/v1/profiles', {
    query: { select: 'id,plan,trial_started_at,stripe_customer_id,subscription_status,current_period_end,billing_interval', id: `eq.${userId}` },
  });
  return rows?.[0] ?? null;
}

export async function updateProfile(userId: string, patch: Partial<BillingProfile>): Promise<void> {
  await admin('/rest/v1/profiles', { method: 'PATCH', query: { id: `eq.${userId}` }, body: patch, prefer: 'return=minimal' });
}
