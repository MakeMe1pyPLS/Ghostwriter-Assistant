export interface CellRange {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export interface WidgetPlacement {
  widgetId: string;
  type: string;
  range: CellRange;
}

const COL_MULTIPLIER = 2;
const ROW_MULTIPLIER = 5;
const START_ROW = 7;
const START_COL = 2;

export function computeWidgetPlacements(widgets: any[], layouts: any): WidgetPlacement[] {
  const lgLayout = layouts?.lg || [];

  if (lgLayout.length === 0) {
    return fallbackPlacement(widgets);
  }

  const placements: WidgetPlacement[] = [];

  for (const widget of widgets) {
    const layoutItem = lgLayout.find((l: any) => l.i === widget.id);
    if (!layoutItem) continue;

    const startCol = START_COL + (layoutItem.x * COL_MULTIPLIER);
    const startRow = START_ROW + (layoutItem.y * ROW_MULTIPLIER);
    const endCol = startCol + (layoutItem.w * COL_MULTIPLIER) - 1;
    const endRow = startRow + (layoutItem.h * ROW_MULTIPLIER) - 1;

    placements.push({
      widgetId: widget.id,
      type: widget.chartType || widget.type,
      range: { startCol, startRow, endCol, endRow }
    });
  }

  return placements;
}

function fallbackPlacement(widgets: any[]): WidgetPlacement[] {
  const placements: WidgetPlacement[] = [];
  let currentRow = START_ROW;

  const kpis = widgets.filter(w => w.type === 'kpi');
  const charts = widgets.filter(w => ['trend', 'bar', 'donut', 'pie', 'line', 'area'].includes(w.type) || ['trend', 'bar', 'donut', 'pie', 'line', 'area'].includes(w.chartType));
  const tables = widgets.filter(w => w.type === 'table');
  const others = widgets.filter(w => !kpis.includes(w) && !charts.includes(w) && !tables.includes(w));

  const kpiWidth = 6;
  const kpiHeight = 5;
  let col = START_COL;
  for (const kpi of kpis) {
    placements.push({
      widgetId: kpi.id,
      type: 'kpi',
      range: { startCol: col, startRow: currentRow, endCol: col + kpiWidth - 1, endRow: currentRow + kpiHeight - 1 }
    });
    col += kpiWidth;
    if (col >= START_COL + 24) {
      col = START_COL;
      currentRow += kpiHeight + 2;
    }
  }
  if (kpis.length > 0) currentRow += kpiHeight + 3;

  for (const chart of charts) {
    placements.push({
      widgetId: chart.id,
      type: chart.chartType || chart.type,
      range: { startCol: START_COL, startRow: currentRow, endCol: START_COL + 23, endRow: currentRow + 17 }
    });
    currentRow += 20;
  }

  for (const table of tables) {
    placements.push({
      widgetId: table.id,
      type: 'table',
      range: { startCol: START_COL, startRow: currentRow, endCol: START_COL + 23, endRow: currentRow + 14 }
    });
    currentRow += 17;
  }

  for (const other of others) {
    placements.push({
      widgetId: other.id,
      type: other.chartType || other.type,
      range: { startCol: START_COL, startRow: currentRow, endCol: START_COL + 11, endRow: currentRow + 7 }
    });
    currentRow += 10;
  }

  return placements;
}