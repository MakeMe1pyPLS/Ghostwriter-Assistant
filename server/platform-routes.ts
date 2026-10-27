// Accounts, billing and AI-key routes.
//
//   GET    /api/me/status            plan, trial, AI usage, what's switched on
//   POST   /api/billing/checkout     → Stripe Checkout URL
//   POST   /api/billing/portal       → Stripe billing portal URL
//   POST   /api/billing/webhook      Stripe → us (signed)
//   GET    /api/ai/keys              the customer's connected AI keys (last 4 only)
//   PUT    /api/ai/keys/:provider    connect or replace a key (tested before saving)
//   DELETE /api/ai/keys/:provider    remove a key
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { readiness, HttpError } from "./services/platform/config";
import { requireUser, getBillingProfile } from "./services/platform/supabase-admin";
import { createCheckout, createPortal, verifyWebhook, handleWebhookEvent } from "./services/platform/billing";
import { listKeys, saveKey, deleteKey, usageFor, aiAccessFor, ENGINES, TRIAL_ANSWERS } from "./services/platform/ai-access";
import type { LLMEngineId } from "./services/ai/engines";
import { rateLimit } from "./services/rate-limit";

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };

const providerParam = z.enum(ENGINES as [LLMEngineId, ...LLMEngineId[]]);

export function registerPlatformRoutes(app: Express) {
  // Work out each AI request's engines once (own keys, allowance, signed out).
  // routes.ts reads res.locals.ai.
  app.use("/api/ai", (req, res, next) => {
    if (req.method !== "POST") return next();
    aiAccessFor(req).then((access) => { res.locals.ai = access; next(); }, next);
  });

  app.get("/api/me/status", wrap(async (req, res) => {
    const user = await requireUser(req);
    const ready = readiness();
    const profile = ready.database ? await getBillingProfile(user.id) : null;
    const plan = profile?.plan ?? "trial";
    const usage = ready.database ? await usageFor(user.id, plan) : { month: "", used: 0, limit: TRIAL_ANSWERS };
    res.json({
      plan,
      trialStartedAt: profile?.trial_started_at ?? null,
      subscription: profile?.subscription_status
        ? { status: profile.subscription_status, renewsAt: profile.current_period_end, interval: profile.billing_interval }
        : null,
      usage,
      ready: { payments: ready.payments, ownKeys: ready.ownKeys, stripeMode: ready.stripeMode },
    });
  }));

  const checkoutSchema = z.object({ plan: z.enum(["starter", "professional", "business"]), billing: z.enum(["monthly", "yearly"]).default("monthly") });
  app.post("/api/billing/checkout", rateLimit({ windowMs: 60_000, max: 10 }), wrap(async (req, res) => {
    const user = await requireUser(req);
    const body = checkoutSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, "Pick a plan and a billing period.", "bad_request");
    res.json({ url: await createCheckout(user, body.data.plan, body.data.billing, req.headers.origin) });
  }));

  app.post("/api/billing/portal", rateLimit({ windowMs: 60_000, max: 10 }), wrap(async (req, res) => {
    const user = await requireUser(req);
    res.json({ url: await createPortal(user, req.headers.origin) });
  }));

  app.post("/api/billing/webhook", wrap(async (req, res) => {
    const raw = req.rawBody instanceof Buffer ? req.rawBody : Buffer.from(JSON.stringify(req.body ?? {}));
    const event = verifyWebhook(raw, req.headers["stripe-signature"] as string | undefined);
    const result = await handleWebhookEvent(event);
    res.json({ received: true, result });
  }));

  app.get("/api/ai/keys", wrap(async (req, res) => {
    const user = await requireUser(req);
    res.json({ keys: await listKeys(user.id), ready: readiness().ownKeys });
  }));

  const keySchema = z.object({ key: z.string().min(1).max(400), model: z.string().trim().max(80).optional() });
  app.put("/api/ai/keys/:provider", rateLimit({ windowMs: 60_000, max: 10 }), wrap(async (req, res) => {
    const user = await requireUser(req);
    const provider = providerParam.safeParse(req.params.provider);
    const body = keySchema.safeParse(req.body);
    if (!provider.success || !body.success) throw new HttpError(400, "Pick Claude, ChatGPT or Gemini and paste a key.", "bad_request");
    await saveKey(user, provider.data, body.data.key, body.data.model);
    res.json({ keys: await listKeys(user.id) });
  }));

  app.delete("/api/ai/keys/:provider", wrap(async (req, res) => {
    const user = await requireUser(req);
    const provider = providerParam.safeParse(req.params.provider);
    if (!provider.success) throw new HttpError(400, "Unknown AI provider.", "bad_request");
    await deleteKey(user, provider.data);
    res.json({ keys: await listKeys(user.id) });
  }));
}
