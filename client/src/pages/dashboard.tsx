import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { BrainCircuit, ChevronUp, ChevronDown, Info, Download, Share2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { metrics, chartData, sector } = useSectorData();
  const { toast } = useToast();
  const [layout, setLayout] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const savedLayout = localStorage.getItem(`layout_${sector}`);
    const savedWidgets = localStorage.getItem(`widgets_${sector}`);
    
    if (savedLayout && savedWidgets) {
      setLayout(JSON.parse(savedLayout));
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // Default fallback
      setLayout([
        { i: 'kpi-0', x: 0, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-1', x: 3, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-2', x: 6, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-3', x: 9, y: 0, w: 3, h: 2, static: true },
        { i: 'trend-1', x: 0, y: 2, w: 12, h: 5, static: true },
      ]);
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

  const handleExport = () => {
    toast({ title: "Export Started", description: "CSV report is being generated..." });
  };

  const renderWidgetContent = (widget: any) => {
    if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />;

    switch (widget.type) {
      case 'kpi':
        const metric = metrics[widget.metricIndex % metrics.length];
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <Tooltip>
                <TooltipTrigger><Info className="w-3.5 h-3.5 text-slate-200" /></TooltipTrigger>
                <TooltipContent>{metric.helpText}</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{metric.value}</h3>
              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black mt-1 ${metric.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {metric.isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {metric.trend}
              </div>
            </div>
          </div>
        );
      case 'trend':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Throughput</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                  <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={4} fill="url(#colorDashboard)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-10 max-w-[1600px] mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Operations Center</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Live Sector Analysis: {sector}</p>
          </div>
          <div className="flex gap-4">
             <Button onClick={handleExport} variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-sm border-slate-200">
               <Download className="w-4 h-4 mr-2" /> Export Data
             </Button>
             <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-sm border-slate-200">
               <Share2 className="w-4 h-4 mr-2" /> Share View
             </Button>
          </div>
        </header>

        <div className="bg-transparent overflow-hidden">
          <MeasuredGrid
            className="layout"
            layout={layout.map(l => ({ ...l, static: true }))}
            cols={12}
            rowHeight={90}
            margin={[30, 30]}
          >
            {widgets.map((w) => {
              const l = layout.find(item => item.i === w.id);
              return (
                <div key={w.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-8">
                  {renderWidgetContent(w)}
                </div>
              );
            })}
          </MeasuredGrid>
        </div>
      </div>
      <style>{`
        .react-grid-layout { width: 100% !important; }
      `}</style>
    </AppLayout>
  );
}
