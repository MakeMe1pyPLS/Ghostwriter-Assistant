import React from "react";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import type { Layout } from "react-grid-layout";

type Layouts = { [P: string]: Layout[] };

type Props = {
  layouts?: any;
  layout?: any[];
  breakpoints?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  cols?: { lg: number; md: number; sm: number; xs: number; xxs: number } | number;
  rowHeight?: number;
  onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
  onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
  children: React.ReactNode;
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  draggableHandle?: string;
  margin?: [number, number];
  compactType?: 'horizontal' | 'vertical' | null;
};

/**
 * Builds tidy layouts for narrower breakpoints from the desktop (lg) layout.
 * Without this, react-grid-layout clamps desktop positions into fewer columns
 * and, with compaction off, widgets end up staggered with gaps on tablets and
 * phones. Widgets keep their reading order (top-to-bottom, left-to-right).
 */
type GridItem = { i: string; x: number; y: number; w: number; h: number; minW?: number; maxW?: number; [k: string]: unknown };
type GridLayouts = Record<string, GridItem[]>;

export function deriveLayouts(lg: GridItem[], cols: Record<string, number>, provided: GridLayouts = {}): GridLayouts {
  const lgCols = cols.lg || 12;
  const order = [...lg].sort((a, b) => a.y - b.y || a.x - b.x);
  const out: GridLayouts = { lg, ...provided };
  for (const bp of Object.keys(cols)) {
    if (bp === 'lg' || (provided[bp] && provided[bp].length === lg.length)) continue;
    const C = cols[bp];
    if (C > 6) {
      // Wide grids (laptops): keep rows intact by scaling edges proportionally.
      out[bp] = lg.map((item): GridItem => {
        const x0 = Math.round((item.x / lgCols) * C);
        const x1 = Math.max(x0 + 1, Math.round(((item.x + item.w) / lgCols) * C));
        return { ...item, x: x0, w: Math.min(x1, C) - x0, minW: 1, maxW: undefined };
      });
      continue;
    }
    // Phones: first-fit packing in reading order, so a half-width card never
    // leaves a hole next to it when a full-width card follows.
    const filled: boolean[][] = [];
    const free = (x: number, y: number, w: number, h: number) => {
      for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (filled[r]?.[c]) return false;
      return true;
    };
    const mark = (x: number, y: number, w: number, h: number) => {
      for (let r = y; r < y + h; r++) { filled[r] ??= []; for (let c = x; c < x + w; c++) filled[r][c] = true; }
    };
    out[bp] = order.map((item): GridItem => {
      let w = item.w / lgCols <= 0.34 ? Math.max(1, Math.floor(C / 2)) : C;
      w = Math.min(w, C);
      // Half-width cards on phones need one more row so their content isn't clipped.
      const h = C <= 4 && w < C ? item.h + 1 : item.h;
      let y = 0, x = 0;
      search: for (;; y++) for (x = 0; x + w <= C; x++) if (free(x, y, w, h)) break search;
      mark(x, y, w, h);
      return { ...item, x, y, w, h, minW: Math.min(item.minW ?? 1, w), maxW: undefined };
    });
  }
  return out;
}

export default function MeasuredGrid({
  layouts,
  layout,
  breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight = 32,
  onLayoutChange,
  onBreakpointChange,
  children,
  className,
  isDraggable = true,
  isResizable = true,
  draggableHandle = ".drag-handle",
  margin = [12, 12],
  compactType = null,
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  // null until measured, so the grid never renders (or reports) a wrong breakpoint first.
  const [width, setWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    // Initial
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) setWidth(Math.floor(rect.width));

    // ResizeObserver — defer to the next animation frame and coalesce
    // bursts so the synchronous observe→setState→layout→observe cycle can't
    // re-enter (which React flags as "Maximum update depth exceeded"). The
    // equality guard makes React bail out when the measured width is stable.
    let frame = 0;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (w <= 0) return;
      const next = Math.floor(w);
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setWidth((prev) => (prev !== next ? next : prev));
      });
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  const colMap = typeof cols === 'number' ? { lg: cols, md: cols, sm: cols, xs: cols, xxs: cols } : cols;
  const lgLayout: GridItem[] | undefined = layouts?.lg ?? layout;
  const fullLayouts = React.useMemo(
    () => (lgLayout ? deriveLayouts(lgLayout, colMap, layouts ?? {}) : layouts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lgLayout, layouts, JSON.stringify(colMap)],
  );

  // Current breakpoint, computed the same way react-grid-layout does. Reported to
  // the parent *before* any layout change, including the very first one on mount
  // (RGL itself only reports breakpoint *changes*).
  const currentBp = React.useMemo(() => {
    if (width === null) return null;
    const sorted = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
    return (sorted.find(([, min]) => width >= min) ?? sorted[sorted.length - 1])[0];
  }, [width, breakpoints]);
  const reportedBp = React.useRef<string | null>(null);
  const reportBp = (bp: string | null) => {
    if (!bp || reportedBp.current === bp) return;
    reportedBp.current = bp;
    onBreakpointChange?.(bp, (colMap as any)[bp]);
  };

  return (
    <div ref={ref} className={className} style={{ width: "100%" }}>
      {width !== null && <ResponsiveGridLayout
        className="layout"
        layouts={fullLayouts}
        breakpoints={breakpoints}
        cols={colMap}
        // Phone-width grids use slightly shorter rows; half-width cards get one
        // extra row there (see deriveLayouts), so they fit without wasted space.
        rowHeight={currentBp && (colMap as any)[currentBp] <= 4 ? Math.round(rowHeight * 0.75) : rowHeight}
        width={width}
        margin={margin}
        containerPadding={margin}
        onLayoutChange={(l, all) => { reportBp(currentBp); onLayoutChange?.(l as any, all as any); }}
        onBreakpointChange={(bp) => reportBp(bp)}
        // @ts-ignore - react-grid-layout types don't correctly extend base props
        preventCollision={false}
        compactType={compactType}
        useCSSTransforms={true}
        draggableHandle={draggableHandle}
        isDraggable={isDraggable}
        isResizable={isResizable}
      >
        {children}
      </ResponsiveGridLayout>}
    </div>
  );
}
