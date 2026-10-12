# ChainInsideIQ — brand, design and motion spec

The visual rules for the product. Pair with `CLAUDE.md`. Improve within these rules; don't introduce new styles without updating this file.

## Brand in one line
**Find the bottleneck. Fix it together.** A calm, capable business analyst, not a flashy gadget.

## Personality
Confident, clear, practical, warm. Like a senior consultant who explains things simply and gets to the point.

## Logo
Two interlocking chain links on an ink tile (`client/src/components/Logo.tsx`, `client/public/favicon.svg`). The white link is the business, the teal link is the partner and the fix, and the weave shows they're joined. Wordmark: **ChainInside** in ink plus **IQ** in teal, Inter Black with tight tracking. Use `<Logo />` or `<LogoMark />`; never redraw it.

## Color
| Token | Value | Use |
|---|---|---|
| Primary (teal) | `#0F766E` (`hsl(175 76% 26%)`) | Primary actions, active states, progress, brand accents |
| Teal light | `#5EEAD4` / `#99F6E4` | Highlights on dark surfaces, progress rings |
| Ink | `#0F172A` (slate-900) | Headlines, dark hero panels, active nav |
| Slate | `#64748B` (slate-500) | Body copy, secondary text |
| Canvas | `#F4F7FA` | App background |
| Surface | `#FFFFFF` | Cards |
| Line | `#E2E8F0` (slate-200) | Borders, dividers |
| Status: good / warn / critical | emerald-600 / amber-500 / rose-600 | Severity and status only; never decorative |

**Dark mode:** canvas `#070B13`, surfaces `#0D131E` → `#16202F`, lines `#1F2A3B`, ink panels lifted to `#16233A`, primary teal brightened.
- Light-first slate and white classes are remapped automatically by `client/src/styles/dark-theme.css`, which is generated. Run `node script/gen-dark-theme.mjs` after adding new colour classes.
- For new UI, prefer explicit `dark:` variants.
- On always-dark panels use `text-white/70` instead of `text-slate-300`.
- The theme logic is in `client/src/lib/theme.ts` and the switch is `<ThemeToggle />`.

Rules: teal is the only brand accent. Status colors mean status. Dark panels (ink) are reserved for heroes and highlights, at most one per screen.

## Typography
- Font: Inter (system fallback).
- Headlines: `font-black`, tight tracking, `text-balance`.
- Labels and eyebrows: 9–11px, `font-black`, uppercase, `tracking-widest`, slate-400 or teal.
- Body: 14–16px, slate-500/600, relaxed line height, about 65 characters per line max.

## Shape and depth
- Radius: cards `rounded-2xl` or `rounded-3xl`, controls `rounded-xl`, chips `rounded-lg`.
- Borders before shadows. Shadows are soft and used on hover or for one hero element.

## Layout
Navigation lives in `client/src/lib/nav.ts`: one list feeds the sidebar, the tab bar and quick-jump search.

| Width | Navigation |
|---|---|
| < 1024px (phones, portrait tablets) | Header (menu, logo, search) + bottom tab bar: Plan, Analyst, Bottlenecks, Hub, More. The full sidebar opens as a sheet. |
| 1024–1279px (laptops, landscape tablets) | 76px icon rail with tooltips |
| ≥ 1280px | 256px full sidebar (collapsible; choice remembered) |

- Content max width about 1400–1600px with 16–32px gutters. Stack to one column at 390px.
- Page action buttons go in a `.toolbar` (one swipeable row below 1280px, wraps above).
- Quick-jump search (Ctrl/⌘ K, `/`) is available on every app page.
- Touch targets are at least 40px; the tab bar respects the iPhone safe area.

## Motion
Motion explains what changed and where things went. It never makes people wait.

| Use | Duration | Easing |
|---|---|---|
| Hover, press | 120–200ms | spring (stiffness 500, damping 30–40) |
| Page transition, card enter | 250–320ms | `[0.22, 1, 0.36, 1]` (ease-out) |
| Stagger between items | 40–70ms | — |
| Scroll reveal (marketing only) | 400ms, once | ease-out |
| Intro (first homepage visit only) | about 2.3s, skippable | ease-out; the fly-out uses ease-in-out |

Rules:
- Use the primitives in `client/src/components/motion.tsx` (`PageTransition`, `Stagger`, `StaggerItem`, `Reveal`, `pressable`, `EASE_OUT`).
- Everything respects `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` is set in `App.tsx`).
- No looping attention-grabbers in the app. Loops are only allowed for loading and typing indicators.
- One orchestrated moment per screen at most (e.g. the Plan progress ring). Everything else is subtle.
- Never animate layout on every keystroke or data refresh.
- Selection indicators (sidebar, tab bar, Hub tabs) slide with a shared spring (`layoutId`, stiffness 500, damping 38–40).
- Buttons scale to 0.97 on press. Page loads show a thin top progress bar, never a full-screen spinner.

### The intro
- **Where:** homepage, first visit only (remembered in the browser as `ciq_intro_seen_v3`), never inside the app.
- **Blends with loading:** `index.html` paints the intro's ink (`#070C16`) and 28px dot grid before the app loads, so loading, intro and site read as one move.
- **Story (about 2.3s):**
  1. A five-partner chain draws across the dots.
  2. One link flickers red, and a teal pulse runs the chain and fixes it.
  3. The chain folds into the logo, with a soft ring and teal glow.
  4. The logo flies to the header logo while the dark layer opens from the centre (a radial mask). The hero plays its entrance as it is revealed (`useIntroReady` in `lib/intro-gate.ts`).
- **Interactive:** tapping or clicking anywhere, Esc, Enter, Space or "Skip intro" jumps straight to step 4.
- **Accessibility:** reduced-motion users and `?nointro` skip it entirely. The page is never blocked for more than about 2.5s.

### The Builder canvas
- A dot-grid canvas you pan by dragging empty space. Ctrl/⌘ + scroll or a pinch zooms. The zoom controls sit at the bottom left.
- Cards move by dragging and resize from any corner. Edit, Duplicate and Delete live on the card and are counter-scaled, so they stay at least 40px at any zoom.
- No move or resize button bars.

### KPI cards
- Show extra detail by container size, never by squeezing. In order of priority: the value and its change vs last period, then one plain sentence, then the last-vs-now bars, then "Next step".
- The arrow follows the direction of the change; the colour shows whether the change is good or bad.
- Only show numbers the card actually has. Never repeat the current value as a "previous", "benchmark" or "target".

## Voice and copy
- Name things the way customers say them ("Growth Plan", "Bottlenecks", "Collabs"), not system terms.
- Buttons say what happens ("Build my plan", "Send invite").
- Errors explain what went wrong and how to fix it, without apologizing.
- Never promise results. Say "businesses like yours often…", not "you will…".

## Website
- **Hero:** one interactive product moment (`marketing/HeroProduct.tsx`); everything else stays calm.
- **Feature illustrations:** `marketing/FeatureVisuals.tsx`. They play once when scrolled into view and stay still with reduced motion.
- **Shared pieces:** `marketing/primitives.tsx` (`CtaButton`, `SectionHeading`, `CountUp`, `GridBackdrop`).
- **Never** use fabricated testimonials, customer logos or statistics. Numbers on the site must be true of the product.

## Video and motion graphics (marketing)
Brand films and launch videos are built in code (Remotion or HyperFrames), from a brand folder that contains this file, the logo, screenshots and a short creative brief. Use the same colors, type and motion rules as above.
