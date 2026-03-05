import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Table as TableIcon, 
  LayoutTemplate,
  MessageSquareQuote,
  BrainCircuit,
  Trash2,
  Info,
  ChevronUp,
  ChevronDown,
  Plus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

const ReactGridLayout = WidthProvider(RGL);

const availableWidgets = [
  { id: 'kpi', name: 'KPI Card', icon: LayoutTemplate, w: 3, h: 2 },
  { id: 'trend', name: 'Trend Line', icon: TrendingUp, w: 6, h: 3 },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, w: 6, h: 3 },
  { id: 'insights', name: 'AI Insights', icon: BrainCircuit, w: 4, h: 4 },
];

export default function BuilderPage() {
  const { metrics, chartData, sector } = useSectorData();
  const { lastRefreshed } = useDashboardStore();
  const [layout, setLayout] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const key = `layout_${sector}`;
    const savedLayout = localStorage.getItem(key);
    const savedWidgets = localStorage.getItem(`widgets_${sector}`);
    
    if (savedLayout && savedWidgets) {
      setLayout(JSON.parse(savedLayout));
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // Default layout per sector
      const defaultLayout = [
        { i: 'kpi-0', x: 0, y: 0, w: 3, h: 2 },
        { i: 'kpi-1', x: 3, y: 0, w: 3, h: 2 },
        { i: 'kpi-2', x: 6, y: 0, w: 3, h: 2 },
        { i: 'kpi-3', x: 9, y: 0, w: 3, h: 2 },
        { i: 'trend-1', x: 0, y: 2, w: 8, h: 4 },
        { i: 'insights-1', x: 8, y: 2, w: 4, h: 4 }
      ];
      const defaultWidgets = [
        { id: 'kpi-0', type: 'kpi', metricIndex: 0 },
        { id: 'kpi-1', type: 'kpi', metricIndex: 1 },
        { id: 'kpi-2', type: 'kpi', metricIndex: 2 },
        { id: 'kpi-3', type: 'kpi', metricIndex: 3 },
        { id: 'trend-1', type: 'trend' },
        { id: 'insights-1', type: 'insights' },
      ];
      setLayout(defaultLayout);
      setWidgets(defaultWidgets);
    }
    setTimeout(() => setLoading(false), 400);
  }, [sector]);

  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
    localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
    localStorage.setItem(`widgets_${sector}`, JSON.stringify(widgets));
  };

  const addWidget = (type: string, w: number, h: number) => {
    const id = `${type}-${Date.now()}`;
    const newItem = { i: id, x: 0, y: Infinity, w, h };
    setWidgets([...widgets, { id, type, metricIndex: Math.floor(Math.random() * 4) }]);
    setLayout([...layout, newItem]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    setLayout(layout.filter(l => l.i !== id));
  };

  const renderWidgetContent = (widget: any) => {
    if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />;

    switch (widget.type) {
      case 'kpi':
        const metric = metrics[widget.metricIndex % metrics.length];
        return (
          <div className="flex flex-col h-full justify-between p-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.label}</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-slate-300 hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent>{metric.helpText}</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {metric.isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {metric.trend}
              </div>
            </div>
            <div className="h-8 w-full mt-2 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData.slice(0, 5)}>
                   <Area type="monotone" dataKey="value" stroke={metric.isPositive ? "#10b981" : "#f43f5e"} fill="transparent" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
        );
      case 'trend':
        return (
          <div className="h-full flex flex-col p-1">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance Trend</h3>
               <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">Real-time</Badge>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={3} fill="url(#colorPrimary)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'insights':
        return (
           <div className="h-full flex flex-col p-1">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Recommendations</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-1">Optimization Found</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">System detected a 4.2% potential yield increase by adjusting Line C throughput.</p>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100">
                  <p className="text-xs font-bold text-teal-700 mb-1">Suggested Action</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Reroute inventory from Central Hub to West Coast to avoid 3-day weather delay.</p>
                </div>
              </div>
           </div>
        );
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Builder</h1>
            <p className="text-slate-500 font-medium mt-1">Configure your supply chain command center.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-bold text-xs uppercase tracking-wider">
               Save Template
             </Button>
          </div>
        </header>

        <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto p-4 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              {loading ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Dashboard...</span>
                   </div>
                 </motion.div>
              ) : widgets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <LayoutTemplate className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Start your Command Center</h3>
                  <p className="text-slate-500 max-w-sm mt-2 mb-8">Drag widgets from the library on the right to build your custom operational view.</p>
                </div>
              ) : (
                <ReactGridLayout
                  className="layout"
                  layout={layout}
                  cols={12}
                  rowHeight={80}
                  onLayoutChange={onLayoutChange}
                  draggableHandle=".widget-handle"
                  margin={[24, 24]}
                >
                  {widgets.map((w) => (
                    <div key={w.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all duration-200 flex flex-col overflow-hidden">
                      <div className="h-8 flex items-center justify-between px-3 bg-slate-50/50 widget-handle cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="flex gap-1">
                           <div className="w-1 h-1 rounded-full bg-slate-300" />
                           <div className="w-1 h-1 rounded-full bg-slate-300" />
                           <div className="w-1 h-1 rounded-full bg-slate-300" />
                         </div>
                         <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-rose-50 hover:text-rose-500" onClick={() => removeWidget(w.id)}>
                           <Trash2 className="w-3 h-3" />
                         </Button>
                      </div>
                      <div className="flex-1 p-5 pt-2">
                        {renderWidgetContent(w)}
                      </div>
                    </div>
                  ))}
                </ReactGridLayout>
              )}
            </AnimatePresence>
          </div>

          <aside className="w-80 flex flex-col gap-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Widget Library</h3>
              </div>
              <CardContent className="p-4 space-y-3">
                {availableWidgets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => addWidget(w.id, w.w, w.h)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-primary/40 hover:bg-teal-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <w.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{w.name}</span>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary" />
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">AI Copilot</h4>
               <p className="text-xs text-slate-400 leading-relaxed relative z-10">Select a pre-built Executive template to instantly hydrate your command center.</p>
               <Button className="w-full mt-6 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold uppercase tracking-wider text-[10px] h-10 relative z-10">
                 Apply Exec Summary
               </Button>
            </div>
          </aside>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .react-grid-placeholder { background: #0F766E !important; opacity: 0.1 !important; border-radius: 1rem !important; }
      `}</style>
    </AppLayout>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return <span className={`px-2 py-0.5 rounded-full font-bold ${className}`}>{children}</span>
}
