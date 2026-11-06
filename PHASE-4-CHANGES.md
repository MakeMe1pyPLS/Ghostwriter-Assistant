# Phase 4: unified intelligence (in progress)

Phase 4 grows ChainInsideIQ from operations into business, operational and go-to-market intelligence, one stage at a time. Each stage ships on its own and says plainly what is not built yet.

## Stage 1a: pick any kind of company
- After you choose **Single business**, **Partnered business** or **Unified supply chain**, you now choose **which kind of company each one is** from the full list of 45 business types (retail and e-commerce, food and hospitality, logistics, manufacturing, professional services, technology, health, home services, real estate and finance, education, media). It is no longer limited to e-commerce, logistics and manufacturing.
- One slot per company: "Your company", then "Partner company" (or two partners for a unified chain). There is a search box and the types are grouped.
- Where: the first-time setup dialog, **Settings → Company types**, and the AI interview (your industry is now remembered as your company type).
- Existing accounts keep working. If you set up before this, Settings fills the picker from your earlier sector (e-commerce, logistics or manufacturing) and says so; pick a more exact type to replace it.
- Company types are saved per workspace, so each client workspace keeps its own.
- Behind the scenes each type still maps to one of the older sector families (e-commerce, logistics, manufacturing, or custom) so the Hub, data sharing and sample dashboards keep working. Types outside those three use the "custom" family for now.

## Stage 1b: KPIs calculated from your own data
- When you upload a file, ChainInsideIQ now **calculates 12 KPIs from the rows**: revenue, orders, average order value, gross margin, net margin, expense ratio, conversion rate, return on ad spend, customer acquisition cost, return rate, on-time rate and order-to-ship time.
- It finds the right columns by name ("Revenue ($)", "Order Date", "Ad Spend" and similar) and shows which column it used for each number.
- "Change" compares the latest stretch of your dates with the stretch before it, and only when there are at least 14 days of dated rows. Otherwise it says there is not enough data.
- If a KPI can't be calculated (missing column, or dividing by zero), it says exactly what is missing. It never shows a made-up number.
- This **replaces the old placeholder numbers** on the Dashboard that were read from the first row of an upload.
- New **"What we calculated"** panel on Data Sources: each KPI with its value, change, how it was worked out, the columns used, and a list of KPIs that need more data.
- Limit: only the first 1,000 rows of each file are kept in your browser, so for larger files the panel says the numbers cover those rows only.

## Stage 1c: findings say how sure they are, and show before and after
- Every **Bottleneck**, **Recommendation** and Pipeline finding now has a **"How we know"** strip with:
  - a source label: **Verified from your data** (the numbers behind it were calculated from your uploaded file), **Sample data** (example numbers, not yours), or **AI hypothesis** (none of your numbers match it);
  - a **confidence** level (High, Medium or Low) and the rule behind it, such as how many numbers back it, whether there is a change over time, how many rows were used, and whether only part of your file was read;
  - the exact numbers behind the finding, how each was worked out, and any caveats.
- The reason for a finding is now labelled **"Possible reason"** on Bottlenecks. Your data shows what changed, not what caused it, and the panel says so.
- **Track as actions** now saves your current number for the finding (when it comes from your own data) as the "before".
- On the **Growth Plan** board, an action with a saved "before" shows **Before and after** against the latest numbers: it says whether the number moved the right way, the wrong way, or not really, and that this does not prove the action caused it. If there is no newer data it says to upload some.
- Actions also have a **Notes** box. Owner, due date and status were already there, and Done marks it resolved.
- Behind the scenes: `shared/insight.ts` (pure logic) and `npm test`, which runs the KPI engine, company-type and insight tests.
- Not done yet: the same format on the Command Center and Analyst chat answers, and a consultant-wide view of outcomes.

## Stage 2: Go-to-market (ads and deals) from your files
- New **Go-to-market** page (under Go-to-market intelligence in the menu). It reads an **ad export** or a **deals export** that you have already uploaded on Data Sources. Nothing is shown until you have uploaded one.
- **Ads:** spend, conversions, click rate, return on ad spend (or cost per conversion if there is no revenue column), by campaign or channel, with a table. It points out:
  - spend that produced no conversions (and says to check tracking first),
  - big-spend campaigns that return far less than your own average,
  - campaigns doing much better than average that could take a small budget test,
  - ads few people click, ads people click but do not buy from,
  - too much spend in one channel, and spend that rose while results got worse.
- **Deals:** win rate, average won deal, time to win, which lead sources and segments close well or badly, open deals that have gone stale, and the most common lost reason.
- Every finding says what we see, a **possible reason** (never stated as proven), what it means, one step to do next, the numbers behind it, and a confidence level with its reason. **Track as action** puts the step on your Growth Plan.
- Everything compares against **your own file's average**. We do not quote industry benchmarks. Small samples are listed as "too early to tell" and are not judged.
- If your file is not recognised, the page lists what each kind of file needs and offers a blank CSV template (headers only).
- **Coming soon:** direct connections to Google Ads, Meta Ads, HubSpot and Salesforce. For now, export a CSV and upload it. Lifetime value and before/after tracking for ad results are not built yet.

## Stage 3: possible links between your numbers
- New **"Possible links between your numbers"** panel at the top of **Bottlenecks**. It looks across your uploaded data, week by week, for numbers from different parts of the business that tend to move together or in opposite directions, for example ad cost and on-time delivery.
- Every link is labelled **"Possible link, not proven"**. It says which way the numbers moved, how many weeks it is based on, a confidence level with its reason, **other explanations** (a sale, a season, a stock-out, a change in how data was recorded) and **a check you can do**. It never says one thing caused another.
- To avoid false alarms it needs at least **8 weeks** of data with a date column, only compares numbers from **different areas**, uses a strict strength bar that rises as more pairs are checked, ignores pairs that only match because both drift up or down over time, skips pairs built from the same column (for example revenue and return on ad spend), and shows at most five, never the same finding twice.
- With sample data, or too little history, it says so and shows no links.
- Limits: it can miss real but weaker links, it only sees the rows kept in the browser, and it cannot tell you why numbers move together. Links between two different companies' data are not part of this yet.

## Stage 4: consultant overview
- **Clients** now opens with an **"Across all clients"** section (it appears once you have at least one client):
  - **Needs attention:** the most urgent items first. A fix whose number moved the wrong way, overdue actions, a review due within a week, an active client with no data uploaded yet, or an active client with no activity for 30 days. Each has an **Open** button that switches into that client's workspace. Paused and completed clients are not nagged about reviews, data or quiet spells.
  - **Are the fixes working?** Counts of tracked fixes that moved the right way, the wrong way, did not really change, or are waiting for newer data. It says that before and after does not prove a fix caused the change.
  - **Clients side by side:** status, which file the numbers come from, up to three headline numbers (revenue, margin, on-time and so on), open and overdue actions, and fix results. Clients with no uploaded file show no numbers.
- Every number comes from that client's own uploaded file (the one set as active, or the newest). Nothing is shared between clients, and the page says so.
- The printable **client report** gets a **"Results from the data"** section (headline numbers and before/after for tracked fixes) and a **"Prepared by [your business]"** line.
- Not built: client logins or a client-facing portal (still "coming soon" on the Clients page), custom logos or colours on reports, and anything involving enterprise access control.

## Stage 5: clearer menu, activity log, and an honest security review
- The menu is regrouped by what you are doing: **Overview**, **Business intelligence**, **Operational intelligence**, **Go-to-market intelligence**, **AI intelligence**, **Clients & partners** and **Data**. No page was removed or renamed. Planned items (Team Management, Notifications, Forecasting, Team audit trail, API Access) stay marked Coming soon.
- New **Activity log** in Settings. It lists data files added or removed, actions created or updated, clients added or removed, workspace switches and downloads, with a CSV download and a Clear button. It records names and counts only, never your file contents, and hides anything that looks like a key. It is kept in this browser only, it is cleared when you sign out, and it is not tamper-proof or shared. A shared team audit trail is not built.
- **The SQL Database tab was not real, so it now says Coming soon.** It used to report "Connected" and import randomly generated rows. If you imported a table that way, the Data page now warns you that those files are made-up example rows and should be removed. Upload a CSV export of the table instead.
- **Server dataset routes locked down.** Datasets imported through the server can no longer be listed or deleted by other callers. Ids are random, rows are kept for one hour, and the data and export routes are rate-limited.
- **"Send to your own API" now answers that it is not available** instead of reporting a simulated success.
- **Collab "access you agree on" is described honestly.** Partners do not sign in yet, so the setting records what you agreed and is not enforced. The page now says so.
- **Support page** no longer says your data only lives in your browser (accounts store it in our database with per-account row rules).
- New `docs/ENTERPRISE-READINESS.md` lists what works, what is not built (roles, team accounts, SSO, certifications), and what to fix next.

## Stage 1d: the same "how we know" label on the Command Center and the Analyst chat
- Each Top Priority on the Command Center (when opened) and each Analyst chat answer now shows the same strip as Bottlenecks: verified from your data, sample data or AI hypothesis, a confidence level with its reason, and the numbers behind it.
- The numbers are chosen from what the finding says is happening, never from its explanation. With no data uploaded the label says Sample data. If no number of yours matches, it says AI hypothesis.

## Stage 6: share a client workspace, read only, enforced by the database
- In a client's details (Clients page) there is now a **Share with the client** section. Enter an email and that person can sign in with their own account and open **Shared with you** in the menu. They see the plan, actions and results from the data as a report. They cannot change anything, and they do not see your private notes, contact details, chat webhook addresses or notes on individual actions.
- You can cancel an invite or remove access any time, and a person can leave on their own. Up to 10 people per client. Invites last 14 days. We do not send invite emails yet, so tell the person which email to sign in with.
- A **sharing history** (who was invited, who joined, who was removed, and when someone looked) is kept on the server. You can read it. Nobody can change or delete it from the app.
- Access is enforced in the database (row-level security and server functions), not by hiding buttons. `supabase/tests/sharing.test.sql` checks it as a stranger, the owner, an invited viewer, an unconfirmed email and a removed viewer. `tests/sharing-migration.test.ts` guards the migration in `npm test`.
- Only the read-only viewer role exists. There is no editor or admin role, no team accounts and no per-plan limit on sharing yet. See `docs/ENTERPRISE-READINESS.md`.

## Consultant: recent reporting activity
- Each client card now says when its progress report was last printed or opened ("Report printed 3 days ago", "Report opened yesterday, not printed", or "No report yet"). A client that is Active or Onboarding and has had no report printed for 30 days shows a **Report due** tag. Paused and Completed clients are never flagged.
- The client's details list their last five report events.
- "Print or save opened" means the print window was opened. The browser does not tell us whether you saved it, and we cannot see whether it was sent to the client, so the screen says so.
- The record is saved with the client (and to your account when signed in). People you share a workspace with never see it.

## Consultant: pending assessments
- Each client now has a checklist of three assessments: **Business performance**, **Operational** and **Go-to-market**. Mark each Not started, In progress or Done, set a due date, write a private note on what you found, and jump to the matching page in that client's workspace.
- Client cards say "2 of 3 assessments pending" (Active and Onboarding clients only), and a new **Assessments pending** tile counts them across clients. An assessment past its due date appears under **Needs attention** in "Across all clients". Not-started assessments are counted but never raise an alert.
- Finished assessments are listed (name and date only) on the printed client report. Your notes are never printed and are never shown to people you share a workspace with.
- This is your own tracker. Nothing checks that an assessment was actually carried out, and status is never worked out from the client's data. The screen says so. "Numbers uploaded, ready to start" only means the client has a data file.

## Consultant: KPIs and targets per client
- In a client's details, **KPIs and targets** lets you choose which calculated numbers (up to 8 of the 12 the app can work out from a data file) appear for that client, and set your own target for each. Until you choose, the client keeps the standard set, exactly as before.
- Those numbers drive that client's printed report and their row in "Clients side by side". Each one with a target says "Target 40.0% met" or "Target 40.0%: 3.2 points below" (the direction that counts as better is respected, so a lower return rate under its target is met).
- A KPI you picked that can't be worked out from the file is listed as "Not calculated" with the reason (for example, "needs net profit"), never filled in.
- A target is your own goal compared with the calculated number. It is not a forecast or an industry benchmark. Targets are private to you and never shown to people you share the workspace with.
- This does not change the Dashboard or Builder, and it is separate from starring KPIs in the KPI Library.

## Consultant: branded client reports
- New **Report branding** card on the Clients page. Add your business name and logo, and optionally hide the ChainInsideIQ logo and name. Your name is printed as "Prepared by", your logo appears in the report header, and a preview shows both before you print.
- Logos can be PNG, JPG or WebP. The browser re-draws and shrinks them to a small bitmap (SVG files are refused). With no branding set, reports read exactly as before.
- When the ChainInsideIQ mark is hidden, the line saying figures come from the numbers entered in the workspace stays.
- **Limits, stated on the screen:** branding is saved in this browser only for now (set it up again on another device, and it is cleared when you sign out). It applies to reports you print or save here. People you share a workspace with see the standard report. It is not tied to a plan, and no pricing or marketing page mentions it.

## Fix: Fulfillment warehouse map labels
- The zone labels on the warehouse map were too narrow, so "24 waiting" and "Bottleneck" overlapped on wide screens (and phones using the desktop view). Labels are wider and the floor sits lower so the top label is no longer clipped.

## Fix: no more made-up AI content
An acceptance audit found screens that looked like analysis of your business but were fixed text or random numbers. They are removed or relabelled.
- **Analyst page:** the pre-written insights, the fixed forecast and the "recommended KPIs" with invented current values are gone. The page now explains what the Analyst does, shows the KPI guide for your sector, and the Forecast area says **Coming soon**.
- **Dashboard widgets:** "AI Insights", "AI Chat" and "Opportunity & Risk" no longer show invented text or scores. Each is now a short pointer to the page that does the real work (Analyst, Bottlenecks). The summary and forecast widget text says what it is. Controls that did nothing were removed from the widget settings.
- **Server:** `/api/ai/insights`, `/api/ai/forecast` and `/api/ai/recommend-kpis` used to return random numbers. They now answer "not available" (HTTP 501). The AI Analyst chat and the built-in analyst are unchanged.
- **Sample data notice:** Dashboard, Builder and Export Center show a "Sample data" note whenever no file of yours is in use, because the cards and charts are then built-in examples. It disappears once you upload and select a file.
- A new test (`tests/honesty-guard.test.ts`, part of `npm test`) fails if the canned text, the fake provider or the notice goes missing.

## Security hardening
- **Page headers:** every page now tells the browser not to guess file types, not to be shown inside other sites, to send less in the referrer, and not to use the camera, microphone or location. A content security policy is added in report-only mode, so it cannot break anything yet.
- **API import:** the address you type is checked and then connected to exactly as checked (no second lookup), more private ranges are refused, redirects are refused, a response over 5 MB is stopped with a clear message, and a slow server times out after 15 seconds. Google Sheets import also times out now.
- Two new tests (`tests/safe-fetch.test.ts`, `tests/security-headers.test.ts`) are part of `npm test`.
- **Still open:** rate limits are still per server instance (see `docs/ENTERPRISE-READINESS.md`).

## Fix: pricing page sent signed-in people to sign-up
When card payments were not switched on, choosing a plan sent everyone to the sign-up screen, even people already signed in, which looked like a sign-in loop. Signed-in people now stay on the pricing page and see "Card payments aren't switched on yet". People who are not signed in still go to sign-up as before.

## Custom domain
The site now lives at **https://www.chaininsideiq.com** (`chaininsideiq.com` redirects to it). The page address used for search engines (canonical links, `sitemap.xml`, `robots.txt`) points there. The `vercel.app` address still works.

## Fix: checkout refused by Stripe ("product tax code is missing")
Stripe accounts with Managed Payments switched on (the default for new accounts) reject a checkout unless the product carries an eligible tax code, so choosing a plan failed. Checkout now sends the tax code for business software (`txcd_10103001`). It is harmless if Managed Payments is off. The request is built by a tested function (`tests/checkout-params.test.ts`).

## Fix: checkout failed for accounts with a test-mode Stripe customer
An account that had paid or opened checkout in Stripe's test mode kept that customer id. After switching to live keys, Stripe did not recognise it and checkout failed. Checkout now looks the saved customer up first and creates a fresh one if Stripe does not know it (or it was deleted). A Stripe outage is not treated as a missing customer. Covered in `tests/checkout-params.test.ts`.

## Fix: included AI answers were not counted, and some Claude replies fell back to the built-in analyst
- The usage count ran after the reply was sent, and on Vercel the function is frozen at that point, so included answers were never counted against the plan allowance. The count now finishes before the reply goes out.
- When Claude's reply could not be read as JSON, the answer silently came from the built-in analyst. Replies are now asked for with stricter JSON rules, trailing commas are repaired, and an unreadable reply is asked for once more (only if there is time left in the request) before falling back. Covered in `tests/llm-json.test.ts`.

## Fix: Claude's first reply was often unreadable (answers took twice as long)
Claude tended to put double quotation marks inside its sentences, which broke the reply format, so the app asked a second time. The instructions now tell it to use single quotes inside text. When a reply is still unreadable, the server log shows only the shape of the text near the error (letters and digits blanked), never the customer's content.

## Fix: Claude answers now come back as a checked structure
Asking Claude for JSON as plain text kept producing a broken list, so many answers fell back to the built-in analyst or took two tries. Claude now returns its answer through a forced tool call, which the API hands back already parsed. ChatGPT and Gemini are unchanged. Customer key checks are unchanged. If Claude still fails, the built-in analyst answers as before.

## Not built yet
- Editor and admin roles, team accounts, invite emails, collab partner sign-in, a full audit trail and SSO. See `docs/ENTERPRISE-READINESS.md`.
