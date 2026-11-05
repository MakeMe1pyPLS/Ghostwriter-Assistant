// API import safety: private-address rules, address pinning (DNS rebinding), redirects, size and time limits.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { isPrivateIp, resolvePublicTarget } from '../server/services/integrations/webhooks';
import { safeFetch } from '../server/services/integrations/safe-fetch';

let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const rejects = async (p: Promise<unknown>) => { try { await p; return null; } catch (e: any) { return String(e.message); } };

(async () => {
  // 1. Which addresses count as private.
  const priv = ['10.0.0.1', '127.0.0.1', '0.0.0.0', '169.254.169.254', '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1', '198.18.0.1', '224.0.0.1', '255.255.255.255',
    '::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', 'febf::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe'];
  const pub = ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '100.63.0.1', '198.20.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'];
  for (const ip of priv) ok(isPrivateIp(ip), `private: ${ip}`);
  for (const ip of pub) ok(!isPrivateIp(ip), `public: ${ip}`);

  // 2. The default resolver refuses private targets and odd URLs (no network needed: literal addresses).
  for (const u of ['http://127.0.0.1/', 'https://169.254.169.254/latest/meta-data', 'http://[::1]:8080/', 'http://10.1.2.3/x', 'http://localhost/', 'https://thing.internal/', 'ftp://example.com/', 'https://user:pw@8.8.8.8/'])
    ok(!!(await rejects(resolvePublicTarget(u))), `refused: ${u}`);
  const good = await resolvePublicTarget('https://8.8.8.8/data.json');
  ok(good.address === '8.8.8.8' && good.family === 4, 'a public literal address is accepted and returned as the one to use', good.address);

  // 3. A local test server stands in for the remote API. Tests pass their own resolver because the
  //    default one (correctly) refuses 127.0.0.1.
  let hits = 0;
  const server = http.createServer((req, res) => {
    hits++;
    if (req.url === '/redirect') { res.writeHead(302, { Location: 'http://127.0.0.1:1/' }); return res.end(); }
    if (req.url === '/big') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('x'.repeat(2_000_000)); }
    if (req.url === '/slow') { return void setTimeout(() => res.end('late'), 2000); }
    res.writeHead(200, { 'Content-Type': 'application/json', 'X-Host': String(req.headers.host) });
    res.end(JSON.stringify({ ok: true, auth: req.headers['x-test'] ?? null }));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  let resolveCalls = 0;
  const resolve = async (url: string) => { resolveCalls++; return { url: new URL(url), address: '127.0.0.1', family: 4 as const }; };

  // Pinning: this host name does not exist in DNS. It only works if the request goes to the address we resolved.
  const r1 = await safeFetch(`http://pinned-host.invalid:${port}/ok`, { resolve, headers: { 'X-Test': 'abc' } });
  ok(r1.status === 200 && JSON.parse(r1.body).auth === 'abc', 'connects to the pinned address, not a fresh lookup of the name', r1);
  ok(resolveCalls === 1, 'host is resolved exactly once per request', resolveCalls);
  ok(r1.body.includes('"ok":true') && r1.contentType.includes('json'), 'returns body and content type');

  ok(/redirected/i.test((await rejects(safeFetch(`http://pinned-host.invalid:${port}/redirect`, { resolve }))) ?? ''), 'redirects are refused');
  ok(/larger than/i.test((await rejects(safeFetch(`http://pinned-host.invalid:${port}/big`, { resolve, maxBytes: 1_000_000 }))) ?? ''), 'a response over the size limit is cut off');
  ok(/too long/i.test((await rejects(safeFetch(`http://pinned-host.invalid:${port}/slow`, { resolve, timeoutMs: 300 }))) ?? ''), 'a slow response times out');

  // The default path refuses a private target before any connection is made.
  const before = hits;
  ok(!!(await rejects(safeFetch(`http://127.0.0.1:${port}/ok`))), 'default safeFetch refuses a private address');
  ok(hits === before, 'and never reaches the private server', { before, hits });

  server.close();
  if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll safe-fetch checks passed');
})();
