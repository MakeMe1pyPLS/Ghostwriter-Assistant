// API base URL handling.
// Frontend-only deploys (e.g. Vercel) can point API calls at a separately
// hosted server by setting VITE_API_URL=https://your-api.example.com.
// When unset, requests go to the same origin as the app.

import { freshSession } from '@/lib/supabase';

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

export function apiUrl(path: string): string {
  return path.startsWith('/api/') && API_BASE ? `${API_BASE}${path}` : path;
}

/**
 * Rewrites every fetch('/api/...') in the app to the configured API base, so
 * existing call sites work unchanged in split deployments. No-op when unset.
 */
export function installApiBaseRewrite(): void {
  if (!API_BASE || typeof window === 'undefined') return;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) return original(apiUrl(input), init);
    return original(input, init);
  };
}

/** The signed-in user's token, so the server knows whose plan, keys and usage apply. */
export async function authHeader(): Promise<Record<string, string>> {
  try {
    const s = await freshSession();
    return s?.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : {};
  } catch {
    return {};
  }
}

/** An API error with the server's plain-English message and machine code. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

/** JSON request to our API, signed in when there's a session. Throws ApiError. */
export async function apiJson<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, timeoutMs = 30_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const isJson = (res.headers.get('content-type') || '').includes('json');
    const data = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok || !isJson) {
      const message = data?.error || (res.status === 404 || !isJson ? 'The ChainInsideIQ server isn’t reachable from here.' : `Request failed (${res.status})`);
      throw new ApiError(message, res.status, data?.code ?? (!isJson ? 'no_server' : undefined));
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Couldn’t reach ChainInsideIQ. Check your connection and try again.', 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}

/** POST JSON and parse the JSON reply; throws on network or HTTP errors. */
export async function postJson<T>(path: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('json')) {
      let message = `Request failed (${res.status})`;
      try { const j = await res.json(); message = j.error || j.message || message; } catch { /* not JSON */ }
      throw Object.assign(new Error(message), { status: res.status });
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
