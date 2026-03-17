# ChainInsideIQ — AI Dashboard Generator Platform

## Overview
A production-quality supply chain dashboard SaaS with a marketing website and full app experience including Dashboard Builder, AI-powered Generate For Me wizard, Enhance My Dashboard flow, AI Insights, Ops Communication Hub, Integration Hub, Export Center, Data Sources, and a read-only presentation Dashboard page.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Radix UI
- **Backend**: Express 5 (Node.js) with TypeScript
- **State**: Zustand + TanStack Query
- **Routing**: wouter v3.3.5 (`<Link href="...">`)
- **Charts**: Recharts
- **Grid**: react-grid-layout via `MeasuredGrid` (never `WidthProvider`)
- **Excel Generation**: exceljs (server-side)
- **AI Engine**: Modular provider architecture (DemoAIProvider for rule-based, server-side, sector-aware)
- **File Upload**: multer (multipart)

## Design System
- Light + teal scheme (`#0F766E` primary, slate neutrals)
- App pages: `bg-[#F4F7FA]`
- Marketing pages: `bg-white` / `bg-[#F4F7FA]`
- Premium SaaS aesthetic with uppercase tracking-widest labels

## Sector Mode System
- **Single Mode**: Focuses dashboard on one sector (E-commerce, Logistics, Manufacturing, Custom)
- **Unified Mode**: Cross-sector bridge KPIs spanning all supply chain stages
- Selector in sidebar with visual toggle between Single/Unified
- Store: `useDashboardStore` has `sectorMode` ('single' | 'unified'), `setSectorMode()`
- Switching to Single auto-selects E-commerce; switching to Unified sets sector to 'unified'

## 3 Creation Modes
### 1. Build Manually (`/builder`)
- Drag-and-drop widget builder
- Full creative control over layout, KPIs, charts
- Edit mode with widget inspector, library, templates

### 2. Generate For Me (`/generate`)
- 8-step guided wizard
- Steps: Business Context → Primary Goal → Destination Tool → Dashboard Style → KPI Priorities → Data Context → Density → AI Help Level
- AI generates recommended KPI set, layout, card styles, visualizations
- Generated dashboards are fully editable in the builder

### 3. Enhance My Dashboard (`/enhance`)
- 5-step guided flow
- Steps: Current Tool → Improvements → KPI Strategy → Design Style → Target Tool
- Works with existing dashboard data from localStorage
- AI improves readability, KPI design, chart choices, visual hierarchy

## Tool-Aware Generation
Supported target tools with distinct profiles:
- **Web App** — Richest layout, full interactivity, all chart types
- **Excel** — Merged-cell-friendly KPIs, simple charts, executive summary blocks
- **Google Sheets** — Clean linear layouts, practical charts
- **Power BI** — Strong KPI tiles, comparison visuals, BI hierarchy
- **Tableau** — Analysis-friendly structure, KPI + trend pairings
- **JSON / API** — Structured output for custom integration

Tool profiles defined in `client/src/lib/tool-profiles.ts`

## Widget Types (13 total)
- **kpi** — KPI cards with 8 presets, 4 data density modes
- **trend** — Area/line time-series
- **bar** — Bar comparison charts
- **donut** — Donut/ring distribution
- **pie** — Pie charts
- **progress** — Radial progress ring
- **table** — Data table
- **chat** — AI conversational assistant
- **summary** — Executive summary text
- **forecast** — Demand forecast with prediction lines
- **insights** — AI-powered anomaly detection and recommendations
- **opportunity-risk** — Sector-specific risk/opportunity highlights with severity indicators

## KPI Card Design System
8 card presets (`client/src/lib/kpi-card-presets.ts`):
- **Clean Corporate** — Professional, balanced layout
- **Executive Tile** — Bold, high-impact for leadership
- **Modern Analytics** — Data-forward with sparklines
- **Compact Grid** — Dense, efficient layout
- **Ops Scorecard** — Operations-focused with status badges
- **Minimal Readout** — Ultra-clean metric display
- **Insight KPI Card** — AI-annotated with contextual insight
- **Comparative KPI Card** — Side-by-side target vs actual

Each preset controls: title/subtitle placement, value emphasis, delta position, icon, border style, background, accent strip, sparkline, benchmark, comparison label, status badge, shadow, border radius, density, alignment.

### KPI Card Customization Properties
- **dataDensity**: minimal | standard | detailed (prev+benchmark rows) | grid (2x2 mini-table)
- **borderRadius**: none | sm | md | lg | xl | 2xl | full
- **shadowIntensity**: none | sm | md | lg | xl
- **cardPadding**: compact | default | spacious
- **showBadge**: Toggle status badge visibility
- **showIcon**: Toggle info icon visibility
- **showComparison**: Toggle "vs prev" comparison label
- **showDelta**: Toggle period delta indicator
- **showSparkline**: Toggle sparkline chart
- **showTarget**: Toggle target line/benchmark

## Opportunity & Risk Engine (`client/src/lib/opportunity-risk-engine.ts`)
- Sector-specific highlights for: ecommerce, logistics, manufacturing, unified
- 5 highlight types: risk, opportunity, urgent, action, forecast
- Each highlight has: icon, title, description, severity (high/medium/low), color
- Rendered by OpportunityRiskWidget in WidgetRenderer

## KPI Library (`client/src/lib/kpi-library.ts`)
36+ KPI definitions across 5 categories:
- **Revenue & Growth**: Revenue, Orders, AOV, Conversion Rate, ROAS, Returns, Repeat Purchase, Cart Abandonment, Sales by Channel, Product Performance
- **Delivery & Fulfillment**: On-Time Delivery, Late Shipments, Shipment Volume, Transit Time, Warehouse Utilization, Cost/Shipment, Delivery Exceptions, Carrier Performance, Fulfillment Cycle
- **Production & Efficiency**: Units Produced, Throughput, Downtime, Defect Rate, Yield, Capacity Utilization, Lead Time, Scrap Rate, Batch Performance
- **Supply Chain Health**: Perfect Order Rate, Cash-to-Cash Cycle, ATP Accuracy, Bullwhip Index, Inventory-to-Demand Risk, Cross-Sector Delay Impact
- **Cost & Margin**: Gross Margin, Operating Cost, Inventory Turnover

Each KPI has: label, description, format type, suggested visualizations, suggested card presets, sector compatibility, tool compatibility hints, default values

## AI Provider Architecture
### Server-Side (`server/services/ai/`)
- `base-provider.ts` — Provider interface (GenerationRequest, EnhancementRequest, DashboardGenerationResult)
- `demo-provider.ts` — Rule-based DemoAIProvider with sector-aware KPI selection, goal-based prioritization, tool-aware layout generation
- Architecture supports swapping to real AI providers later

### API Routes
- `POST /api/ai/generate-dashboard` — Full dashboard generation from wizard answers
- `POST /api/ai/enhance-dashboard` — Dashboard enhancement from existing data
- `POST /api/ai/insights` — Structured insight JSON per sector
- `POST /api/ai/chat` — Conversational AI chat
- `POST /api/ai/forecast` — 7/14-day projections
- `POST /api/ai/recommend-kpis` — Sector-specific KPI recommendations

### Frontend AI (`client/src/lib/ai-provider.ts`)
- BackendAIProvider → server routes with DemoAIProvider fallback

## Export System
### Backend Routes
- `POST /api/export/excel` — Full Excel workbook
- `POST /api/export/csv` — CSV export
- `POST /api/export/json` — Dashboard spec JSON
- `POST /api/export/dataset` — Underlying dataset (JSON or CSV)
- `POST /api/export/custom-api` — External API integration (simulated)

### File Naming Convention
`chaininsideiq_{type}_{sector}_{YYYY-MM-DD}.{ext}`

## Data Connectors
### Backend Services (`server/services/data-sources/`)
- `dataset-registry.ts` — In-memory dataset store
- `csv-source.ts` — CSV parser and import
- `sql-source.ts` — SQL connector (simulated)
- `google-sheets-source.ts` — Public Google Sheets import
- `api-source.ts` — JSON API ingestion

### Data API Routes
- `POST /api/data/upload-csv`, `POST /api/data/parse-csv-text`
- `POST /api/data/sql/test`, `POST /api/data/sql/schema`, `POST /api/data/sql/import`
- `POST /api/data/google-sheets`
- `POST /api/data/api-ingest`
- `GET /api/data/datasets`, `GET /api/data/datasets/:id`, `GET /api/data/datasets/:id/rows`
- `DELETE /api/data/datasets/:id`

## Integration Architecture (Scaffolded)
### Backend Adapters (`server/services/integrations/`)
- base-adapter, excel, google-sheets, powerbi, tableau, custom-api

### Frontend Panels (`client/src/integrations/`)
- Excel, Google Sheets, Power BI, Tableau, Custom API panels

## Layout Sync System
- Builder saves to `localStorage['layout_${sector}']` and `localStorage['widgets_${sector}']`
- Dashboard page loads from same keys in read-only presentation mode
- Generate and Enhance flows write to same keys after generation
- All pages share sector context via `useDashboardStore`

## Website Pages
- `/` Home, `/features`, `/pricing`, `/contact`, `/support`, `/privacy`, `/terms`
- `/generate` — Generate For Me wizard
- `/enhance` — Enhance My Dashboard flow
- `/builder`, `/dashboard`, `/insights`, `/hub`, `/data`, `/connectors`, `/exports`
- `/checkout/success`, `/checkout/cancel`, `/checkout/stripe-mock`

## Support Page
- 3 support channels (Email, Live Chat, Documentation)
- 10 documentation sections covering: Dashboard Builder, Generate For Me, Enhance Dashboard, AI & Insights Widgets, Data Sources & KPI Library, Export & Reporting, Connectors & Integrations, Team & Collaboration, Security & Compliance, Plans & Billing
- 10 FAQ items with expandable accordion UI

## Pricing Tiers (Source: `client/src/lib/pricing.ts`)
- Starter $79, Professional $149 (Most Popular), Business $299, Enterprise Custom

## Key Files
- `client/src/components/visualizations/WidgetRenderer.tsx` — Canonical widget rendering (card-preset-aware KPIs, opportunity-risk widget)
- `client/src/lib/dashboard-spec.ts` — Dashboard spec engine
- `client/src/lib/kpi-library.ts` — Comprehensive KPI definitions
- `client/src/lib/kpi-card-presets.ts` — 8 KPI card style presets
- `client/src/lib/tool-profiles.ts` — Tool-aware generation profiles
- `client/src/lib/ai-provider.ts` — AI provider abstraction
- `client/src/lib/pricing.ts` — Pricing tier source of truth
- `client/src/lib/opportunity-risk-engine.ts` — Sector-specific opportunity/risk highlights
- `client/src/hooks/use-dashboard-store.ts` — Zustand store with sector mode
- `client/src/components/GenerateWizard.tsx` — 8-step generation wizard
- `client/src/components/EnhanceWizard.tsx` — 5-step enhancement flow
- `client/src/components/WidgetInspector.tsx` — Widget configuration panel
- `client/src/components/WidgetLibrary.tsx` — Widget type catalog (13 types)
- `client/src/components/layout/Sidebar.tsx` — Navigation + sector mode selector
- `client/src/components/layout/AppLayout.tsx` — App shell with scroll fixes
- `server/services/ai/base-provider.ts` — AI provider interface
- `server/services/ai/demo-provider.ts` — Rule-based generation engine
- `server/routes.ts` — All API routes

## Important Notes
- Use `MeasuredGrid` (never `WidthProvider`)
- `compactType={null}` prevents layout compaction
- Dashboard spec stored in localStorage keys `layout_${sector}` and `widgets_${sector}`
- `WidgetRenderer` is the canonical rendering component
- wouter v3.3.5 uses `<Link href="...">` and `useLocation()` directly
- Generated dashboard metadata stored in `localStorage.generated_dashboard_meta`
- Export Center pulls live data from `useSectorData` hook
- Data sources page at `/data`; dataset registry is in-memory (resets on server restart)
- `useSectorData` exports `donutData`, `metrics`, `chartData`, `allMetrics`, `sector`, `dateRange`, `hasImportedData`
- `useDashboardStore` has `importedData`, `setImportedData`, `selectedSector`, `setSector`, `sectorMode`, `setSectorMode`
- Social links in footer are placeholder URLs
- Sidebar sector mode selector uses 'single'/'unified' toggle with per-sector buttons in single mode
