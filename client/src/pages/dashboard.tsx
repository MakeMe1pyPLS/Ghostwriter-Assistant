import { getCardShellClasses } from "@/lib/card-shell";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback, useMemo } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { Share2, ArrowLeft, BrainCircuit, BarChart2, Wand2 } from "lucide-react";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WidgetRenderer } from "@/components/visualizations/WidgetRenderer";
import { ExportDrawer } from "@/components/ExportDrawer";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { AnalystPanel } from "@/components/analyst/AnalystPanel";
import { AIAnalystPanel } from "@/components/analyst/AIAnalystPanel";
import { ExecutiveCommandCenter } from "@/components/analyst/ExecutiveCommandCenter";
import { GRID_BREAKPOINTS, FINE_COLS, FINE_ROW, GRID_PAD, fineLayoutOf, fineToClassic } from "@/lib/dashboard-grid";

// Stable empty-array reference so loading renders don't churn new refs into the grid.
const EMPTY_ARR: any[] = [];

export default function DashboardPage() {
  const sectorData = useSectorData();
  const { metrics, chartData, donutData, sector, dateRange, allMetrics } = sectorData;
  const { analystMode, setAnalystMode, businessStructure } = useDashboardStore();
  // Read the dashboard config reactively from the store so Builder edits are
  // mirrored here without a manual refresh. The Builder is the single source of truth.
  const dash = useDashboardStore((s) => s.dashboards[sector]);
  const ensureDashboardLoaded = useDashboardStore((s) => s.ensureDashboardLoaded);
  const { toast } = useToast();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const businessName = useGrowthStore((s) => s.profile?.businessName);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  useEffect(() => {
    ensureDashboardLoaded(sector);
  }, [sector, ensureDashboardLoaded]);

  const widgets = dash?.widgets ?? EMPTY_ARR;
  const rawLayout = useMemo(() => (dash ? fineLayoutOf(dash) : EMPTY_ARR), [dash]);
  const loading = !dash;

  // Lock every item read-only so the presentation grid mirrors the saved geometry exactly.
  const layout = useMemo(
    () =>
      rawLayout.map((l: any) => ({
        ...l,
        static: true,
        minW: l.w,
        minH: l.h,
        maxW: l.w,
        maxH: l.h,
      })),
    [rawLayout]
  );
  const layouts = useMemo(() => ({ lg: layout }), [layout]);

  const widgetData = useMemo(
    () => ({ metrics, chartData, donutData, allMetrics }),
    [metrics, chartData, donutData, allMetrics]
  );

  const renderWidgetContent = useCallback(
    (widget: any) => (
      <WidgetRenderer
        widget={widget}
        data={widgetData}
        sector={sector}
        loading={loading}
        presentationMode={true}
      />
    ),
    [widgetData, sector, loading]
  );

  const sectorLabel = useMemo(() => {
    const labels: Record<string, string> = {
      ecommerce: 'E-Commerce',
      logistics: 'Logistics',
      manufacturing: 'Manufacturing',
      unified: 'Unified Supply Chain',
    };
    return labels[sector] ?? 'Custom';
  }, [sector]);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto min-h-0 flex flex-col">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6 md:mb-8 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 shrink-0" aria-label="Back to Builder" asChild>
              <Link href="/builder">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-500 truncate">{greeting}{businessName ? `, ${businessName}` : ""}</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-[-0.035em] leading-tight">Operations Center</h1>
              <p className="mt-1 inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-500">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                </span>
                Live · {sectorLabel}
              </p>
            </div>
          </div>
          <div className="toolbar w-full xl:w-auto md:gap-3">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm p-1 gap-1" role="radiogroup" aria-label="View">
              {[
                { on: !analystMode, set: false, label: "Standard", icon: BarChart2, id: "button-standard-mode" },
                { on: analystMode, set: true, label: "Analyst", icon: BrainCircuit, id: "button-analyst-mode" },
              ].map((o) => (
                <button
                  key={o.label}
                  role="radio"
                  aria-checked={o.on}
                  onClick={() => setAnalystMode(o.set)}
                  className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-semibold transition-colors ${o.on ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  data-testid={o.id}
                >
                  {o.on && <motion.span layoutId="dash-mode" className={`absolute inset-0 rounded-lg shadow-sm ${o.set ? 'bg-primary' : 'bg-slate-900'}`} transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <o.icon className="relative w-3.5 h-3.5" />
                  <span className="relative">{o.label}</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setAiPanelOpen(true)}
              className={`rounded-xl font-semibold text-[13px] h-10 px-4 shadow-sm border-slate-200 gap-2 ${aiPanelOpen ? 'border-primary/40 text-primary bg-primary/5' : ''}`}
              data-testid="button-ai-analyst"
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI Analyst</span>
            </Button>

            <ExportDrawer layout={fineToClassic(rawLayout, true)} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />

            <Button variant="outline" className="rounded-xl font-semibold text-[13px] h-10 px-4 shadow-sm border-slate-200">
              <Share2 className="w-4 h-4" /> <span className="hidden md:inline">Share view</span>
            </Button>
          </div>
        </header>

        {analystMode && (
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
              <BrainCircuit className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12.5px] font-semibold text-primary">Analyst view on — advanced breakdown panels are shown below</span>
            </div>
          </div>
        )}

        <ExecutiveCommandCenter sector={sector} metrics={metrics} businessStructure={businessStructure} />

        <div className="bg-transparent flex-1 relative min-h-0">
          {loading ? (
            <DashboardSkeleton testId="status-dashboard-loading" />
          ) : widgets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 border-dashed">
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Widgets Configured</h3>
              <p className="text-slate-500 text-sm mb-6">Build your dashboard first to see it here in presentation mode.</p>
              <Button asChild>
                <Link href="/builder">Go to Builder</Link>
              </Button>
            </div>
          ) : (
            // Same responsive grid engine + geometry as the Builder, so widgets
            // sit in the exact same place and size. Smaller breakpoints (incl. mobile)
            // are derived from the lg layout by react-grid-layout, clamped to the
            // available columns — no separate mobile stack to diverge from.
            <MeasuredGrid
              className="layout presentation-mode"
              layouts={layouts}
              cols={FINE_COLS}
              breakpoints={GRID_BREAKPOINTS}
              rowHeight={FINE_ROW}
              margin={[0, 0]}
              containerPadding={GRID_PAD}
              isDraggable={false}
              isResizable={false}
              compactType={null}
            >
              {widgets.map((w, i) => (
                <div
                  key={w.id}
                  data-testid={`widget-${w.id}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}
                  className="ciq-rise"
                >
                  {/* Cards are inset inside their grid cell; the inset forms the gaps. */}
                  <div className={`ciq-card-inset flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-300 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] hover:border-slate-300 ${getCardShellClasses(w.cardPreset || w.stylePreset, 'dashboard')}`}>
                    <div className="ciq-cq flex-1 min-h-0 flex flex-col">{renderWidgetContent(w)}</div>
                  </div>
                </div>
              ))}
            </MeasuredGrid>
          )}

          {analystMode && (
            <AnalystPanel sector={sector} />
          )}
        </div>
      </div>

      <AIAnalystPanel open={aiPanelOpen} onOpenChange={setAiPanelOpen} sector={sector} />

      <style>{`
        .presentation-mode .react-grid-item {
          transition: none !important;
        }
        .presentation-mode .react-grid-item.cssTransforms {
          transition: transform 0ms ease !important;
        }
      `}</style>
    </AppLayout>
  );
}
