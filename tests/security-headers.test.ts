// The page security headers in vercel.json, and the hash that lets the one inline script in
// client/index.html run under the Content-Security-Policy.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

const cfg = JSON.parse(readFileSync('vercel.json', 'utf8'));
const all = (cfg.headers as any[]).find((h) => h.source === '/(.*)');
ok(!!all, 'a headers rule covers every path');
const get = (k: string): string => (all?.headers as any[] | undefined)?.find((h) => h.key.toLowerCase() === k.toLowerCase())?.value ?? '';

ok(get('X-Content-Type-Options') === 'nosniff', 'nosniff is set');
ok(/^(DENY|SAMEORIGIN)$/.test(get('X-Frame-Options')), 'framing is limited');
ok(get('Referrer-Policy') === 'strict-origin-when-cross-origin', 'referrer policy is set');
ok(/camera=\(\)/.test(get('Permissions-Policy')) && /microphone=\(\)/.test(get('Permissions-Policy')), 'camera and microphone are switched off');

const csp = get('Content-Security-Policy-Report-Only') || get('Content-Security-Policy');
const dir = (n: string) => (csp.split(';').map((s) => s.trim()).find((s) => s.startsWith(n + ' ')) ?? '');
ok(csp.length > 0, 'a Content-Security-Policy is present (report-only until the live site is checked)');
ok(dir('default-src') === "default-src 'self'", "default-src is 'self'");
ok(!/unsafe-eval/.test(csp), 'no unsafe-eval');
ok(!/script-src[^;]*unsafe-inline/.test(csp), 'scripts are not allowed inline in general');
ok(dir('object-src') === "object-src 'none'", 'plugins are off');
ok(/frame-ancestors 'self'/.test(csp) || /^(DENY|SAMEORIGIN)$/.test(get('X-Frame-Options')), 'the app cannot be framed by other sites');
const supa = /SUPABASE_URL = [^\n]*'(https:\/\/[a-z0-9]+\.supabase\.co)'/.exec(readFileSync('client/src/lib/supabase.ts', 'utf8'))?.[1] ?? '';
ok(!!supa && /https:\/\/\*\.supabase\.co/.test(dir('connect-src')), 'sign-in and sync to Supabase are allowed', { supa });

// The inline theme/intro script must match its hash, or a browser enforcing the policy would block it.
const html = readFileSync('client/index.html', 'utf8');
const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
const want = inline ? "'sha256-" + createHash('sha256').update(inline).digest('base64') + "'" : '';
ok(!!inline && dir('script-src').includes(want), 'the hash for the inline script in client/index.html is current', { want });
ok((html.match(/<script>/g) ?? []).length === 1, 'there is still exactly one inline script (add its hash if you add another)');

const app = readFileSync('server/app.ts', 'utf8');
ok(/X-Content-Type-Options/.test(app) && /X-Frame-Options/.test(app), 'the API adds the basic headers when it runs on its own');

if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll security-header checks passed');
