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
- **Sprint 5** ✅ Integration Hub Custom API Drawer
- **Sprint 6** ✅ Export System (CSV, JSON, Dataset, Excel improvements, Export Center wired to live data)
- **Sprint 7** ✅ Data Connectors (CSV upload, SQL connector, Google Sheets import, API ingestion, dataset management)

## Export System (Sprint 6)
### Backend Routes
- `POST /api/export/excel` — Full Excel workbook with KPIs, charts, and data tables
- `POST /api/export/csv` — CSV export with KPI metrics and timeseries data
- `POST /api/export/json` — Dashboard spec JSON with widgets, layout, theme, and data snapshot
- `POST /api/export/dataset` — Underlying dataset export (supports `format: 'json'` or `format: 'csv'`)
- `POST /api/export/custom-api` — Simulated external API integration

### File Naming Convention
`chaininsideiq_{type}_{sector}_{YYYY-MM-DD}.{ext}`
Examples: `chaininsideiq_dashboard_excel_ecommerce_2026-03-13.xlsx`, `chaininsideiq_dataset_logistics_2026-03-13.csv`

### Modular Export Services (Backend)
- `server/services/exports/csv-exporter.ts` — CSV generation logic
- `server/services/exports/json-exporter.ts` — JSON dashboard spec generation
- `server/services/exports/dataset-exporter.ts` — Dataset export (JSON + CSV)
- `server/services/exports/index.ts` — Shared file naming utilities

### Shared Export Helpers (Frontend)
- `client/src/lib/export-helpers.ts` — Shared utilities for file naming, payload building, blob downloads

## Integration Architecture (Scaffolded)
### Backend Adapters (`server/services/integrations/`)
- `base-adapter.ts` — Abstract base class with `testConnection()`, `formatPayload()`, `sendPayload()`, `getStatus()`
- `excel/adapter.ts` — Excel integration (active)
- `google-sheets/adapter.ts` — Google Sheets (coming soon, OAuth required)
- `powerbi/adapter.ts` — Power BI (coming soon, Azure AD required)
- `tableau/adapter.ts` — Tableau (coming soon, server auth required)
- `custom-api/adapter.ts` — Custom API (active)
- `index.ts` — Integration registry and barrel exports

### Frontend Panels (`client/src/integrations/`)
- `types.ts` — Integration metadata and registry
- `excel/ExcelPanel.tsx` — Excel integration status panel
- `google-sheets/GoogleSheetsPanel.tsx` — Google Sheets placeholder panel
- `powerbi/PowerBIPanel.tsx` — Power BI placeholder panel
- `tableau/TableauPanel.tsx` — Tableau placeholder panel
- `custom-api/CustomApiPanel.tsx` — Custom API integration panel
- `index.ts` — Barrel exports

### Export Center (exports.tsx)
- Wired to `useSectorData` — exports reflect current sector, date range, and live KPI data
- Sector/date range selectors actually drive data (not decorative)
- Data summary panel shows KPI count, timeseries points, channel count
- Clear separation: Dashboard Files vs Data Exports vs Integrations vs BI Tools

### ExportDrawer (builder/dashboard)
- Uses backend routes for Excel, CSV, JSON, and Dataset exports
- Shows loading, success, and error states per export type

## Data Connectors (Sprint 7)
### Backend Data Source Services (`server/services/data-sources/`)
- `dataset-registry.ts` — In-memory dataset store with column type inference
- `csv-source.ts` — CSV parser (supports quoted fields) and import
- `sql-source.ts` — SQL connector with test connection, schema inspection, table import (simulated)
- `google-sheets-source.ts` — Fetches public Google Sheets via CSV export URL
- `api-source.ts` — JSON API ingestion with automatic row flattening

### Data API Routes
- `POST /api/data/upload-csv` — Multipart CSV file upload (multer, max 10MB)
- `POST /api/data/parse-csv-text` — Parse raw CSV text
- `POST /api/data/sql/test` — Test SQL database connection
- `POST /api/data/sql/schema` — Fetch table schema
- `POST /api/data/sql/import` — Import table data as dataset
- `POST /api/data/google-sheets` — Import from public Google Sheet URL
- `POST /api/data/api-ingest` — Fetch and import JSON API data
- `GET /api/data/datasets` — List all imported datasets (metadata only)
- `GET /api/data/datasets/:id` — Get dataset metadata + preview (50 rows)
- `GET /api/data/datasets/:id/rows` — Paginated row access (?limit=100&offset=0)
- `DELETE /api/data/datasets/:id` — Remove dataset

### Frontend Data Sources Page (`/data`)
- Tab-based UI: CSV Upload, SQL Database, Google Sheets, API Endpoint
- Drag-and-drop CSV upload with file type validation
- SQL connector with host/port/db/user/pass fields, test connection, table browser, import
- Google Sheets URL input with public sheet validation
- API endpoint with GET/POST method, custom headers, JSON auto-flattening
- Dataset list with expand/collapse preview, delete, column schema badges
- All imports wire into `useDashboardStore.setImportedData` and set sector to `custom`

## AI Backend Endpoints
- `POST /api/ai/insights` — Structured insight JSON per sector
- `POST /api/ai/chat` — Conversational AI chat with KPI-aware responses
- `POST /api/ai/forecast` — 7/14-day projections with confidence levels
- `POST /api/ai/recommend-kpis` — Sector-specific KPI recommendations

## Website Pages (All Routed)
- `/` Home, `/features`, `/pricing`, `/contact`, `/support`, `/privacy`, `/terms`
- `/demo` → Builder, `/request-setup` → Contact
- `/builder`, `/dashboard`, `/insights`, `/hub`, `/data`, `/connectors`, `/exports`
- `/checkout/success`, `/checkout/cancel`, `/checkout/stripe-mock`

## Key Files
- `client/src/components/visualizations/WidgetRenderer.tsx` — Canonical widget rendering component
- `client/src/lib/dashboard-spec.ts` — Dashboard spec engine
- `client/src/lib/export-helpers.ts` — Shared export utilities (file naming, payload builders, download helpers)
- `client/src/lib/ai-provider.ts` — AI provider abstraction (BackendAIProvider → server, DemoAIProvider fallback)
- `client/src/pages/exports.tsx` — Export Center with live data, all export types, Custom API modal
- `client/src/components/ExportDrawer.tsx` — Inline export drawer for builder/dashboard pages
- `client/src/pages/insights.tsx` — AI Insights page with Chat, Forecast, and KPI Guide tabs
- `client/src/pages/connectors.tsx` — Integration Hub with Custom API side drawer
- `client/src/pages/support.tsx` — Support page with FAQ accordion
- `client/src/pages/privacy.tsx` — Privacy Policy page
- `client/src/pages/terms.tsx` — Terms of Service page
- `client/src/components/layout/MarketingLayout.tsx` — Marketing layout with social links in footer
- `server/routes.ts` — All API routes (AI + Export + Custom API)
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
- Export Center pulls live data from `useSectorData` hook — sector/range selectors are functional