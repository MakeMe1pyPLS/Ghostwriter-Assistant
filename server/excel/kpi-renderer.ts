import type ExcelJS from 'exceljs';
import { ExcelTheme } from './theme-mapper';
import { CellRange } from './layout-engine';

export function renderKpiCard(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  widget: any,
  metric: any,
  theme: ExcelTheme
) {
  if (!metric) {
    renderPlaceholder(ws, range, widget.id, theme);
    return;
  }

  const { startCol, startRow, endCol, endRow } = range;

  ws.mergeCells(startRow, startCol, endRow, endCol);

  const topLeft = ws.getCell(startRow, startCol);

  const trendIsPositive = metric.isPositive;
  const trendSymbol = trendIsPositive ? '▲' : '▼';
  const trendColor = trendIsPositive ? theme.positiveTrend : theme.negativeTrend;

  topLeft.value = {
    richText: [
      {
        text: `${metric.label}\n`,
        font: { name: theme.fontFamily, size: 9, color: { argb: theme.textLight }, bold: true }
      },
      {
        text: `${metric.value}\n`,
        font: { name: theme.fontFamily, size: 22, color: { argb: theme.textDark }, bold: true }
      },
      {
        text: `${trendSymbol} ${metric.trend}`,
        font: { name: theme.fontFamily, size: 10, color: { argb: trendColor }, bold: true }
      }
    ]
  };

  topLeft.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  topLeft.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: theme.cardBg }
  };

  topLeft.border = {
    top: { style: 'thin', color: { argb: theme.cardBorder } },
    left: { style: 'thin', color: { argb: theme.cardBorder } },
    bottom: { style: 'medium', color: { argb: theme.primary } },
    right: { style: 'thin', color: { argb: theme.cardBorder } }
  };
}

function renderPlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  widgetId: string,
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  ws.mergeCells(startRow, startCol, endRow, endCol);
  const cell = ws.getCell(startRow, startCol);
  cell.value = `[Widget: ${widgetId}]`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textLight }, italic: true };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  cell.border = {
    top: { style: 'thin', color: { argb: theme.cardBorder } },
    left: { style: 'thin', color: { argb: theme.cardBorder } },
    bottom: { style: 'thin', color: { argb: theme.cardBorder } },
    right: { style: 'thin', color: { argb: theme.cardBorder } }
  };
}