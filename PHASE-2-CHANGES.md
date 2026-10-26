# ChainInsideIQ · Phase 2 changes (visual redesign)

Phase 2 makes the analysis screens easier to read at a glance. Same data, same features, clearer pictures. Rules for the new look live in `docs/BRAND.md` → "Visual system".

## What changed for customers

### Bottlenecks (`/bottlenecks`)
- Opens on **your #1 bottleneck**: what's happening, why, what it's costing you, and how to fix it, with its steps beside it.
- The rest are a ranked list with a 1–3 bar severity meter and the workflow affected. Open any row for the full detail.
- An **At a glance** panel counts bottlenecks by impact and shows which workflows they're in.
- A progress track shows how far each bottleneck is from fixed.

### Pipeline (`/pipeline`)
- Now a **fix pipeline**: Spotted → Cause found → Fix planned → In progress → Fixed.
- The flow at the top counts issues at each stage and marks the stage where most are waiting. Tap a stage to filter.
- Issues move along when you **Track as actions** and work through those actions on your Growth Plan board.
- Each issue tells its story as a timeline (right now → what we spotted → why → the fix → when it's fixed).

### Recommendations (`/recommendations`)
- Each fix is an action card: **What** to do, **Why**, **How** (numbered steps) and **When** (Now / This week / Later), plus effort and status (Not started, To do, In progress, Done).
- An **Impact vs effort** map puts quick wins top left; tap a number to jump to that fix.
- Filter by timing and see how many fixes are done.
- How it's worked out, shown on screen: timing comes from severity, effort from the number of steps.

### KPI Library (`/kpis`)
- Opens on an **illustrated industry picker** (11 groups, 46 industries) instead of a wall of cards.
- Pick an industry to see its metrics plus the ones every business should watch, with a "What they measure" breakdown you can tap to filter.
- 24 cards at a time with "Show more". Cards show the category, formula and which way is better in plain words.
- Search and "Tracked" work across everything, as before.

### Dashboard (`/dashboard`)
- Clear title and one primary action (**Ask the analyst**). "Share" now opens the share menu (it did nothing before). "Edit layout" goes to the Builder.
- Removed the pulsing "Live" dot, which suggested a real-time feed the dashboard doesn't have.

### Everywhere above
- No text under 12px on these screens (11px inside resizable dashboard cards); sentence-case titles instead of all caps.
- Severity always shown with an icon and a word as well as colour.
- Friendlier empty and error states that say what to do next.

## For developers
- New `client/src/components/viz.tsx` holds the shared pieces.
- New helpers in `components/analyst/operations-shared.tsx`: `fixStageIndex`, `trackedStatus`, `effortOf`, `TIMING`, `IMPACT_SCORE`, `FIX_STAGES`.
- `tsconfig.json` now sets `target: ES2022`, so `npm run check` passes (it had 18 errors about iterating Maps and Sets).

## Fulfillment illustrations

### Load check (`/fulfillment` → Load check)
- New side-view drawings of a cargo van, a cutaway box truck and a 53' trailer.
- The cargo area splits into one block per line of your load, as wide as that line's share of the vehicle. Switch between **by weight** and **by volume**. Lines with no size are left out of the volume view, and the screen says so.
- Totals cards (by weight, room left, by volume, on board) and a table of lines. Tap a block or a row to highlight the other.
- **Try an example load** fills it with made-up lines.
- Still an estimate: blocks show how much of the vehicle each line uses, not where it goes.

### Warehouse floor (`/fulfillment` → Overview)
- A 3D-style floor with the five zones in the order work flows. Floor colour shows health, and each zone's pin shows its name, how many are waiting, and On pace / Watch / Bottleneck.
- The cartons on each zone are drawn to scale with the work waiting there (the busiest zone shows 12).
- Tap a zone (or its row underneath) to open the same drawer as before. Switch back to the cards with **Floor / Cards**. Your choice is remembered.

### Orders (`/fulfillment` → Orders)
- Each order card and the detail panel shows a small drawing of where the order is: in the queue, on the shelf, on the packing bench, boxed and waiting, with the carrier, or coming back.
- Cards sit two to a row on wide screens.
