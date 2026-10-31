# ChainInsideIQ · Phase 3 changes (accounts, billing, your own AI, Excel and CSV)

Phase 3 gets the business side ready for launch: real plans that are paid through Stripe, an AI that customers can point at their own key, and imports that cope with the files people actually have.

## What changed for customers

### Plans and payments
- **Choose a plan → Stripe Checkout.** Pricing buttons open Stripe's secure checkout page. We never see or store card numbers.
- **14-day free trial, once per account.** The card is charged when the trial ends; cancel any time before then.
- Not signed up yet? Picking a plan takes you to sign-up first, then straight on to checkout.
- **Settings → Billing** shows your plan, when it renews, how many AI answers you've used this month and a **Manage billing** button (Stripe's portal: change card, switch plan, download invoices, cancel).
- After checkout, the confirmation page waits a few seconds for Stripe to confirm, then shows your plan and renewal date.
- If card payments aren't switched on yet, the pricing page says so plainly and offers the free trial (no card needed). There is no fake checkout page any more.

### AI: included, or bring your own key
- Every plan includes AI answers each month: trial 50, Starter 200, Professional 1,000, Business 3,000, Enterprise unlimited.
- **Connect your own Claude, ChatGPT or Gemini key** in Settings → AI engines. We test the key before saving it, store it encrypted (AES-256-GCM) and only ever show its last 4 characters. Answers from your own key don't count toward your allowance.
- You can pick which engine leads and, optionally, which model to use.
- Over your allowance or signed out? The built-in analyst still answers, and a one-time note tells you why.

### Excel and CSV import
- **Excel files with a title above the table** now import correctly. The real header row is found and the title becomes the dataset name.
- **Money, percents and dates are stored as values:** `$12,450.50` → 12450.5, `94.5%` → 94.5, `(1,200)` → -1200, `10/04/2026` → 2026-10-04. Charts and KPIs can use them right away.
- **"Total" rows at the bottom are left out** so totals aren't counted twice.
- A **"Check before you save"** box lists anything the import changed or left out:
  - a CSV row with an unquoted comma (like `Acme, Inc.`) that would have shifted columns
  - formula cells with no saved result
  - which sheet was used when a workbook has several
- Formula cells never show as `[object Object]` any more.

## Behind the scenes
- New API routes: `/api/me/status`, `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook` (Stripe-signed) and `/api/ai/keys`.
- The API now runs on Vercel as a single bundled function (`script/build-api.mjs` → `dist/fn/server.cjs`, served by `api/index.mjs`).
- Database migration `supabase/migrations/20261027_billing_and_ai_keys.sql`: billing fields on `profiles` (users can't edit them), plus `billing_events`, `ai_keys` and `ai_usage` tables, all with row-level security.

## Setup the owner must do before taking payments
Set these in Vercel → Project → Settings → Environment Variables. None of them go in the code.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `KEY_ENCRYPTION_SECRET` (32+ random characters; never change it once keys are saved)
- `STRIPE_SECRET_KEY` (`sk_test_…` until launch) and `STRIPE_WEBHOOK_SECRET`. Point the Stripe webhook at `https://<your domain>/api/billing/webhook` with the events `checkout.session.completed` and `customer.subscription.created/updated/deleted`.
- `APP_URL` (your public address)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` for the included AI. Any one is enough.
- In Stripe, save a Customer portal configuration (Settings → Billing → Customer portal).
