// A design-tool style canvas: an endless dot grid you can drag around (mouse or
// finger), scroll/trackpad to pan, Ctrl/⌘ + scroll or pinch to zoom. The
// content (the dashboard page) is rendered at a fixed width and transformed.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus, Maximize, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanvasView { x: number; y: number; z: number }

const MIN_Z = 0.2;
const MAX_Z = 2;
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z));

export function PanZoomCanvas({
  contentWidth,
  cellW,
  cellH,
  pad,
  panFromCards,
  children,
  className,
  overlay,
}: {
  contentWidth: number;
  /** Grid cell size in content pixels (for the dots). */
  cellW: number;
  cellH: number;
  pad: [number, number];
  /** Allow panning when the drag starts on a card (view mode). */
  panFromCards: boolean;
  children: (z: number) => React.ReactNode;
  className?: string;
  /** Extra floating UI rendered inside the viewport (not transformed). */
  overlay?: React.ReactNode;
}) {
  const vpRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<CanvasView>({ x: 16, y: 16, z: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [height, setHeight] = useState(560);
  const [panning, setPanning] = useState(false);
  const fitted = useRef(false);
  // The "drag to move around" hint fades after the first move (or a few seconds).
  const [hint, setHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHint(false), 7000); return () => clearTimeout(t); }, []);

  // Fill the screen below the canvas's top edge (above the phone tab bar).
  const measure = useCallback(() => {
    const el = vpRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const bottomBar = window.innerWidth < 1024 ? 64 + 12 : 24;
    const main = el.closest('main');
    const scrollTop = main ? main.scrollTop : 0;
    setHeight(Math.max(380, Math.round(window.innerHeight - (top + scrollTop) - bottomBar)));
  }, []);

  const fit = useCallback(() => {
    const el = vpRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    const z = clampZ(Math.min(1.1, (vw - 24) / contentWidth));
    setView({ x: Math.round((vw - contentWidth * z) / 2), y: 12, z });
  }, [contentWidth]);

  useLayoutEffect(() => {
    measure();
    if (!fitted.current) { fit(); fitted.current = true; }
    const ro = new ResizeObserver(() => measure());
    if (vpRef.current) ro.observe(vpRef.current);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => { ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, [measure, fit]);

  // Refit when the available width changes a lot (e.g. the widget library opens).
  const lastW = useRef(0);
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (lastW.current && Math.abs(w - lastW.current) > 120) fit();
      lastW.current = w;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const z = clampZ(v.z * factor);
      const k = z / v.z;
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  // Wheel: pan; Ctrl/⌘ + wheel (and trackpad pinch, which sends ctrlKey): zoom at the pointer.
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setHint(false);
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Drag empty space to pan; two fingers pinch to zoom.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; vx: number; vy: number; dist?: number; z?: number; mx?: number; my?: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.ciq-ui')) return;
    const onCard = !!target.closest('.react-grid-item');
    if (onCard && !panFromCards && pointers.current.size === 0) return; // the card is being dragged
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const v = viewRef.current;
    setHint(false);
    if (pointers.current.size === 1) {
      gesture.current = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
      setPanning(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = vpRef.current!.getBoundingClientRect();
      gesture.current = { x: 0, y: 0, vx: v.x, vy: v.y, dist: Math.hypot(a.x - b.x, a.y - b.y), z: v.z, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size >= 2 && g.dist) {
      const [a, b] = [...pointers.current.values()];
      const z = clampZ(g.z! * Math.hypot(a.x - b.x, a.y - b.y) / g.dist);
      const k = z / g.z!;
      setView({ z, x: g.mx! - (g.mx! - g.vx) * k, y: g.my! - (g.my! - g.vy) * k });
    } else {
      setView((v) => ({ ...v, x: g.vx + (e.clientX - g.x), y: g.vy + (e.clientY - g.y) }));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) { gesture.current = null; setPanning(false); }
    else if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      const v = viewRef.current;
      gesture.current = { x: p.x, y: p.y, vx: v.x, vy: v.y };
    }
  };

  const center = () => {
    const el = vpRef.current!;
    return { cx: el.clientWidth / 2, cy: el.clientHeight / 2 };
  };

  // Endless dots, aligned with the grid cells and moving with the view.
  const bw = cellW * view.z, bh = cellH * view.z;
  const dots: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, var(--ciq-dot) 1.2px, transparent 1.45px)',
    backgroundSize: `${bw}px ${bh}px`,
    backgroundPosition: `${view.x + pad[0] * view.z}px ${view.y + pad[1] * view.z}px`,
  };

  return (
    <div
      ref={vpRef}
      className={cn("ciq-canvas relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 select-none", panning ? "cursor-grabbing" : "cursor-grab", className)}
      style={{ height, touchAction: 'none', ...dots }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      data-testid="builder-canvas"
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ width: contentWidth, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.z})`, ['--z' as any]: view.z }}
      >
        {children(view.z)}
      </div>

      {overlay}

      {/* Zoom controls */}
      <div className="ciq-ui absolute left-3 bottom-3 z-20 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-1 shadow-lg cursor-default" role="group" aria-label="Zoom">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100" aria-label="Zoom out" onClick={() => { const { cx, cy } = center(); zoomAt(1 / 1.2, cx, cy); }}><Minus className="w-4 h-4" /></button>
        <span className="w-12 text-center text-[12px] font-bold tabular-nums text-slate-700" aria-live="polite" data-testid="canvas-zoom">{Math.round(view.z * 100)}%</span>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100" aria-label="Zoom in" onClick={() => { const { cx, cy } = center(); zoomAt(1.2, cx, cy); }}><Plus className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-slate-200 mx-0.5" aria-hidden />
        <button className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-100" aria-label="Fit to screen" onClick={fit} data-testid="canvas-fit"><Maximize className="w-3.5 h-3.5" /> Fit</button>
      </div>
      <div aria-hidden={!hint} className={cn("ciq-ui pointer-events-none absolute right-3 top-3 z-20 hidden sm:flex items-center transition-opacity duration-500", hint ? "opacity-100" : "opacity-0")} data-hint={hint ? 'on' : 'off'}><div className="flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur px-2 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200">
        <Hand className="w-3.5 h-3.5" /> Drag the grid to move around · {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + scroll to zoom
      </div></div>
    </div>
  );
}
