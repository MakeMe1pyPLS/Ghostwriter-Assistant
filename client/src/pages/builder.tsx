// Dashboard Builder: the page is a dot-grid canvas. In edit mode you can tap a
// card to select it, drag it anywhere, resize it from the corner, and use the
// selection bar (or the keyboard) to nudge, resize, duplicate or delete it.
//
// Layouts are stored on a fine 48-column grid ("Free" mode moves in small
// steps). "Locked to grid" edits the same layout on the classic 12-column
// grid, where cards snap into rows and gaps close automatically.
import { getCardShellClasses } from "@/lib/card-shell";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutTemplate, Trash2, Info, Plus, Settings2, Edit3, Copy, Download, Save, Eye, CheckCircle2, Lock, Move,
  MoreHorizontal, RotateCcw, Upload, Undo2, Redo2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, X, Sparkles, Wand2,
  MoveHorizontal, MoveVertical, Minus,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectedWidgetId, setInspectedWidgetId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [arrange, setArrange] = useState<'locked' | 'free'>('locked');
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
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

  // Width of the canvas, to switch to the scaled desktop canvas on narrow screens.
  const canvasRef = useRef<HTMLElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = canvasWidth < GRID_BREAKPOINTS.lg + 8;
  const designMode = editMode && narrow;

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
    setSelectedId(null);
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
    if (finish) { setEditMode(false); setSelectedId(null); }
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
    setSelectedId(id);
    toast({ title: "Card added", description: `${widgetInfo.name} is at the bottom of the grid. Drag it into place.` });
  };

  const removeWidget = (id: string) => {
    const before = { layout, widgets };
    lastPush.current = 0;
    commit(layout.filter((l) => l.i !== id), widgets.filter((w) => w.id !== id));
    lastPush.current = 0;
    if (selectedId === id) setSelectedId(null);
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
    setSelectedId(newId);
    toast({ title: "Card duplicated", description: "The copy is at the bottom of the grid." });
  };

  const step = arrange === 'locked' ? FINE : 1;
  const minSize = arrange === 'locked' ? FINE : 2;
  const nudge = (id: string, dx: number, dy: number) => {
    commit(pushDown(layout.map((l) => l.i !== id ? l : {
      ...l,
      x: Math.min(FINE_COLS.lg - l.w, Math.max(0, l.x + dx * step)),
      y: Math.max(0, l.y + dy * step),
    }), id), widgets);
  };
  const resize = (id: string, dw: number, dh: number) => {
    commit(pushDown(layout.map((l) => l.i !== id ? l : {
      ...l,
      w: Math.min(FINE_COLS.lg - l.x, Math.max(minSize, l.w + dw * step)),
      h: Math.max(minSize, l.h + dh * step),
    }), id), widgets);
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

  // ---------------------------------------------------------------- keyboard

  useEffect(() => {
    if (!editMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping() || inspectedWidgetId) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (!selectedId) return;
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key]) {
        e.preventDefault();
        const [dx, dy] = arrows[e.key];
        e.shiftKey ? resize(selectedId, dx, dy) : nudge(selectedId, dx, dy);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); removeWidget(selectedId);
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault(); duplicateWidget(selectedId);
      } else if (e.key === 'Enter') {
        e.preventDefault(); setInspectedWidgetId(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectedWidget = widgets.find((w) => w.id === selectedId);
  const selectedItem = layout.find((l) => l.i === selectedId);
  const cardLabel = (w: any) => w?.title || w?.name || (w?.type === 'kpi' ? (metrics[w.metricIndex % (metrics.length || 1)]?.label ?? 'KPI') : w?.type) || 'Card';

  const btn = "rounded-xl shadow-sm font-semibold text-[13px] h-10 px-3.5 border-slate-200 bg-white";
  const seg = (on: boolean) => `h-8 px-3 rounded-lg text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors ${on ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <AppLayout>
      <div className={cn("p-4 md:p-6 lg:p-8 lg:pb-10 max-w-[1600px] mx-auto w-full flex flex-col gap-4 md:gap-5", editMode && selectedId ? "pb-56" : "pb-28")}>
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard Builder</h1>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Arrange your KPI cards on the grid. Export it to Excel, Google Sheets or Power BI.</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500" data-testid="text-save-status" aria-live="polite">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
                {narrow && (
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="Zoom">
                    {([['fit', 'Fit'], [0.6, '60%'], [1, '100%']] as const).map(([z, label]) => (
                      <button key={label} role="radio" aria-checked={zoom === z} onClick={() => setZoom(z)} className={seg(zoom === z)}>{label}</button>
                    ))}
                  </div>
                )}
                <div className="inline-flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={undo} disabled={!past.current.length} className="h-10 w-10 rounded-xl border-slate-200 bg-white" aria-label="Undo" data-testid="button-undo"><Undo2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={redo} disabled={!future.current.length} className="h-10 w-10 rounded-xl border-slate-200 bg-white" aria-label="Redo" data-testid="button-redo"><Redo2 className="w-4 h-4" /></Button>
                </div>
                <Button variant="outline" onClick={resetLayout} className={btn}><RotateCcw className="w-4 h-4" /> Reset</Button>
                <Button variant="outline" onClick={() => { setEditMode(false); setSelectedId(null); }} className={btn} data-testid="button-done-editing"><Settings2 className="w-4 h-4" /> Done</Button>
                <Button onClick={() => saveNow(true)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout"><Save className="w-4 h-4" /> Save layout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className={btn} onClick={() => setEditMode(true)} data-testid="button-edit-mode"><Edit3 className="w-4 h-4" /> Edit layout</Button>
                <Button onClick={() => saveNow(false)} className="rounded-xl shadow-sm font-semibold text-[13px] h-10 px-4" data-testid="button-save-layout"><Save className="w-4 h-4" /> Save</Button>
                <ExportDrawer layout={fineToClassic(layout, true)} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />
                <Link href="/dashboard">
                  <Button variant="outline" className={btn} data-testid="button-view-dashboard"><Eye className="w-4 h-4" /> View dashboard</Button>
                </Link>
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
                ? "Tap a card to select it, then drag it or use the bar at the bottom to move, resize, edit or remove it."
                : "Click a card to select it. Drag to move, pull the corner to resize. Arrow keys nudge, Shift + arrows resize, Delete removes, Ctrl+Z undoes."}
            </p>
          )}
        </header>

        <div className="flex gap-6 items-start">
          <section
            ref={canvasRef}
            aria-label="Dashboard grid"
            className={cn("flex-1 min-w-0 rounded-2xl border transition-colors", editMode ? "bg-white/60 border-slate-200 shadow-inner" : "bg-transparent border-transparent")}
            onClick={(e) => { if (editMode && !(e.target as HTMLElement).closest('.react-grid-item')) setSelectedId(null); }}
          >
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
                    <Button size="lg" onClick={() => setTemplatesOpen(true)} className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest h-12"><LayoutTemplate className="w-4 h-4 mr-2" /> Templates</Button>
                    <Link href="/generate" className="flex-1">
                      <Button size="lg" variant="outline" className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-12 border-slate-200" data-testid="button-generate-for-me"><Sparkles className="w-4 h-4 mr-2" /> Generate for me</Button>
                    </Link>
                  </div>
                  <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200" onClick={() => { setEditMode(true); addWidget(widgetCategories[0].items[0]); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add a card
                  </Button>
                </div>
              ) : (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <MeasuredGrid
                    key={`${designMode ? 'design' : 'fluid'}-${editMode && arrange === 'locked' ? 'classic' : 'fine'}`}
                    className={cn("layout", editMode && "ciq-editing", coarse && "ciq-touch")}
                    layouts={layouts}
                    cols={editCols}
                    breakpoints={GRID_BREAKPOINTS}
                    rowHeight={editRow}
                    margin={[0, 0]}
                    containerPadding={GRID_PAD}
                    onLayoutChange={onLayoutChange}
                    onBreakpointChange={(_bp, cols) => { colsRef.current = cols; }}
                    // Mouse: drag any card. Touch: only the selected card, so swiping still scrolls the page.
                    draggableHandle={coarse ? '.ciq-selected' : '.ciq-card-inset'}
                    draggableCancel=".ciq-nodrag"
                    isDraggable={editMode}
                    isResizable={editMode}
                    compactType={editMode && arrange === 'locked' ? 'vertical' : null}
                    designWidth={designMode ? DESIGN_WIDTH : undefined}
                    zoom={zoom}
                    showDots
                    minCanvasHeight={editMode ? 520 : 0}
                  >
                    {widgets.map((w) => {
                      const selected = editMode && selectedId === w.id;
                      return (
                        <div key={w.id} className={cn("group", selected && "ciq-sel z-20")}>
                          {selected && (
                            <span className="absolute left-5 -top-2 z-30 max-w-[80%] truncate rounded-md bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow pointer-events-none">
                              {cardLabel(w)}
                            </span>
                          )}
                          <div
                            className={cn(
                              "ciq-card-inset flex flex-col overflow-hidden transition-shadow duration-200",
                              getCardShellClasses(w.cardPreset || w.stylePreset, 'builder'),
                              editMode && "cursor-grab active:cursor-grabbing",
                              selected ? "ciq-selected ring-[3px] ring-primary shadow-xl" : editMode ? "hover:ring-2 hover:ring-primary/40" : "hover:shadow-md",
                            )}
                            onClick={(e) => { if (!editMode) return; e.stopPropagation(); setSelectedId(w.id); }}
                            onDoubleClick={() => { if (editMode) setInspectedWidgetId(w.id); }}
                            data-testid={`builder-card-${w.id}`}
                          >
                            <div className={cn("ciq-cq flex-1 p-3 md:p-4 min-h-0", editMode && "pointer-events-none")}>
                              <WidgetRenderer widget={w} data={{ metrics, chartData, donutData, allMetrics }} sector={sector} loading={loading} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

        {/* Phones & tablets: add a card (hidden while the selection bar is showing) */}
        {!(editMode && selectedId) && <WidgetLibraryMobile onAdd={(w) => { if (!editMode) setEditMode(true); addWidget(w); }} />}
      </div>

      {/* Selection bar: everything you can do to the selected card, with big touch targets. */}
      <AnimatePresence>
        {editMode && selectedWidget && selectedItem && (
          <motion.div
            key="selbar"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}
            className="fixed z-[56] left-2 right-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto"
            role="toolbar" aria-label={`Selected card: ${cardLabel(selectedWidget)}`} data-testid="selection-bar"
          >
            <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.45)] p-2 flex flex-col lg:flex-row lg:items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="px-2 text-[12px] font-black text-slate-900 truncate max-w-[9rem] lg:max-w-[12rem]">{cardLabel(selectedWidget)}</span>
                <span className="text-[11px] font-semibold text-slate-400 tabular-nums mr-auto lg:mr-1">
                  {arrange === 'locked' ? `${Math.round(selectedItem.w / FINE)}×${Math.round(selectedItem.h / FINE)}` : `${selectedItem.w}×${selectedItem.h}`}
                </span>
                <BarButton label="Edit" onClick={() => setInspectedWidgetId(selectedWidget.id)} testId="sel-edit"><Edit3 className="w-4 h-4" /></BarButton>
                <BarButton label="Duplicate" onClick={() => duplicateWidget(selectedWidget.id)} testId="sel-duplicate"><Copy className="w-4 h-4" /></BarButton>
                <BarButton label="Delete" onClick={() => removeWidget(selectedWidget.id)} danger testId="sel-delete"><Trash2 className="w-4 h-4" /></BarButton>
                <BarButton label="Deselect" onClick={() => setSelectedId(null)} testId="sel-close"><X className="w-4 h-4" /></BarButton>
              </div>
              <div className="flex items-center gap-1 justify-between lg:justify-start lg:border-l lg:border-slate-200 lg:pl-2">
                <div className="flex items-center gap-1" aria-label="Move">
                  <BarButton label="Move left" onClick={() => nudge(selectedWidget.id, -1, 0)} testId="sel-left"><ArrowLeft className="w-4 h-4" /></BarButton>
                  <BarButton label="Move up" onClick={() => nudge(selectedWidget.id, 0, -1)} testId="sel-up"><ArrowUp className="w-4 h-4" /></BarButton>
                  <BarButton label="Move down" onClick={() => nudge(selectedWidget.id, 0, 1)} testId="sel-down"><ArrowDown className="w-4 h-4" /></BarButton>
                  <BarButton label="Move right" onClick={() => nudge(selectedWidget.id, 1, 0)} testId="sel-right"><ArrowRight className="w-4 h-4" /></BarButton>
                </div>
                <div className="w-px h-6 bg-slate-200 mx-0.5" aria-hidden />
                <div className="flex items-center gap-1" aria-label="Size">
                  <BarButton label="Narrower" onClick={() => resize(selectedWidget.id, -1, 0)} testId="sel-narrower"><MoveHorizontal className="w-4 h-4" /><Minus className="w-3 h-3 -ml-1" /></BarButton>
                  <BarButton label="Wider" onClick={() => resize(selectedWidget.id, 1, 0)} testId="sel-wider"><MoveHorizontal className="w-4 h-4" /><Plus className="w-3 h-3 -ml-1" /></BarButton>
                  <BarButton label="Shorter" onClick={() => resize(selectedWidget.id, 0, -1)} testId="sel-shorter"><MoveVertical className="w-4 h-4" /><Minus className="w-3 h-3 -ml-1" /></BarButton>
                  <BarButton label="Taller" onClick={() => resize(selectedWidget.id, 0, 1)} testId="sel-taller"><MoveVertical className="w-4 h-4" /><Plus className="w-3 h-3 -ml-1" /></BarButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        .react-grid-item > .react-resizable-handle { z-index: 5; }
        .layout:not(.ciq-editing) .react-resizable-handle { display: none; }
        .ciq-touch .react-grid-item:not(.ciq-sel) > .react-resizable-handle { display: none; }
        .react-grid-item > .react-resizable-handle { right: 8px; bottom: 8px; }
      `}</style>
    </AppLayout>
  );
}

function BarButton({ label, onClick, children, danger, testId }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; testId?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={label}
          data-testid={testId}
          className={cn(
            "ciq-nodrag h-10 min-w-10 px-2 rounded-xl inline-flex items-center justify-center transition-colors active:scale-95",
            danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
