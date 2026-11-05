# ChainInsideIQ: final acceptance report (Phase 9)

Written from the code, the phase notes and the test runs, not from the marketing. It uses the nine headings the master prompt asks for. Where something is not done, it says so. Last reviewed: November 2026.

Status words: **Met** (works, and a test or a screen proves it), **Partly** (works with a stated limit) and **Not yet** (not built; the app says "Coming soon" or does not mention it).

---

## 1. Audit of the original application

What the app was when this work began, taken from `PHASE-1-CHANGES.md` and the code history:

- A React + Vite dashboard builder with KPI cards, charts, a Builder, a KPI Library and Excel/CSV/JSON exports.
- Browser-only storage with no accounts, an optional Express API, and three AI engines with a built-in fallback.
- A rule-based analyst and a Growth Plan interview.
- **Problems the audit found and fixed:**
  - A "SQL Database" import tab that said "Connected" and generated random rows. Now Coming soon, with the server answering 501.
  - Dataset routes with no owner check. Removed.
  - "Send to your own API" returned a fake success. Now 501.
  - Integration and support copy that claimed things that were not true. Reworded.
  - **Found in this final audit:** the Analyst page, three dashboard widgets ("AI Insights", "AI Chat", "Opportunity & Risk") and three `/api/ai/*` routes showed fixed text or random numbers as if it were analysis of the customer's business. Removed or relabelled (see section 2).
  - Dashboard, Builder and Export Center showed built-in example figures with no label. They now say "Sample data" until a file is in use.

## 2. Completed enhancements (existing features made better)

- **Accounts and data separation.** Supabase sign-in, row-level security on every table, workspaces saved to the account, sign-out clears the browser copy.
- **Payments and AI keys.** Stripe checkout and webhook (signature checked), and customer AI keys stored encrypted. *Stripe go-live is pending, see section 8.*
- **Excel and CSV import** (Phase 3).
- **KPIs from your own data.** Twelve KPIs are calculated from an uploaded file. A KPI the file cannot support is listed as "Not calculated" with the reason, never filled in.
- **Findings say how sure they are** and show before and after (Stage 1c). The same "how we know" label is on the Command Center and the Analyst chat.
- **Honesty pass.** Canned insights, the fixed forecast, invented recommended-KPI values and no-op widget controls are gone. The three server routes that returned random numbers answer 501. `opportunity-risk-engine.ts` and the rotating insight banner are deleted. `tests/honesty-guard.test.ts` fails if any of that returns.
- **Visual redesign** of Bottlenecks, Pipeline, Recommendations, KPI Library and Dashboard (Phase 2), and the Builder studio.
- **Fulfillment map labels** no longer overlap.

## 3. Newly implemented features

- **Any kind of company.** Pick a company type and get the matching KPIs and data needs (Stage 1a).
- **Go-to-market from your files.** Ads and deals files give spend, cost per customer, win rate and pipeline numbers (`shared/gtm-engine.ts`, `/gtm`).
- **Possible links between your numbers** (`shared/links.ts`). Labelled as possible links, never as proof of cause.
- **Consultant overview and client workspaces.**
  - Portfolio view across clients, "Needs attention" list and side-by-side KPIs.
  - Report activity (opened, printed, "report due").
  - Assessments tracker (business, operational, go-to-market).
  - Per-client KPI choice and targets.
  - Branded printed reports.
- **Read-only sharing of a client workspace.** Enforced by the database, with a server-side sharing history and a 51-check permission script.
- **Activity log** (local, downloadable as CSV) and a clearer menu.
- **Fulfillment prototype** for 3PLs. It runs on labelled sample data only.

## 4. Existing features preserved

Builder and Dashboard layouts, exports (Excel, CSV, JSON, dataset), KPI Library, Growth Plan and actions, collabs, Hub, Connectors page, the AI router with fallback to the built-in analyst (still answers with no keys and no server), dark mode and the phone layouts. No page was removed. The only removals were fake or canned content and unused or unsafe server routes.

## 5. Incomplete capabilities

Against the Phase 9 criteria:

| Criterion | Status | What is true |
|---|---|---|
| **BI:** ingest supported data | Met | Excel, CSV, Google Sheets and API import. |
| **BI:** validated and transformed | Partly | Files are read and mapped to KPI fields. There is no separate data-quality report. |
| **BI:** KPIs calculated accurately | Met for 12 KPIs | Covered by `tests/kpi-engine.test.ts`. Other KPIs in the library are guidance, not calculated. |
| **BI:** reports generated and exported | Partly | Excel, CSV, JSON, dataset exports and a printed client report. PDF export, Power BI, Tableau and share links are Coming soon. |
| **OI:** bottlenecks from evidence | Met | Bottlenecks page and Analyst work from the uploaded file. Fulfillment is sample data. |
| **OI:** trends monitored | Partly | KPI trends from the file. Forecasting is not built. |
| **OI:** recommendations generated and tracked | Met | Recommendations become actions with owners and due dates, with before and after. |
| **GTM:** customer and CRM data analysed | Partly | From uploaded ads and deals files. No live CRM connection. |
| **GTM:** pipeline and acquisition KPIs | Met | From the same files. |
| **GTM:** revenue trends, growth opportunities | Partly | Trend numbers and possible links. No forecast and no market sizing. |
| **Shared:** insights connect across the three areas | Partly | Possible-link finder and one findings list. No automatic cross-discipline root-cause analysis. |
| **Shared:** recommendations reference real data | Met | Each finding carries a "how we know" label. If no number of yours matches, it says so. |
| **Shared:** AI states uncertainty | Met | Confidence labels. Sample data is flagged as having no numbers of yours. |
| **Shared:** actions and outcomes tracked | Met | Actions, notes, resolved state and before/after. |
| **Consultant:** workspaces separated | Met | Per-client data, and the sharing function returns only whitelisted fields. |
| **Consultant:** analyse performance, produce client reports | Met | Overview, KPI targets, branded printed report. |
| **Consultant:** permissions enforced and tested | Partly | Owner and read-only viewer, tested at database level. Editor and admin roles are not built. |

Also not built:
- Team accounts and invite emails.
- Plan limits on sharing.
- Branding saved to the account (it is per-browser).
- Direct database and ad-platform connections.
- Real forecasting.
- Full server-side audit trail.

## 6. Security and integration limitations

From `docs/ENTERPRISE-READINESS.md`, which holds the full list:

- Rate limits are per server instance, so they are soft on serverless hosting.
- Anonymous calls to the built-in analyst are allowed, limited only by IP.
- Page security headers are set, but the Content-Security-Policy is report-only until it is checked on the live site. The policy still allows inline styles.
- Supabase leaked-password protection is off.
- The Activity log lives in one browser and is not tamper-proof. It is not compliance evidence.
- No SSO, two-factor sign-in, certifications, data-residency choices or tested recovery objective. None is claimed anywhere.
- Collab "access you agree on" is a label and is not enforced.
- **Integrations that work now:** file uploads, Google Sheets and API import, Excel/CSV/JSON export, Stripe checkout and Supabase accounts. **Everything else on `/connectors` and `/exports` is Coming soon** and has no Connect button. The server stubs for Power BI and Tableau are disabled.

## 7. Test results

- `npm test`: 392 checks pass, 0 fail across 15 test files. They cover:
  - the KPI engine
  - company types
  - insight confidence
  - the go-to-market engine
  - links
  - consultant roll-ups
  - activity log
  - report activity
  - assessments
  - KPI targets
  - branding
  - a static guard on the sharing migration
  - the honesty guard
  - API import safety (address pinning, redirects, size and time limits)
  - the page security headers
- Database permission script `supabase/tests/sharing.test.sql`: 51 PASS, `FAILED: 0`. Run by the owner against the live project as five users inside a rolled-back statement.
- Logo handling was exercised in headless Chromium.
- Every merged change had both Vercel builds (`ghostwriter-assistant`, `ghostwriter-assistant-94fg`) green before merge, so the production build succeeds.
- **Not run by me, still to do:**
  - `npm run check` (full type check) in a normal checkout. The environment used here had no installed packages, so I used a partial check that finds undefined names only.
  - Manual layout checks at 390px and 1440px.
  - Keyboard-focus and light/dark spot checks of the newest screens.
  - End-to-end tests in a browser.

## 8. Deployment recommendations

1. In Vercel, delete the duplicate project (`ghostwriter-assistant-94fg`) so each change builds once. Deletion needs the owner's confirmation in the dashboard.
2. Before taking payments:
   - Add the Stripe secret key and webhook secret as environment variables.
   - Test with a Stripe test card.
   - Check the plan and webhook handling in `docs/PRICING.md`.
3. In Supabase, turn on leaked-password protection (Authentication → Policies).
4. Check the live site's browser console for Content-Security-Policy warnings, then switch the header from report-only to enforced (steps in `docs/ENTERPRISE-READINESS.md`).
5. Move rate limits to a shared store before relying on them.
7. Run `npm run check`, `npm run build` and the 390px/1440px checks in a normal checkout, and fix anything they show.
8. Keep `docs/ENTERPRISE-READINESS.md` and each `PHASE-*-CHANGES.md` updated in the same change as any feature.

## 9. Roadmap for remaining BI, OI and GTM capabilities

**Business intelligence**
1. A data-quality report on import (missing columns, odd values, duplicate rows).
2. Real forecasting from the customer's history, shown with its uncertainty. The "Coming soon" slot is already in place.
3. PDF export and a share link for dashboards, then Power BI and Tableau.

**Operational intelligence**
1. Connect Fulfillment to real order and inventory files, replacing the sample data.
2. Alerts when a monitored KPI crosses its target.
3. Direct database connections, read-only and permissioned.

**GTM intelligence**
1. CRM and ad-platform connections with proper sign-in and permission handling.
2. Funnel and cohort views, and channel comparison.
3. Growth-opportunity ranking that uses the customer's own numbers only.

**Shared and consultant**
1. An editor role (so a client can mark actions done), with database checks tested the same way as the viewer role.
2. Team accounts, invite emails, plan limits on sharing, then SSO.
3. Branding saved to the account.
4. A server-side audit trail that also covers edits, exports and deletions.
