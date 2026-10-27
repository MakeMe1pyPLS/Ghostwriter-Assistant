// Dashboard Builder: a design-tool canvas. Drag the dot grid to move around,
// drag cards to rearrange them, pull any corner to resize, and use the buttons
// on each card to edit, duplicate or delete it.
//
// Layouts are stored on a fine 48-column grid ("Free" moves in small steps).
// "Locked to grid" edits the same layout on the classic 12-column grid, where
// cards snap into rows and gaps close automatically.
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { getCardShellClasses } from "@/lib/card-shell";
import { AppLayout, openAppNav } from "@/components/layout/AppLayout";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MeasuredGrid from "@/components/MeasuredGrid";
import { PanZoomCanvas } from "@/components/builder/PanZoomCanvas";
import { useDragMotion, animatePop } from "@/components/builder/drag-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutTemplate, Trash2, Plus, Edit3, Copy, Download, Save, Eye, CheckCircle2, Lock, Move,
  MoreHorizontal, RotateCcw, Upload, Undo2, Redo2, Sparkles, Wand2, Menu, X, Grid3x3, PanelRightClose, PanelRightOpen, Check,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
type GridStep = 1 | 2 | 4;
const GRID_STEP_KEY = "ciq_grid_step";
const GRID_SIZES: { step: GridStep; label: string; short: string; desc: string }[] = [
  { step: 1, label: "Fine", short: "S", desc: "48 columns · smallest steps, most freedom" },
  { step: 2, label: "Medium", short: "M", desc: "24 columns · a balance of free and tidy" },
  { step: 4, label: "Large", short: "L", desc: "12 columns · big, even steps" },
];
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
/** First free spot for a w×h card, scanning rows top to bottom (fine units, 48 columns). */
function firstFreeSpot(l: Item[], w: number, h: number, cols = FINE_COLS.lg): { x: number; y: number } {
  const hit = (x: number, y: number) => l.some((o) => x < o.x + o.w && o.x < x + w && y < o.y + o.h && o.y < y + h);
  const limit = bottomOf(l) + 1;
  for (let y = 0; y <= limit; y++) for (let x = 0; x + w <= cols; x++) if (!hit(x, y)) return { x, y };
  return { x: 0, y: bottomOf(l) };
}
/** Pack cards upward and leftward in reading order, keeping their sizes (removes gaps). */
function tidy(l: Item[], cols = FINE_COLS.lg): Item[] {
  const placed: Item[] = [];
  for (const it of [...l].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const w = Math.min(it.w, cols);
    const { x, y } = firstFreeSpot(placed, w, it.h, cols);
    placed.push({ ...it, x, y, w });
  }
  return placed;
}
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
  // Motion: cards swing while dragged, settle on drop, pop in when added.
  const canvasRef = useRef<HTMLElement | null>(null);
  const dragMotion = useDragMotion(canvasRef);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  useEffect(() => {
    if (!editMode) return;
    setEntering(true);
    const t = window.setTimeout(() => setEntering(false), 900);
    return () => window.clearTimeout(t);
  }, [editMode]);
  useEffect(() => {
    if (!freshId) return;
    // The grid places new cards a frame or two after the state update, so wait for it.
    let frames = 0, raf = 0;
    const find = () => {
      const el = canvasRef.current?.querySelector(`[data-testid="builder-card-${CSS.escape(freshId)}"]`);
      if (el) {
        el.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
        animatePop(el);
        setFreshId(null);
      } else if (frames++ < 30) {
        raf = requestAnimationFrame(find);
      } else {
        setFreshId(null);
      }
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [freshId]);
  const [inspectedWidgetId, setInspectedWidgetId] = useState<string | null>(null);
  // Touch screens: the card you last tapped shows its buttons and corner handles.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [arrange, setArrange] = useState<'locked' | 'free'>('locked');
  // Free mode: how big a grid cell is (in 48-column "fine" steps). Remembered per browser.
  const [gridStep, setGridStepState] = useState<GridStep>(() => {
    try { const v = Number(localStorage.getItem(GRID_STEP_KEY)); return (v === 2 || v === 4) ? v : 1; } catch { return 1; }
  });
  const [libraryOpen, setLibraryOpen] = useState(true);
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

  // The grid shows the layout in its own units: 1 cell = `step` fine units.
  // Locked uses the classic 12-column grid; Free uses the chosen grid size.
  const step: number = !editMode ? 1 : arrange === 'locked' ? FINE : gridStep;
  const gridLayout = useMemo(() => (step === 1 ? layout : layout.map((it) => ({
    ...it, x: Math.round(it.x / step), y: Math.round(it.y / step), w: Math.max(1, Math.round(it.w / step)), h: Math.max(1, Math.round(it.h / step)),
  }))), [layout, step]);
  const layouts = useMemo(() => ({ lg: gridLayout }), [gridLayout]);
  const editCols = useMemo(() => (step === 1 ? FINE_COLS : { ...FINE_COLS, lg: FINE_COLS.lg / step }), [step]);
  const editRow = FINE_ROW * step;

  const onLayoutChange = (newLayout: any[]) => {
    // Phone layouts are generated from the saved one and never written back.
    if (colsRef.current !== editCols.lg) return;
    const incoming = new Map(clean(newLayout).map((g) => [g.i, g]));
    const before = new Map(gridLayout.map((g) => [g.i, g]));
    // Only cards that actually moved or resized change; the rest keep their exact place.
    const next = layout.map((it) => {
      const g = incoming.get(it.i), b = before.get(it.i);
      if (!g || !b || (g.x === b.x && g.y === b.y && g.w === b.w && g.h === b.h)) return it;
      return { i: it.i, x: g.x * step, y: g.y * step, w: g.w * step, h: g.h * step };
    });
    if (geometry(next) === geometry(layout)) return;
    commit(next, widgets);
  };

  const setGridStep = (v: GridStep) => {
    setGridStepState(v);
    try { localStorage.setItem(GRID_STEP_KEY, String(v)); } catch { /* private mode */ }
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
    toast(mode === 'locked'
      ? { title: "Locked to grid", description: "Cards snap to the 12-column grid and gaps close up." }
      : { title: "Free layout", description: "Cards stay exactly where you drop them. Pick a grid size for how fine they snap." });
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
    const w = Math.min(FINE_COLS.lg, widgetInfo.w * FINE), h = widgetInfo.h * FINE;
    const spot = firstFreeSpot(layout, w, h);
    const item: Item = { i: id, x: spot.x, y: spot.y, w, h };
    commit([...layout, item], [...widgets, { id, type: widgetInfo.id, metricIndex: Math.floor(Math.random() * 4), ...(widgetInfo.defaultProps || {}) }], { history: true });
    lastPush.current = 0;
    setFreshId(id);
    toast({ title: "Card added", description: `${widgetInfo.name} went into the first free space. Drag it anywhere.` });
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
    const spot = firstFreeSpot(layout, item.w, item.h);
    commit([...layout, { ...item, i: newId, ...spot }], [...widgets, { ...src, id: newId }]);
    lastPush.current = 0;
    setFreshId(newId);
    toast({ title: "Card duplicated", description: "The copy went into the first free space." });
  };

  const updateWidget = (id: string, updates: any) => {
    commit(layout, widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const tidyLayout = () => {
    lastPush.current = 0;
    commit(tidy(layout), widgets);
    lastPush.current = 0;
    toast({ title: "Tidied up", description: "Gaps closed and cards packed together. Undo puts them back." });
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
      if (e.key === 'Escape' && !templatesOpen) { setActiveId(null); setEditMode(false); return; }
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cardLabel = (w: any) => w?.title || w?.name || (w?.type === 'kpi' ? (metrics[w.metricIndex % (metrics.length || 1)]?.label ?? 'KPI') : w?.type) || 'Card';

  const iconBtn = "h-10 w-10 shrink-0 rounded-xl inline-flex items-center justify-center text-slate-600 hover:bg-slate-900/[0.06] hover:text-slate-900 disabled:opacity-35 disabled:pointer-events-none transition-colors pointer-coarse:h-11 pointer-coarse:w-11";
  const pill = "h-10 px-3.5 rounded-xl inline-flex items-center gap-2 text-[13px] font-semibold transition-colors shrink-0 pointer-coarse:h-11";
  const seg = (on: boolean) => `h-8 px-3 rounded-lg text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap pointer-coarse:h-9 ${on ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`;
  const finishEditing = () => { setActiveId(null); saveNow(true); };

  const arrangeSwitch = (where: 'bar' | 'row') => (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm shrink-0" role="radiogroup" aria-label="How cards move">
      {([
        { id: 'locked', label: 'Locked', icon: Lock, hint: 'Cards snap to the 12-column grid and gaps close automatically.' },
        { id: 'free', label: 'Free', icon: Move, hint: 'Cards stay exactly where you drop them. No gaps are closed.' },
      ] as const).map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <button role="radio" aria-checked={arrange === m.id} onClick={() => setArrangeMode(m.id)} className={seg(arrange === m.id)} data-testid={where === 'bar' ? `arrange-${m.id}` : `arrange-${m.id}-row`}>
              <m.icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          </TooltipTrigger>
          <TooltipContent>{m.hint}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );

  const gridSizeMenu = (where: 'bar' | 'row') => (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(pill, "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50", arrange === 'locked' && "opacity-50")}
              disabled={arrange === 'locked'}
              data-testid={where === 'bar' ? "button-grid-size" : "button-grid-size-row"}
            >
              <Grid3x3 className="w-4 h-4" /> <span className="hidden sm:inline text-slate-500">Grid:</span> {GRID_SIZES.find((g) => g.step === gridStep)?.label}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{arrange === 'locked' ? 'Locked uses the 12-column grid. Switch to Free to choose a grid size.' : 'How finely cards snap when you move or resize them'}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-64 rounded-xl">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-slate-500">Grid size</DropdownMenuLabel>
        {GRID_SIZES.map((g) => (
          <DropdownMenuItem key={g.step} onSelect={() => setGridStep(g.step)} className="gap-3 py-2" data-testid={`grid-size-${g.step}-${where}`}>
            <span className="w-4 shrink-0">{gridStep === g.step && <Check className="w-4 h-4 text-primary" />}</span>
            <span className="flex flex-col">
              <span className="font-semibold text-slate-900">{g.label}</span>
              <span className="text-[12px] text-slate-500">{g.desc}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const moreMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={iconBtn} aria-label="More actions" data-testid="button-builder-more"><MoreHorizontal className="w-5 h-5" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuItem onSelect={() => setTemplatesOpen(true)} className="gap-2" data-testid="menu-templates"><LayoutTemplate className="w-4 h-4" /> Templates</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/generate')} className="gap-2"><Sparkles className="w-4 h-4 text-primary" /> Generate with AI</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/enhance')} className="gap-2"><Wand2 className="w-4 h-4 text-indigo-600" /> Enhance a dashboard</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/dashboard')} className="gap-2 sm:hidden"><Eye className="w-4 h-4" /> View dashboard</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => saveNow(false)} className="gap-2" data-testid="button-save-layout"><Save className="w-4 h-4" /> Save now</DropdownMenuItem>
        <DropdownMenuItem onSelect={tidyLayout} className="gap-2" data-testid="menu-tidy"><Sparkles className="w-4 h-4 text-teal-700" /> Tidy up (close gaps)</DropdownMenuItem>
        <DropdownMenuItem onSelect={resetLayout} className="gap-2"><RotateCcw className="w-4 h-4" /> Reset to default cards</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={importSpec} className="gap-2"><Upload className="w-4 h-4" /> Import spec (JSON)</DropdownMenuItem>
        <DropdownMenuItem onSelect={exportSpec} className="gap-2"><Download className="w-4 h-4" /> Export spec (JSON)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <AppLayout fullscreen>
      <div className="h-full flex flex-col">
        {/* Toolbar: the Builder owns the whole screen; the menu button opens the app navigation. */}
        <header className="shrink-0 z-30 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-14 pointer-coarse:h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl" data-testid="builder-toolbar">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={iconBtn} onClick={openAppNav} aria-label="Open menu" data-testid="button-open-nav"><Menu className="w-5 h-5" /></button>
            </TooltipTrigger>
            <TooltipContent>Menu</TooltipContent>
          </Tooltip>
          <div className="min-w-0 mr-auto pl-1">
            <h1 className="text-[15px] font-black tracking-tight text-slate-900 leading-tight truncate">
              {editMode ? <>Editing<span className="hidden sm:inline"> layout</span></> : <>Builder<span className="hidden sm:inline"> · your dashboard</span></>}
            </h1>
            <p className="text-[11.5px] font-semibold text-slate-500 truncate inline-flex items-center gap-1 max-w-full" data-testid="text-save-status" aria-live="polite">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{savedAt ? `Saved ${timeAgo(savedAt)}` : "Saves automatically"}</span>
            </p>
          </div>

          {editMode ? (
            <>
              <div className="hidden md:flex items-center gap-2">{arrangeSwitch('bar')}{arrange === 'free' && gridSizeMenu('bar')}</div>
              <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" aria-hidden />
              <button className={iconBtn} onClick={undo} disabled={!past.current.length} aria-label="Undo" data-testid="button-undo"><Undo2 className="w-[18px] h-[18px]" /></button>
              <button className={iconBtn} onClick={redo} disabled={!future.current.length} aria-label="Redo" data-testid="button-redo"><Redo2 className="w-[18px] h-[18px]" /></button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={cn(iconBtn, "hidden lg:inline-flex", libraryOpen && "bg-slate-900/[0.06] text-slate-900")} onClick={() => setLibraryOpen((o) => !o)} aria-label={libraryOpen ? "Hide card library" : "Show card library"} aria-pressed={libraryOpen}>
                    {libraryOpen ? <PanelRightClose className="w-[18px] h-[18px]" /> : <PanelRightOpen className="w-[18px] h-[18px]" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{libraryOpen ? "Hide card library" : "Show card library"}</TooltipContent>
              </Tooltip>
              {moreMenu}
              <button onClick={finishEditing} className={cn(pill, "ml-1 bg-slate-900 text-white hover:bg-slate-800 shadow-sm pl-2.5 pr-3 sm:pl-3 sm:pr-4")} data-testid="button-done-editing" aria-label="Done editing">
                <X className="w-4 h-4" /> Done
              </button>
            </>
          ) : (
            <>
              <div className="hidden sm:block">
                <ExportDrawer layout={fineToClassic(layout, true)} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />
              </div>
              <Link href="/dashboard" className={cn(pill, "hidden sm:inline-flex text-slate-700 hover:bg-slate-900/[0.06]")} data-testid="button-view-dashboard"><Eye className="w-4 h-4" /> View</Link>
              {moreMenu}
              <button onClick={() => setEditMode(true)} className={cn(pill, "ml-1 bg-primary text-white hover:brightness-110 shadow-sm")} data-testid="button-edit-mode">
                <Edit3 className="w-4 h-4" /> <span>Edit<span className="hidden sm:inline"> layout</span></span>
              </button>
            </>
          )}
        </header>

        {/* Phones and small tablets: the layout controls get their own row while editing. */}
        {editMode && (
          <div className="md:hidden shrink-0 z-20 flex items-center gap-2 px-2 py-2 border-b border-slate-200/70 bg-white/80 backdrop-blur overflow-x-auto no-scrollbar-on-mobile" data-testid="builder-edit-controls">
            {arrangeSwitch('row')}
            {arrange === 'free' && gridSizeMenu('row')}
          </div>
        )}
        {!editMode && !loading && widgets.length > 0 && (
          <div className="sm:hidden shrink-0 px-2 py-2 border-b border-slate-200/70 bg-white/80 flex items-center gap-2 overflow-x-auto no-scrollbar-on-mobile">
            <ExportDrawer layout={fineToClassic(layout, true)} widgets={widgets} sector={sector} dateRange={dateRange} metrics={metrics} chartData={chartData} donutData={donutData} allMetrics={allMetrics} />
            <Link href="/dashboard" className={cn(pill, "border border-slate-200 bg-white text-slate-700 shadow-sm")}><Eye className="w-4 h-4" /> View dashboard</Link>
          </div>
        )}
        <TemplateGallery onSelect={applyTemplate} open={templatesOpen} onOpenChange={setTemplatesOpen} hideTrigger />

        <div className="relative flex-1 min-h-0 flex">
          <section
            aria-label="Dashboard grid"
            ref={canvasRef}
            className={cn("relative flex-1 min-w-0", (loading || widgets.length === 0) && "overflow-y-auto", entering && "ciq-enter")}
            onPointerDownCapture={(e) => {
              const t = e.target as HTMLElement;
              if (!t.closest('.react-grid-item') && !t.closest('.ciq-ui')) setActiveId(null);
            }}
          >
            {loading ? (
              <div className="p-4 md:p-6"><DashboardSkeleton /></div>
            ) : widgets.length === 0 ? (
              <div className="min-h-full flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <LayoutTemplate className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start your dashboard</h3>
                <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Pick a template, let the AI build one, or add cards yourself.</p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                  <Button size="lg" onClick={() => setTemplatesOpen(true)} className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest h-12"><LayoutTemplate className="w-4 h-4 mr-2" /> Templates</Button>
                  <Button size="lg" variant="outline" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest h-12 border-slate-200" data-testid="button-generate-for-me" asChild>
                    <Link href="/generate"><Sparkles className="w-4 h-4 mr-2" /> Generate for me</Link>
                  </Button>
                </div>
                <Button size="lg" variant="outline" className="rounded-xl font-bold shadow-sm mt-4 border-slate-200" onClick={() => { setEditMode(true); addWidget(widgetCategories[0].items[0]); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add a card
                </Button>
              </div>
            ) : (
              <PanZoomCanvas
                fill
                insetTop={56}
                insetX={coarse ? 12 : 24}
                className={cn("rounded-none border-0", editMode ? "ciq-canvas-edit" : "")}
                contentWidth={DESIGN_WIDTH}
                cellW={(DESIGN_WIDTH - GRID_PAD[0] * 2) / editCols.lg}
                cellH={editRow}
                pad={GRID_PAD}
                panFromCards={!editMode}
                hintText={editMode
                  ? (coarse ? "Drag cards · pull a corner to resize · drag the grid" : "Drag cards to move · pull any corner to resize · drag the grid to look around")
                  : (coarse ? "Drag to look around · pinch to zoom" : undefined)}
              >
                {(z) => (
                  <div className={cn("rounded-[22px] transition-[background-color,box-shadow] duration-300", editMode ? "bg-white/40 ring-1 ring-slate-300/60 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] dark:bg-white/[0.03] dark:ring-white/10" : "bg-transparent")}>
                    <MeasuredGrid
                      key={`g${step}`}
                      className={cn("layout", editMode && "ciq-editing", coarse ? "ciq-touch" : "ciq-mouse")}
                      layouts={layouts}
                      cols={editCols}
                      breakpoints={GRID_BREAKPOINTS}
                      rowHeight={editRow}
                      margin={[0, 0]}
                      containerPadding={GRID_PAD}
                      onLayoutChange={onLayoutChange}
                      onBreakpointChange={(_bp, cols) => { colsRef.current = cols; }}
                      onDragStart={dragMotion.onDragStart}
                      onDragStop={dragMotion.onDragStop}
                      onResizeStop={dragMotion.onResizeStop}
                      draggableHandle=".ciq-card-inset"
                      draggableCancel=".ciq-nodrag"
                      isDraggable={editMode}
                      isResizable={editMode}
                      resizeHandles={['se', 'sw', 'ne', 'nw']}
                      compactType={editMode && arrange === 'locked' ? 'vertical' : null}
                      designWidth={DESIGN_WIDTH}
                      canvasScale={z}
                      minCanvasHeight={editMode ? 900 : 0}
                    >
                      {widgets.map((w, wi) => (
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
                              "ciq-card-inset flex flex-col overflow-hidden",
                              getCardShellClasses(w.cardPreset || w.stylePreset, 'builder'),
                              editMode ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/40" : "hover:shadow-md",
                            )}
                            style={{ ["--i" as any]: Math.min(wi, 14) }}
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

          {/* Desktop card library, docked on the right while editing (hide it for more room). */}
          {editMode && libraryOpen && (
            <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-slate-200/80 bg-white animate-in slide-in-from-right-6 fade-in duration-200" aria-label="Card library">
              <WidgetLibraryContent onAdd={addWidget} />
            </aside>
          )}
        </div>

        {/* Phones & tablets: add a card. */}
        <WidgetLibraryMobile
          className="bottom-[calc(1rem+env(safe-area-inset-bottom))]"
          onAdd={(w) => { if (!editMode) setEditMode(true); addWidget(w); }}
        />
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
        /* ---- Motion (drag-motion.ts adds the swing; everything here is CSS) ---- */
        /* Cards glide, with a little bounce, when they make room for each other. */
        .ciq-canvas .react-grid-item { transition: transform 340ms cubic-bezier(0.34, 1.32, 0.64, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1), height 220ms cubic-bezier(0.22, 1, 0.36, 1); }
        .ciq-canvas .react-grid-item.react-draggable-dragging, .ciq-canvas .react-grid-item.resizing { transition: none; z-index: 20; }
        .ciq-canvas .react-grid-item > .ciq-card-inset {
          transition: scale 320ms cubic-bezier(0.34, 1.56, 0.64, 1), rotate 320ms cubic-bezier(0.34, 1.56, 0.64, 1), translate 320ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 260ms ease, opacity 220ms ease;
        }
        .ciq-editing .react-grid-item:hover > .ciq-card-inset { translate: 0 -2px; }
        /* Pick up: spring up with a slight overshoot and a deeper shadow. The tilt is set from JS. */
        .ciq-canvas .react-grid-item.react-draggable-dragging > .ciq-card-inset {
          scale: 1.045; translate: 0 -6px;
          transition: scale 300ms cubic-bezier(0.34, 1.7, 0.64, 1), translate 300ms cubic-bezier(0.34, 1.7, 0.64, 1), box-shadow 220ms ease;
          box-shadow: 0 46px 90px -30px rgba(15,23,42,.55), 0 14px 28px -14px rgba(15,23,42,.28), 0 0 0 2px var(--color-teal-500);
          cursor: grabbing;
        }
        /* While one card moves, the others step back a touch. */
        .ciq-dragging .react-grid-item:not(.react-draggable-dragging) > .ciq-card-inset { opacity: .82; scale: .985; }
        .ciq-canvas .react-grid-item.resizing > .ciq-card-inset { box-shadow: 0 0 0 2px var(--color-teal-500), 0 18px 40px -16px rgba(15,23,42,.35); }
        /* Drop target: springs to each new spot. */
        .ciq-canvas .react-grid-placeholder { transition: transform 200ms cubic-bezier(0.34, 1.4, 0.64, 1), width 200ms ease, height 200ms ease !important; }
        .ciq-canvas .react-grid-placeholder::after { animation: ciq-target-in 260ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes ciq-target-in { from { opacity: 0; scale: .9; } to { opacity: 1; scale: 1; } }
        /* Entering edit mode: every card breathes once, one after another. */
        .ciq-enter .react-grid-item > .ciq-card-inset { animation: ciq-breathe 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(var(--i, 0) * 35ms); }
        @keyframes ciq-breathe { 0% { scale: 1; } 40% { scale: .97; } 75% { scale: 1.012; } 100% { scale: 1; } }
        /* Handles grow a little under the pointer. */
        .ciq-canvas .react-grid-item > .react-resizable-handle::after { transition: scale 180ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .ciq-canvas .react-grid-item > .react-resizable-handle:hover::after, .ciq-canvas .react-grid-item > .react-resizable-handle:active::after { scale: 1.35; }
        .ciq-canvas-edit { --ciq-dot: color-mix(in oklab, var(--color-teal-600) 45%, transparent); }
        .ciq-dragging .ciq-canvas-edit, .ciq-dragging { --ciq-dot: color-mix(in oklab, var(--color-teal-600) 75%, transparent); }
        @media (prefers-reduced-motion: reduce) {
          .ciq-canvas .react-grid-item, .ciq-canvas .react-grid-item > .ciq-card-inset, .ciq-canvas .react-grid-placeholder { transition: none !important; }
          .ciq-canvas .react-grid-item > .ciq-card-inset, .ciq-canvas .react-grid-placeholder::after { animation: none !important; }
          .ciq-canvas .react-grid-item.react-draggable-dragging > .ciq-card-inset { scale: 1; translate: none; rotate: none; }
          .ciq-dragging .react-grid-item:not(.react-draggable-dragging) > .ciq-card-inset { scale: 1; }
        }
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
