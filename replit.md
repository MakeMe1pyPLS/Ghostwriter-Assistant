# ChainInsideIQ — AI Dashboard Generator Platform

## Overview
A production-quality supply chain dashboard SaaS with a marketing website and full app experience including Dashboard Builder, AI Insights, Ops Communication Hub, Integration Hub, Export Center, and a read-only presentation Dashboard page.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Radix UI
- **Backend**: Express 5 (Node.js) with TypeScript
- **State**: Zustand + TanStack Query
- **Routing**: wouter v3.3.5 (`<Link href="...">`)
- **Charts**: Recharts
- **Grid**: react-grid-layout via `MeasuredGrid` (never `WidthProvider`)
- **Excel Generation**: exceljs (server-side)
- **AI Engine**: Rule-based demo engine (server-side, sector-aware)

## Design System
- Light + teal scheme (`#0F766E` primary, slate neutrals)
- App pages: `bg-[#F4F7FA]`
- Marketing pages: `bg-white` / `bg-[#F4F7FA]`
- Premium SaaS aesthetic with uppercase tracking-widest labels

## Sprint Status
- **Sprint 1** ✅ Dashboard Spec Engine
- **Sprint 2** ✅ Renderer Architecture
- **Sprint 3** ✅ Excel Dashboard Generator
- **Sprint 4** ✅ AI Supply Chain Analyst + Website Pages + Custom API Export + Social Links

## AI Backend Endpoints
- `POST /api/ai/insights` — Returns structured insight JSON per sector (summary, what_changed, why_it_matters, actions, forecast_note)
- `POST /api/ai/chat` — Conversational AI chat with KPI-aware responses, keyword matching, KPI explanations
- `POST /api/ai/forecast` — 7/14-day projections with confidence levels and data points
- `POST /api/ai/recommend-kpis` — Sector-specific KPI recommendations with current/target values and explanations
- `POST /api/export/custom-api` — Simulated external API integration (accepts endpoint, method, apiKey, payload)

## Website Pages (All Routed)
- `/` Home, `/features`, `/pricing`, `/contact`, `/support`, `/privacy`, `/terms`
- `/demo` → Builder, `/request-setup` → Contact
- `/builder`, `/dashboard`, `/insights`, `/hub`, `/connectors`, `/exports`
- `/checkout/success`, `/checkout/cancel`, `/checkout/stripe-mock`

## Key Files
- `client/src/components/visualizations/WidgetRenderer.tsx` — Canonical widget rendering component
- `client/src/lib/dashboard-spec.ts` — Dashboard spec engine
- `client/src/lib/ai-provider.ts` — AI provider abstraction (BackendAIProvider → server endpoints, DemoAIProvider fallback)
- `client/src/pages/insights.tsx` — AI Insights page with Chat, Forecast, and KPI Guide tabs
- `client/src/pages/exports.tsx` — Export Center with Custom API modal
- `client/src/pages/support.tsx` — Support page with FAQ accordion
- `client/src/pages/privacy.tsx` — Privacy Policy page
- `client/src/pages/terms.tsx` — Terms of Service page
- `client/src/components/layout/MarketingLayout.tsx` — Marketing layout with social links in footer
- `server/routes.ts` — All API routes (AI + Excel + Custom API)
- `server/excel/` — Excel generation modules (6 files)

## Social Links (Footer)
- LinkedIn, X/Twitter, YouTube, GitHub — placeholder URLs ready for replacement

## Important Notes
- Use `MeasuredGrid` (never `WidthProvider`) to avoid Vite bundling issues
- `compactType={null}` prevents layout compaction
- Dashboard spec stored in localStorage keys `layout_${sector}` and `widgets_${sector}`
- `WidgetRenderer` is the canonical rendering component
- wouter v3.3.5 uses `<Link href="...">` and `useLocation()` directly
- AI provider uses BackendAIProvider with graceful fallback to client-side DemoAIProvider