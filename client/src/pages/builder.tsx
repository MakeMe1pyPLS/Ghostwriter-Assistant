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
import { useSectorData, getAllMetrics } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TemplateGallery } from "@/components/TemplateGallery";
import { ExportDrawer } from "@/components/ExportDrawer";
import { WidgetInspector } from "@/components/WidgetInspector";
import { WidgetLibraryContent, WidgetLibraryMobile, widgetCategories } from "@/components/WidgetLibrary";
import { WidgetRenderer } from "@/components/visualizations/WidgetRenderer";
import { useToast } from "@/hooks/use-toast";

function InsightsWidgetContent({ sector, title }: { sector: string, title?: string }) {
  const [insights, setInsights] = useState<any>(null);
  
  useEffect(() => {
    import('@/lib/ai-provider').then(({ ai }) => {
      ai.generateInsights(sector, {}).then(setInsights);
    });
  }, [sector]);

  if (!insights) {
    return (
      <div className="h-full flex flex-col p-1 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-primary opacity-50" />
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <BrainCircuit className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title || 'AI Recommendations'}</h3>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2">Impact Assessment</p>
          <ul className="text-[11px] text-slate-500 leading-relaxed list-disc pl-3 space-y-1">
            {insights.what_changed?.map((c: string, i: number) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100">
          <p className="text-xs font-bold text-teal-700 mb-2">Recommended Actions</p>
          <ul className="text-[11px] text-teal-700/80 leading-relaxed list-disc pl-3 space-y-1">
            {insights.actions?.slice(0, 2).map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        {insights.forecast_note && (
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-1">Forecast Note</p>
            <p className="text-[11px] text-indigo-700/80 leading-relaxed">{insights.forecast_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const { metrics, chartData, donutData, sector, dateRange } = useSectorData();
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

  const addWidget = (widgetInfo: any) => {
    const id = `${widgetInfo.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem = { i: id, x: 0, y: Infinity, w: widgetInfo.w, h: widgetInfo.h };
    
    setWidgets(prev => {
      const newWidgets = [...prev, { id, type: widgetInfo.id, metricIndex: Math.floor(Math.random() * 4), ...(widgetInfo.defaultProps || {}) }];
      localStorage.setItem(`widgets_${sector}`, JSON.stringify(newWidgets));
      return newWidgets;
    });
    
    setLayout(prev => {
      const newLayout = [...prev, newItem];
      setLayouts((prevLayouts: any) => ({ ...prevLayouts, lg: newLayout }));
      localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
      return newLayout;
    });
    
    toast({ title: "Widget Added", description: `${widgetInfo.name} added to dashboard.` });
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== id);
      localStorage.setItem(`widgets_${sector}`, JSON.stringify(newWidgets));
      return newWidgets;
    });
    setLayout(prev => {
      const newLayout = prev.filter(l => l.i !== id);
      setLayouts((prevLayouts: any) => ({ ...prevLayouts, lg: newLayout }));
      localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
      return newLayout;
    });
  };

  const duplicateWidget = (id: string) => {
    const widgetToDup = widgets.find(w => w.id === id);
    const layoutItem = layout.find(l => l.i === id);
    if (!widgetToDup || !layoutItem) return;
    
    const newId = `${widgetToDup.type}-${Date.now()}`;
    
    setWidgets(prev => {
      const newWidgets = [...prev, { ...widgetToDup, id: newId }];
      localStorage.setItem(`widgets_${sector}`, JSON.stringify(newWidgets));
      return newWidgets;
    });
    
    setLayout(prev => {
      const newLayout = [...prev, { ...layoutItem, i: newId, y: Infinity }];
      setLayouts((prevLayouts: any) => ({ ...prevLayouts, lg: newLayout }));
      localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
      return newLayout;
    });
    
    toast({ title: "Widget Duplicated" });
  };

  const moveWidget = (id: string, dir: 'up' | 'down') => {
      setLayout(prev => {
          const layoutItem = prev.find(l => l.i === id);
          if (!layoutItem) return prev;
          const newLayout = prev.map(l => {
              if (l.i === id) {
                  return { ...l, y: dir === 'up' ? Math.max(0, l.y - 1) : l.y + 1 };
              }
              return l;
          });
          setLayouts((prevLayouts: any) => ({ ...prevLayouts, lg: newLayout }));
          localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
          return newLayout;
      });
  };

  const updateWidget = (id: string, updates: any) => {
    setWidgets(prev => {
      const newWidgets = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      localStorage.setItem(`widgets_${sector}`, JSON.stringify(newWidgets));
      return newWidgets;
    });
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
    return <WidgetRenderer widget={widget} data={{ metrics, chartData, donutData, allMetrics: getAllMetrics(1) }} sector={sector} loading={loading} />;
  };

    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-4 md:gap-6 lg:gap-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard Builder</h1>
              <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Configure your supply chain command center.</p>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 bg-white md:bg-transparent p-2 md:p-0 rounded-xl md:rounded-none border md:border-none border-slate-100 shadow-sm md:shadow-none">
               {editMode && (
                 <Button variant="outline" onClick={() => resetLayout(true)} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Reset
                 </Button>
               )}
               {!editMode && <div className="flex-1 md:flex-none"><TemplateGallery onSelect={applyTemplate} /></div>}
               {!editMode && <div className="flex-1 md:flex-none"><ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} /></div>}
               <Button 
                 variant={editMode ? "default" : "outline"} 
                 className={`flex-[2] md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 w-full md:w-auto px-3 md:px-4 ${!editMode ? 'border-slate-200 bg-white' : ''}`}
                 onClick={() => {
                   if (editMode) {
                     toast({ title: "Layout Saved", description: "Your dashboard layout has been saved." });
                   }
                   setEditMode(!editMode);
                 }}
               >
                 {editMode ? <Settings2 className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> : <Edit3 className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
                 {editMode ? 'Done Editing' : 'Edit Mode'}
               </Button>
            </div>
          </header>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 overflow-hidden min-h-0 relative">
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
                  <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <LayoutTemplate className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start your Command Center</h3>
                  <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Drag widgets from the library on the right to build your custom operational view.</p>
                  {editMode && (
                     <Button size="lg" className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all" onClick={() => addWidget(widgetCategories[0].items[0])}>Add First Widget</Button>
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
                             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pointer-events-none truncate max-w-[60px] md:max-w-none">
                                {w.name || w.type}
                             </div>
                           </div>
                           <div className="flex items-center gap-0.5">
                             <Button variant="ghost" size="icon" className="h-6 w-6 widget-action hover:bg-slate-200 hidden sm:flex" onClick={(e) => { e.stopPropagation(); moveWidget(w.id, 'up'); }}>
                               <ArrowUpToLine className="w-3 h-3 text-slate-500" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6 widget-action hover:bg-slate-200 hidden sm:flex" onClick={(e) => { e.stopPropagation(); moveWidget(w.id, 'down'); }}>
                               <ArrowDownToLine className="w-3 h-3 text-slate-500" />
                             </Button>
                             <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />
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
            <>
              {/* Desktop Widget Library */}
              <aside className="hidden lg:flex w-80 flex-col gap-6 animate-in slide-in-from-right-8 duration-300">
                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex-1">
                  <WidgetLibraryContent onAdd={addWidget} />
                </Card>

                <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden group shrink-0">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                   <h4 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">Pro Tip</h4>
                   <p className="text-xs text-slate-400 leading-relaxed relative z-10">Drag the handles to move widgets. Resize from the bottom right corner. Click the Edit icon on any widget to configure its data source.</p>
                </div>
              </aside>
              
              {/* Mobile Widget Library Floating Action Button */}
              <WidgetLibraryMobile onAdd={addWidget} />
            </>
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
          const newLayout = layout.map(l => l.i === id ? { ...l, ...updates } : l);
          setLayout(newLayout);
          setLayouts({ ...layouts, lg: newLayout, md: newLayout, sm: newLayout });
          localStorage.setItem(`layout_${sector}`, JSON.stringify(newLayout));
        }}
        onDelete={removeWidget}
        onDuplicate={(id) => {
            duplicateWidget(id);
            setInspectedWidgetId(null);
        }}
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
