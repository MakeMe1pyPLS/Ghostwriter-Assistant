// A small Supabase client built on fetch: email + password auth and the REST
// API for our two tables. It covers exactly what the app uses, adds no bundle
// weight, and keeps the session in localStorage like supabase-js does.
//
// The URL and publishable key are public by design (they ship to every
// browser); row-level security in the database is what protects data. Override
// them with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY, or set
// VITE_SUPABASE_URL to "off" to run without accounts (browser-only mode).

const ENV_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const ENV_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const SUPABASE_URL = ENV_URL === 'off' ? '' : (ENV_URL || 'https://bjqgdosujsttghbddhrf.supabase.co');
const SUPABASE_KEY = ENV_KEY || 'sb_publishable_JL023gIP2GjxDYj3C_EKRw_ycS38OG-';

/** True when accounts are available. When false the app keeps everything in the browser, as before. */
export const cloudEnabled = !!SUPABASE_URL && !!SUPABASE_KEY;

const SESSION_KEY = 'ciq_session';

export interface CloudUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  fullName: string;
  createdAt: number;
}

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  /** epoch seconds */
  expiresAt: number;
  user: CloudUser;
}

export class CloudError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
  }
}

function toUser(u: any): CloudUser {
  return {
    id: u.id,
    email: u.email ?? '',
    emailConfirmed: !!(u.email_confirmed_at || u.confirmed_at),
    fullName: u.user_metadata?.full_name ?? '',
    createdAt: u.created_at ? Date.parse(u.created_at) : Date.now(),
  };
}

function toSession(d: any): CloudSession {
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresAt: d.expires_at ?? Math.floor(Date.now() / 1000) + (Number(d.expires_in) || 3600),
    user: toUser(d.user),
  };
}

// ------------------------------------------------------------------ session storage

let current: CloudSession | null = readSession();
const listeners = new Set<(s: CloudSession | null) => void>();

function readSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CloudSession) : null;
  } catch { return null; }
}

function writeSession(s: CloudSession | null) {
  current = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* private mode: the session lasts for this tab only */ }
  listeners.forEach((l) => l(s));
}

export function getSession(): CloudSession | null { return current; }
export function onSessionChange(fn: (s: CloudSession | null) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Another tab signed in or out: follow it.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SESSION_KEY) return;
    current = readSession();
    listeners.forEach((l) => l(current));
  });
}

// ------------------------------------------------------------------ requests

async function request(path: string, init: RequestInit & { auth?: boolean; query?: Record<string, string> } = {}): Promise<any> {
  if (!cloudEnabled) throw new CloudError('Accounts are not available', 'disabled', 0);
  const url = new URL(SUPABASE_URL + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(init.headers as Record<string, string> ?? {}) };
  if (init.auth) {
    const s = await freshSession();
    if (!s) throw new CloudError('You are signed out', 'no_session', 401);
    headers.Authorization = `Bearer ${s.accessToken}`;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), { ...init, headers });
  } catch {
    throw new CloudError('Can’t reach the server. Check your connection.', 'network', 0);
  }
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const code = body?.error_code ?? body?.code ?? body?.error ?? String(res.status);
    const msg = body?.msg ?? body?.message ?? body?.error_description ?? body?.error ?? `Request failed (${res.status})`;
    throw new CloudError(String(msg), String(code), res.status);
  }
  return body;
}

// Refresh the access token shortly before it expires. One refresh at a time.
let refreshing: Promise<CloudSession | null> | null = null;
export async function freshSession(): Promise<CloudSession | null> {
  const s = current;
  if (!s) return null;
  if (s.expiresAt - 60 > Date.now() / 1000) return s;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const d = await request('/auth/v1/token', { method: 'POST', query: { grant_type: 'refresh_token' }, body: JSON.stringify({ refresh_token: s.refreshToken }) });
        const next = toSession(d);
        writeSession(next);
        return next;
      } catch (e) {
        // Only a rejected token signs you out; being offline keeps the session.
        if (e instanceof CloudError && e.status >= 400 && e.status < 500) writeSession(null);
        return e instanceof CloudError && e.code === 'network' ? s : null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

// ------------------------------------------------------------------ auth

const redirect = (path: string) => (typeof window !== 'undefined' ? window.location.origin + path : path);

/** Returns a session when the project doesn't require email confirmation, otherwise null. */
export async function signUp(input: { email: string; password: string; fullName: string }): Promise<CloudSession | null> {
  const d = await request('/auth/v1/signup', {
    method: 'POST',
    query: { redirect_to: redirect('/verify-email') },
    body: JSON.stringify({ email: input.email.trim(), password: input.password, data: { full_name: input.fullName.trim() } }),
  });
  if (d?.access_token) {
    const s = toSession(d);
    writeSession(s);
    return s;
  }
  // Supabase returns a user with no identities when the email is already registered.
  const user = d?.user ?? d;
  if (user && Array.isArray(user.identities) && user.identities.length === 0) {
    throw new CloudError('An account with this email already exists. Sign in instead.', 'user_already_exists', 400);
  }
  return null;
}

export async function signIn(email: string, password: string): Promise<CloudSession> {
  const d = await request('/auth/v1/token', { method: 'POST', query: { grant_type: 'password' }, body: JSON.stringify({ email: email.trim(), password }) });
  const s = toSession(d);
  writeSession(s);
  return s;
}

export async function resendConfirmation(email: string): Promise<void> {
  await request('/auth/v1/resend', { method: 'POST', query: { redirect_to: redirect('/verify-email') }, body: JSON.stringify({ type: 'signup', email: email.trim() }) });
}

export async function sendPasswordReset(email: string): Promise<void> {
  await request('/auth/v1/recover', { method: 'POST', query: { redirect_to: redirect('/reset-password') }, body: JSON.stringify({ email: email.trim() }) });
}

export async function updatePassword(password: string): Promise<void> {
  const d = await request('/auth/v1/user', { method: 'PUT', auth: true, body: JSON.stringify({ password }) });
  if (current && d?.id) writeSession({ ...current, user: toUser(d) });
}

export async function signOut(): Promise<void> {
  try { if (current) await request('/auth/v1/logout', { method: 'POST', auth: true }); } catch { /* sign out locally anyway */ }
  writeSession(null);
}

/**
 * Email links (confirm sign-up, reset password) come back with the session in
 * the URL hash. Call once on load: it stores the session and cleans the URL.
 */
export async function consumeAuthRedirect(): Promise<{ type: string; session?: CloudSession; error?: string } | null> {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const p = new URLSearchParams(window.location.hash.slice(1));
  const error = p.get('error_description') || p.get('error');
  const access = p.get('access_token');
  if (!access && !error) return null;
  const type = p.get('type') ?? 'signup';
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (error) return { type, error: error.replace(/\+/g, ' ') };
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${access}` } });
    if (!res.ok) return { type, error: 'This link is no longer valid. Request a new one.' };
    const user = await res.json();
    const s = toSession({
      access_token: access,
      refresh_token: p.get('refresh_token'),
      expires_at: Number(p.get('expires_at')) || undefined,
      expires_in: p.get('expires_in'),
      user,
    });
    writeSession(s);
    return { type, session: s };
  } catch {
    return { type, error: 'Can’t reach the server. Check your connection and open the link again.' };
  }
}

// ------------------------------------------------------------------ data

export interface ProfileRow { id: string; full_name: string; plan: string; trial_started_at: string; created_at: string }
export interface WorkspaceRow {
  id: string;
  kind: 'own' | 'client';
  name: string;
  meta: Record<string, any>;
  growth: any | null;
  dashboard: any | null;
  updated_at?: string;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const s = await freshSession();
  if (!s) return null;
  const rows = await request('/rest/v1/profiles', { auth: true, query: { select: 'id,full_name,plan,trial_started_at,created_at', id: `eq.${s.user.id}` } });
  return rows?.[0] ?? null;
}

export async function updateProfileName(fullName: string): Promise<void> {
  const s = await freshSession();
  if (!s) return;
  await request('/rest/v1/profiles', { method: 'PATCH', auth: true, query: { id: `eq.${s.user.id}` }, headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ full_name: fullName.slice(0, 120) }) });
}

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  return (await request('/rest/v1/workspaces', { auth: true, query: { select: 'id,kind,name,meta,growth,dashboard,updated_at', order: 'created_at.asc' } })) ?? [];
}

/** Insert or update workspaces. Only the fields present are changed on existing rows. */
export async function upsertWorkspaces(rows: (Partial<WorkspaceRow> & { id: string; kind: 'own' | 'client' })[], opts: { keepalive?: boolean } = {}): Promise<void> {
  const s = await freshSession();
  if (!s || rows.length === 0) return;
  // PostgREST needs the same keys on every row in a batch, so send one request per shape.
  const groups = new Map<string, any[]>();
  for (const r of rows) {
    const row = { owner_id: s.user.id, ...r };
    const shape = Object.keys(row).sort().join(',');
    groups.set(shape, [...(groups.get(shape) ?? []), row]);
  }
  for (const group of groups.values()) {
    await request('/rest/v1/workspaces', {
      method: 'POST', auth: true, keepalive: opts.keepalive,
      query: { on_conflict: 'owner_id,id' },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(group),
    });
  }
}

export async function deleteWorkspaces(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const list = ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',');
  await request('/rest/v1/workspaces', { method: 'DELETE', auth: true, query: { id: `in.(${list})` }, headers: { Prefer: 'return=minimal' } });
}

/** Plain-language versions of Supabase auth errors. */
export function friendly(e: CloudError): string {
  switch (e.code) {
    case 'invalid_credentials': return "Email or password is incorrect.";
    case 'email_not_confirmed': return "Please confirm your email first.";
    case 'user_already_exists': return "An account with this email already exists. Sign in instead.";
    case 'weak_password': return "Choose a stronger password: at least 8 characters with a mix of letters and numbers.";
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return "Too many attempts right now. Please wait a few minutes and try again.";
    case 'network': return e.message;
    default: return e.message || "Something went wrong. Please try again.";
  }
}
