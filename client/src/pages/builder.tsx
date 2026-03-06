import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
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
  Plus,
  Settings2,
  Edit3,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  LineChart as LineChartIcon,
  Bot
} from "lucide-react";
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
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TemplateGallery } from "@/components/TemplateGallery";
import { ExportDrawer } from "@/components/ExportDrawer";
import { WidgetInspector } from "@/components/WidgetInspector";
import { useToast } from "@/hooks/use-toast";

const availableWidgets = [
  { id: 'kpi', name: 'KPI Card', icon: LayoutTemplate, w: 3, h: 2 },
  { id: 'trend', name: 'Line Chart', icon: LineChartIcon, w: 6, h: 3, defaultProps: { chartType: 'line' } },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, w: 6, h: 3, defaultProps: { chartType: 'bar' } },
  { id: 'donut', name: 'Donut Chart', icon: PieChart, w: 4, h: 3, defaultProps: { chartType: 'donut' } },
  { id: 'table', name: 'Data Table', icon: TableIcon, w: 6, h: 4 },
  { id: 'insights', name: 'AI Insights', icon: BrainCircuit, w: 4, h: 4 },
  { id: 'chat', name: 'AI Chat', icon: Bot, w: 4, h: 4 },
  { id: 'summary', name: 'Executive Summary', icon: MessageSquareQuote, w: 12, h: 2 },
  { id: 'forecast', name: 'Forecast Panel', icon: TrendingUp, w: 8, h: 4 },
];

export default function BuilderPage() {
  const { metrics, chartData, sector, dateRange } = useSectorData();
  const { lastRefreshed } = useDashboardStore();
  const { toast } = useToast();
  
  const [layout, setLayout] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [editMode, setEditMode] = useState(false);
  const [inspectedWidgetId, setInspectedWidgetId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const key = `layout_${sector}`;
    const savedLayout = localStorage.getItem(key);
    const savedWidgets = localStorage.getItem(`widgets_${sector}`);
    
    if (savedLayout && savedWidgets) {
      setLayout(JSON.parse(savedLayout));
      setLayouts({ lg: JSON.parse(savedLayout) });
      setWidgets(JSON.parse(savedWidgets));
    } else {
      resetLayout(false);
    }
    setTimeout(() => setLoading(false), 400);
  }, [sector]);

  const onLayoutChange = (newLayout: any, allLayouts: any) => {
    setLayout(newLayout);
    setLayouts(allLayouts);
    localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
    localStorage.setItem(`widgets_${sector}`, JSON.stringify(widgets));
  };

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };

  const addWidget = (widgetInfo: typeof availableWidgets[0]) => {
    const id = `${widgetInfo.id}-${Date.now()}`;
    const newItem = { i: id, x: 0, y: Infinity, w: widgetInfo.w, h: widgetInfo.h };
    setWidgets([...widgets, { id, type: widgetInfo.id, metricIndex: Math.floor(Math.random() * 4), ...(widgetInfo.defaultProps || {}) }]);
    setLayout([...layout, newItem]);
    
    toast({ title: "Widget Added", description: `${widgetInfo.name} added to dashboard.` });
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    setLayout(layout.filter(l => l.i !== id));
  };

  const duplicateWidget = (id: string) => {
    const widgetToDup = widgets.find(w => w.id === id);
    const layoutItem = layout.find(l => l.i === id);
    if (!widgetToDup || !layoutItem) return;
    
    const newId = `${widgetToDup.type}-${Date.now()}`;
    setWidgets([...widgets, { ...widgetToDup, id: newId }]);
    setLayout([...layout, { ...layoutItem, i: newId, y: Infinity }]);
    toast({ title: "Widget Duplicated" });
  };

  const updateWidget = (id: string, updates: any) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const resetLayout = (showToast = true) => {
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
    setLayouts({ lg: defaultLayout });
    setWidgets(defaultWidgets);
    if (showToast) {
       toast({ title: "Layout Reset", description: "Reverted to default configuration." });
    }
  };

  const applyTemplate = (templateId: string) => {
    const templateWidgets = [
      { id: `kpi-${Date.now()}-1`, type: 'kpi', metricIndex: 0, title: 'Key Metric 1' },
      { id: `kpi-${Date.now()}-2`, type: 'kpi', metricIndex: 1, title: 'Key Metric 2' },
      { id: `trend-${Date.now()}-1`, type: 'trend', title: 'Overall Performance' },
    ];
    
    const templateLayout = [
      { i: templateWidgets[0].id, x: 0, y: 0, w: 6, h: 2 },
      { i: templateWidgets[1].id, x: 6, y: 0, w: 6, h: 2 },
      { i: templateWidgets[2].id, x: 0, y: 2, w: 12, h: 4 },
    ];

    setWidgets(templateWidgets);
    setLayout(templateLayout);
    setLayouts({ lg: templateLayout });
    toast({ title: "Template Applied" });
  };

  const getBadgeColors = (color: string) => {
    switch(color) {
      case 'teal': return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'indigo': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'rose': return 'bg-rose-50 border-rose-200 text-rose-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const renderWidgetContent = (widget: any) => {
    if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />;

    switch (widget.type) {
      case 'kpi':
        const metric = metrics[widget.metricIndex % metrics.length];
        return (
          <div className="flex flex-col h-full justify-between p-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || metric.label}</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-slate-300 hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent>{metric.helpText}</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
              {widget.showDelta !== false && (
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {metric.isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {metric.trend}
                </div>
              )}
            </div>
            <div className="h-8 w-full mt-2 opacity-30 relative">
               {widget.showTarget && (
                 <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-400 z-10" />
               )}
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData.slice(0, 5)}>
                   <Area type="monotone" dataKey="value" stroke={metric.isPositive ? "#10b981" : "#f43f5e"} fill="transparent" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
        );
      case 'trend':
      case 'bar':
        return (
          <div className="h-full flex flex-col p-1">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || 'Performance Trend'}</h3>
               <Badge variant="outline" className={`text-[10px] ${getBadgeColors(widget.badgeColor)}`}>Real-time</Badge>
            </div>
            <div className="flex-1 relative min-h-0">
              {widget.showTarget && (
                 <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-slate-300 z-10 w-full" />
              )}
              <ResponsiveContainer width="100%" height="100%">
                {widget.chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : widget.chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={3} dot={{r: 4, fill: '#0F766E'}} />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`colorPrimary-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={3} fill={`url(#colorPrimary-${widget.id})`} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'donut':
        return (
          <div className="h-full flex flex-col p-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{widget.title || 'Distribution'}</h3>
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
          <div className="h-full flex flex-col p-1">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{widget.title || 'Data Table'}</h3>
                </div>
             </div>
             <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
               <table className="w-full text-left text-xs">
                 <thead className="bg-slate-50 sticky top-0">
                   <tr><th className="p-2 font-bold text-slate-500">Metric</th><th className="p-2 font-bold text-slate-500">Value</th><th className="p-2 font-bold text-slate-500">Trend</th></tr>
                 </thead>
                 <tbody>
                   {metrics.slice(0,4).map((m, i) => (
                     <tr key={i} className="border-b border-slate-50">
                       <td className="p-2 text-slate-700 font-medium">{m.label}</td>
                       <td className="p-2 font-bold">{m.value}</td>
                       <td className={`p-2 font-bold ${m.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{m.trend}</td>
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
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{widget.title || 'AI Assistant'}</h3>
             </div>
             <div className="flex-1 flex flex-col gap-3 overflow-auto mb-3 px-1">
               <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 text-xs text-slate-700 self-start max-w-[85%] shadow-sm">
                 How can I help you analyze the {sector} data today?
               </div>
               <div className="bg-primary/10 rounded-lg rounded-tr-none p-3 text-xs text-primary font-bold self-end max-w-[85%] shadow-sm">
                 What's our biggest risk?
               </div>
             </div>
             <div className="h-9 border border-slate-200 rounded-lg flex items-center px-3 text-xs text-slate-400 bg-slate-50">Ask a question...</div>
          </div>
        );
      case 'summary':
        return (
          <div className="h-full flex flex-col justify-center p-2">
            <h3 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">{widget.title || 'Executive Summary'}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Overall performance in {sector} is showing a <strong className={metrics[0]?.isPositive ? 'text-emerald-600' : 'text-rose-600'}>{metrics[0]?.trend || 'stable'}</strong> trend. Key indicators suggest strong operational health despite minor localized disruptions. Focus should remain on sustaining current throughput and mitigating identified supply chain risks.</p>
          </div>
        );
      case 'forecast':
        return (
          <div className="h-full flex flex-col p-1">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || 'Demand Forecast'}</h3>
               <Badge variant="outline" className={`text-[10px] ${getBadgeColors(widget.badgeColor)} bg-indigo-50 text-indigo-700 border-indigo-200`}>Predictive</Badge>
             </div>
             <div className="flex-1 relative min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                   <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                   <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        );
      case 'insights':
        return (
           <div className="h-full flex flex-col p-1">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{widget.title || 'AI Recommendations'}</h3>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
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
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-6 md:gap-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Builder</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Configure your supply chain command center.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
             {editMode && (
               <Button variant="outline" onClick={() => resetLayout(true)} className="rounded-xl shadow-sm font-bold text-xs uppercase tracking-wider h-10 border-slate-200 bg-white">
                 Reset Layout
               </Button>
             )}
             {!editMode && <TemplateGallery onSelect={applyTemplate} />}
             {!editMode && <ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} />}
             <Button 
               variant={editMode ? "default" : "outline"} 
               className={`rounded-xl shadow-sm font-bold text-xs uppercase tracking-wider h-10 w-full md:w-auto ${!editMode ? 'border-slate-200 bg-white' : ''}`}
               onClick={() => {
                 if (editMode) {
                   toast({ title: "Layout Saved", description: "Your dashboard layout has been saved." });
                 }
                 setEditMode(!editMode);
               }}
             >
               {editMode ? <Settings2 className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
               {editMode ? 'Done Editing' : 'Edit Mode'}
             </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 overflow-hidden min-h-0">
          <div className={`flex-1 bg-white rounded-2xl border ${editMode ? 'border-primary/20 ring-4 ring-primary/5' : 'border-slate-200'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto p-2 md:p-4 custom-scrollbar relative transition-all`}>
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
                  {editMode && (
                     <Button onClick={() => addWidget(availableWidgets[0])}>Add First Widget</Button>
                  )}
                </div>
              ) : (
                <MeasuredGrid
                  className="layout"
                  layouts={layouts}
                  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={80}
                  onLayoutChange={onLayoutChange}
                  onBreakpointChange={onBreakpointChange}
                  draggableHandle=".widget-handle"
                  margin={[16, 16]}
                  isDraggable={editMode}
                  isResizable={editMode}
                >
                  {widgets.map((w) => (
                    <div 
                      key={w.id} 
                      className={`bg-white rounded-2xl border ${editMode ? 'border-primary/30 shadow-md ring-1 ring-primary/10' : 'border-slate-100 shadow-sm hover:border-slate-200'} group transition-all duration-200 flex flex-col overflow-hidden relative`}
                      onClick={(e) => {
                        // Prevent triggering inspector if clicking handle or its children
                        if ((e.target as HTMLElement).closest('.widget-handle')) return;
                        if ((e.target as HTMLElement).closest('.widget-action')) return;
                        if (editMode) {
                          setInspectedWidgetId(w.id);
                        }
                      }}
                    >
                      {editMode && (
                        <div className="h-9 flex items-center justify-between px-3 bg-slate-50/90 widget-handle cursor-move border-b border-slate-100">
                           <div className="flex items-center gap-2">
                             <div className="flex gap-1 opacity-50">
                               <div className="w-1 h-1 rounded-full bg-slate-400" />
                               <div className="w-1 h-1 rounded-full bg-slate-400" />
                               <div className="w-1 h-1 rounded-full bg-slate-400" />
                             </div>
                             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pointer-events-none">
                                {w.name || w.type}
                             </div>
                           </div>
                           <div className="flex items-center gap-0.5">
                             <Button variant="ghost" size="icon" className="h-6 w-6 widget-action hover:bg-slate-200" onClick={(e) => { e.stopPropagation(); duplicateWidget(w.id); }}>
                               <Copy className="w-3 h-3 text-slate-500" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6 widget-action hover:bg-slate-200" onClick={(e) => { e.stopPropagation(); setInspectedWidgetId(w.id); }}>
                               <Edit3 className="w-3 h-3 text-slate-500" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6 widget-action hover:bg-rose-100" onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}>
                               <Trash2 className="w-3 h-3 text-rose-500" />
                             </Button>
                           </div>
                        </div>
                      )}
                      <div className={`flex-1 p-3 md:p-5 ${editMode ? 'pt-2' : ''} min-h-0 pointer-events-none ${editMode ? '' : 'pointer-events-auto'}`}>
                        {renderWidgetContent(w)}
                      </div>
                      
                      {/* View mode subtle hover indicator for clickable widgets if needed, but keeping it clean */}
                      {!editMode && <div className="absolute inset-0 border-2 border-transparent group-hover:border-slate-100/50 rounded-2xl pointer-events-none transition-colors" />}
                    </div>
                  ))}
                </MeasuredGrid>
              )}
            </AnimatePresence>
          </div>

          {editMode && (
            <aside className="w-full lg:w-80 flex flex-col gap-6 animate-in slide-in-from-right-8 duration-300">
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Widget Library</h3>
                </div>
                <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {availableWidgets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => addWidget(w)}
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

              <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                 <h4 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">Pro Tip</h4>
                 <p className="text-xs text-slate-400 leading-relaxed relative z-10">Drag the handles to move widgets. Resize from the bottom right corner. Click the Edit icon on any widget to configure its data source.</p>
              </div>
            </aside>
          )}
        </div>
      </div>
      
      <WidgetInspector 
        widget={widgets.find(w => w.id === inspectedWidgetId)}
        layoutItem={layout.find(l => l.i === inspectedWidgetId)}
        open={!!inspectedWidgetId}
        onOpenChange={(open) => !open && setInspectedWidgetId(null)}
        onUpdate={updateWidget}
        onUpdateLayout={(id, updates) => {
          setLayout(layout.map(l => l.i === id ? { ...l, ...updates } : l));
        }}
        onDelete={removeWidget}
      />
      
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
