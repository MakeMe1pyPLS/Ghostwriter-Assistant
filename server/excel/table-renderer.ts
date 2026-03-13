import type ExcelJS from 'exceljs';
import { ExcelTheme } from './theme-mapper';
import { CellRange } from './layout-engine';

export function renderTable(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  widget: any,
  metrics: any[],
  theme: ExcelTheme
) {
  if (!metrics || metrics.length === 0) {
    renderTablePlaceholder(ws, range, theme);
    return;
  }

  const { startCol, startRow, endCol } = range;

  const titleRow = startRow;
  ws.mergeCells(titleRow, startCol, titleRow, endCol);
  const titleCell = ws.getCell(titleRow, startCol);
  titleCell.value = widget.title || 'Data Table';
  titleCell.font = { name: theme.fontFamily, size: 11, bold: true, color: { argb: theme.textDark } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

  const headerRow = startRow + 1;
  const headers = ['Metric', 'Value', 'Trend', 'Status'];
  headers.forEach((header, i) => {
    const cell = ws.getCell(headerRow, startCol + i);
    cell.value = header;
    cell.font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: theme.cardBorder } }
    };
  });

  metrics.forEach((metric, i) => {
    const row = headerRow + 1 + i;
    const isEven = i % 2 === 0;

    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const labelCell = ws.getCell(row, startCol);
    labelCell.value = metric.label;
    labelCell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

    const valueCell = ws.getCell(row, startCol + 1);
    valueCell.value = metric.value;
    valueCell.font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.textDark } };
    valueCell.alignment = { horizontal: 'center' };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

    const trendCell = ws.getCell(row, startCol + 2);
    const trendColor = metric.isPositive ? theme.positiveTrend : theme.negativeTrend;
    trendCell.value = metric.trend;
    trendCell.font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: trendColor } };
    trendCell.alignment = { horizontal: 'center' };
    trendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

    const statusCell = ws.getCell(row, startCol + 3);
    statusCell.value = metric.isPositive ? '● On Track' : '● Attention';
    statusCell.font = { name: theme.fontFamily, size: 9, color: { argb: trendColor } };
    statusCell.alignment = { horizontal: 'center' };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

    for (let c = 0; c < 4; c++) {
      ws.getCell(row, startCol + c).border = {
        bottom: { style: 'hair', color: { argb: theme.cardBorder } }
      };
    }
  });
}

function renderTablePlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  ws.mergeCells(startRow, startCol, endRow, endCol);
  const cell = ws.getCell(startRow, startCol);
  cell.value = '[Table — no data available]';
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textLight }, italic: true };
}