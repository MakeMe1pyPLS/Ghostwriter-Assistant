# ChainInsideIQ — brand, design and motion spec

The visual rules for the product. Pair with `CLAUDE.md`. Improve within these rules; don't introduce new styles without updating this file.

## Brand in one line
**Find the bottleneck. Fix it together.** A calm, capable business analyst, not a flashy gadget.

## Personality
Confident, clear, practical, warm. Like a senior consultant who explains things simply and gets to the point.

## Logo
Two interlocking chain links on an ink tile (`client/src/components/Logo.tsx`, `client/public/favicon.svg`). The white link is the business, the teal link is the partner and the fix, and the weave shows they're joined. Wordmark: **ChainInside** in ink plus **IQ** in teal, Inter Black with tight tracking. Use `<Logo />` or `<LogoMark />`; never redraw it.

## Color
All values live in **`client/src/styles/tokens.css`** (the design tokens). Components use them through Tailwind classes; don't add new hex values in components.

| Token | Value | Use |
|---|---|---|
| Brand / primary | `#0F766E` teal-700 (`bg-primary`, `text-primary`, `--ciq-brand`) | The one primary action per screen, active states, links, focus |
| Accent | `#14B8A6` teal-500 (`--ciq-accent`) | Highlights, charts, rings. Never small text |
| Ink | `#0F172A` slate-900 | Headlines, dark hero panels, active nav |
| Text, secondary | slate-500 `#4F5E74`, slate-400 `#5F6F86` | Body copy, labels, helper text (both pass AA on white and the canvas) |
| Canvas | `#F4F7FA` | App background |
| Surface | `#FFFFFF` | Cards |
| Line | `#E2E8F0` slate-200 | Borders, dividers |
| Success / warning / danger / info | `text-success`, `text-warning`, `text-danger`, `text-info` (+ `bg-*-soft`, `border-*-line`) | Status only, never decoration |

**Contrast (WCAG AA), in light and dark:** body text at least 4.5:1, large text (24px, or 18.7px bold) at least 3:1, icons and control borders at least 3:1.
- Coloured text uses the **700 shade** in light mode (`text-emerald-700`, `text-amber-700`, `text-red-700`, `text-teal-700`). The 500 and 600 shades fail on white.
- slate-300 is never used for text on light surfaces. On dark panels in light mode, use `text-slate-300` or `text-white/70`.
- Disabled controls are exempt.

**Dark mode:**
- Canvas `#070B13`, surfaces `#0D131E` → `#16202F`, lines `#1F2A3B`, ink panels lifted to `#16233A`.
- Primary buttons use a darker teal (`hsl(177 73% 29%)`, white text 4.8:1). Brand-coloured text uses `#2DD4BF`.
- Light-first slate and white classes are remapped by `client/src/styles/dark-theme.css`, which is generated. Run `node script/gen-dark-theme.mjs` after adding new colour classes.
- For new UI, prefer explicit `dark:` variants.
- The theme logic is in `client/src/lib/theme.ts` and the switch is `<ThemeToggle />`. The choice is saved (`ciq_theme`); with no choice saved, the device setting decides.

Rules: teal is the only brand accent. Status colours mean status. Dark panels (ink) are reserved for heroes and highlights, at most one per screen.

### Spacing, radius, shadows, layers, motion
- **Spacing:** Tailwind's 4px scale (`p-1` = 4px, `p-2` = 8px…).
  - Cards use `p-5`, with `p-4` on phones.
  - Gaps between cards are `gap-4`.
  - Page sections use `--space-section`.
- **Radius:** `rounded-card` (20px) for cards, `rounded-control` (12px) for inputs and buttons, `rounded-pill` for chips.
- **Shadows:** `shadow-card` for resting cards, `shadow-pop` for menus and popovers, `shadow-overlay` for dialogs.
- **Layers:** use `z-(--z-sticky)`, `--z-header`, `--z-dropdown`, `--z-overlay`, `--z-modal`, `--z-toast` and `--z-intro`. Don't invent new z-index numbers.
- **Motion:** `--dur-fast` (150ms) for hover and press, `--dur-base` (200ms) for open and close, `--dur-slow` (250ms) for panels. Easing is `--ease-out-soft`.

### Components
Use `client/src/components/ui/*` before building new ones.
- **Button:** `default` is the one primary action, then `outline` / `secondary`, `ghost`, `destructive` and `link`.
  - Sizes are `sm`, `default`, `lg` and `icon`. On touch screens every size grows to at least 40–44px.
  - `loading` shows a spinner and disables the button.
  - For a link that looks like a button, use `<Button asChild><Link …/></Button>`, never a button inside a link.
- **Other components:** Input, Select, Textarea, Card, Badge, Dialog (modal), Toast (with Undo where it makes sense), Tabs, Empty, Skeleton.
- **Loading** uses skeletons shaped like the content (see `DashboardSkeleton`), not a spinner over a blank area.
- **Form fields** have a visible label or an `aria-label`. Inputs with only a placeholder get it as their accessible name automatically.

## Typography
- Font: Inter, self-hosted (`client/public/fonts/inter-latin-var.woff2`: one variable file, Latin subset, weights 400–900, SIL OFL). "Inter Fallback" is Arial tuned to Inter's metrics so text doesn't jump while it loads. One family only.
- Sizes: headings 3xl–7xl use fluid sizes (`clamp()`), so they're smaller on phones and unchanged on desktop. Form fields render at 16px on phones so iOS doesn't zoom.
- Headlines: `font-black`, tight tracking, `text-balance`.
- Labels and eyebrows: 9–11px, `font-black`, uppercase, `tracking-widest`, slate-400 or teal-700.
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
- **Fast first paint:** `client/index.html` contains a static copy of the homepage hero (`#ciq-shell`). It's shown on `/` when the intro doesn't play, and React replaces it.
  - When you change the hero's copy or classes in `pages/home.tsx`, change the shell too, so nothing jumps when the app takes over.
  - The price in the badge is written into the shell; update it when pricing changes.
- **SEO:** titles, descriptions, canonical links and `noindex` for app pages are set per route in `client/src/lib/page-meta.ts`. When you add a public page, add it there and to `client/public/sitemap.xml`.

## Video and motion graphics (marketing)
Brand films and launch videos are built in code (Remotion or HyperFrames), from a brand folder that contains this file, the logo, screenshots and a short creative brief. Use the same colors, type and motion rules as above.
