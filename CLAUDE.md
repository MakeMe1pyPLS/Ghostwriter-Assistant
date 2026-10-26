# ChainInsideIQ — project brief

Read this before changing anything. It is the "setup" every AI assistant and developer works from. `docs/BRAND.md` holds the visual and motion rules; `shared/analyst-framework.ts` holds the business method the AI Analyst follows.

## Mission
Be the most helpful business tool a company can have: turn a goal into a step-by-step plan, find the bottlenecks holding the business back, and help fix them together with the partners it depends on.

## Who it's for
- **Owner-operators and local businesses.** Little time, no analyst. Need plain language and one clear next step.
- **Growing teams.** Need owners for each action, shared numbers with partners and one place to discuss fixes.
- **Enterprises and multi-site operators.** Need cross-company bottleneck detection and exports into Excel and Power BI.
- **Consultants and agencies.** Run client engagements: onboard a client fast, share data safely, track every recommendation to done.

## The core loop (every feature should serve it)
1. **Set the goal.** The AI interview leads to a Growth Plan.
2. **Spot the bottleneck.** Bottlenecks, the Dashboard health score and the AI Analyst.
3. **Fix it.** Recommendations become tracked actions with owners and due dates.
4. **Fix it together.** Collabs, Hub threads, Teams and Google Chat updates.
5. **See it move.** KPIs, progress and exports.

If a feature doesn't help someone move through this loop, it waits.

## Product principles
- **Helpful over impressive.** Every AI answer ends with a concrete next step someone can do this week.
- **Plain language.** No jargon without a one-line explanation. Write for a busy owner.
- **Honest.** Never claim a feature, integration, certification or result that doesn't exist. Planned items are labeled "Coming soon". The AI never invents companies, statistics or sources.
- **Always an answer.** Every AI feature falls back to the built-in analyst when engines or the server are unavailable.
- **Fast and calm.** Motion clarifies; it never delays. See `docs/BRAND.md`.
- **Works everywhere.** Phone (390px) to desktop (1440px+). Touch targets at least 40px.
- **Respect data.** Only share what the customer chose to share. Never show one customer's data to another.

## Architecture (short)
- `client/` holds React 19 + Vite + Tailwind 4 + Framer Motion. Pages are in `client/src/pages`, shared UI in `client/src/components`.
- `server/` holds Express 5. The AI router is `server/services/ai/` (Claude, ChatGPT and Gemini, with fallback).
- `shared/` holds logic used by both client and server: the KPI library, growth plans, the rule-based analyst, the dashboard generator, exporters and the analyst framework.
- State: `use-dashboard-store` (dashboards and data), `use-growth-store` (plan, actions, collabs, Hub, integrations, consult sessions) and `use-clients-store` (consultant client workspaces). The app always works from these browser stores.
- Accounts: Supabase (project `bjqgdosujsttghbddhrf`). `client/src/lib/supabase.ts` is a small fetch client (auth + REST); `client/src/lib/cloud-sync.ts` mirrors the stores to the `workspaces` table for signed-in users. Schema and row-level security live in `supabase/migrations/`. Every new table needs RLS so users only see their own rows. The publishable key is public by design; never put the secret/service-role key in the client.
- Deploy: Vercel serves the frontend (`vercel.json` rewrites); the API is optional (`VITE_API_URL`).

## Rules for changes
- Keep existing behavior unless asked: improve, don't replace.
- New AI capability: add it to `llm-provider.ts` and give it a rule-based fallback in `shared/`.
- New pricing or marketing claim: only if it ships in the same change.
- Never commit API keys. Secrets come from environment variables.
- Colours, type, spacing, radius, shadows, layers and motion come from `client/src/styles/tokens.css` (rules in `docs/BRAND.md`). Text must pass WCAG AA in light and dark: use the 700 shade for coloured text, never slate-300 text on light surfaces.
- New colour classes: support dark mode (prefer `dark:` variants) and re-run `node script/gen-dark-theme.mjs`.
- Homepage hero changes: keep the static copy in `client/index.html` (`#ciq-shell`) in sync. New public pages: add them to `client/src/lib/page-meta.ts` and `client/public/sitemap.xml`.
- Links that look like buttons: `<Button asChild><Link …/></Button>`, never a button inside a link.
- Pricing lives in `client/src/lib/pricing.ts`; the reasoning is in `docs/PRICING.md`.
- After adding or removing KPIs or industries, update the counts in `shared/kpi-stats.ts` (the app warns in the console when they drift).
- Fulfillment (`/fulfillment`, `shared/fulfillment.ts`) runs on labeled sample data. Never present its numbers as real, and keep every client's rows separate (`ordersForClient`, `lotsFor`, `*For(clientId)`). The zone cards are swappable through `ZoneViewProps`.
- Integration and status tiles (`/connectors`, exports, marketing): say "Works now" only for what really runs. Everything else says "Coming soon" and has no Connect button. Product mocks on marketing pages carry an "Example" or "Sample data" label.
- Keep bundle weight in check. Prefer existing dependencies; lazy-load heavy ones (e.g. `exceljs`).

## Definition of done
- `npm run check` passes and `npm run build` succeeds.
- Works at 390px and 1440px; no horizontal scroll; keyboard focus is visible.
- Respects `prefers-reduced-motion`.
- Looks right in light and dark mode.
- AI features still answer with no keys and no server (built-in analyst).
- No new false claims on marketing, pricing, support or privacy pages.
- `PHASE-*-CHANGES.md` updated for anything a customer would notice.
