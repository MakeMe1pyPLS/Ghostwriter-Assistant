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

  const { startCol, startRow, endCol, endRow } = range;
  const tableWidth = endCol - startCol + 1;

  const titleRow = startRow;
  for (let c = startCol; c <= endCol; c++) {
    ws.getCell(titleRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primarySoft } };
    ws.getCell(titleRow, c).border = { bottom: { style: 'medium', color: { argb: theme.primary } } };
  }
  ws.mergeCells(titleRow, startCol, titleRow, endCol);
  const titleCell = ws.getCell(titleRow, startCol);
  titleCell.value = `  ${widget.title || 'Key Performance Metrics'}`;
  titleCell.font = { name: theme.fontFamilyHeading, size: 12, bold: true, color: { argb: theme.primaryDark } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(titleRow).height = 30;

  ws.getRow(titleRow + 1).height = 6;

  const headerRow = titleRow + 2;
  const colWidths = [3, 2, 2, 2, Math.max(1, tableWidth - 9)];
  const headers = ['Metric', 'Current Value', 'Change', 'Status', 'Performance'];
  const colStarts = [startCol];
  for (let i = 1; i < colWidths.length; i++) {
    colStarts.push(colStarts[i - 1] + colWidths[i - 1]);
  }

  headers.forEach((header, i) => {
    const cs = colStarts[i];
    const ce = cs + colWidths[i] - 1;
    if (ce > endCol) return;
    if (colWidths[i] > 1) ws.mergeCells(headerRow, cs, headerRow, ce);
    const cell = ws.getCell(headerRow, cs);
    cell.value = header.toUpperCase();
    cell.font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.textLight } };
    cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
    for (let c = cs; c <= Math.min(ce, endCol); c++) {
      ws.getCell(headerRow, c).border = { bottom: { style: 'thin', color: { argb: theme.divider } } };
    }
  });
  ws.getRow(headerRow).height = 22;

  metrics.forEach((metric, i) => {
    const row = headerRow + 1 + i;
    if (row > endRow) return;
    const isStripe = i % 2 === 1;
    const rowBg = isStripe ? theme.rowStripe : theme.cardBg;
    const trendIsPositive = metric.isPositive;
    const trendColor = trendIsPositive ? theme.positiveTrend : theme.negativeTrend;
    const trendBg = trendIsPositive ? theme.positiveTrendBg : theme.negativeTrendBg;

    ws.getRow(row).height = 26;

    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      ws.getCell(row, c).border = { bottom: { style: 'hair', color: { argb: theme.divider } } };
    }

    const metricCs = colStarts[0];
    const metricCe = metricCs + colWidths[0] - 1;
    if (colWidths[0] > 1) ws.mergeCells(row, metricCs, row, metricCe);
    const labelCell = ws.getCell(row, metricCs);
    labelCell.value = `  ${metric.label}`;
    labelCell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };
    labelCell.alignment = { vertical: 'middle' };

    const valCs = colStarts[1];
    const valCe = valCs + colWidths[1] - 1;
    if (colWidths[1] > 1) ws.mergeCells(row, valCs, row, valCe);
    const valueCell = ws.getCell(row, valCs);
    valueCell.value = metric.value;
    valueCell.font = { name: theme.fontFamily, size: 11, bold: true, color: { argb: theme.textDark } };
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const trendCs = colStarts[2];
    const trendCe = trendCs + colWidths[2] - 1;
    if (colWidths[2] > 1) ws.mergeCells(row, trendCs, row, trendCe);
    const trendCell = ws.getCell(row, trendCs);
    const trendSymbol = trendIsPositive ? '▲' : '▼';
    trendCell.value = `${trendSymbol} ${metric.trend}`;
    trendCell.font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: trendColor } };
    trendCell.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = trendCs; c <= Math.min(trendCe, endCol); c++) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: trendBg } };
    }

    const statusCs = colStarts[3];
    const statusCe = statusCs + colWidths[3] - 1;
    if (colWidths[3] > 1) ws.mergeCells(row, statusCs, row, statusCe);
    const statusCell = ws.getCell(row, statusCs);
    statusCell.value = trendIsPositive ? '● On Track' : '● Review';
    statusCell.font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: trendColor } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    if (colStarts[4] && colStarts[4] <= endCol) {
      const perfCs = colStarts[4];
      const perfCe = perfCs + colWidths[4] - 1;
      const perfBarLen = Math.floor(colWidths[4] * (trendIsPositive ? 0.75 : 0.4));
      for (let c = 0; c < perfBarLen && (perfCs + c) <= Math.min(perfCe, endCol); c++) {
        ws.getCell(row, perfCs + c).fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: trendIsPositive ? theme.primaryLight : theme.negativeTrendBg }
        };
      }
    }
  });
}

function renderTablePlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  const midRow = Math.floor((startRow + endRow) / 2);
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.sectionBg } };
    }
  }
  ws.mergeCells(midRow, startCol, midRow, endCol);
  const cell = ws.getCell(midRow, startCol);
  cell.value = 'No metrics data available for this table';
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMuted }, italic: true };
}