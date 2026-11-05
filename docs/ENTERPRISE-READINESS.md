# Enterprise readiness: what is true today

Written from reading the code, not from the marketing. Each "Works" line names where to check it. Anything not listed under "Works" must not be described to customers as available. Update this file in the same change that adds or removes any of it.

Last reviewed: November 2026 (Phase 4, stage 5).

## Works today

| Area | What is true | Where to check |
|---|---|---|
| Accounts | Sign-up and sign-in run on Supabase Auth. The server confirms a bearer token with Supabase before it acts for a user. | `server/services/platform/supabase-admin.ts` (`requireUser`) |
| Data isolation (database) | Row-level security is on for every table. A user can read and change only rows where `owner_id` / `user_id` is their own id. Browser roles get only the commands they need. | `supabase/migrations/*.sql`, especially `20261101_tighten_table_grants.sql` |
| Secret tables | `ai_keys` and `billing_events` have no browser access at all. Only the server (service-role key) touches them. | `20261027_billing_and_ai_keys.sql` |
| Customer AI keys | Stored encrypted (AES-256-GCM) with a server-only secret, never returned to the browser, only the last 4 characters shown. | `server/services/platform/secrets.ts` |
| Stripe webhook | The signature is checked against the raw body with a constant-time compare and a 5-minute window. | `server/services/platform/billing.ts` |
| Sign-out | Ends the session and clears this browser's workspace data, so the next person on a shared computer does not see it. | `client/src/lib/cloud-sync.ts` (`clearLocalData`) |
| Input checks | AI routes validate bodies with zod. JSON bodies are capped at 2 MB, uploads at 10 MB. | `server/routes.ts`, `server/app.ts` |
| Outbound fetches | The API-import route refuses private, loopback and cloud-metadata addresses. | `server/services/integrations/webhooks.ts` (`assertPublicHttpUrl`) |
| Rate limits | Per-IP limits on AI, data import, export, billing and key routes. | `server/services/rate-limit.ts`, `server/routes.ts` |
| Activity log | A local list of data added or removed, actions created or updated, clients added or removed, workspace switches and downloads. Names and counts only, never file contents, and anything that looks like a key is hidden. Downloadable as CSV. | `shared/audit.ts`, `tests/audit.test.ts`, Settings → Activity log |
| Data sharing with partners | A record of what was agreed and an email invite. Not enforced by the app (see below). | `client/src/pages/collabs.tsx` |

## Not built (do not claim any of these)

- **Roles and permissions.** There is one role: the account owner. No admin / member / viewer, no per-page or per-dataset permission checks.
- **Team accounts.** One account is one person. No invites into a shared workspace, no seats.
- **Partner or client logins.** Partners and consultant clients do not sign in. The collab "access you agree on" setting is a label and is not enforced. A consultant's client reports are printed or shared by the consultant.
- **A shared audit trail.** The Activity log lives in one browser, can be cleared by anyone using it, and is not tamper-proof. It is not evidence for a compliance review.
- **SSO / SAML / SCIM**, two-factor sign-in, session management screens, IP allow-lists.
- **Certifications and attestations** (SOC 2, ISO 27001, HIPAA and similar), penetration-test reports, a data-processing agreement template, a subprocessor page beyond the privacy policy list.
- **Dedicated environments**, data residency choices, customer-managed encryption keys.
- **Backups and restore promises.** Supabase provides platform backups according to the plan chosen. We have not set or tested a recovery objective, so none is promised.
- **Direct database connections and ad-platform connections** (shown as Coming soon).
- **Sending dashboards to a customer's own API** (shown as Coming soon).

## Fixed in this stage

1. **The "SQL Database" tab was not real.** It reported "Connected" and filled the file with randomly generated rows named after the customer's table. The tab now says Coming soon, the server answers 501, and the generator is deleted. Files already created this way show a warning on the Data page so nobody decides on made-up numbers.
2. **Dataset routes had no owner check.** Any caller could list, read or delete datasets that other people had imported through the server. The list and delete routes are removed (the app never used them), ids are now random and not guessable, rows are kept for one hour only, and the store is capped.
3. **"Send to your own API" returned a fake success.** It now returns 501.
4. **Support and collab copy no longer says things that are untrue** (browser-only storage after accounts shipped; enforced partner permissions).

## Known weaknesses to fix next (in order)

1. **Rate limiting is per server instance, in memory.** On serverless hosting each instance counts separately, so the limits are soft. Use a shared store (for example Upstash) before relying on them.
2. **Anonymous AI calls are allowed** (the built-in analyst answers without sign-in) and are limited only by IP. Fine for a demo, not for cost control.
3. **The API-import address check looks up the host and then fetches it separately.** A hostile DNS server could answer differently the second time. Pin the resolved address for the fetch.
4. **No security headers are set** (content security policy, frame protection, referrer policy) in `vercel.json`. Add them and test the app under them.
5. **Server logs.** Route errors are logged with the error object. Check that no request bodies reach the logs before adding a log drain.
6. **Google Sheets and API import fetch on the server**, so the data passes through our server in memory. The privacy policy says this; keep it said.
7. **Supabase leaked-password protection** is off. Turn it on in the Supabase dashboard (Authentication → Policies).

## Suggested build order when a customer asks for it

1. Team accounts with an owner / member split, checked on the server and in row-level security, with tests that prove one member cannot read another workspace.
2. A server-side audit table (insert-only, one row per change, readable by the workspace owner), replacing the local log for those customers.
3. Partner and client sign-in with read-only sharing that is actually enforced by row-level security.
4. SSO, then a security questionnaire pack, then certifications.

Do not build role screens before step 1's server checks exist. A role picker that is not enforced is worse than none.
