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
        setWidth((prev) => (prev !== next ? next : prev));
      });
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: "100%" }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={typeof cols === 'number' ? { lg: cols, md: cols, sm: cols, xs: cols, xxs: cols } : cols}
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
