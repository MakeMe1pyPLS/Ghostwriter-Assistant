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

## Design System
- Light + teal scheme (`#0F766E` primary, slate neutrals)
- App pages: `bg-[#F4F7FA]`
- Marketing pages: `bg-white` / `bg-[#F4F7FA]`
- Premium SaaS aesthetic with uppercase tracking-widest labels

## Sprint Status
- **Sprint 1** ✅ Dashboard Spec Engine — `dashboard-spec.ts` with Export/Import Spec buttons
- **Sprint 2** ✅ Renderer Architecture — `client/src/lib/renderers/` with base renderer, layout translator, theme system, Excel skeleton
- **Sprint 3** ✅ Excel Dashboard Generator — Full server-side Excel workbook generation via `/api/export/excel`

## Key Files
- `client/src/components/visualizations/WidgetRenderer.tsx` — Canonical widget rendering component
- `client/src/lib/dashboard-spec.ts` — Dashboard spec engine (types, mappers, download utility)
- `client/src/lib/renderers/` — Client-side renderer architecture (Sprint 2)
- `client/src/components/ExportDrawer.tsx` — Export UI with JSON, CSV, and Excel options
- `client/src/pages/builder.tsx` — Dashboard builder page
- `client/src/pages/dashboard.tsx` — Read-only presentation dashboard
- `client/src/hooks/use-sector-data.ts` — Demo data provider (metrics, chartData, donutData)
- `server/routes.ts` — API routes (includes `/api/export/excel`)
- `server/excel/` — Excel generation modules:
  - `excel-renderer.ts` — Main orchestrator
  - `layout-engine.ts` — Grid-to-cell-range translator
  - `theme-mapper.ts` — Brand-consistent Excel styling
  - `kpi-renderer.ts` — KPI card merged-cell renderer
  - `chart-renderer.ts` — Chart data visualization (line, bar, donut)
  - `table-renderer.ts` — Formatted data table renderer

## Important Notes
- Use `MeasuredGrid` (never `WidthProvider`) to avoid Vite bundling issues
- `compactType={null}` prevents layout compaction
- Widget IDs generated with `Date.now() + Math.random()` suffix
- Dashboard spec stored in localStorage keys `layout_${sector}` and `widgets_${sector}`
- `WidgetRenderer` is the canonical rendering component — do NOT add rendering logic back to builder/dashboard pages
- wouter v3.3.5 uses `<Link href="...">` and `useLocation()` directly
