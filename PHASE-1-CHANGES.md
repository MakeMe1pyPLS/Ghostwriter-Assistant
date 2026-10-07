# ChainInsideIQ · Phase 1 changes

Phase 1 turns ChainInsideIQ from a dashboard generator into an AI business tool: owners set a goal, get a step-by-step plan, spot bottlenecks and fix them with their partners. The existing product is kept and improved, not replaced.

## What's new

### New customer flow
Sign up (or buy) → verify email → **AI Analyst interview** (8 questions, ~2 minutes) → **Growth Plan** → **product tour** (skippable).

- `/onboarding` asks about the goal, business name, industry (46 options), team size, stage, challenges, target KPI and timeframe, and partners.
- The plan is written by the AI router (Claude, ChatGPT or Gemini). With no keys, or no server, the built-in analyst writes it.
- Sign-in now goes to `/plan` (or `/onboarding` if the interview isn't done). Checkout success goes to the interview.

### Growth Plan (`/plan`)
- Goal headline, North Star metric with a progress ring, supporting KPI targets and a "Next up" card.
- **Plan view:** three phases with steps. Each step has an owner, a due date, a status, "Ask the analyst", and Add to Google Calendar, Outlook or Apple Calendar (.ics).
- **Action board:** To do, In progress and Done. It also collects actions created from bottlenecks and Hub posts.
- Export the plan to Excel, CSV or calendar. Share it to Teams, Google Chat, Slack or email.
- Rebuild the plan with a chosen AI engine. Actions you added yourself are kept.

### Three AI engines
- `server/services/ai/engines.ts` has adapters for Claude (Anthropic SDK), ChatGPT (OpenAI REST) and Gemini (Google REST). No new npm packages were added.
- `server/services/ai/intelligence-router.ts` tries the requested engine first, then the other connected engines, then the rule-based engine, so every request gets an answer.
- Settings → AI engine: users pick Auto, Claude, ChatGPT or Gemini, and can see which engines are connected.
- New endpoints: `GET /api/ai/engines` and `POST /api/ai/growth-plan`. The existing AI endpoints accept an `engine` field.

### Works on Vercel without the server
The rule-based analyst, dashboard generator, exporters, KPI library and plan builder moved to `shared/` so the browser can use them.
- **Bottlenecks, Recommendations, Pipeline, the Command Center and AI chat** now work on a frontend-only deploy. On the live Vercel site they currently show "Could not load".
- **Generate and Enhance** work without the server.
- **CSV, Excel (.xlsx) and JSON imports** are parsed in the browser.
- **Exports** fall back to browser-built CSV, JSON and a formatted Excel workbook.
- **`vercel.json`** adds SPA rewrites, so refreshing a page like `/plan` no longer 404s.

### Collaboration
- **Data collabs (`/collabs`):** 8 templates (Seller + 3PL, Manufacturer + suppliers, Restaurant + distributor, Business + agency…). Each collab has partners, shared datasets, shared KPIs, an access level and a review cadence. **Reuse as preset** copies a collab to set up the next partner. Invites go out by email.
- **Hub:** posts are now saved rather than lost on page change. Posts have reply threads and can be tied to a collab. Any post can become a tracked action or be sent to Teams, Google Chat or Slack. Links like `/hub?thread=…` open and highlight a thread.
- **Bottlenecks and Recommendations:** "Discuss with partner" opens a Hub thread for that issue, and "Track as actions" adds its action-plan steps to the board with weekly due dates.

### KPI Library (`/kpis`)
314 KPIs across 45 industries plus a universal set. Each shows how it's measured, its unit and which direction is better. You can search, filter by industry and category, track KPIs and set one as the plan's North Star.

### Microsoft and Google (first step)
- **Settings → Connected tools:** paste an incoming-webhook URL for Microsoft Teams (Workflows), Google Chat or Slack, then test and save it.
- **Calendar links** for Google Calendar and Outlook, plus `.ics` files, on every action with a due date.
- **Email sharing** through `mailto:`, which opens Outlook, Gmail or the default mail app.

### Import & export
- File upload accepts CSV, TSV, Excel (.xlsx) and JSON. The Excel importer picks the fullest sheet, finds the header row and evaluates formulas.
- **Enhance** now starts with "Which dashboard should we improve?" You can upload an Excel, CSV or JSON dashboard spec, or use the current one. Uploaded data is also saved to Data Sources.

### UI and motion
- One motion system (`client/src/components/motion.tsx`) with page transitions, staggered lists, scroll reveals and press feedback. Every animation runs 150–400ms and respects the phone's "reduce motion" setting.
- The sidebar is grouped into Grow, Spot & fix, Collaborate, Build and Data, with an animated active state.
- On phones, the top bar has a quick "Analyst" button. All new pages were checked at 390px (phone) and 1440px (desktop).
- The homepage and marketing copy were repositioned around the new message ("Find the bottleneck. Fix it together."), with a four-step "How it works" and a "Who it's for" section.

### Fixes from the code review
- **Server now reachable on hosting platforms:** it listens on `0.0.0.0` using `httpServer`. Before, it used `127.0.0.1` with `app.listen`, which blocked Replit deploys and broke hot reload.
- **Logs no longer include full response bodies,** which could contain customer data.
- **AI endpoints are rate-limited per IP** (`AI_RATE_LIMIT_PER_MIN`, default 30).
- **API data import is safer:** it blocks private, loopback and cloud-metadata addresses, blocks redirects, and filters headers.
- **CORS is available** for split deployments (`ALLOWED_ORIGINS`).
- **Card style presets** now look the same in the Builder and on the Dashboard (`client/src/lib/card-shell.ts`).
- **The chart-type picker** no longer appears on KPI and table widgets.
- **The `catMetrics` type error** is fixed.
- **The checkout success page** no longer claims a card was connected through Stripe.
- **Removed stray files:** `cross-env`, `rest-express@1.0.0`, the `fix_*.cjs` and `replace_dashboard.*` patch scripts, and the duplicate `scripts/build.ts`. The duplicate `welcome.tsx` homepage was also removed; `/welcome` now opens the interview.
- **Added `.gitattributes`** so Windows line endings stop showing as changes.

### Phase 1.2: analyst framework, project brief and intro
- **AI Analyst framework** (`shared/analyst-framework.ts`): one editable playbook (principles, diagnostic order, prioritization, rules of thumb, collaboration rules, tone, red lines, output rules and example answers) is sent to Claude, ChatGPT and Gemini on every request, so all three follow the same method. Edit it to "train" the analyst.
- **Project brief** (`CLAUDE.md`) and **brand, design and motion spec** (`docs/BRAND.md`): the setup every developer and AI assistant works from.
- **Homepage intro:** a 4-second interactive story (chain → bottleneck → fixed → logo), shown on the first visit only. Click, tap, Esc, Enter or "Skip intro" ends it; reduced-motion users never see it; `?nointro` turns it off.

### Phase 1.3: works on every device, cleaner and more interactive
- **Phones and tablets** get a bottom tab bar (Plan, Analyst, Bottlenecks, Hub, More) with the full menu one tap away. The header shows a search button and a soft shadow once you scroll.
- **Laptops and landscape tablets (1024–1279px)** get a slim icon sidebar with labels on hover, so pages have room. Wide screens get the full sidebar. Either can be collapsed or expanded, and the choice is remembered.
- **Quick-jump search:** press Ctrl/⌘ K or `/` (or tap the search icon) to jump to any page, run common actions (ask the analyst, import, export, start a collab, rebuild the plan, retake the tour) or find a step in your plan.
- **Cleaner sidebar:** single-line page names, the business-mode switch folds into one compact row, and "Coming soon" items take one small block.
- **Page action buttons** on Dashboard and Builder sit in one swipeable row on smaller screens instead of uneven wrapped rows.
- **Builder and Dashboard grids** now reflow cleanly on tablets and phones (widgets used to end up staggered with gaps).
- **Hub** is on by default, because "Discuss with partner" and Collabs depend on it. Hub stats fit on phones, and tabs have an animated indicator.
- **The old "Set up your business structure" popup** no longer appears for people who finished the AI interview, or in the demo.
- **The product tour** points at the tab bar on phones and places its card where it fits.
- **Feel:** buttons respond to presses, focus rings are consistent, pages load with a thin progress bar instead of a full-screen spinner, and page code is prefetched once you're in the app, so switching pages is near-instant.
- Pricing shows 2 columns up to 1279px wide so plans aren't squeezed on laptops. Toasts sit above the tab bar.

### Phase 1.4: redesigned website, dark mode, new logo, new pricing
- **Light and dark mode** across the whole app and website. There's a switch in every header, the choice is remembered, and the page never flashes the wrong theme on load. With no choice saved it follows the device setting. The new theme spreads out in a circle from the button where the browser supports it.
- **New logo:** two interlocking chain links (you and your partner, the teal link is the fix) on an ink tile, plus a new favicon and app icon.
- **Redesigned homepage:**
  - A live, interactive product preview in the hero: orders flow, the warehouse backs up, the AI explains it, and "Apply fix" clears it while KPIs climb. It plays once by itself.
  - Real product numbers (314 KPIs, 46 industries, 3 engines, 2 minutes) and a how-it-works rail that fills as you scroll.
  - A feature grid with six small animated illustrations.
  - "Who it's for" tabs, a pricing teaser, FAQ and a final call to action.
- **Features page rebuilt** with the animated illustrations instead of placeholder icons. Copy now matches what ships: removed PDF export, "direct" Power BI export, and ERP or warehouse connectors.
- **Pricing based on supply and demand** (see `docs/PRICING.md`):
  - Plans: Starter $49 ($39 yearly), Professional $129 ($99 yearly), Business $299 ($249 yearly), Enterprise custom.
  - Each plan includes an AI answer allowance (200 / 1,000 / 3,000).
  - A monthly/yearly toggle, a three-tap plan finder, a comparison table and pricing FAQ. Checkout carries the billing choice.
- **Stronger intro (about 4.7s, once, skippable):**
  - Particles ignite the chain, energy pulses jam at the weak link with a red shockwave and shake, and a teal beam snaps it fixed.
  - The chain then folds into the new logo with a wordmark sweep.
  - Visitors who saw the old intro see the new one once.
- **Dashboard:** greeting with your business name, an animated view switch, KPI numbers that count up, widgets that rise in one after another, a health ring that draws in, and smooth priority expand and collapse.
- **Website header:** see-through at the top and frosted once you scroll. Added Demo and Support links. The scrolling marquee is gone.
- **Removed false claims** from sign-in and sign-up ("bank-grade encryption", "SOC 2 ready"). Fixed the social-share image and the Twitter handle that still pointed to Replit.

### Phase 1.5: phone fixes
- **Builder:** the + (add widget) button is always available on phones and tablets and sits above the tab bar. The builder now scrolls as one page.
- **Hub** scrolls on phones (the feed used to be squeezed into a fixed-height box); "Post to Hub" is reachable above the tab bar.
- **Bottlenecks, Recommendations, Pipeline, AI Analyst, Data Sources, Exports and Connectors** scroll as one page instead of an inner box, with smaller side padding on phones.
- **Dashboard and Builder** half-width cards on phones get one more row so their bottom line isn't cut off.
- The **X button** in the footer links to [@AtomBSA](https://x.com/AtomBSA), and link previews credit @AtomBSA.

### Builder: what you save is what the Dashboard shows
- **Fixed a bug where Builder edits didn't reach the Dashboard.** With the widget library open, the grid became narrower than 1200px and switched to a 10-column layout. Your edits went to that version and were thrown away, because only the full-width layout was saved.
- **One layout now covers every screen at least 540px wide** (tablets, laptops, desktops, and the Builder with the library open). The Builder and Dashboard use the same layout, so positions match exactly.
- **Phones get a stacked version** made from your layout, which is never saved back over it. On phones, moving and resizing is turned off (tapping to configure and the + button still work), and a short note explains why.
- **Save:** a **Save** button, plus **Save layout** and **Done** in edit mode. You get a "Layout saved" confirmation with a **View dashboard** shortcut, a "Saved just now" status under the title, and a **View on dashboard** button. Changes still save automatically, so nothing is lost.
- **Phone stacking** fills gaps, so a half-width card never leaves a hole beside it, and uses slightly shorter rows so cards fit without wasted space.

### Interview: "Do you have this data already?"
- After choosing their target number, the analyst lists the numbers it needs for that industry and goal, and what to record for each. For example, a restaurant fixing delivery needs on-time orders, ticket time, food cost and covers.
- Three answers:
  - **I have it. Upload now:** CSV, Excel or JSON, read in the browser. The analyst shows which needed numbers it found in the file and which are missing, and saves the file to Data Sources.
  - **I have it. Add it later:** the plan lists exactly what to export.
  - **Start fresh:** a ready-made weekly tracking sheet (Excel or CSV). It has a column for each number, 12 weeks of rows and a "How to use" tab.
- Step 1 of the growth plan matches the answer: check the imported numbers, import the file, or start tracking weekly. The AI engines get the same information.
- **Fixed:** every column imported from a CSV was getting " (2)" added to its name.

### Business consultant: AI Consultant sessions and client workspaces
- **AI Consultant** (new "Consult" section in the menu). Eight short sessions, each 4 to 6 minutes:
  - business health check, pricing review, cash flow check, growth strategy
  - bottleneck deep-dive, partner and vendor review, hiring readiness, SWOT and strategy
  - Each session asks for a few numbers and returns findings, 2 or 3 options with pros, cons, impact and effort, and a recommendation.
  - Pick an option and its steps become actions on the board, with owners and due dates.
  - Sessions are saved with the decision, so you can reopen them. The summary can be copied for email or Teams, and each session ends with a follow-up question you can take to the AI Analyst.
  - The page recommends sessions from your goal and the challenges you named.
- **The built-in consultant does real calculations**, so every session answers with no AI engine connected. Examples:
  - how much volume a price rise can lose before profit drops
  - runway and the cash conversion cycle
  - the monthly growth rate needed to hit a target
  - capacity gap at a bottleneck
  - partner score
  - hire payback
  When Claude, ChatGPT or Gemini is connected, it gets the same figures and must answer in the same format, so it falls back cleanly. New endpoint: `POST /api/ai/consult`.
- **Clients** (for consultants and agencies, Professional plan):
  - Add a client with industry, contact, engagement type and first review date, then run the AI interview for them.
  - Each client has a separate workspace: plan, actions, Hub, collabs, consult sessions, datasets and dashboards.
  - Switch between workspaces from the sidebar, the client list or Ctrl K. A purple bar shows whose workspace you're in, with a one-tap way back to your own business.
  - The client list shows progress, overdue actions, status and next review date, plus notes for each client.
  - **Printable progress report** for each client: goal, plan progress, work done in the last 30 days, consulting decisions, next actions, and optional notes. Print it or save it as a PDF.
  - Client workspaces are saved in this browser on this device until accounts arrive. The page says so.
- **Fixed:** the growth-plan endpoint now passes the interview's data answers (uploaded, later, or start fresh) to the AI engines. Before, they were dropped.

## Environment variables

| Variable | Needed for | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude | — |
| `OPENAI_API_KEY` | ChatGPT | — |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | Gemini | — |
| `AI_PROVIDER` | First choice when set to Auto: `claude`, `openai` or `gemini` | `claude` |
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` / `GEMINI_MODEL` | Model IDs | `claude-sonnet-5` / `gpt-6-luna` / `gemini-3.8-flash` |
| `AI_RATE_LIMIT_PER_MIN` | AI calls per IP per minute | `30` |
| `AI_TIMEOUT_MS` | Per-engine timeout | `45000` |
| `ALLOWED_ORIGINS` | CORS when the frontend and API are on different domains | — |
| `VITE_API_URL` (frontend) | Points the Vercel frontend at a separately hosted API | same origin |

Check each provider's model list and set the `*_MODEL` variables if a newer model is available.

## Deploying

**Frontend only (Vercel, as today):** push this code. Everything works in demo mode with the built-in analyst. Sending to Teams and Google Chat and the AI engines need the server.

**Frontend on Vercel + API elsewhere (recommended):**
1. Deploy the whole repo to Render, Railway, Fly.io or Replit with `npm run build` then `npm start`, and set the API keys.
2. On that host, set `ALLOWED_ORIGINS=https://ghostwriter-assistant.vercel.app`.
3. On Vercel, set `VITE_API_URL=https://your-api-host` and redeploy.

## Testing checklist
1. `npm install`, then `npm run check`, then `npm run dev`.
2. Sign up → verify → answer the interview → open the plan → take the tour.
3. On the Plan page: tick steps, set a due date, add one to your calendar, export to Excel.
4. Bottlenecks → Discuss with partner (it should open the Hub thread) → Track as actions (they should appear on the board).
5. Collabs → create from a template → Reuse as preset → Send invite.
6. Data Sources → upload an .xlsx file. Enhance → upload a dashboard file.
7. Settings → Connected tools → paste a Teams or Google Chat webhook → Test.
8. Resize to phone width and repeat the key steps.

## Not in Phase 1 (planned)
- **Phase 2:** real server-side accounts and companies, partner invites so two companies see the same data live, Postgres storage for plans, collabs, Hub and datasets (Drizzle is already set up), Stripe Checkout, and role permissions.
- **Phase 3:** Microsoft 365 and Google Workspace sign-in (Graph API for Outlook, Teams and OneDrive; Google APIs for Gmail, Chat, Sheets and Drive), scheduled reports, and live connectors (Shopify, QuickBooks, ShipStation…).

Until Phase 2, all workspace data (plans, actions, collabs, Hub posts) is stored in the user's browser.
