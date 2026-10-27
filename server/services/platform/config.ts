// Server settings for accounts, billing and AI keys. Everything secret comes
// from environment variables (set them in Vercel → Settings → Environment
// Variables). Nothing here is ever sent to the browser.
//
//   SUPABASE_URL                 Same project URL the app uses (public).
//   SUPABASE_PUBLISHABLE_KEY     Same publishable key the app uses (public).
//   SUPABASE_SERVICE_ROLE_KEY    Secret. Lets the server update plans and usage.
//   KEY_ENCRYPTION_SECRET        Secret, 32+ random characters. Encrypts the AI
//                                keys customers connect. Never change it once
//                                customers have saved keys (they would have to
//                                re-enter them).
//   STRIPE_SECRET_KEY            Secret. sk_test_… while testing, sk_live_… later.
//   STRIPE_WEBHOOK_SECRET        Secret. whsec_… from the Stripe webhook you add.
//   APP_URL                      Where checkout returns to, e.g. https://chaininsideiq.ai
//   ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
//                                Your own keys for the AI answers included in plans.

// Keep in step with client/src/lib/supabase.ts.
const DEFAULT_SUPABASE_URL = 'https://bjqgdosujsttghbddhrf.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_JL023gIP2GjxDYj3C_EKRw_ycS38OG-';

const env = (k: string) => (process.env[k] || '').trim();

export const config = {
  supabaseUrl: (env('SUPABASE_URL') || env('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL).replace(/\/$/, ''),
  publishableKey: env('SUPABASE_PUBLISHABLE_KEY') || env('VITE_SUPABASE_PUBLISHABLE_KEY') || DEFAULT_PUBLISHABLE_KEY,
  serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
  encryptionSecret: env('KEY_ENCRYPTION_SECRET'),
  stripeSecretKey: env('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: env('STRIPE_WEBHOOK_SECRET'),
  appUrl: env('APP_URL').replace(/\/$/, ''),
};

/** What's switched on. Safe to show the signed-in owner; never includes values. */
export function readiness() {
  return {
    accounts: !!config.supabaseUrl && !!config.publishableKey,
    database: !!config.serviceRoleKey,
    payments: !!config.stripeSecretKey && !!config.stripeWebhookSecret && !!config.serviceRoleKey,
    ownKeys: !!config.encryptionSecret && !!config.serviceRoleKey,
    stripeMode: config.stripeSecretKey.startsWith('sk_live_') ? 'live' as const : config.stripeSecretKey ? 'test' as const : null,
  };
}

/** An error the API turns into a clean JSON reply with this status. */
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
