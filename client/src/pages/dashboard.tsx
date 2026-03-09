import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { BrainCircuit, ChevronUp, ChevronDown, Info, Share2, ArrowLeft } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { useSectorData, getAllMetrics } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WidgetRenderer } from "@/components/visualizations/WidgetRenderer";
import { ExportDrawer } from "@/components/ExportDrawer";
import { Link } from "wouter";

function InsightsWidgetContent({ sector, title }: { sector: string, title?: string }) {
  const [insights, setInsights] = useState<any>(null);
  
  useEffect(() => {
    import('@/lib/ai-provider').then(({ ai }) => {
      ai.generateInsights(sector, {}).then(setInsights);
    });
  }, [sector]);

  if (!insights) {
    return (
      <div className="h-full flex flex-col animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-primary opacity-50" />
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <BrainCircuit className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title || 'AI Recommendations'}</h3>
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Impact Assessment</p>
          <ul className="text-xs text-slate-500 leading-relaxed list-disc pl-4 space-y-1.5 font-medium">
            {insights.what_changed?.map((c: string, i: number) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
          <p className="text-xs font-bold text-teal-700 mb-2 uppercase tracking-wider">Recommended Actions</p>
          <ul className="text-xs text-teal-700/80 leading-relaxed list-disc pl-4 space-y-1.5 font-medium">
            {insights.actions?.slice(0, 2).map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        {insights.forecast_note && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <p className="text-[10px] font-black text-indigo-700 mb-1.5 uppercase tracking-widest">Forecast Note</p>
            <p className="text-xs text-indigo-700/80 leading-relaxed font-medium">{insights.forecast_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, chartData, donutData, sector, dateRange, allMetrics } = useSectorData();
  const { toast } = useToast();
  const [layout, setLayout] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We load the read-only state from local storage.
  // The layout on the Dashboard page should never be edited.
  useEffect(() => {
    setLoading(true);
    const savedLayout = localStorage.getItem(`layout_${sector}`);
    const savedWidgets = localStorage.getItem(`widgets_${sector}`);
    
    if (savedLayout && savedWidgets) {
      const parsedLayout = JSON.parse(savedLayout).map((l: any) => ({ ...l, static: true }));
      setLayout(parsedLayout);
      setLayouts({ lg: parsedLayout, md: parsedLayout, sm: parsedLayout });
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // Default fallback if no builder setup exists yet
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

  const renderWidgetContent = (widget: any) => {
    return <WidgetRenderer widget={widget} data={{ metrics, chartData, donutData, allMetrics: getAllMetrics(1) }} sector={sector} loading={loading} presentationMode={true} />;
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen flex flex-col">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
          <div className="flex items-center gap-4">
            <Link href="/builder">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Operations Center</h1>
              <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sector Analysis: {sector}
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 flex-wrap">
             <ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} />
             <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 md:h-12 px-4 md:px-6 shadow-sm border-slate-200">
               <Share2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Share View</span>
             </Button>
          </div>
        </header>

        <div className="bg-transparent flex-1 relative">
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
              {widgets.map((w) => {
                return (
                  <div key={w.id} className={"flex flex-col overflow-hidden transition-all duration-300 " + (w.stylePreset === 'corporate' ? "bg-white rounded-lg border border-slate-300 shadow-sm p-6" : w.stylePreset === 'executive' ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-lg p-6" : w.stylePreset === 'elevated' ? "bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] p-6" : w.stylePreset === 'compact' ? "bg-white rounded-md border border-slate-200 shadow-sm p-4" : "bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 md:p-8 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)]")}>
                    {renderWidgetContent(w)}
                  </div>
                );
              })}
            </MeasuredGrid>
          )}
        </div>
      </div>
      <style>{`
        /* Presentation mode specific overrides */
        .presentation-mode .react-grid-item {
          transition: none !important; /* Disable jumpy transitions in presentation */
        }
        .presentation-mode .react-grid-item.cssTransforms {
          transition: transform 0ms ease !important;
        }
      `}</style>
    </AppLayout>
  );
}
