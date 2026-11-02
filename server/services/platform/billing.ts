// Stripe billing over Stripe's REST API (no SDK).
//
// Checkout builds each plan's price from client/src/lib/pricing.ts, so there's
// nothing to create in the Stripe dashboard except the webhook. The webhook is
// the only thing that changes a customer's plan.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PRICING_TIERS } from '../../../client/src/lib/pricing';
import { config, HttpError } from './config';
import { admin, getBillingProfile, updateProfile, type SignedInUser } from './supabase-admin';

export type Billing = 'monthly' | 'yearly';
const PAID = ['starter', 'professional', 'business'] as const;
type PaidPlan = (typeof PAID)[number];
const TRIAL_DAYS = 14;

function requireStripe() {
  if (!config.stripeSecretKey || !config.serviceRoleKey) {
    throw new HttpError(503, 'Payments aren’t switched on yet.', 'not_configured');
  }
}

/** Stripe wants form encoding with brackets for nested fields. */
function form(obj: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? form(item as any, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === 'object') form(v as any, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(path: string, body?: Record<string, unknown>, method = 'POST'): Promise<any> {
  requireStripe();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${config.stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? form(body).toString() : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[stripe] ${path} → ${res.status}: ${json?.error?.message ?? ''}`);
    throw new HttpError(502, 'Stripe didn’t accept that. Try again in a moment.', 'stripe_error');
  }
  return json;
}

function returnBase(originHeader?: string): string {
  if (config.appUrl) return config.appUrl;
  if (originHeader && /^https:\/\/[a-z0-9.-]+$/i.test(originHeader)) return originHeader;
  throw new HttpError(500, 'APP_URL isn’t set on the server.', 'not_configured');
}

async function customerFor(user: SignedInUser): Promise<string> {
  const p = await getBillingProfile(user.id);
  if (!p) throw new HttpError(404, 'Your account profile is missing. Sign out and back in.', 'no_profile');
  if (p.stripe_customer_id) return p.stripe_customer_id;
  const c = await stripe('/customers', { email: user.email || undefined, metadata: { user_id: user.id } });
  await updateProfile(user.id, { stripe_customer_id: c.id });
  return c.id;
}

export async function createCheckout(user: SignedInUser, planId: string, billing: Billing, origin?: string): Promise<string> {
  requireStripe();
  const tier = PRICING_TIERS.find((t) => t.id === planId);
  if (!tier || !PAID.includes(planId as PaidPlan) || tier.price == null || tier.priceAnnual == null) {
    throw new HttpError(400, 'Pick Starter, Professional or Business. Enterprise is set up with you directly.', 'bad_plan');
  }
  const profile = await getBillingProfile(user.id);
  if (profile?.subscription_status && ['active', 'trialing', 'past_due'].includes(profile.subscription_status)) {
    throw new HttpError(409, 'You already have a plan. Use “Manage billing” to change it.', 'already_subscribed');
  }
  const customer = await customerFor(user);
  // One free trial per account: skip it if they've had a subscription before.
  const hadTrial = !!profile?.subscription_status;
  const base = returnBase(origin);
  const yearly = billing === 'yearly';
  const session = await stripe('/checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round((yearly ? tier.priceAnnual * 12 : tier.price) * 100),
        recurring: { interval: yearly ? 'year' : 'month' },
        product_data: { name: `ChainInsideIQ ${tier.name}`, metadata: { plan_id: tier.id } },
      },
    }],
    subscription_data: {
      ...(hadTrial ? {} : { trial_period_days: TRIAL_DAYS }),
      metadata: { user_id: user.id, plan_id: tier.id, billing },
    },
    metadata: { user_id: user.id, plan_id: tier.id, billing },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/pricing?plan=${tier.id}&billing=${billing}`,
  });
  return session.url as string;
}

export async function createPortal(user: SignedInUser, origin?: string): Promise<string> {
  requireStripe();
  const p = await getBillingProfile(user.id);
  if (!p?.stripe_customer_id) throw new HttpError(400, 'You don’t have a paid plan yet.', 'no_customer');
  const s = await stripe('/billing_portal/sessions', { customer: p.stripe_customer_id, return_url: `${returnBase(origin)}/settings#billing` });
  return s.url as string;
}

// ---------------------------------------------------------------- webhook

/** Checks the Stripe-Signature header against the raw body. Throws if it doesn't match. */
export function verifyWebhook(raw: Buffer, header: string | undefined, now = Date.now()): any {
  if (!config.stripeWebhookSecret) throw new HttpError(503, 'Webhook secret not set.', 'not_configured');
  const parts = Object.fromEntries((header || '').split(',').map((p) => p.split('=') as [string, string]).filter((x) => x.length === 2));
  const t = Number(parts.t);
  const sigs = (header || '').split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length) throw new HttpError(400, 'Missing signature.', 'bad_signature');
  if (Math.abs(now / 1000 - t) > 300) throw new HttpError(400, 'Signature too old.', 'bad_signature');
  const expected = createHmac('sha256', config.stripeWebhookSecret).update(`${t}.`).update(raw).digest('hex');
  const ok = sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) throw new HttpError(400, 'Signature doesn’t match.', 'bad_signature');
  return JSON.parse(raw.toString('utf8'));
}

/** Stripe status → the plan the app should use. Lapsed subscriptions fall back to an (expired) trial. */
export function planFor(status: string, planId: string | undefined): string {
  if (['active', 'trialing', 'past_due'].includes(status) && PAID.includes(planId as PaidPlan)) return planId!;
  return 'trial';
}

async function alreadyHandled(eventId: string): Promise<boolean> {
  // The unique key on event_id makes this the idempotency guard: a replayed event is ignored.
  const rows = await admin('/rest/v1/billing_events', {
    method: 'POST',
    query: { on_conflict: 'event_id' },
    body: { event_id: eventId },
    prefer: 'resolution=ignore-duplicates,return=representation',
  });
  return !rows?.length;
}

async function userForCustomer(customerId: string): Promise<string | null> {
  const rows = await admin('/rest/v1/profiles', { query: { select: 'id', stripe_customer_id: `eq.${customerId}` } });
  return rows?.[0]?.id ?? null;
}

export async function handleWebhookEvent(event: any): Promise<string> {
  if (!event?.id || !event?.type) return 'ignored';
  const relevant = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];
  if (!relevant.includes(event.type)) return 'ignored';
  if (await alreadyHandled(event.id)) return 'duplicate';
  const obj = event.data?.object ?? {};

  if (event.type === 'checkout.session.completed') {
    const userId = obj.client_reference_id || obj.metadata?.user_id;
    if (userId && obj.customer) await updateProfile(userId, { stripe_customer_id: obj.customer });
    return 'linked';
  }

  // customer.subscription.*
  const userId = obj.metadata?.user_id || (obj.customer ? await userForCustomer(obj.customer) : null);
  if (!userId) return 'no_user';
  const status = event.type === 'customer.subscription.deleted' ? 'canceled' : String(obj.status || '');
  const planId = obj.metadata?.plan_id;
  const interval = obj.items?.data?.[0]?.price?.recurring?.interval;
  await updateProfile(userId, {
    plan: planFor(status, planId),
    subscription_status: status,
    current_period_end: obj.current_period_end
      ? new Date(obj.current_period_end * 1000).toISOString()
      : obj.items?.data?.[0]?.current_period_end ? new Date(obj.items.data[0].current_period_end * 1000).toISOString() : null,
    billing_interval: interval === 'year' ? 'yearly' : interval === 'month' ? 'monthly' : null,
  } as any);
  return 'updated';
}
