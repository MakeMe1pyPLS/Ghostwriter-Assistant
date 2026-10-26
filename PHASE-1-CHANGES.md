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

### AI & automation metrics and the "AI project check"
- **KPI Library grows from 314 to 347 metrics.**
  - **New AI & automation set (22 KPIs)** for any business using AI, in four groups:
    - is the AI right? (detection rate, false alarms, escape rate, forecast error, warning lead time, drift)
    - is the operation better? (downtime avoided, scrap reduction, OEE change, hours saved)
    - are people using it? (acceptance, overrides, active users, alert-to-action time)
    - is it worth it? (ROI, payback, cost per prediction, data readiness, human review, incidents)
  - New **AI** category filter. `/kpis?category=AI` opens straight on it.
  - **Discrete manufacturing goes from 10 to 21 KPIs.** New ones include MTBF, MTTR, planned maintenance share, changeover time, rework, energy per unit, OTIF, work-in-progress days, labor productivity, recordable incident rate and maintenance cost per unit.
- **New consult session: AI project check.**
  - You enter what the AI does, the monthly cost of the problem before and after, what the AI costs, and (optionally) accuracy, how often staff follow it, data readiness and months live.
  - It works out monthly savings, net return, ROI and payback.
  - It names the weak link (accuracy, adoption or data) and recommends scaling it, fixing the weak link, or pausing it.
  - It's recommended automatically for manufacturing, food production, construction, agriculture and energy businesses.
- **KPI counts on the home, pricing, features and KPI Library pages now come from one place** (`shared/kpi-stats.ts`), so they can't disagree. The home page used to say 46 industries while the library said 45. The real count is 45, plus the cross-industry sets. The app warns in the console if the counts drift from the data.
- The industry pickers (interview, add client) no longer list the cross-industry sets as an industry.

### Phase 2, part 1: real accounts (Supabase)
- **Real sign-up and sign-in.** Accounts are created in Supabase Auth with your email and password, replacing the pretend login.
  - A confirmation email is sent, and its link signs you in.
  - "Forgot password?" sends a reset link. The new **/reset-password** page sets a new password.
  - Clear messages for a wrong password, an unconfirmed email, an email that's already registered, and too many attempts.
- **Your workspaces are saved to your account:** your business, every client workspace, plans, actions, consult sessions, datasets and dashboards.
  - Changes save a couple of seconds after you make them. Settings and the account menu show "Saved to your account".
  - Sign in on another device and everything is there.
  - The first time you sign in, anything you built before having an account is moved into it. A different account's data is never mixed in.
  - Signing out removes this browser's copy, so the next person on the computer can't see it.
  - Offline edits save when you reconnect.
- **Security:** each table has row-level security, so an account can only read or change its own rows. Your plan and trial dates can't be changed from the app; billing will set them.
- Without an account (the demo, or with `VITE_SUPABASE_URL=off`), everything still works in the browser as before.
- The Privacy Policy now says where data is stored (Supabase, United States) and that signing out clears the browser's copy. The Clients page now says client workspaces are saved to your account when you're signed in.
- **Before launch:**
  - Set up custom SMTP in Supabase. Its built-in email service only delivers to members of your Supabase team and sends only a few emails an hour.
  - Set the Auth Site URL and redirect URLs in the Supabase dashboard.

### Builder as an open grid, exports that keep your layout, and layout fixes on every device
- **The Builder is now the page, not a box.** The grid scrolls with the page instead of inside its own window.
  - In edit mode it shows dashed column guides. The widget library stays beside the grid as you scroll.
- **Toolbars never cut off buttons.** Every toolbar now wraps onto a second line instead of hiding buttons off-screen; this was why the last Builder button was cut off. The Builder keeps its main actions in view (Edit layout, Save, Export, View dashboard). Generate, Enhance, Templates and the JSON spec are under **More**.
- **Two ways to arrange cards:**
  - **Locked to grid:** cards snap into rows and gaps close automatically. This is the default.
  - **Free:** cards stay exactly where you drop them.

  The choice is saved with the dashboard.
- **Edit on any device.** On phones you now edit the full desktop layout on a scaled canvas, with **Fit / 60% / 100%** zoom. Cards land in the same spot as on a computer, so the Dashboard and exports match. Resize handles are bigger on touch screens.
- **Fixed:** the grid ignored some settings, so finished dashboards could be dragged, cards moved from anywhere instead of their top bar, and arranging didn't behave as set. These now work as intended. The Builder also no longer shows the old message that moving cards only works on a computer.
- **Cards fit their content:** KPI numbers and badges size themselves to the card's width. The AI Insights card no longer scrolls inside itself; its sections sit side by side on wide cards.
- **Templates now give different layouts:** Excel, Google Sheets, Power BI, Tableau and SQL each have their own arrangement. Before, they all produced the same three cards. Template descriptions no longer claim live or real-time features.
- **Exports that keep your layout** (built in the browser, so they work on the live site):
  - **Excel:** each card is placed where it sits on the grid, and AI cards come through as text. KPI numbers are formulas that read the Data sheet, so editing the data updates the dashboard. The dashboard prints as one landscape page.
  - **Google Sheets:** the same workbook. Upload it to Google Drive and open it with Google Sheets.
  - **Power BI starter pack:** named data tables (KPIs, Trend, Breakdown), a Layout sheet with each card's position on a 1280×720 page, a How to use sheet, and a matching colour theme (.json). It does not create .pbix files, and the export drawer says so.
- **Scrolling and fit across devices:**
  - The **Hub** scrolls as a normal page on phones, tablets and desktops, with the post form staying beside it on large screens.
  - Hub tabs, KPI Library category filters and AI Analyst suggestions wrap instead of hiding off-screen.
  - Every app page was checked at 390, 820, 1024 and 1366 px. None scrolls sideways, has buttons cut off, or has a box that scrolls inside the page.

### Builder canvas: dot grid, real free movement, and a touch-friendly edit mode
- **The Builder is a dot-grid canvas**, like a design tool. Dots mark every grid cell, and in edit mode the canvas fills the page.
- **Real free movement.** Layouts are now saved on a fine grid of 48 columns and 24px rows.
  - **Free** moves and sizes cards in small steps, and they stay where you drop them.
  - **Locked to grid** edits the same layout on the classic 12-column grid, where cards snap into rows and gaps close up. Switching to Locked snaps cards to the nearest cell.
  - Existing dashboards convert automatically. The Dashboard, Excel, Google Sheets and Power BI exports all follow the fine positions.
- **New edit mode:**
  - Tap or click a card to select it. A **selection bar** appears with large buttons: Edit, Duplicate, Delete, move left/up/down/right, and narrower/wider/shorter/taller.
  - On phones the bar sits above the tab bar; on computers it floats at the bottom of the screen. The small buttons in each card's corner are gone.
  - On touch screens only the selected card can be dragged, so swiping on other cards still scrolls the page. The resize handle shows on the selected card.
  - With a mouse you can drag any card from anywhere on it.
  - The keyboard works too: arrows move, Shift + arrows resize, Delete removes, Ctrl/⌘+D duplicates, Enter edits, Esc deselects.
- **Undo and redo** (buttons and Ctrl/⌘+Z), plus an Undo button on the "Card removed" message. Moving or resizing with the bar pushes overlapping cards down instead of stacking them.
- New and duplicated cards go to the bottom of the grid and are selected, ready to drag into place.

### Builder you drag around, richer KPI cards, and a new intro
- **The Builder is a canvas you move around by dragging.** This replaces the selection bar above.
  - Drag the empty grid to pan, with a mouse or a finger. The scroll wheel or trackpad also pans.
  - Ctrl/⌘ + scroll, a trackpad pinch or a two-finger pinch zooms. The zoom controls are at the bottom left (−, %, +, Fit).
  - Fit shows the whole page width. Phones and tablets edit the same desktop layout, scaled down.
- **Cards are click-and-drag only.**
  - Drag a card to move it.
  - Pull any of its four corners to resize it.
  - Edit, Duplicate and Delete are buttons on the card. With a mouse they appear when you hover over the card. On touch screens, tap a card and they float just outside it, sized for a finger at any zoom; that card's corner handles also appear.
  - Undo and redo still work: the buttons, Ctrl/⌘+Z, and Undo on the "Card removed" message.
- **KPI cards show more, without overflowing.** A card shows extra detail only when it has room, so small cards stay clean and larger cards tell more:
  - The value with its change, for example "+1.2% vs 97.2% last period". The arrow follows the direction of the change and the colour shows whether that is good or bad, so "Late shipments −12%" is a green down arrow.
  - One plain sentence on why the KPI moved, or what it measures.
  - Two slim bars comparing last period with now.
  - On tall cards, a "Next step".
  - "Last period" is worked out from the card's own value and change (`shared/kpi-detail.ts`). The "Previous", "Benchmark" and "Target" fields used to repeat the current value; they now show the real previous value, the change, or "Not set". The sparkline, which drew the same sample trend on every KPI, has been replaced by the comparison bars.
- **New homepage intro (about 2.3s, down from 4.7s).**
  - On a first visit, the loading screen paints the intro's dark dot grid, so loading flows straight into the intro.
  - A five-partner chain draws itself, one link flickers red, a teal pulse fixes it, and the chain folds into the logo.
  - The logo then flies to its place in the header while the dark layer opens from the centre. The hero plays its entrance as it is revealed, and the hero preview starts its demo only once the intro is done.
  - Tap, click, Esc, Enter or Skip opens it straight away. It shows once per browser (`ciq_intro_seen_v3`), so visitors who saw the old intro see the new one once.
  - It never plays with reduced motion or `?nointro`.

### Polish pass: clearer, faster, accessible on every device
- **Faster on phones.**
  - The homepage hero shows straight from the page's HTML, before the app's code arrives.
  - Inter is now self-hosted: one 50KB file instead of a round trip to Google Fonts.
  - Pricing, features, support, sign-in and checkout pages load on demand, so the homepage downloads about 25% less code.
  - Background prefetching waits until the page has loaded and skips data-saver and slow connections.
  - The intro is skipped on slow connections too.
- **Easier to read.**
  - Grey helper text and coloured status text now pass the WCAG AA contrast standard in light and dark mode.
  - In dark mode, primary buttons and teal links are readable again.
  - Headings scale smoothly on phones.
- **Design system.** `client/src/styles/tokens.css` is the one place for colours (brand, status), type, spacing, radius, shadows, layers and motion. The rules are in `docs/BRAND.md`.
- **Buttons:**
  - They have hover states and a loading state.
  - They grow to finger size (about 44px) on touch screens.
  - Links styled as buttons are now real links, not a button inside a link.
- **Accessibility:**
  - The AI Analyst tabs, a Dashboard button, the chat send button, Settings switches and form fields without labels now have accessible names.
  - Top-priority cards say whether they're open.
- **Dashboard:**
  - Top priorities start collapsed, so your KPI cards come up sooner.
  - A dashboard-shaped skeleton replaces the loading spinner (Builder too).
  - Narrow KPI cards no longer cut off their explanation.
- **Phones:**
  - The AI Analyst page no longer scrolls sideways at 360px.
  - Form fields render at 16px so iOS doesn't zoom in.
  - Full-height screens use the visible screen height.
- **SEO:**
  - Every page has its own title and description.
  - Public pages have canonical links, and app pages are hidden from search engines.
  - New `robots.txt` and `sitemap.xml`.
- **Deploys:**
  - Vercel now builds only the website (`vite build`), not the unused API server, so builds are quicker.
  - Hashed files and the font are cached for a year.

### Builder studio: full screen, free grid, grid sizes
- **The Builder takes the whole screen** on phones, tablets and computers.
  - The side menu, top bar and phone tab bar are tucked away. The ☰ button opens the menu whenever you need it.
  - Everything you need is in one toolbar.
- **A clear way out of editing:** a **Done ✕** button on every device (Esc on a keyboard). It saves and leaves edit mode.
- **Dragging no longer scrolls the page.** On phones, dragging the grid or a card moves only the canvas or the card.
- **Free mode with a grid size you choose:** Fine (48 columns), Medium (24) or Large (12). Moving a card only snaps that card; the rest stay exactly where they are.
- **A more playful feel:**
  - Cards lift and tilt slightly while you drag them, then settle into place.
  - The grid dots turn teal while you edit.
  - The card library docks on the right on desktop and can be hidden for more room.

### Every KPI in the Builder, with the right chart
- **All 347 KPIs are in the Builder's card library.** Search them, filter by industry (47) or category, and add any with one tap.
- **The right chart for each KPI** (`shared/kpi-viz.ts`):
  - Money totals like revenue use an area chart.
  - Counts like orders use a bar chart.
  - Rates toward 100% (on-time, utilization, accuracy) use a gauge.
  - Margins and growth rates use a line chart.
  - Everything else uses a KPI card.
- **Honest data.** A KPI that has numbers in your workspace shows them (green dot in the library). One without data shows "No data yet" and how it's measured, never another KPI's numbers. Excel exports now use each card's own KPI too, leaving an empty value to fill in when there's no data.
- **More room on the page.**
  - The Builder page is wider (1600px), so more cards fit side by side at a readable size.
  - New and duplicated cards go into the first free space instead of the bottom.
  - "Tidy up (close gaps)" in the ⋯ menu packs everything together, and Undo reverses it.
- **Gauge fix:** gauges now show the real percentage instead of a made-up fallback.

### Honesty fixes: Integration Hub and the home hero
- **Integration Hub no longer pretends.** The tiles used to show Excel, Shopify and Email as "connected" with a made-up sync time, and every Connect button showed "Connection Successful" without connecting anything. Now each tile says **Works now** or **Coming soon** (an icon and a word). Only file import (Excel, CSV and JSON) works in the browser. Slack, Teams and Google Chat say "Works now" only when the API server is reachable, otherwise "Coming soon". Everything else is "Coming soon" with no Connect button.
- **Removed:** the database-password forms and the Custom API drawer (its "Test connection" always said "reachable" and its "send" was simulated). Exports now marks Custom API "Coming soon".
- **Home hero is labeled.** The product mock now says "Example · Harbor & Pine Coffee" and a line under it says the numbers are made up and the company isn't real.
- **Home copy:** removed "build for Tableau" (no Tableau export exists). The Power BI starter pack is real.

### Fulfillment (prototype) for 3PLs and the brands they serve
A new **Operate → Fulfillment** page. It is a clickable prototype on **sample data** (every screen says so), with Apparel and Supplements as the two niches.
- **Overview.** Four plain-language numbers, then an **AI insight** that names the bottleneck and says what, why, how to fix it, when, and one next step. Below it is the fulfillment flow (Receiving → Pick → Pack → Ship → Returns) with the problem stage marked, and a health card for each zone. Tap a zone for its numbers and what to do.
  - The insight comes from the built-in analyst (`shared/fulfillment.ts`), so it works with no keys and no server. It is not a live AI engine yet.
  - Status is always shown with an icon and a word as well as a colour.
  - The zone cards sit behind one interface (`ZoneViewProps`), so an isometric floor illustration can replace them later without touching anything else.
- **Orders board.** Status tabs with counts, a "late orders only" switch, and a detail panel (a bottom sheet on phones) with a progress stepper, timing against the limit, package details (actual, size-based and billed weight) and the items in the box, with lot and expiry for supplements.
- **Load check.** Pick a cargo van, cutaway box truck or 53' trailer, then type a total weight and volume or upload a CSV. It shows % full by weight and by volume, says which limit is hit first, and warns from 85%. Columns are matched automatically and you check a preview (with problems listed by line) before anything is used. It is labeled as an **estimate**: typical vehicle limits, perfect packing assumed, no pallet layout. Excel files must be saved as CSV first (Excel upload is coming soon).
- **Niche modules.** Apparel: stock by size and color with low and out flags, and returns by reason. Supplements: lots listed first-expiry-first-out, and subscription boxes for the next 7 days.
- **Clients.** The 3PL chooses what each client can see (orders, stock, returns, bottleneck insight) and previews exactly that. A client only ever gets its own rows; anything not shared shows as locked. Sending real invitations is **coming soon**.
- **Not included yet:** map, desktop app, live data connections (Shopify, ShipStation, GPS), saved load lists.

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

### Design system foundation (step 2 of the redesign)
- **Nothing in the product changes yet.** This adds the shared chart and status parts and a hidden preview page at `/design` (not linked anywhere, not indexed). Screens move onto these parts in later changes.
- Chart colour tokens (`--chart-*`) for light and dark, checked for colour-blind separation and contrast.
- Parts: KPI card, sparkline, chart frame with a Table view, trend chart, target gauge, heat strip, pipeline flow, bottleneck card, ranked problem row, action card, impact and effort quadrant, industry card, empty state, status chip.
- One illustration style with six illustrations.
- Rules written down in `docs/BRAND.md` under "Data visualization".
