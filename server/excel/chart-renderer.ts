import type ExcelJS from 'exceljs';
import { ExcelTheme } from './theme-mapper';
import { CellRange } from './layout-engine';

export function renderChart(
  ws: ExcelJS.Worksheet,
  dataSheet: ExcelJS.Worksheet,
  range: CellRange,
  widget: any,
  chartData: any[],
  theme: ExcelTheme,
  dataRowOffset: number
): number {
  const vizType = widget.chartType || widget.type;

  if (!chartData || chartData.length === 0) {
    renderChartPlaceholder(ws, range, vizType, theme);
    return dataRowOffset;
  }

  const dataStartRow = dataRowOffset + 1;

  dataSheet.getCell(dataStartRow, 1).value = 'Label';
  dataSheet.getCell(dataStartRow, 1).font = { bold: true, name: theme.fontFamily, size: 10 };
  dataSheet.getCell(dataStartRow, 2).value = 'Value';
  dataSheet.getCell(dataStartRow, 2).font = { bold: true, name: theme.fontFamily, size: 10 };

  chartData.forEach((point, i) => {
    const row = dataStartRow + 1 + i;
    dataSheet.getCell(row, 1).value = point.name || `Point ${i}`;
    dataSheet.getCell(row, 2).value = typeof point.value === 'number' ? point.value : (point.absolute || 0);
  });

  const dataEndRow = dataStartRow + chartData.length;

  const { startCol, startRow, endCol, endRow } = range;

  const titleRow = startRow;
  ws.mergeCells(titleRow, startCol, titleRow, endCol);
  const titleCell = ws.getCell(titleRow, startCol);
  titleCell.value = widget.title || `${vizType.toUpperCase()} Chart`;
  titleCell.font = { name: theme.fontFamily, size: 11, bold: true, color: { argb: theme.textDark } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

  const chartAreaStart = startRow + 1;

  if (vizType === 'donut' || vizType === 'pie') {
    renderDonutSection(ws, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme);
  } else if (vizType === 'bar') {
    renderBarSection(ws, dataSheet, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme, dataStartRow, dataEndRow);
  } else {
    renderLineSection(ws, dataSheet, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme, dataStartRow, dataEndRow);
  }

  return dataEndRow + 2;
}

function renderDonutSection(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol } = range;

  chartData.forEach((item, i) => {
    const row = startRow + i;
    const colorIdx = i % theme.chartColors.length;

    ws.getCell(row, startCol).value = '';
    ws.getCell(row, startCol).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: theme.chartColors[colorIdx] }
    };

    ws.getCell(row, startCol + 1).value = item.name;
    ws.getCell(row, startCol + 1).font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };

    ws.getCell(row, startCol + 2).value = typeof item.value === 'number' ? item.value : 0;
    ws.getCell(row, startCol + 2).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.textDark } };
    ws.getCell(row, startCol + 2).numFmt = item.absolute ? '#,##0' : '0"%"';

    if (item.absolute) {
      ws.getCell(row, startCol + 3).value = item.absolute;
      ws.getCell(row, startCol + 3).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
      ws.getCell(row, startCol + 3).numFmt = '$#,##0';
    }
  });
}

function renderBarSection(
  ws: ExcelJS.Worksheet,
  _dataSheet: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme,
  _dataStartRow: number,
  _dataEndRow: number
) {
  const { startCol, startRow, endCol } = range;
  const maxVal = Math.max(...chartData.map(d => d.value || d.absolute || 0));
  const barWidth = endCol - startCol - 2;

  chartData.forEach((item, i) => {
    const row = startRow + i;
    const val = item.value || item.absolute || 0;
    const barLen = maxVal > 0 ? Math.round((val / maxVal) * barWidth) : 0;

    ws.getCell(row, startCol).value = item.name || `Item ${i}`;
    ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    ws.getCell(row, startCol).alignment = { horizontal: 'right' };

    for (let c = 0; c < barLen; c++) {
      ws.getCell(row, startCol + 1 + c).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: theme.primary }
      };
    }

    ws.getCell(row, endCol).value = val;
    ws.getCell(row, endCol).font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.textDark } };
    ws.getCell(row, endCol).numFmt = '#,##0';
  });
}

function renderLineSection(
  ws: ExcelJS.Worksheet,
  _dataSheet: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme,
  _dataStartRow: number,
  _dataEndRow: number
) {
  const { startCol, startRow, endCol } = range;
  const filteredData = chartData.filter(d => d.value !== null && d.value !== undefined);

  ws.getCell(startRow, startCol).value = 'Period';
  ws.getCell(startRow, startCol).font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.textLight } };
  ws.getCell(startRow, startCol + 4).value = 'Value';
  ws.getCell(startRow, startCol + 4).font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.textLight } };

  filteredData.forEach((item, i) => {
    const row = startRow + 1 + i;
    ws.getCell(row, startCol).value = item.name;
    ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    ws.getCell(row, startCol + 4).value = item.value;
    ws.getCell(row, startCol + 4).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.primary } };
    ws.getCell(row, startCol + 4).numFmt = '#,##0';
  });

  const forecastData = chartData.filter(d => d.forecast !== null && d.forecast !== undefined);
  if (forecastData.length > 0) {
    const fStartRow = startRow + 1 + filteredData.length + 1;
    ws.getCell(fStartRow - 1, startCol).value = 'Forecast';
    ws.getCell(fStartRow - 1, startCol).font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.textLight } };

    forecastData.forEach((item, i) => {
      const row = fStartRow + i;
      ws.getCell(row, startCol).value = item.name;
      ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid }, italic: true };
      ws.getCell(row, startCol + 4).value = item.forecast;
      ws.getCell(row, startCol + 4).font = { name: theme.fontFamily, size: 10, color: { argb: theme.accent } };
      ws.getCell(row, startCol + 4).numFmt = '#,##0';
    });
  }
}

function renderChartPlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  type: string,
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  ws.mergeCells(startRow, startCol, endRow, endCol);
  const cell = ws.getCell(startRow, startCol);
  cell.value = `[${type} chart — no data available]`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textLight }, italic: true };
}