// Every /api/* request is rewritten here (vercel.json); req.url keeps the original path. The server is bundled at build time
// (script/build-api.mjs → dist/fn/server.cjs) because Vercel functions can't
// resolve this project's "@shared/…" import paths on their own.
import server from '../dist/fn/server.cjs';

export default function handler(req, res) {
  return server.default(req, res);
}
