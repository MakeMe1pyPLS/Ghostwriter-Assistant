// Single source of truth for dashboard grid geometry.
// Both the Builder (editable) and the Dashboard (read-only presentation) consume
// these constants so a widget renders in the exact same place and size on both
// pages, across every breakpoint.

// One 12-column layout is used whenever the grid is at least 540px wide
// (tablets, laptops, desktops — including the Builder while the widget library
// panel is open). What you arrange in the Builder is exactly what the Dashboard
// shows. Only phone-width grids get an automatically stacked version.
export const GRID_COLS = { lg: 12, md: 6, sm: 6, xs: 4, xxs: 2 } as const;
export const GRID_BREAKPOINTS = { lg: 540, md: 480, sm: 420, xs: 320, xxs: 0 } as const;
/** Breakpoints where the saved layout is shown and can be edited as-is. */
export const EDITABLE_COLS = 12;
export const GRID_ROW_HEIGHT = 80;
export const GRID_MARGIN: [number, number] = [16, 16];

export interface DashboardData {
  layout: any[];
  widgets: any[];
  /** When the layout was last saved (ms). */
  savedAt?: number;
  /** Builder arrange mode: "locked" packs cards into rows; "free" keeps them where dropped. */
  arrange?: 'locked' | 'free';
}

/** Width of the desktop canvas used to edit the full layout on narrow screens. */
export const DESIGN_WIDTH = 1024;

// Canonical default dashboard used when a sector has no saved configuration.
// Shared by the Builder reset action and the migration fallback so both pages
// start from an identical baseline.
export const DEFAULT_LAYOUT = [
  { i: 'kpi-0', x: 0, y: 0, w: 3, h: 2 },
  { i: 'kpi-1', x: 3, y: 0, w: 3, h: 2 },
  { i: 'kpi-2', x: 6, y: 0, w: 3, h: 2 },
  { i: 'kpi-3', x: 9, y: 0, w: 3, h: 2 },
  { i: 'trend-1', x: 0, y: 2, w: 8, h: 5 },
  { i: 'insights-1', x: 8, y: 2, w: 4, h: 5 },
];

export const DEFAULT_WIDGETS = [
  { id: 'kpi-0', type: 'kpi', metricIndex: 0 },
  { id: 'kpi-1', type: 'kpi', metricIndex: 1 },
  { id: 'kpi-2', type: 'kpi', metricIndex: 2 },
  { id: 'kpi-3', type: 'kpi', metricIndex: 3 },
  { id: 'trend-1', type: 'trend' },
  { id: 'insights-1', type: 'insights' },
];

export function defaultDashboard(): DashboardData {
  return {
    layout: DEFAULT_LAYOUT.map((l) => ({ ...l })),
    widgets: DEFAULT_WIDGETS.map((w) => ({ ...w })),
  };
}
