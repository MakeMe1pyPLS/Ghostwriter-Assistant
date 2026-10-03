// API base URL handling.
// Frontend-only deploys (e.g. Vercel) can point API calls at a separately
// hosted server by setting VITE_API_URL=https://your-api.example.com.
// When unset, requests go to the same origin as the app.

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

/** POST JSON and parse the JSON reply; throws on network or HTTP errors. */
export async function postJson<T>(path: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
