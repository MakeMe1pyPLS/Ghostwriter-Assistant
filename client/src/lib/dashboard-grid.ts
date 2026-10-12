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

// ---------------------------------------------------------------- fine grid
// Saved layouts use a fine grid: 48 columns and 24px rows, so cards can be
// placed freely. "Locked to grid" mode edits the same layout on the classic
// 12-column grid (4 fine units per column/row), so both modes line up exactly.
// Cards have no margin in the grid; each card is inset by INSET px instead,
// which keeps the gaps identical in both modes.
export const FINE = 4;
export const FINE_COLS = { lg: 48, md: 8, sm: 8, xs: 8, xxs: 4 } as const;
export const CLASSIC_COLS = { lg: 12, md: 2, sm: 2, xs: 2, xxs: 1 } as const;
export const FINE_ROW = 24;
export const CARD_INSET = 8;
export const GRID_PAD: [number, number] = [8, 8];

type Item = { i: string; x: number; y: number; w: number; h: number; [k: string]: any };

/** Classic (12-column) layout → fine layout. */
export function classicToFine(layout: Item[]): Item[] {
  return layout.map((l) => ({ ...l, x: l.x * FINE, y: l.y * FINE, w: l.w * FINE, h: l.h * FINE, minW: undefined, minH: undefined, maxW: undefined, maxH: undefined }));
}
/** Fine layout → classic 12-column units. exact=true keeps fractions (for exporters). */
export function fineToClassic(layout: Item[], exact = false): Item[] {
  const r = (n: number) => (exact ? n / FINE : Math.round(n / FINE));
  return layout.map((l) => ({ ...l, x: r(l.x), y: r(l.y), w: Math.max(exact ? 0.25 : 1, r(l.w)), h: Math.max(exact ? 0.25 : 1, r(l.h)) }));
}
/** The saved layout in fine units, whichever format it was stored in. */
export function fineLayoutOf(d?: { layout: any[]; grid?: 'fine' } | null): Item[] {
  if (!d) return [];
  return d.grid === 'fine' ? d.layout : classicToFine(d.layout);
}
/** Snap a fine layout to whole classic cells (used when switching to Locked). */
export function snapToClassic(layout: Item[]): Item[] {
  const s = (n: number) => Math.round(n / FINE) * FINE;
  return layout.map((l) => ({ ...l, x: s(l.x), y: s(l.y), w: Math.max(FINE, s(l.w)), h: Math.max(FINE, s(l.h)) }));
}

export interface DashboardData {
  layout: any[];
  /** "fine" when layout is in fine-grid units; missing means classic 12-column units. */
  grid?: 'fine';
  widgets: any[];
  /** When the layout was last saved (ms). */
  savedAt?: number;
  /** Builder arrange mode: "locked" packs cards into rows; "free" keeps them where dropped. */
  arrange?: 'locked' | 'free';
}

/** Width of the desktop canvas used to edit the full layout on narrow screens. */
export const DESIGN_WIDTH = 1280;

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
