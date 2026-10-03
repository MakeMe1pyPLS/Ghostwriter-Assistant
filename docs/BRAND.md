# ChainInsideIQ — brand, design and motion spec

The visual rules for the product. Pair with `CLAUDE.md`. Improve within these rules; don't introduce new styles without updating this file.

## Brand in one line
**Find the bottleneck. Fix it together.** A calm, capable business analyst, not a flashy gadget.

## Personality
Confident, clear, practical, warm. Like a senior consultant who explains things simply and gets to the point.

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
| Intro (first homepage visit only) | ≤ 4s total, skippable | ease-out |

Rules:
- Use the primitives in `client/src/components/motion.tsx` (`PageTransition`, `Stagger`, `StaggerItem`, `Reveal`, `pressable`, `EASE_OUT`).
- Everything respects `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` is set in `App.tsx`).
- No looping attention-grabbers in the app. Loops are only allowed for loading and typing indicators.
- One orchestrated moment per screen at most (e.g. the Plan progress ring). Everything else is subtle.
- Never animate layout on every keystroke or data refresh.
- Selection indicators (sidebar, tab bar, Hub tabs) slide with a shared spring (`layoutId`, stiffness 500, damping 38–40).
- Buttons scale to 0.97 on press. Page loads show a thin top progress bar, never a full-screen spinner.

### The intro
- **Where:** homepage, first visit only (remembered in the browser), never inside the app.
- **Story (≤ 4s):** scattered business nodes link into a chain → one link glows red (the bottleneck) → it snaps teal (fixed) → logo lockup with the tagline. The homepage then fades in.
- **Interactive:** nodes drift toward the pointer; tapping or clicking anywhere, Esc, Enter or "Skip" ends it immediately.
- **Accessibility:** reduced-motion users skip it entirely. The homepage content is never blocked for more than 4s.

## Voice and copy
- Name things the way customers say them ("Growth Plan", "Bottlenecks", "Collabs"), not system terms.
- Buttons say what happens ("Build my plan", "Send invite").
- Errors explain what went wrong and how to fix it, without apologizing.
- Never promise results. Say "businesses like yours often…", not "you will…".

## Video and motion graphics (marketing)
Brand films and launch videos are built in code (Remotion or HyperFrames), from a brand folder that contains this file, the logo, screenshots and a short creative brief. Use the same colors, type and motion rules as above.
