import { getCardShellClasses } from "@/lib/card-shell";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useRef } from "react";
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
  Download,
  Save,
  Eye,
  CheckCircle2,
  Lock,
  Move,
  MoreHorizontal,
  RotateCcw,
  Upload,
  GripHorizontal,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TemplateGallery, buildTemplate } from "@/components/TemplateGallery";
import { ExportDrawer } from "@/components/ExportDrawer";
import { WidgetInspector } from "@/components/WidgetInspector";
import { WidgetLibraryContent, WidgetLibraryMobile, widgetCategories } from "@/components/WidgetLibrary";
import { WidgetRenderer } from "@/components/visualizations/WidgetRenderer";
import { useToast } from "@/hooks/use-toast";
import { buildSpecFromState, buildStateFromSpec, downloadSpecJson } from "@/lib/dashboard-spec";
import { Link } from "wouter";
import { Sparkles, Wand2 } from "lucide-react";
import { GRID_COLS, GRID_BREAKPOINTS, GRID_ROW_HEIGHT, GRID_MARGIN, EDITABLE_COLS, DESIGN_WIDTH, defaultDashboard } from "@/lib/dashboard-grid";
import { ToastAction } from "@/components/ui/toast";
import { useLocation } from "wouter";

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString();
}

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
  // Columns at the grid's current width. The saved layout is edited only at
  // full width (12 columns), so what you arrange is exactly what the Dashboard shows.
  const [gridCols, setGridCols] = useState<number>(EDITABLE_COLS);
  const colsRef = useRef<number>(EDITABLE_COLS); // read synchronously in onLayoutChange
  const canArrange = gridCols === EDITABLE_COLS;
  const savedAt = useDashboardStore((s) => s.dashboards[sector]?.savedAt);
  const [, navigate] = useLocation();
  const [, setTick] = useState(0);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [arrange, setArrange] = useState<'locked' | 'free'>(() => useDashboardStore.getState().dashboards[sector]?.arrange ?? 'locked');
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  // Width of the grid area, to know when to switch to the scaled desktop canvas.
  const canvasRef = useRef<HTMLElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Narrower than the 12-column grid: editing uses the full desktop canvas, scaled to fit.
  const narrow = canvasWidth < GRID_BREAKPOINTS.lg + 8;
  const designMode = editMode && narrow;
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 30000); return () => clearInterval(id); }, []);

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
      setArrange(dash.arrange ?? 'locked');
    }
    setTimeout(() => setLoading(false), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  // Persist the canonical (lg) layout + widgets to the store, which mirrors to
  // the legacy localStorage keys and reactively drives the read-only Dashboard.
  const persist = (nextLayout: any[], nextWidgets: any[]) => {
    saveDashboard(sector, nextLayout, nextWidgets);
  };

  const geometry = (l: any[]) => JSON.stringify((l || []).map(({ i, x, y, w, h }: any) => [i, x, y, w, h]).sort());

  const onLayoutChange = (newLayout: any) => {
    // Only the full-width layout is the saved one. Stacked phone layouts are
    // generated from it and never written back.
    if (colsRef.current !== EDITABLE_COLS) return;
    const clean = newLayout.map(({ i, x, y, w, h, minW, minH, maxW, maxH }: any) => ({ i, x, y, w, h, ...(minW ? { minW } : {}), ...(minH ? { minH } : {}), ...(maxW ? { maxW } : {}), ...(maxH ? { maxH } : {}) }));
    if (geometry(clean) === geometry(layout)) return; // nothing actually moved
    setLayout(clean);
    setLayouts({ lg: clean });
    persist(clean, widgets);
  };

  const saveNow = (finish: boolean) => {
    persist(layout, widgets);
    if (finish) setEditMode(false);
    toast({
      title: "Layout saved",
      description: "Your Dashboard now shows this exact layout.",
      action: <ToastAction altText="View dashboard" onClick={() => navigate("/dashboard")}>View dashboard</ToastAction>,
    });
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
    const { widgets: templateWidgets, layout: templateLayout } = buildTemplate(templateId);
    setWidgets(templateWidgets);
    setLayout(templateLayout);
    setLayouts({ lg: templateLayout });
    persist(templateLayout, templateWidgets);
    toast({ title: "Template applied", description: "Rearrange anything with Edit layout." });
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

  const importSpec = () => {
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
            toast({ title: "Blueprint imported", description: "Dashboard updated from the spec file." });
          } else {
            toast({ title: "Invalid spec", description: "That file isn't a v1.0.0 Dashboard Blueprint.", variant: "destructive" });
          }
        } catch {
          toast({ title: "Import failed", description: "Couldn't read that JSON file.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportSpec = () => {
    const spec = buildSpecFromState("My Dashboard", sector, widgets, layouts);
    downloadSpecJson(spec);
    toast({ title: "Blueprint exported", description: "Your dashboard spec (JSON) has been downloaded." });
  };

  const setArrangeMode = (mode: 'locked' | 'free') => {
    setArrange(mode);
    saveDashboard(sector, layout, widgets, { arrange: mode });
  };

  const btn = "rounded-xl shadow-sm font-semibold text-[13px] h-10 px-3.5 border-slate-200 bg-white";

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-28 lg:pb-10 max-w-[1600px] mx-auto w-full flex flex-col gap-4 md:gap-5">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard Builder</h1>
              <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Arrange your KPI cards on the grid. Export it to Excel, Google Sheets or Power BI.</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500" data-testid="text-save-status" aria-live="polite">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {savedAt ? `Saved ${timeAgo(savedAt)} · changes save automatically` : "Changes save automatically"}
              </p>
            </div>
          </div>

          {/* Actions wrap onto a second line instead of disappearing off-screen. */}
          <div className="toolbar" data-testid="builder-toolbar">
            {editMode ? (
              <>
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="How cards are arranged">
                  {([
                    { id: 'locked', label: 'Locked to grid', icon: Lock, hint: 'Cards snap into rows and close gaps automatically.' },
                    { id: 'free', label: 'Free', icon: Move, hint: 'Cards stay exactly where you drop them, gaps and all.' },
                  ] as const).map((m) => (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>
                        <button role="radio" aria-checked={arrange === m.id} onClick={() => setArrangeMode(m.id)}
                          className={`h-8 px-3 rounded-lg text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors ${arrange === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          data-testid={`arrange-${m.id}`}>
                          <m.icon className="w-3.5 h-3.5" /> {m.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{m.hint}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {narrow && (
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="Zoom">
                    {([['fit', 'Fit'], [0.6, '60%'], [1, '100%']] as const).map(([z, label]) => (
                      <button key={label} role="radio" aria-checked={zoom === z} onClick={() => setZoom(z)}
                        className={`h-8 px-3 rounded-lg text-[12.5px] font-bold transition-colors ${zoom === z ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
                    ))}
                  </div>
                )}
                <Button variant="outline" onClick={() => resetLayout(true)} className={btn}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} className={btn} data-testid="button-done-editing">
                  <Settings2 className="w-4 h-4" /> Done
                </Button>
                <Button onClick={() => saveNow(true)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout">
                  <Save className="w-4 h-4" /> Save layout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className={btn} onClick={() => setEditMode(true)} data-testid="button-edit-mode">
                  <Edit3 className="w-4 h-4" /> Edit layout
                </Button>
                <Button onClick={() => saveNow(false)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout">
                  <Save className="w-4 h-4" /> Save
                </Button>
                <ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />
                <Link href="/dashboard">
                  <Button variant="outline" className={btn} data-testid="button-view-dashboard">
                    <Eye className="w-4 h-4" /> View dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={btn} data-testid="button-builder-more">
                      <MoreHorizontal className="w-4 h-4" /> More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem onSelect={() => navigate('/generate')} className="gap-2"><Sparkles className="w-4 h-4 text-primary" /> Generate with AI</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/enhance')} className="gap-2"><Wand2 className="w-4 h-4 text-indigo-500" /> Enhance a dashboard</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTemplatesOpen(true)} className="gap-2" data-testid="menu-templates"><LayoutTemplate className="w-4 h-4" /> Templates</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={importSpec} className="gap-2"><Upload className="w-4 h-4" /> Import spec (JSON)</DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportSpec} className="gap-2"><Download className="w-4 h-4" /> Export spec (JSON)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          <TemplateGallery onSelect={applyTemplate} open={templatesOpen} onOpenChange={setTemplatesOpen} hideTrigger />

          {editMode && (
            <p className="flex items-start gap-2 text-[12.5px] font-semibold text-slate-500" data-testid="builder-edit-hint">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              {narrow
                ? "You're editing the full desktop layout, so it matches your Dashboard and exports. Drag a card by its top bar; resize from the corner. Zoom in for precise moves."
                : "Drag a card by its top bar, resize from the bottom-right corner, and tap a card to change its data or style."}
            </p>
          )}
        </header>

        <div className="flex gap-6 items-start">
          {/* The grid is the page: no inner scroll box. */}
          <section ref={canvasRef} aria-label="Dashboard grid"
            className={`flex-1 min-w-0 rounded-2xl transition-colors ${editMode ? 'bg-slate-50 border-2 border-dashed border-primary/25' : 'bg-transparent border-2 border-transparent'}`}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your dashboard…</span>
                  </div>
                </motion.div>
              ) : widgets.length === 0 ? (
                <div key="empty" className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <LayoutTemplate className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start your dashboard</h3>
                  <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Pick a template, let the AI build one, or add cards yourself.</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                    <Button size="lg" onClick={() => setTemplatesOpen(true)} className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest h-12">
                      <LayoutTemplate className="w-4 h-4 mr-2" /> Templates
                    </Button>
                    <Link href="/generate" className="flex-1">
                      <Button size="lg" variant="outline" className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-12 border-slate-200" data-testid="button-generate-for-me">
                        <Sparkles className="w-4 h-4 mr-2" /> Generate for me
                      </Button>
                    </Link>
                  </div>
                  <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200"
                    onClick={() => { setEditMode(true); addWidget(widgetCategories[0].items[0]); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add a card
                  </Button>
                </div>
              ) : (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <MeasuredGrid
                    key={designMode ? 'design' : 'fluid'}
                    className="layout"
                    layouts={layouts}
                    cols={GRID_COLS}
                    breakpoints={GRID_BREAKPOINTS}
                    rowHeight={GRID_ROW_HEIGHT}
                    onLayoutChange={onLayoutChange}
                    onBreakpointChange={(_bp, cols) => { colsRef.current = cols; setGridCols(cols); }}
                    draggableHandle=".widget-handle"
                    margin={GRID_MARGIN}
                    isDraggable={editMode && canArrange}
                    isResizable={editMode && canArrange}
                    compactType={editMode && arrange === 'locked' ? 'vertical' : null}
                    designWidth={designMode ? DESIGN_WIDTH : undefined}
                    zoom={zoom}
                    showGuides={editMode}
                  >
                    {widgets.map((w) => (
                      <div
                        key={w.id}
                        className={`${getCardShellClasses(w.cardPreset || w.stylePreset, 'builder')} ${editMode ? 'ring-2 ring-primary/20 shadow-md' : 'hover:shadow-md'} group transition-shadow duration-200 flex flex-col overflow-hidden relative`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('.widget-handle')) return;
                          if ((e.target as HTMLElement).closest('.widget-action')) return;
                          if (editMode) setInspectedWidgetId(w.id);
                        }}
                      >
                        {editMode && (
                          <div className="h-9 flex items-center justify-between gap-1 px-2.5 bg-slate-50/95 widget-handle cursor-move border-b border-slate-100 touch-none select-none">
                            <div className="flex items-center gap-2 min-w-0">
                              <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
                              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pointer-events-none truncate">
                                {w.title || w.name || w.type}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button variant="ghost" size="icon" aria-label="Duplicate card" className="h-7 w-7 widget-action hover:bg-slate-200" onClick={(e) => { e.stopPropagation(); duplicateWidget(w.id); }}>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label="Edit card" className="h-7 w-7 widget-action hover:bg-slate-200" onClick={(e) => { e.stopPropagation(); setInspectedWidgetId(w.id); }}>
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label="Remove card" className="h-7 w-7 widget-action hover:bg-rose-100" onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}>
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className={`ciq-cq flex-1 p-3 md:p-4 ${editMode ? 'pt-2 pointer-events-none' : ''} min-h-0`}>
                          {renderWidgetContent(w)}
                        </div>
                      </div>
                    ))}
                  </MeasuredGrid>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {editMode && (
            <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-4 sticky top-4 self-start max-h-[calc(100dvh-7rem)] animate-in slide-in-from-right-8 duration-300">
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
                <WidgetLibraryContent onAdd={addWidget} />
              </Card>
            </aside>
          )}
        </div>
        {/* Phones & tablets: the + button is always available */}
        <WidgetLibraryMobile onAdd={(w) => { if (!editMode) setEditMode(true); addWidget(w); }} />
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
        .react-grid-placeholder { background: #0F766E !important; opacity: 0.12 !important; border-radius: 1rem !important; }
      `}</style>
    </AppLayout>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return <span className={`px-2 py-0.5 rounded-full font-bold ${className}`}>{children}</span>
}
