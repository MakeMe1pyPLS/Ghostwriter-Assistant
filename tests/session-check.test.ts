// A browser can hold a session that Supabase has already ended (password reset, sign-out elsewhere).
// verifySession must notice, renew when it can, and sign out here when it can't, never when merely offline.
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
const session = (token: string) => JSON.stringify({ accessToken: token, refreshToken: 'r-' + token, expiresAt: Math.floor(Date.now() / 1000) + 3000, user: { id: 'u1', email: 'a@b.c', emailConfirmed: true, fullName: '', createdAt: 0 } });
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let userStatus = 200; let refreshStatus = 200; let offline = false; const calls: string[] = [];
(globalThis as any).fetch = async (url: string) => {
  calls.push(String(url));
  if (offline) throw new TypeError('fetch failed');
  if (String(url).includes('/auth/v1/user')) return userStatus === 200 ? reply(200, { id: 'u1' }) : reply(userStatus, { code: userStatus, error_code: 'session_not_found', msg: 'Session from session_id claim in JWT does not exist' });
  if (String(url).includes('grant_type=refresh_token')) return refreshStatus === 200 ? reply(200, { access_token: 'new', refresh_token: 'r-new', expires_in: 3600, user: { id: 'u1', email: 'a@b.c' } }) : reply(refreshStatus, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
  return reply(404, {});
};

async function main() {
  store.set('ciq_session', session('old'));
  const m = await import('../client/src/lib/supabase');
  let changes = 0; m.onSessionChange(() => { changes++; });

  // 1. A healthy session is left alone.
  let s = await m.verifySession(true);
  ok(s?.accessToken === 'old' && m.getSession()?.accessToken === 'old', 'a working session is kept');

  // Unforced checks are throttled: right after a check, no new call to Supabase.
  const callsBefore = calls.length; await m.verifySession();
  ok(calls.length === callsBefore, 'unforced checks are throttled to one every 30 seconds');

  // 2. Offline keeps the session (no sign-out for a bad connection).
  offline = true; s = await m.verifySession(true); offline = false;
  ok(s?.accessToken === 'old' && !!m.getSession(), 'offline does not sign you out');

  // 3. Access token rejected but the refresh token works: a new token is stored.
  userStatus = 403; refreshStatus = 200;
  s = await m.verifySession(true);
  ok(s?.accessToken === 'new' && m.getSession()?.accessToken === 'new', 'a rejected token is renewed from the refresh token', m.getSession());

  // 4. Session ended on the server (password reset): refresh fails too, so this browser signs out.
  const before = changes; refreshStatus = 400;
  s = await m.verifySession(true);
  ok(s === null && m.getSession() === null && !store.has('ciq_session'), 'a dead session signs out here', { s });
  ok(changes > before, 'listeners hear about the sign-out');

  if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll session checks passed');
}
main();
