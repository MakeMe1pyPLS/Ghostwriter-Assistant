# Fulfillment: go-live checklist

Scope: the Fulfillment prototype as built (Overview and AI insight, zone health, Orders board, Load check, Apparel and Supplements modules, Clients sharing). Not covered, because it isn't built: map, GPS, drivers, desktop app, isometric floor, pallet layout.

Today everything runs on **sample data in the browser**. Going live means replacing that with real data, real accounts and real sharing rules.

## The one decision that shapes everything: where do stage times come from?

The bottleneck finder needs to know **when each order entered and left each stage** (new, picking, packing, ready to ship). Shopify, WooCommerce and ShipStation only know when an order was created and when it shipped. They don't know when picking or packing started.

So the first real question for a 3PL is: **what do you use inside the warehouse?**
- If they have a warehouse system that records scans or stage changes, export or connect that. Stage-level insight works.
- If they don't, v1 can only show **created → shipped** time per order. That still finds slow clients and slow days, but it can't say "Pick is the problem". Say so in the product instead of guessing.

Ask the first beta 3PL this before building any connector.

## Must have before launch

**Real data in**
- [ ] CSV import for orders with these columns: order id, client, created, picked, packed, shipped, status. Fallback for everyone, and the only path in v1 if no connector exists.
- [ ] Per-warehouse settings for each zone's target pace and time limit. The prototype hard-codes them, and the insight is only as good as these numbers.
- [ ] The "Sample data" badge shows only on the demo. Real workspaces never show invented numbers.
- [ ] Empty and error states for a workspace with no orders, a failed import and a partial import.

**Accounts, roles and sharing**
- [ ] Tables for organizations, memberships, clients, orders, order lines, inbound deliveries and share grants, each with row-level security, in `supabase/migrations/`. The prototype's browser store doesn't enforce anything.
- [ ] Roles: **owner**, **manager** and **client viewer**. (A consultant role already exists elsewhere in the app.)
- [ ] A client viewer can read only rows where the client is theirs **and** the 3PL has granted that section. Write an automated test that proves client A can't read client B's orders, stock, lots or counts. This is the most important test in the whole feature.
- [ ] Real invitations by email. Needs custom email sending (still on the earlier open list).
- [ ] An audit log of who changed sharing and who viewed what.

**Privacy and legal**
- [ ] **Don't store end customers' names or addresses in v1.** Order id, items and times are enough for everything shown. This avoids most personal-data risk.
- [ ] Update the privacy policy and terms for order data, and prepare a data processing agreement for 3PLs (they are the controller of their clients' data; you process it).
- [ ] No claims about regulatory compliance for supplements (lot tracking, expiry). The product helps you see expiry dates; it doesn't make anyone compliant.
- [ ] Keep the load estimate's "Estimate only" label and add a line that it isn't a legal weight check.

**Quality**
- [ ] Unit tests for `estimateLoad`, `parseLoadCsv` and `analyzeFulfillment` (see "Load check accuracy" below). The repo has no test runner yet; add one.
- [ ] A plan gate and free-plan limits (see "Billing").
- [ ] Error tracking and database backups switched on and confirmed (see "Running it").

## First 30 days

- [ ] One read-only connector, chosen by what the first beta 3PLs use. Shopify and ShipStation are the likely ones. Needs OAuth, webhooks with signature checks, and safe retries so one event never counts twice.
- [ ] Scheduled refresh so the Overview updates without anyone pressing a button.
- [ ] Configurable dimensional-weight divisor. The Orders panel uses 139, which is common for UPS and FedEx domestic but not every carrier.
- [ ] Email alert when an order passes its time limit or a lot gets within 30 days of expiry.
- [ ] A weekly client report using the existing Excel and PDF exports.
- [ ] Saved load lists and Excel upload for the Load check.
- [ ] A short in-app feedback prompt on the insight ("Was this the right bottleneck?"). This tells you whether the analyst is right.

## Later

- WooCommerce and warehouse-system connectors.
- GPS or telematics, a map and driver tracking. That brings in driver consent and location-privacy work; don't start it before then. Choosing between map providers also waits until then.
- The isometric floor view (the zone cards are built to be swapped out).
- A real pallet and cube load planner, which is a different and riskier product from the estimate.
- More niches beyond Apparel and Supplements, a desktop app, single sign-on.
- A live AI engine to word the insight (see below).

## Load check accuracy

The check is a rough estimate, and it can be wrong in these ways:
- **Volume assumes perfect packing.** Real loads rarely use all the space. That's why it warns from 85%.
- **Vehicle limits are typical figures.** Actual payload depends on the exact chassis and what's already on board. The user can edit them; the door-label rating is the truth.
- **It doesn't check axle weights**, how freight is stacked, fragile or hazardous items, or the weight of pallets and packaging unless they're in the list.
- **CSV mistakes.** Handled: quoted commas, tab and semicolon files, kg and cm headers, "weight per item" versus "total weight", blank cells, bad rows and missing sizes (volume then shows as "at least"). A semicolon file now reads "1,5" as 1.5.
- **Not handled:** headers in other languages, mixed units in one column.

Test plan:
- Unit tests at 0%, 84%, 85%, 100% and 101%, for weight, volume and both together.
- A folder of real CSV exports from beta customers, run through the parser with the expected totals written down.
- Check three real loads by hand against a calculator, once, before launch.

## The AI layer

- Today the insight comes from the built-in rule-based analyst. It never invents a number: every figure comes from the order data.
- If you add a live model, keep the project rule: the rule-based answer stays as the fallback and the source of truth. Let the model only reword it. Pass it the computed facts, not raw orders, and reject any reply that contains a number not in those facts.
- Set a per-workspace monthly cap on model calls and cache the insight (it only changes when the data does), so cost per user stays predictable.

## Billing and free plan

Pricing is in `client/src/lib/pricing.ts`, with the reasoning in `docs/PRICING.md`. Per the project rule, don't add pricing or marketing claims until the feature ships.

Suggested starting shape (a decision for you, not a recommendation backed by data): the free plan covers one warehouse, one client and a monthly order cap, with the Load check free for everyone. Paid plans unlock more clients and the sharing preview.

## Running it

- Large files and big order volumes: the Orders board is paginated and the CSV limit is 2 MB. Real volumes need server-side pagination and zone numbers calculated in the database, not in the browser.
- Confirm Supabase backups and point-in-time recovery are included in your plan. Don't assume.
- Add error tracking before the beta. Know about a broken import before the customer does.
- Webhooks must reply fast and be idempotent, or a retry will double-count orders.

## Beta

- 2 or 3 small 3PLs for 2 to 4 weeks, each with at least two of their own clients invited.
- Watch for: time to the first real insight (aim for under 15 minutes from sign-up), whether the ops lead agrees with the named bottleneck, and whether clients actually log in.
- Stop and fix if a client ever sees something they shouldn't. Treat that as a launch blocker.

## What was cut from the original idea, and why

| Idea | Decision |
|---|---|
| Map with live vehicle pins | Cut. Fake pins don't help a real customer. Needs real telematics first. |
| Pallet-layout load builder | Cut. A different, higher-risk product. The fill gauge answers "will it fit?" well enough for v1. |
| Isometric warehouse and rack heatmap | Delayed. Zone cards give the same answer; needs real location data to mean anything. |
| 7 e-commerce niches | Cut to 2 so each one is good. |
| Desktop app | Delayed. The web app already works everywhere. |
| Driver and vehicle-performance panels | Cut. Needs GPS and consent. |
