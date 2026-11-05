// Fetch for URLs a customer typed in (API import). Differences from plain fetch():
//  - the host is resolved once, checked, and the connection goes to that exact address,
//    so DNS cannot change its answer between the check and the request (DNS rebinding);
//  - redirects are refused (a redirect could point at an internal address);
//  - a time limit and a size limit on the response.
// The certificate is still checked against the host name in the URL.
import http from 'node:http';
import https from 'node:https';
import { resolvePublicTarget, type ResolvedTarget } from './webhooks';

export interface SafeFetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  /** Replaceable in tests only. Real callers use the default, which refuses private addresses. */
  resolve?: (url: string) => Promise<ResolvedTarget>;
}
export interface SafeFetchResult { status: number; statusText: string; contentType: string; body: string }

export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 15_000;

export async function safeFetch(url: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const target = await (opts.resolve ?? resolvePublicTarget)(url);
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { url: u, address, family } = target;
  const lib = u.protocol === 'https:' ? https : http;

  return new Promise<SafeFetchResult>((resolve, reject) => {
    let done = false;
    const finish = (fn: () => void) => { if (!done) { done = true; clearTimeout(timer); fn(); } };
    const req = lib.request({
      protocol: u.protocol,
      hostname: u.hostname.replace(/^\[|\]$/g, ''),
      port: u.port || undefined,
      path: u.pathname + u.search,
      method: opts.method ?? 'GET',
      headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
      agent: false,
      // Always connect to the address we checked, whatever the name would resolve to now.
      lookup: ((_host: string, options: any, cb: any) => {
        if (options && options.all) cb(null, [{ address, family }]);
        else cb(null, address, family);
      }) as any,
    }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        res.resume();
        return finish(() => reject(new Error('The address redirected somewhere else. Use the final address instead.')));
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (c: Buffer) => {
        size += c.length;
        if (size > maxBytes) {
          res.destroy();
          return finish(() => reject(new Error(`The response is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`)));
        }
        chunks.push(c);
      });
      res.on('end', () => finish(() => resolve({
        status, statusText: res.statusMessage ?? '', contentType: String(res.headers['content-type'] ?? ''),
        body: Buffer.concat(chunks).toString('utf8'),
      })));
      res.on('error', (e) => finish(() => reject(e)));
    });
    const timer = setTimeout(() => { req.destroy(); finish(() => reject(new Error('The request took too long.'))); }, timeoutMs);
    req.on('error', (e) => finish(() => reject(e)));
    req.end();
  });
}
