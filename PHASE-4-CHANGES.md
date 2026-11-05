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

## Fix: Fulfillment warehouse map labels
- The zone labels on the warehouse map were too narrow, so "24 waiting" and "Bottleneck" overlapped on wide screens (and phones using the desktop view). Labels are wider and the floor sits lower so the top label is no longer clipped.

## Not built yet
- The insight format on the Command Center and Analyst chat, go-to-market and ad analysis, and the consultant overview are the next stages. Until they ship, nothing in the app claims them.
