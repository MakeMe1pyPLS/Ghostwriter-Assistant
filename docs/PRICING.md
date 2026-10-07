# How ChainInsideIQ is priced

Prices balance two things: **supply** (what each customer costs to serve) and **demand** (what buyers compare us against and what they'll pay). Revisit this every quarter, or whenever AI model prices change.

## Supply: cost to serve

The biggest variable cost is AI. One "AI answer" (an analyst reply, a plan rebuild step, an analysis) is about **3,500 input tokens** (the analyst framework, business context and question) plus **1,000 output tokens**.

| Engine | Price per 1M tokens (in / out) | Cost per AI answer |
|---|---|---|
| Claude Sonnet 5 | $2 / $10 | ≈ $0.017 |
| Gemini 3.8 Flash | $0.75 / $3.75 | ≈ $0.006 |
| GPT-6 Luna | $0.10 / $0.50 | ≈ $0.001 |

Prices are from OpenRouter's public model pages (October 2026).

| Plan | Price | AI answers / month | Worst case (all Claude) | Typical (mixed engines) | AI cost share, worst case |
|---|---|---|---|---|---|
| Starter | $49 | 200 | $3.40 | ≈ $1.20 | 7% |
| Professional | $129 | 1,000 | $17.00 | ≈ $6 | 13% |
| Business | $299 | 3,000 | $51.00 | ≈ $18 | 17% |

**Other costs:**
- Payments: about 2.9% + $0.30 per charge.
- Hosting: Vercel plus an API host and database. This is roughly $70/month fixed at launch and close to nothing per customer.
- Support time: the real cost on Business and Enterprise.

Even in the worst case, gross margin stays above 75% on every plan.

**Levers if costs rise:**
1. Cache repeated analyses. This is the biggest saving.
2. Route Starter to Gemini or Luna by default.
3. Keep the allowances.

Note: AI allowances are plan terms today. Metering and enforcing them needs server-side accounts (Phase 2).

## Demand: what buyers compare against

| Product | What it is | Price |
|---|---|---|
| Julius AI | Solo AI data analyst | $20/month |
| Databox | Business dashboards | $64 / $159 / $399 a month (yearly) |
| Fathom | Financial analysis for accountants and consultants | $65/month per company; $390 for 10 |

**What this means for us:**
- **Owner-operators** compare us to $20–$65 tools. Starting under $50 removes the biggest objection, and the growth plan, bottlenecks and partner collabs justify the premium over a solo analyst.
- **Growing teams** pay for collaboration and choosing their AI engine. $129 sits between Databox Analyst and Pro.
- **Operations teams and consultants** compare to $159–$399 tools and per-company pricing. Business stays at $299.
- **Yearly billing** saves about 20%, matching the category norm, and improves cash flow.

## Current plans

| Plan | Monthly | Yearly (per month) | AI answers |
|---|---|---|---|
| Starter | $49 | $39 | 200 |
| Professional | $129 | $99 | 1,000 |
| Business | $299 | $249 | 3,000 |
| Enterprise | Custom | Custom | Custom |

AI Consultant sessions are in every plan. A session answered by an AI engine costs about the same as one AI answer (the prompt is a little longer, the reply a little shorter). The built-in consultant has no AI cost. Client workspaces for consultants and agencies start at Professional, the same tier that unlocks AI engine choice and unlimited collabs. Agencies usually run several clients at once, so they get most of their value from those features.

The source of truth is `client/src/lib/pricing.ts`. This is a pricing model, not financial advice. Validate it with real customer conversations and conversion data.
