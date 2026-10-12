// Dashboard Builder: a design-tool canvas. Drag the dot grid to move around,
// drag cards to rearrange them, pull any corner to resize, and use the buttons
// on each card to edit, duplicate or delete it.
//
// Layouts are stored on a fine 48-column grid ("Free" moves in small steps).
// "Locked to grid" edits the same layout on the classic 12-column grid, where
// cards snap into rows and gaps close automatically.
import { getCardShellClasses } from "@/lib/card-shell";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { PanZoomCanvas } from "@/components/builder/PanZoomCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutTemplate, Trash2, Info, Plus, Settings2, Edit3, Copy, Download, Save, Eye, CheckCircle2, Lock, Move,
  MoreHorizontal, RotateCcw, Upload, Undo2, Redo2, Sparkles, Wand2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateGallery, buildTemplate } from "@/components/TemplateGallery";
import { ExportDrawer } from "@/components/ExportDrawer";
import { WidgetInspector } from "@/components/WidgetInspector";
import { WidgetLibraryContent, WidgetLibraryMobile, widgetCategories } from "@/components/WidgetLibrary";
import { WidgetRenderer } from "@/components/visualizations/WidgetRenderer";
import { useToast } from "@/hooks/use-toast";
import { buildSpecFromState, buildStateFromSpec, downloadSpecJson } from "@/lib/dashboard-spec";
import { Link, useLocation } from "wouter";
import {
  GRID_BREAKPOINTS, DESIGN_WIDTH, FINE, FINE_COLS, CLASSIC_COLS, FINE_ROW, GRID_PAD,
  defaultDashboard, classicToFine, fineToClassic, fineLayoutOf, snapToClassic,
} from "@/lib/dashboard-grid";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Item = { i: string; x: number; y: number; w: number; h: number };
type Snapshot = { layout: Item[]; widgets: any[] };

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString();
}

const clean = (l: any[]): Item[] => l.map(({ i, x, y, w, h }: any) => ({ i, x, y, w, h }));
const geometry = (l: Item[]) => JSON.stringify(l.map(({ i, x, y, w, h }) => [i, x, y, w, h]).sort());
const bottomOf = (l: Item[]) => l.reduce((m, it) => Math.max(m, it.y + it.h), 0);
const overlaps = (a: Item, b: Item) => a.i !== b.i && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** Push cards that overlap the moved card down below it (and so on), so nothing ends up on top of another card. */
function pushDown(layout: Item[], movedId: string): Item[] {
  const out = layout.map((l) => ({ ...l }));
  const queue = [movedId];
  let guard = 0;
  while (queue.length && guard++ < 500) {
    const m = out.find((l) => l.i === queue.shift());
    if (!m) continue;
    for (const o of out) if (overlaps(m, o)) { o.y = m.y + m.h; queue.push(o.i); }
  }
  return out;
}
const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const on = () => setCoarse(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return coarse;
}

export default function BuilderPage() {
  const { metrics, chartData, donutData, sector, dateRange, allMetrics } = useSectorData();
  const { ensureDashboardLoaded, saveDashboard } = useDashboardStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const coarse = useCoarsePointer();

  const [layout, setLayout] = useState<Item[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [inspectedWidgetId, setInspectedWidgetId] = useState<string | null>(null);
  // Touch screens: the card you last tapped shows its buttons and corner handles.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [arrange, setArrange] = useState<'locked' | 'free'>('locked');
  const savedAt = useDashboardStore((s) => s.dashboards[sector]?.savedAt);
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 30000); return () => clearInterval(id); }, []);

  // Undo / redo
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastPush = useRef(0);
  const [, setHistoryTick] = useState(0);

  // Grid columns at the current width; only the full-width grid writes the layout back.
  const lgCols = arrange === 'locked' ? CLASSIC_COLS.lg : FINE_COLS.lg;
  const colsRef = useRef<number>(lgCols);

  // Load from the store. Older dashboards (classic units) are converted once.
  useEffect(() => {
    setLoading(true);
    ensureDashboardLoaded(sector);
    const dash = useDashboardStore.getState().dashboards[sector];
    if (dash) {
      const mode = dash.arrange ?? 'locked';
      // Locked layouts always sit on whole classic cells.
      const fine = mode === 'locked' ? snapToClassic(clean(fineLayoutOf(dash))) : clean(fineLayoutOf(dash));
      setLayout(fine);
      setWidgets(dash.widgets);
      setArrange(dash.arrange ?? 'locked');
      if (dash.grid !== 'fine' || geometry(fine) !== geometry(clean(fineLayoutOf(dash)))) saveDashboard(sector, fine, dash.widgets, { grid: 'fine', arrange: mode });
    }
    past.current = []; future.current = [];
    setTimeout(() => setLoading(false), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  /** Apply and save a change. Edits within ~0.7s count as one undo step. */
  const commit = useCallback((nextLayout: Item[], nextWidgets: any[], opts: { history?: boolean } = {}) => {
    if (opts.history !== false) {
      const now = Date.now();
      if (now - lastPush.current > 700) {
        past.current = [...past.current.slice(-49), { layout, widgets }];
        future.current = [];
        setHistoryTick((t) => t + 1);
      }
      lastPush.current = now;
    }
    setLayout(nextLayout);
    setWidgets(nextWidgets);
    saveDashboard(sector, nextLayout, nextWidgets, { grid: 'fine', arrange });
  }, [layout, widgets, sector, arrange, saveDashboard]);

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ layout, widgets });
    setLayout(prev.layout); setWidgets(prev.widgets);
    saveDashboard(sector, prev.layout, prev.widgets, { grid: 'fine', arrange });
    lastPush.current = 0;
    setHistoryTick((t) => t + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ layout, widgets });
    setLayout(next.layout); setWidgets(next.widgets);
    saveDashboard(sector, next.layout, next.widgets, { grid: 'fine', arrange });
    lastPush.current = 0;
    setHistoryTick((t) => t + 1);
  };

  // The layout handed to the grid, in the units of the current mode.
  const gridLayout = useMemo(() => (arrange === 'locked' && editMode ? fineToClassic(layout) : layout), [layout, arrange, editMode]);
  const layouts = useMemo(() => ({ lg: gridLayout }), [gridLayout]);
  const editCols = arrange === 'locked' && editMode ? CLASSIC_COLS : FINE_COLS;
  const editRow = arrange === 'locked' && editMode ? FINE_ROW * FINE : FINE_ROW;

  const onLayoutChange = (newLayout: any[]) => {
    // Phone layouts are generated from the saved one and never written back.
    if (colsRef.current !== editCols.lg) return;
    const next = arrange === 'locked' && editMode ? classicToFine(clean(newLayout)) : clean(newLayout);
    if (geometry(next) === geometry(layout)) return;
    commit(next, widgets);
  };

  const setArrangeMode = (mode: 'locked' | 'free') => {
    if (mode === arrange) return;
    const next = mode === 'locked' ? snapToClassic(layout) : layout;
    setArrange(mode);
    if (geometry(next) !== geometry(layout)) {
      past.current = [...past.current.slice(-49), { layout, widgets }];
      setLayout(next);
    }
    saveDashboard(sector, next, widgets, { grid: 'fine', arrange: mode });
    if (mode === 'locked') toast({ title: "Locked to grid", description: "Cards snap to the 12-column grid and gaps close up." });
  };

  const saveNow = (finish: boolean) => {
    saveDashboard(sector, layout, widgets, { grid: 'fine', arrange });
    if (finish) setEditMode(false);
    toast({
      title: "Layout saved",
      description: "Your Dashboard now shows this exact layout.",
      action: <ToastAction altText="View dashboard" onClick={() => navigate("/dashboard")}>View dashboard</ToastAction>,
    });
  };

  // ---------------------------------------------------------------- card actions

  const addWidget = (widgetInfo: any) => {
    const id = `${widgetInfo.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const item: Item = { i: id, x: 0, y: bottomOf(layout), w: widgetInfo.w * FINE, h: widgetInfo.h * FINE };
    commit([...layout, item], [...widgets, { id, type: widgetInfo.id, metricIndex: Math.floor(Math.random() * 4), ...(widgetInfo.defaultProps || {}) }], { history: true });
    lastPush.current = 0;
    toast({ title: "Card added", description: `${widgetInfo.name} is at the bottom of the grid. Drag it into place.` });
  };

  const removeWidget = (id: string) => {
    const before = { layout, widgets };
    lastPush.current = 0;
    commit(layout.filter((l) => l.i !== id), widgets.filter((w) => w.id !== id));
    lastPush.current = 0;
    toast({
      title: "Card removed",
      action: <ToastAction altText="Undo" onClick={() => { setLayout(before.layout); setWidgets(before.widgets); saveDashboard(sector, before.layout, before.widgets, { grid: 'fine', arrange }); }}>Undo</ToastAction>,
    });
  };

  const duplicateWidget = (id: string) => {
    const src = widgets.find((w) => w.id === id);
    const item = layout.find((l) => l.i === id);
    if (!src || !item) return;
    const newId = `${src.type}-${Date.now()}`;
    lastPush.current = 0;
    commit([...layout, { ...item, i: newId, y: bottomOf(layout) }], [...widgets, { ...src, id: newId }]);
    lastPush.current = 0;
    toast({ title: "Card duplicated", description: "The copy is at the bottom of the grid." });
  };

  const updateWidget = (id: string, updates: any) => {
    commit(layout, widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const resetLayout = () => {
    const d = defaultDashboard();
    lastPush.current = 0;
    commit(clean(classicToFine(d.layout)), d.widgets);
    lastPush.current = 0;
    toast({ title: "Layout reset", description: "Back to the default cards. Undo brings your layout back." });
  };

  const applyTemplate = (templateId: string) => {
    const t = buildTemplate(templateId);
    lastPush.current = 0;
    commit(clean(classicToFine(t.layout)), t.widgets);
    lastPush.current = 0;
    toast({ title: "Template applied", description: "Rearrange anything with Edit layout. Undo brings your old layout back." });
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
            commit(clean(classicToFine(newLayouts.lg || [])), newWidgets);
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
    downloadSpecJson(buildSpecFromState("My Dashboard", sector, widgets, { lg: fineToClassic(layout) }));
    toast({ title: "Blueprint exported", description: "Your dashboard spec (JSON) has been downloaded." });
  };

  // ---------------------------------------------------------------- keyboard: undo / redo

  useEffect(() => {
    if (!editMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping() || inspectedWidgetId) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cardLabel = (w: any) => w?.title || w?.name || (w?.type === 'kpi' ? (metrics[w.metricIndex % (metrics.length || 1)]?.label ?? 'KPI') : w?.type) || 'Card';

  const btn = "rounded-xl shadow-sm font-semibold text-[13px] h-10 px-3.5 border-slate-200 bg-white";
  const seg = (on: boolean) => `h-8 px-3 rounded-lg text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors ${on ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-4 lg:pb-6 max-w-[1700px] mx-auto w-full flex flex-col gap-3 md:gap-4">
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard Builder</h1>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Arrange your KPI cards on the grid. Export it to Excel, Google Sheets or Power BI.</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500" data-testid="text-save-status" aria-live="polite">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {savedAt ? `Saved ${timeAgo(savedAt)} · changes save automatically` : "Changes save automatically"}
            </p>
          </div>

          {/* Actions wrap onto a second line instead of disappearing off-screen. */}
          <div className="toolbar" data-testid="builder-toolbar">
            {editMode ? (
              <>
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="How cards move">
                  {([
                    { id: 'locked', label: 'Locked to grid', icon: Lock, hint: 'Cards snap to the 12-column grid and gaps close automatically.' },
                    { id: 'free', label: 'Free', icon: Move, hint: 'Move and size cards in small steps; they stay exactly where you drop them.' },
                  ] as const).map((m) => (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>
                        <button role="radio" aria-checked={arrange === m.id} onClick={() => setArrangeMode(m.id)} className={seg(arrange === m.id)} data-testid={`arrange-${m.id}`}>
                          <m.icon className="w-3.5 h-3.5" /> {m.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{m.hint}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="inline-flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={undo} disabled={!past.current.length} className="h-10 w-10 rounded-xl border-slate-200 bg-white" aria-label="Undo" data-testid="button-undo"><Undo2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={redo} disabled={!future.current.length} className="h-10 w-10 rounded-xl border-slate-200 bg-white" aria-label="Redo" data-testid="button-redo"><Redo2 className="w-4 h-4" /></Button>
                </div>
                <Button variant="outline" onClick={resetLayout} className={btn}><RotateCcw className="w-4 h-4" /> Reset</Button>
                <Button variant="outline" onClick={() => setEditMode(false)} className={btn} data-testid="button-done-editing"><Settings2 className="w-4 h-4" /> Done</Button>
                <Button onClick={() => saveNow(true)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout"><Save className="w-4 h-4" /> Save layout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className={btn} onClick={() => setEditMode(true)} data-testid="button-edit-mode"><Edit3 className="w-4 h-4" /> Edit layout</Button>
                <Button onClick={() => saveNow(false)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout"><Save className="w-4 h-4" /> Save</Button>
                <ExportDrawer layout={fineToClassic(layout, true)} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />
                <Button variant="outline" className={btn} data-testid="button-view-dashboard" asChild>
                  <Link href="/dashboard"><Eye className="w-4 h-4" /> View dashboard</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={btn} data-testid="button-builder-more"><MoreHorizontal className="w-4 h-4" /> More</Button>
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
              {coarse
                ? "Drag a card to move it, pull any corner to resize. Drag the empty grid to move around; pinch to zoom."
                : "Drag a card to move it and pull any corner to resize. Drag the empty grid to move around; Ctrl + scroll zooms. Ctrl+Z undoes."}
            </p>
          )}
        </header>

        <div className="flex gap-6 items-start">
          <section
            aria-label="Dashboard grid"
            className="flex-1 min-w-0"
            onPointerDownCapture={(e) => {
              const t = e.target as HTMLElement;
              if (!t.closest('.react-grid-item') && !t.closest('.ciq-ui')) setActiveId(null);
            }}
          >
            {loading ? (
              <div className="h-80 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your dashboard…</span>
                </div>
              </div>
            ) : widgets.length === 0 ? (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <LayoutTemplate className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start your dashboard</h3>
                <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Pick a template, let the AI build one, or add cards yourself.</p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                  <Button size="lg" onClick={() => setTemplatesOpen(true)} className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest h-12"><LayoutTemplate className="w-4 h-4 mr-2" /> Templates</Button>
                  <Button size="lg" variant="outline" className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-12 border-slate-200" data-testid="button-generate-for-me" asChild>
                    <Link href="/generate" className="flex-1"><Sparkles className="w-4 h-4 mr-2" /> Generate for me</Link>
                  </Button>
                </div>
                <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200" onClick={() => { setEditMode(true); addWidget(widgetCategories[0].items[0]); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add a card
                </Button>
              </div>
            ) : (
              <PanZoomCanvas
                contentWidth={DESIGN_WIDTH}
                cellW={(DESIGN_WIDTH - GRID_PAD[0] * 2) / editCols.lg}
                cellH={editRow}
                pad={GRID_PAD}
                panFromCards={!editMode}
              >
                {(z) => (
                  <div className={cn("rounded-[22px] transition-colors", editMode ? "bg-white/50 ring-1 ring-slate-300/70 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]" : "bg-transparent")}>
                    <MeasuredGrid
                      key={editMode && arrange === 'locked' ? 'classic' : 'fine'}
                      className={cn("layout", editMode && "ciq-editing", coarse ? "ciq-touch" : "ciq-mouse")}
                      layouts={layouts}
                      cols={editCols}
                      breakpoints={GRID_BREAKPOINTS}
                      rowHeight={editRow}
                      margin={[0, 0]}
                      containerPadding={GRID_PAD}
                      onLayoutChange={onLayoutChange}
                      onBreakpointChange={(_bp, cols) => { colsRef.current = cols; }}
                      draggableHandle=".ciq-card-inset"
                      draggableCancel=".ciq-nodrag"
                      isDraggable={editMode}
                      isResizable={editMode}
                      resizeHandles={['se', 'sw', 'ne', 'nw']}
                      compactType={editMode && arrange === 'locked' ? 'vertical' : null}
                      designWidth={DESIGN_WIDTH}
                      canvasScale={z}
                      minCanvasHeight={editMode ? 600 : 0}
                    >
                      {widgets.map((w) => (
                        <div
                          key={w.id}
                          className={cn("group", activeId === w.id && "ciq-active")}
                          onPointerDown={() => { if (coarse && editMode) setActiveId(w.id); }}
                        >
                          {editMode && coarse && activeId === w.id && (
                            <CardActions
                              z={z}
                              placement={(layout.find((l) => l.i === w.id)?.y ?? 1) < 2 ? 'below' : 'above'}
                              label={cardLabel(w)}
                              onEdit={() => setInspectedWidgetId(w.id)}
                              onDuplicate={() => duplicateWidget(w.id)}
                              onDelete={() => { removeWidget(w.id); setActiveId(null); }}
                              id={w.id}
                            />
                          )}
                          <div
                            className={cn(
                              "ciq-card-inset flex flex-col overflow-hidden transition-shadow duration-200",
                              getCardShellClasses(w.cardPreset || w.stylePreset, 'builder'),
                              editMode ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/40" : "hover:shadow-md",
                            )}
                            onDoubleClick={() => { if (editMode) setInspectedWidgetId(w.id); }}
                            data-testid={`builder-card-${w.id}`}
                          >
                            {editMode && !coarse && (
                              <CardActions
                                z={z}
                                placement="inside"
                                label={cardLabel(w)}
                                onEdit={() => setInspectedWidgetId(w.id)}
                                onDuplicate={() => duplicateWidget(w.id)}
                                onDelete={() => removeWidget(w.id)}
                                id={w.id}
                              />
                            )}
                            <div className={cn("ciq-cq flex-1 p-3 md:p-4 min-h-0", editMode && "pointer-events-none")}>
                              <WidgetRenderer widget={w} data={{ metrics, chartData, donutData, allMetrics }} sector={sector} loading={loading} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </MeasuredGrid>
                  </div>
                )}
              </PanZoomCanvas>
            )}
          </section>

          {editMode && (
            <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-4 sticky top-4 self-start max-h-[calc(100dvh-7rem)] animate-in slide-in-from-right-8 duration-300">
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
                <WidgetLibraryContent onAdd={addWidget} />
              </Card>
            </aside>
          )}
        </div>

        {/* Phones & tablets: add a card (hidden while the selection bar is showing) */}
        <WidgetLibraryMobile onAdd={(w) => { if (!editMode) setEditMode(true); addWidget(w); }} />
      </div>

      <WidgetInspector
        widget={widgets.find((w) => w.id === inspectedWidgetId)}
        layoutItem={(() => { const l = layout.find((x) => x.i === inspectedWidgetId); return l ? fineToClassic([l])[0] : undefined; })()}
        open={!!inspectedWidgetId}
        onOpenChange={(open) => !open && setInspectedWidgetId(null)}
        onUpdate={updateWidget}
        onUpdateLayout={(id, updates) => {
          const u: any = {};
          for (const k of ['x', 'y', 'w', 'h'] as const) if (updates[k] != null) u[k] = updates[k] * FINE;
          commit(layout.map((l) => (l.i === id ? { ...l, ...u } : l)), widgets);
        }}
        onDelete={(id) => { removeWidget(id); setInspectedWidgetId(null); }}
        onDuplicate={(id) => { duplicateWidget(id); setInspectedWidgetId(null); }}
      />

      <style>{`
        .react-grid-placeholder { background: transparent !important; opacity: 1 !important; }
        .react-grid-placeholder::after { content: ''; position: absolute; inset: 8px; border-radius: 1rem; background: color-mix(in oklab, var(--color-teal-500) 14%, transparent); border: 2px dashed color-mix(in oklab, var(--color-teal-600) 55%, transparent); }
        /* Corner handles: round, sitting on the card's corners, finger-sized at any zoom. */
        .ciq-canvas .react-grid-item > .react-resizable-handle {
          width: calc(26px / var(--z)); height: calc(26px / var(--z));
          background: none !important; transform: none !important; z-index: 12; padding: 0;
        }
        .ciq-canvas .react-grid-item > .react-resizable-handle::after {
          content: ''; position: absolute; inset: 27%; width: auto; height: auto; transform: none;
          border-radius: 999px; background: #fff; border: calc(2px / var(--z)) solid var(--color-teal-600);
          box-shadow: 0 1px 4px rgba(15,23,42,.25); right: auto; bottom: auto;
        }
        .ciq-canvas .react-grid-item > .react-resizable-handle-se { right: calc(8px - 13px / var(--z)); bottom: calc(8px - 13px / var(--z)); cursor: nwse-resize; }
        .ciq-canvas .react-grid-item > .react-resizable-handle-sw { left: calc(8px - 13px / var(--z)); bottom: calc(8px - 13px / var(--z)); cursor: nesw-resize; }
        .ciq-canvas .react-grid-item > .react-resizable-handle-ne { right: calc(8px - 13px / var(--z)); top: calc(8px - 13px / var(--z)); cursor: nesw-resize; }
        .ciq-canvas .react-grid-item > .react-resizable-handle-nw { left: calc(8px - 13px / var(--z)); top: calc(8px - 13px / var(--z)); cursor: nwse-resize; }
        .ciq-mouse .react-grid-item:not(:hover):not(.react-draggable-dragging):not(.resizing) > .react-resizable-handle { opacity: 0; }
        .ciq-touch .react-grid-item:not(.ciq-active) > .react-resizable-handle { display: none; }
        .react-grid-item.ciq-active { z-index: 4; }
        .ciq-touch .react-grid-item.ciq-active > .ciq-card-inset { box-shadow: 0 0 0 calc(2px / var(--z)) var(--color-teal-500); }
        .ciq-canvas .react-grid-item > .react-resizable-handle { transition: opacity .15s; }
      `}</style>
    </AppLayout>
  );
}

/**
 * Edit / duplicate / delete on the card itself. Counter-scaled so the buttons stay
 * finger-sized at any zoom. With a mouse they sit inside the card's top-right
 * corner (shown on hover); on touch screens they float just above the card you
 * tapped, so they never cover a small card.
 */
function CardActions({ z, placement, label, onEdit, onDuplicate, onDelete, id }: {
  z: number; placement: 'inside' | 'above' | 'below'; label: string; onEdit: () => void; onDuplicate: () => void; onDelete: () => void; id: string;
}) {
  const b = "w-10 h-10 rounded-lg inline-flex items-center justify-center transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-primary";
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const k = Math.min(4, 1 / z);
  return (
    <div
      className={cn(
        "ciq-nodrag absolute z-20 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 p-0.5 shadow-lg backdrop-blur transition-opacity",
        placement === 'inside'
          ? "right-3 top-3 origin-top-right opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          : placement === 'above'
            ? "right-2 bottom-[calc(100%-4px)] origin-bottom-right animate-in fade-in zoom-in-95 duration-150"
            : "right-2 top-[calc(100%-4px)] origin-top-right animate-in fade-in zoom-in-95 duration-150",
      )}
      style={{ transform: `scale(${k})` }}
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      role="toolbar"
      aria-label={`${label} card actions`}
    >
      <button type="button" className={cn(b, "text-slate-600 hover:bg-slate-100")} aria-label={`Edit ${label}`} title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} data-testid={`card-edit-${id}`}><Edit3 className="w-4 h-4" /></button>
      <button type="button" className={cn(b, "text-slate-600 hover:bg-slate-100")} aria-label={`Duplicate ${label}`} title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} data-testid={`card-duplicate-${id}`}><Copy className="w-4 h-4" /></button>
      <button type="button" className={cn(b, "text-rose-600 hover:bg-rose-50")} aria-label={`Delete ${label}`} title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} data-testid={`card-delete-${id}`}><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}
