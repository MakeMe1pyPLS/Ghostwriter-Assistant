// Vercel function entry. script/build-api.mjs bundles this file to
// dist/fn/server.cjs, and api/index.mjs hands every /api/* request to it.
// The Express app is built once per warm instance and reused.
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./app";

let ready: ReturnType<typeof createApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= createApp();
  const { app } = await ready;
  return (app as any)(req, res);
}
