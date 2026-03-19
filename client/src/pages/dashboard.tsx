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
import { AnalystPanel } from "@/components/analyst/AnalystPanel";
import { AIAnalystPanel } from "@/components/analyst/AIAnalystPanel";

export default function DashboardPage() {
  const sectorData = useSectorData();
  const { metrics, chartData, donutData, sector, dateRange, allMetrics } = sectorData;
  const { analystMode, setAnalystMode } = useDashboardStore();
  const { toast } = useToast();
  const [layout, setLayout] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const savedLayout = localStorage.getItem(`layout_${sector}`);
    const savedWidgets = localStorage.getItem(`widgets_${sector}`);

    if (savedLayout && savedWidgets) {
      const parsed = JSON.parse(savedLayout);
      const staticLayout = parsed.map((l: any) => ({
        ...l,
        static: true,
        minW: l.w,
        minH: l.h,
        maxW: l.w,
        maxH: l.h,
      }));
      setLayout(staticLayout);
      setLayouts({ lg: staticLayout, md: staticLayout, sm: staticLayout, xs: staticLayout, xxs: staticLayout });
      setWidgets(JSON.parse(savedWidgets));
    } else {
      const defaultLayout = [
        { i: 'kpi-0', x: 0, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-1', x: 3, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-2', x: 6, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-3', x: 9, y: 0, w: 3, h: 2, static: true },
        { i: 'trend-1', x: 0, y: 2, w: 12, h: 4, static: true },
      ];
      setLayout(defaultLayout);
      setLayouts({ lg: defaultLayout });
      setWidgets([
        { id: 'kpi-0', type: 'kpi', metricIndex: 0 },
        { id: 'kpi-1', type: 'kpi', metricIndex: 1 },
        { id: 'kpi-2', type: 'kpi', metricIndex: 2 },
        { id: 'kpi-3', type: 'kpi', metricIndex: 3 },
        { id: 'trend-1', type: 'trend' },
      ]);
    }
    setTimeout(() => setLoading(false), 400);
  }, [sector]);

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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/builder">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Operations Center</h1>
              <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live: {sectorLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 flex-wrap items-center">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm p-1 gap-1">
              <button
                onClick={() => setAnalystMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!analystMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                data-testid="button-standard-mode"
              >
                <BarChart2 className="w-3 h-3" />
                Standard
              </button>
              <button
                onClick={() => setAnalystMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${analystMode ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                data-testid="button-analyst-mode"
              >
                <BrainCircuit className="w-3 h-3" />
                Analyst
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => setAiPanelOpen(true)}
              className={`rounded-xl font-black text-[10px] uppercase tracking-widest h-9 md:h-10 px-4 shadow-sm border-slate-200 gap-2 ${aiPanelOpen ? 'border-primary/40 text-primary bg-primary/5' : ''}`}
              data-testid="button-ai-analyst"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Analyst</span>
            </Button>

            <ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />

            <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 md:h-10 px-4 shadow-sm border-slate-200">
              <Share2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Share View</span>
            </Button>
          </div>
        </header>

        {analystMode && (
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
              <BrainCircuit className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Analyst Mode Active — Advanced breakdown panels enabled</span>
            </div>
          </div>
        )}

        <div className="bg-transparent flex-1 relative min-h-0">
          {widgets.length === 0 && !loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 border-dashed">
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Widgets Configured</h3>
              <p className="text-slate-500 text-sm mb-6">Build your dashboard first to see it here in presentation mode.</p>
              <Link href="/builder">
                <Button>Go to Builder</Button>
              </Link>
            </div>
          ) : (
            <MeasuredGrid
              className="layout presentation-mode"
              layouts={layouts}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={90}
              margin={[20, 20]}
              isDraggable={false}
              isResizable={false}
              compactType={null}
            >
              {widgets.map((w) => (
                <div
                  key={w.id}
                  className={
                    "flex flex-col overflow-hidden transition-all duration-300 " +
                    (w.stylePreset === 'corporate'
                      ? "bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-6"
                      : w.stylePreset === 'executive'
                      ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-lg p-4 sm:p-6"
                      : w.stylePreset === 'elevated'
                      ? "bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 sm:p-6"
                      : w.stylePreset === 'compact'
                      ? "bg-white rounded-md border border-slate-200 shadow-sm p-3 sm:p-4"
                      : "bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-4 sm:p-6 md:p-8")
                  }
                >
                  {renderWidgetContent(w)}
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
