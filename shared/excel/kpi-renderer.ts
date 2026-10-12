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
  const midCol = Math.floor((startCol + endCol) / 2);
  const totalRows = endRow - startRow + 1;

  fillCardBackground(ws, startCol, startRow, endCol, endRow, theme);

  const accentRow = startRow;
  for (let c = startCol; c <= endCol; c++) {
    ws.getCell(accentRow, c).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: theme.primary }
    };
  }
  ws.getRow(accentRow).height = 4;

  const labelRow = startRow + 1;
  ws.mergeCells(labelRow, startCol, labelRow, endCol);
  const labelCell = ws.getCell(labelRow, startCol);
  labelCell.value = (metric.label || 'Metric').toUpperCase();
  labelCell.font = {
    name: theme.fontFamilyHeading, size: 8, bold: true,
    color: { argb: theme.textLight }
  };
  labelCell.alignment = { vertical: 'bottom', horizontal: 'center', wrapText: false };
  ws.getRow(labelRow).height = 22;

  const valueRow = startRow + 2;
  ws.mergeCells(valueRow, startCol, valueRow, endCol);
  const valueCell = ws.getCell(valueRow, startCol);
  valueCell.value = metric.value;
  valueCell.font = {
    name: theme.fontFamilyHeading, size: 28, bold: true,
    color: { argb: theme.textDark }
  };
  valueCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  ws.getRow(valueRow).height = 40;

  const trendRow = startRow + 3;
  ws.mergeCells(trendRow, startCol, trendRow, endCol);
  const trendCell = ws.getCell(trendRow, startCol);
  const trendIsPositive = metric.isPositive;
  const trendSymbol = trendIsPositive ? '▲' : '▼';
  const trendColor = trendIsPositive ? theme.positiveTrend : theme.negativeTrend;
  const trendBg = trendIsPositive ? theme.positiveTrendBg : theme.negativeTrendBg;

  trendCell.value = `${trendSymbol}  ${metric.trend}`;
  trendCell.font = {
    name: theme.fontFamily, size: 11, bold: true,
    color: { argb: trendColor }
  };
  trendCell.alignment = { vertical: 'middle', horizontal: 'center' };
  trendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: trendBg } };
  ws.getRow(trendRow).height = 24;

  if (metric.helpText && totalRows >= 5) {
    const helpRow = startRow + 4;
    if (helpRow <= endRow) {
      ws.mergeCells(helpRow, startCol, helpRow, endCol);
      const helpCell = ws.getCell(helpRow, startCol);
      helpCell.value = metric.helpText;
      helpCell.font = { name: theme.fontFamily, size: 8, italic: true, color: { argb: theme.textMuted } };
      helpCell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
    }
  }

  applyCardBorder(ws, startCol, startRow, endCol, endRow, theme);
}

function fillCardBackground(
  ws: ExcelJS.Worksheet,
  startCol: number, startRow: number,
  endCol: number, endRow: number,
  theme: ExcelTheme
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(r, c).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: theme.cardBg }
      };
    }
  }
}

function applyCardBorder(
  ws: ExcelJS.Worksheet,
  startCol: number, startRow: number,
  endCol: number, endRow: number,
  theme: ExcelTheme
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const border: any = {};
      if (r === startRow) border.top = { style: 'thin', color: { argb: theme.cardBorder } };
      if (r === endRow) border.bottom = { style: 'thin', color: { argb: theme.cardBorder } };
      if (c === startCol) border.left = { style: 'thin', color: { argb: theme.cardBorder } };
      if (c === endCol) border.right = { style: 'thin', color: { argb: theme.cardBorder } };
      if (Object.keys(border).length > 0) {
        ws.getCell(r, c).border = border;
      }
    }
  }
}

function renderPlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  widgetId: string,
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.sectionBg } };
    }
  }
  const midRow = Math.floor((startRow + endRow) / 2);
  ws.mergeCells(midRow, startCol, midRow, endCol);
  const cell = ws.getCell(midRow, startCol);
  cell.value = `No data for: ${widgetId}`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMuted }, italic: true };
  applyCardBorder(ws, startCol, startRow, endCol, endRow, theme);
}