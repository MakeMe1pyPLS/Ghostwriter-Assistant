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
import { ExportDrawer } from "@/components/ExportDrawer";
import { Link } from "wouter";

export default function DashboardPage() {
  const { metrics, chartData, sector, dateRange, allMetrics } = useSectorData();
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
    if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />;

    // Shared metric resolution logic
    let metric = metrics[widget.metricIndex % metrics.length];
    if (widget.customMetricId) {
       const found = allMetrics.find(m => m.label === widget.customMetricId);
       if (found) metric = found;
    }

    switch (widget.type) {
      case 'kpi':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{widget.title || metric?.label}</span>
                {widget.description && <span className="text-[10px] text-slate-400 font-medium mt-1">{widget.description}</span>}
              </div>
              <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-slate-300 hover:text-slate-500 transition-colors" /></TooltipTrigger>
                <TooltipContent>{metric?.helpText}</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-4 flex-1 flex flex-col justify-center">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{metric?.value || '0'}</h3>
              {widget.showDelta !== false && metric?.trend && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-black mt-2 w-fit ${metric.isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100'}`}>
                  {metric.isPositive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {metric.trend}
                </div>
              )}
            </div>
            {widget.showSparkline !== false && (
              <div className="h-12 w-full mt-4 opacity-40 relative shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData.slice(0, 5)}>
                     <Area type="monotone" dataKey="value" stroke={metric?.isPositive ? "#10b981" : "#f43f5e"} fill="transparent" strokeWidth={3} />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      case 'trend':
      case 'bar':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{widget.title || 'Trend Analysis'}</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {widget.chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : widget.chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={3} dot={{r: 4, fill: '#0F766E'}} />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`colorDash-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={4} fill={`url(#colorDash-${widget.id})`} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'donut':
        return (
          <div className="h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{widget.title || 'Distribution'}</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={chartData.slice(0, 4)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" stroke="none">
                    {chartData.slice(0,4).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#0F766E', '#14B8A6', '#2DD4BF', '#99F6E4'][index % 4]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="h-full flex flex-col">
             <div className="mb-6">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{widget.title || 'Data Table'}</h3>
             </div>
             <div className="flex-1 overflow-auto border border-slate-100 rounded-xl shadow-sm">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 sticky top-0">
                   <tr><th className="p-4 font-bold text-slate-500">Metric</th><th className="p-4 font-bold text-slate-500">Value</th><th className="p-4 font-bold text-slate-500">Trend</th></tr>
                 </thead>
                 <tbody>
                   {metrics.slice(0,4).map((m, i) => (
                     <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                       <td className="p-4 text-slate-700 font-medium">{m.label}</td>
                       <td className="p-4 font-black text-slate-900">{m.value}</td>
                       <td className={`p-4 font-bold ${m.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{m.trend}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'chat':
        return (
          <div className="h-full flex flex-col p-1">
             <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{widget.title || 'AI Assistant'}</h3>
             </div>
             <div className="flex-1 flex flex-col gap-3 overflow-auto mb-3 px-1">
               <div className="bg-slate-50 rounded-xl rounded-tl-none p-3 text-[11px] font-medium text-slate-700 self-start max-w-[85%] border border-slate-100 shadow-sm">
                 How can I help you analyze the {sector} data today?
               </div>
               <div className="bg-primary/10 rounded-xl rounded-tr-none p-3 text-[11px] font-bold text-primary self-end max-w-[85%] border border-primary/20 shadow-sm">
                 What's our biggest risk?
               </div>
               <div className="bg-slate-50 rounded-xl rounded-tl-none p-3 text-[11px] font-medium text-slate-700 self-start max-w-[85%] border border-slate-100 shadow-sm">
                 The biggest risk currently is a potential bottleneck at the Central Hub due to incoming weather.
               </div>
             </div>
             <div className="h-10 border border-slate-200 rounded-xl flex items-center px-4 text-xs font-medium text-slate-400 bg-white shadow-sm">Ask a question...</div>
          </div>
        );
      case 'forecast':
        return (
          <div className="h-full flex flex-col p-1">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{widget.title || 'Demand Forecast'}</h3>
               <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-widest">Predictive</span>
             </div>
             <div className="flex-1 relative min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                   <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                   <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        );
      case 'summary':
        return (
          <div className="h-full flex flex-col justify-center p-4">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">{widget.title || 'Executive Summary'}</h3>
            <p className="text-[15px] text-slate-600 leading-relaxed font-medium">Overall performance in {sector} is showing a <strong className={metrics[0]?.isPositive ? 'text-emerald-600 bg-emerald-50 px-1 rounded' : 'text-rose-600 bg-rose-50 px-1 rounded'}>{metrics[0]?.trend || 'stable'}</strong> trend. Key indicators suggest strong operational health despite minor localized disruptions. Focus should remain on sustaining current throughput and mitigating identified supply chain risks.</p>
          </div>
        );
      case 'insights':
        return (
           <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{widget.title || 'AI Recommendations'}</h3>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-1">Optimization Found</p>
                  <p className="text-xs text-slate-500 leading-relaxed">System detected a 4.2% potential yield increase by adjusting Line C throughput.</p>
                </div>
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                  <p className="text-xs font-bold text-teal-700 mb-1">Suggested Action</p>
                  <p className="text-xs text-slate-600 leading-relaxed">Reroute inventory from Central Hub to West Coast to avoid 3-day weather delay.</p>
                </div>
              </div>
           </div>
        );
      default: return (
        <div className="h-full flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{widget.title || widget.type}</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Widget view ready
          </div>
        </div>
      );
    }
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
                  <div key={w.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)]">
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
