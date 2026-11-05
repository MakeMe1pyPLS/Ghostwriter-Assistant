# Enterprise readiness: what is true today

Written from reading the code, not from the marketing. Each "Works" line names where to check it. Anything not listed under "Works" must not be described to customers as available. Update this file in the same change that adds or removes any of it.

Last reviewed: November 2026 (Phase 4, stage 6).

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
| Page security headers | `nosniff`, framing limited to our own site, a strict referrer policy and camera/microphone/location switched off on every response. A Content-Security-Policy is sent in **report-only** mode (it logs what it would block in the browser console; it does not block yet). A test keeps the policy's hash for the one inline script in `client/index.html` current. | `vercel.json`, `tests/security-headers.test.ts` |
| API import address pinning | The host is looked up once, checked, and the connection is made to that exact address, so DNS cannot answer differently the second time. Redirects are refused, responses over 5 MB are cut off, and the request times out at 15 s. | `server/services/integrations/safe-fetch.ts`, `tests/safe-fetch.test.ts` |
| Activity log | A local list of data added or removed, actions created or updated, clients added or removed, workspace switches and downloads. Names and counts only, never file contents, and anything that looks like a key is hidden. Downloadable as CSV. | `shared/audit.ts`, `tests/audit.test.ts`, Settings → Activity log |
| Share a client workspace (read only) | The owner of a client workspace can share it with a person by email. That person signs in with their own account (confirmed email required) and sees a trimmed, read-only copy: plan, actions and results from the data. They cannot read the owner's private notes, contact details, webhook addresses or per-action notes, and they cannot change anything. The owner can remove access at any time, and a member can leave. Enforced by the database, not the screens. | `supabase/migrations/20261105_share_client_workspaces.sql`, `client/src/components/SharingPanel.tsx`, `client/src/pages/shared.tsx` |
| Server-side history of sharing | Every invite, cancellation, join, removal and (once an hour per person) view is written on the server. The owner can read it. Browsers cannot insert, edit or delete a row. | `audit_log` table, same migration |
| Permission tests | A script of about 50 checks that runs as five different users (stranger, owner, invited viewer, unconfirmed email, removed viewer) inside one statement that always rolls back. Run it against the database after any change to sharing. A static guard of the migration runs in `npm test`. | `supabase/tests/sharing.test.sql`, `tests/sharing-migration.test.ts` |
| Data sharing with partners (collabs) | A record of what was agreed and an email invite. Not enforced by the app (see below). | `client/src/pages/collabs.tsx` |

## Not built (do not claim any of these)

- **Roles beyond owner and read-only viewer.** There is no editor or admin role, no per-page or per-dataset permission checks, and viewers see one client workspace at a time as a report, not the full app.
- **Team accounts.** One account is one person. No seats, no shared billing, no joint ownership of a workspace, no editing together.
- **Partner logins for collabs.** Collab partners do not sign in. The collab "access you agree on" setting is a label and is not enforced. (Consultant clients can now be given read-only access; see above.)
- **Invite emails.** We do not send them yet. The owner tells the person to sign in with that address. Invites last 14 days.
- **Plan limits on sharing.** Sharing is not tied to a paid plan yet.
- **A full audit trail.** The server history covers sharing only. The Activity log in Settings lives in one browser, can be cleared by anyone using it, and is not tamper-proof. Neither is evidence for a compliance review.
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
3. ~~API-import address check looked up the host twice.~~ Fixed: the address is pinned (see the table above).
4. **Turn the Content-Security-Policy from report-only to enforced.** Open the live site, then the browser console, on the homepage, sign-in, Dashboard, Builder, Clients and Export pages. If no "Content Security Policy" warnings appear, rename the header `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `vercel.json`. If the API runs on its own host (`VITE_API_URL`), add that host to `connect-src` first. The policy still allows inline styles because the charts and animations set them.
5. **Server logs.** Route errors are logged with the error object. Check that no request bodies reach the logs before adding a log drain.
6. **Google Sheets and API import fetch on the server**, so the data passes through our server in memory. The privacy policy says this; keep it said.
7. **Supabase leaked-password protection** is off. Turn it on in the Supabase dashboard (Authentication → Policies).

## Suggested build order when a customer asks for it

1. An editor role (so a client can mark actions done), with writes checked by row-level security and tested the same way as the viewer role. Merge changes by action, not by overwriting the whole workspace.
2. Team accounts with an owner / member split on the owner's own workspace, using the same members table.
3. Extend the server history to cover edits, exports and deletions.
4. Send invite emails; tie sharing to the plan; SSO; a security questionnaire pack; then certifications.

Do not add a role picker before the server checks for that role exist and are tested. A role that is not enforced is worse than none.
