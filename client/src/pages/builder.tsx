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
  Bot,
  Download
} from "lucide-react";
import { useSectorData } from "@/hooks/use-sector-data";
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
import { buildSpecFromState, buildStateFromSpec, downloadSpecJson } from "@/lib/dashboard-spec";
import { Link } from "wouter";
import { Sparkles, Wand2 } from "lucide-react";
import { GRID_COLS, GRID_BREAKPOINTS, GRID_ROW_HEIGHT, GRID_MARGIN, defaultDashboard } from "@/lib/dashboard-grid";

export default function BuilderPage() {
  const { metrics, chartData, donutData, sector, dateRange, allMetrics } = useSectorData();
  const { ensureDashboardLoaded, saveDashboard, resetDashboard } = useDashboardStore();
  const { toast } = useToast();
  
  const [layout, setLayout] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any>({});
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [inspectedWidgetId, setInspectedWidgetId] = useState<string | null>(null);

  // Hydrate local editing state from the store (the single source of truth),
  // migrating from the legacy localStorage keys on first load if needed.
  useEffect(() => {
    setLoading(true);
    ensureDashboardLoaded(sector);
    const dash = useDashboardStore.getState().dashboards[sector];
    if (dash) {
      setLayout(dash.layout);
      setLayouts({ lg: dash.layout });
      setWidgets(dash.widgets);
    }
    setTimeout(() => setLoading(false), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  // Persist the canonical (lg) layout + widgets to the store, which mirrors to
  // the legacy localStorage keys and reactively drives the read-only Dashboard.
  const persist = (nextLayout: any[], nextWidgets: any[]) => {
    saveDashboard(sector, nextLayout, nextWidgets);
  };

  const onLayoutChange = (newLayout: any, allLayouts: any) => {
    const lgLayout = (allLayouts && allLayouts.lg) ? allLayouts.lg : newLayout;
    setLayout(lgLayout);
    setLayouts({ lg: lgLayout });
    persist(lgLayout, widgets);
  };

  const addWidget = (widgetInfo: any) => {
    const id = `${widgetInfo.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem = { i: id, x: 0, y: Infinity, w: widgetInfo.w, h: widgetInfo.h };
    const newWidgets = [...widgets, { id, type: widgetInfo.id, metricIndex: Math.floor(Math.random() * 4), ...(widgetInfo.defaultProps || {}) }];
    const newLayout = [...layout, newItem];
    setWidgets(newWidgets);
    setLayout(newLayout);
    setLayouts({ lg: newLayout });
    persist(newLayout, newWidgets);
    toast({ title: "Widget Added", description: `${widgetInfo.name} added to dashboard.` });
  };

  const removeWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    const newLayout = layout.filter(l => l.i !== id);
    setWidgets(newWidgets);
    setLayout(newLayout);
    setLayouts({ lg: newLayout });
    persist(newLayout, newWidgets);
  };

  const duplicateWidget = (id: string) => {
    const widgetToDup = widgets.find(w => w.id === id);
    const layoutItem = layout.find(l => l.i === id);
    if (!widgetToDup || !layoutItem) return;
    const newId = `${widgetToDup.type}-${Date.now()}`;
    const newWidgets = [...widgets, { ...widgetToDup, id: newId }];
    const newLayout = [...layout, { ...layoutItem, i: newId, y: Infinity }];
    setWidgets(newWidgets);
    setLayout(newLayout);
    setLayouts({ lg: newLayout });
    persist(newLayout, newWidgets);
    toast({ title: "Widget Duplicated" });
  };

  const moveWidget = (id: string, dir: 'up' | 'down') => {
    const layoutItem = layout.find(l => l.i === id);
    if (!layoutItem) return;
    const newLayout = layout.map(l =>
      l.i === id ? { ...l, y: dir === 'up' ? Math.max(0, l.y - 1) : l.y + 1 } : l
    );
    setLayout(newLayout);
    setLayouts({ lg: newLayout });
    persist(newLayout, widgets);
  };

  const updateWidget = (id: string, updates: any) => {
    const newWidgets = widgets.map(w => w.id === id ? { ...w, ...updates } : w);
    setWidgets(newWidgets);
    persist(layout, newWidgets);
  };

  const resetLayout = (showToast = true) => {
    const { layout: defaultLayout, widgets: defaultWidgets } = defaultDashboard();
    setLayout(defaultLayout);
    setLayouts({ lg: defaultLayout });
    setWidgets(defaultWidgets);
    resetDashboard(sector);
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
    persist(templateLayout, templateWidgets);
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
    return <WidgetRenderer widget={widget} data={{ metrics, chartData, donutData, allMetrics }} sector={sector} loading={loading} />;
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
               {!editMode && (
                 <div className="flex gap-1.5">
                   <Link href="/generate">
                     <Button variant="outline" className="rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4" data-testid="button-header-generate">
                       <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" /> Generate
                     </Button>
                   </Link>
                   <Link href="/enhance">
                     <Button variant="outline" className="rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4" data-testid="button-header-enhance">
                       <Wand2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Enhance
                     </Button>
                   </Link>
                 </div>
               )}
               {editMode && (
                 <Button variant="outline" onClick={() => resetLayout(true)} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Reset
                 </Button>
               )}
                              {!editMode && (
                 <>
                 <Button variant="outline" onClick={() => {
                   const input = document.createElement('input');
                   input.type = 'file';
                   input.accept = 'application/json';
                   input.onchange = (e) => {
                     const file = (e.target as HTMLInputElement).files?.[0];
                     if (!file) return;
                     const reader = new FileReader();
                     reader.onload = (event) => {
                       try {
                         const spec = JSON.parse(event.target?.result as string);
                         if (spec.version === "1.0.0" && spec.widgets) {
                                                      const { widgets: newWidgets, layouts: newLayouts } = buildStateFromSpec(spec);
                           const importedLayout = newLayouts.lg || [];
                           setWidgets(newWidgets);
                           setLayout(importedLayout);
                           setLayouts({ lg: importedLayout });
                           persist(importedLayout, newWidgets);
                           toast({ title: "Blueprint Imported", description: "Dashboard updated from spec." });
                         } else {
                           toast({ title: "Invalid Spec", description: "The uploaded file is not a valid v1.0.0 Dashboard Blueprint.", variant: "destructive" });
                         }
                       } catch (e) {
                         toast({ title: "Import Failed", description: "Failed to parse JSON blueprint.", variant: "destructive" });
                       }
                     };
                     reader.readAsText(file);
                   };
                   input.click();
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Import Spec
                 </Button>
                 <Button variant="outline" onClick={() => {
                   const spec = buildSpecFromState("My Dashboard", sector, widgets, layouts);
                   downloadSpecJson(spec);
                   toast({ title: "Blueprint Exported", description: "Your Dashboard JSON spec has been downloaded." });
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   <Download className="w-3.5 h-3.5 mr-1.5" /> Export Spec
                 </Button>
                 </>
               )}
               {!editMode && <div className="flex-1 md:flex-none"><TemplateGallery onSelect={applyTemplate} /></div>}
               {!editMode && <div className="flex-1 md:flex-none"><ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} /></div>}
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

          {editMode && (
            <div className="md:hidden flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0" data-testid="builder-mobile-hint">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold leading-relaxed">
                Editing layouts works best on a larger screen. Tap a widget to configure it, or use the <span className="uppercase tracking-widest font-black">+</span> button to add new widgets.
              </p>
            </div>
          )}

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
                  <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Choose how you want to create your dashboard.</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                    <Link href="/generate" className="flex-1">
                      <Button size="lg" className="w-full rounded-xl font-black shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-xs uppercase tracking-widest h-12" data-testid="button-generate-for-me">
                        <Sparkles className="w-4 h-4 mr-2" /> Generate For Me
                      </Button>
                    </Link>
                    <Link href="/enhance" className="flex-1">
                      <Button size="lg" variant="outline" className="w-full rounded-xl font-black shadow-sm hover:shadow-md transition-all text-xs uppercase tracking-widest h-12 border-slate-200" data-testid="button-enhance-dashboard">
                        <Wand2 className="w-4 h-4 mr-2" /> Enhance Dashboard
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-px bg-slate-200 w-12" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">or build manually</span>
                    <div className="h-px bg-slate-200 w-12" />
                  </div>
                  {editMode ? (
                     <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200" onClick={() => addWidget(widgetCategories[0].items[0])}>
                       <Plus className="w-4 h-4 mr-2" /> Add First Widget
                     </Button>
                  ) : (
                     <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200" onClick={() => setEditMode(true)}>
                       <Edit3 className="w-4 h-4 mr-2" /> Enter Edit Mode
                     </Button>
                  )}
                </div>
              ) : (
                <MeasuredGrid
                  className="layout"
                  layouts={layouts}
                  cols={GRID_COLS}
                  breakpoints={GRID_BREAKPOINTS}
                  rowHeight={GRID_ROW_HEIGHT}
                  onLayoutChange={onLayoutChange}
                  draggableHandle=".widget-handle"
                  margin={GRID_MARGIN}
                  isDraggable={editMode}
                  isResizable={editMode}
                  compactType={null}
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
          setLayouts({ lg: newLayout });
          persist(newLayout, widgets);
        }}
        onDelete={removeWidget}
        onDuplicate={(id) => {
            duplicateWidget(id);
            setInspectedWidgetId(null);
        }}
      />
      
      <style>{`
        .react-grid-placeholder { background: #0F766E !important; opacity: 0.1 !important; border-radius: 1rem !important; }
      `}</style>
    </AppLayout>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return <span className={`px-2 py-0.5 rounded-full font-bold ${className}`}>{children}</span>
}
