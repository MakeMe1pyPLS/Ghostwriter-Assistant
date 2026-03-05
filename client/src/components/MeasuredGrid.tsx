import React from "react";
import GridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";

type Props = {
  layout: Layout[];
  cols?: number;
  rowHeight?: number;
  onLayoutChange?: (layout: Layout[]) => void;
  children: React.ReactNode;
  className?: string;
};

export default function MeasuredGrid({
  layout,
  cols = 12,
  rowHeight = 32,
  onLayoutChange,
  children,
  className,
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(1200);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    // Initial
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) setWidth(Math.floor(rect.width));

    // ResizeObserver
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (w > 0) setWidth(Math.floor(w));
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: "100%" }}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        margin={[12, 12]}
        containerPadding={[12, 12]}
        isResizable
        isDraggable
        draggableHandle=".drag-handle"
        onLayoutChange={(l) => onLayoutChange?.(l)}
        // makes dragging smoother
        useCSSTransforms
        compactType={null}
        preventCollision={false}
      >
        {children}
      </GridLayout>
    </div>
  );
}
