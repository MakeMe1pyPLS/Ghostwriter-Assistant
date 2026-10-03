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
    let x = 0, y = 0, rowH = 0;
    out[bp] = order.map((item): GridItem => {
      // Scale width to the new column count, then snap to halves/full rows on small grids.
      let w = Math.max(1, Math.round((item.w / lgCols) * C));
      if (C <= 6) w = item.w / lgCols <= 0.34 ? Math.max(1, Math.floor(C / 2)) : C;
      w = Math.min(w, C);
      if (x + w > C) { x = 0; y += rowH; rowH = 0; }
      const placed = { ...item, x, y, w, minW: Math.min(item.minW ?? 1, w), maxW: undefined };
      x += w; rowH = Math.max(rowH, item.h);
      return placed;
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
  const [width, setWidth] = React.useState<number>(1200);

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
        setWidth((prev: number) => (prev !== next ? next : prev));
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

  return (
    <div ref={ref} className={className} style={{ width: "100%" }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={fullLayouts}
        breakpoints={breakpoints}
        cols={colMap}
        rowHeight={rowHeight}
        width={width}
        margin={margin}
        containerPadding={margin}
        onLayoutChange={(l, all) => onLayoutChange?.(l as any, all as any)}
        onBreakpointChange={onBreakpointChange}
        // @ts-ignore - react-grid-layout types don't correctly extend base props
        preventCollision={false}
        compactType={compactType}
        useCSSTransforms={true}
        draggableHandle={draggableHandle}
        isDraggable={isDraggable}
        isResizable={isResizable}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
}
