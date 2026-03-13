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
  const dataSourceLabel = widget.title || `${vizType} data`;

  dataSheet.getCell(dataStartRow, 1).value = `── ${dataSourceLabel} ──`;
  dataSheet.getCell(dataStartRow, 1).font = { bold: true, name: theme.fontFamilyHeading, size: 10, color: { argb: theme.primary } };
  dataSheet.mergeCells(dataStartRow, 1, dataStartRow, 3);

  const headerDataRow = dataStartRow + 1;
  ['Label', 'Value', 'Secondary'].forEach((h, i) => {
    const cell = dataSheet.getCell(headerDataRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, name: theme.fontFamily, size: 9, color: { argb: theme.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
    cell.alignment = { horizontal: 'center' };
  });

  chartData.forEach((point, i) => {
    const row = headerDataRow + 1 + i;
    const isStripe = i % 2 === 1;
    dataSheet.getCell(row, 1).value = point.name || `Point ${i}`;
    dataSheet.getCell(row, 2).value = typeof point.value === 'number' ? point.value : (point.absolute || 0);
    dataSheet.getCell(row, 3).value = point.forecast || point.absolute || '';
    dataSheet.getCell(row, 2).numFmt = '#,##0';
    if (isStripe) {
      for (let c = 1; c <= 3; c++) {
        dataSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
      }
    }
  });

  const dataEndRow = headerDataRow + chartData.length;

  const { startCol, startRow, endCol, endRow } = range;

  renderSectionHeader(ws, startRow, startCol, endCol, widget.title || formatChartTitle(vizType), theme);

  const chartAreaStart = startRow + 2;

  if (vizType === 'donut' || vizType === 'pie') {
    renderDonutSection(ws, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme);
  } else if (vizType === 'bar') {
    renderBarSection(ws, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme);
  } else {
    renderLineSection(ws, { startCol, startRow: chartAreaStart, endCol, endRow }, chartData, theme);
  }

  return dataEndRow + 2;
}

function formatChartTitle(vizType: string): string {
  const titles: Record<string, string> = {
    trend: 'Performance Trend',
    line: 'Trend Analysis',
    bar: 'Comparative Analysis',
    donut: 'Distribution Breakdown',
    pie: 'Composition Analysis',
    area: 'Cumulative Trend'
  };
  return titles[vizType] || `${vizType.charAt(0).toUpperCase() + vizType.slice(1)} Chart`;
}

function renderSectionHeader(
  ws: ExcelJS.Worksheet,
  row: number, startCol: number, endCol: number,
  title: string,
  theme: ExcelTheme
) {
  for (let c = startCol; c <= endCol; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primarySoft } };
    ws.getCell(row, c).border = { bottom: { style: 'medium', color: { argb: theme.primary } } };
  }
  ws.mergeCells(row, startCol, row, endCol);
  const titleCell = ws.getCell(row, startCol);
  titleCell.value = `  ${title}`;
  titleCell.font = { name: theme.fontFamilyHeading, size: 12, bold: true, color: { argb: theme.primaryDark } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(row).height = 30;

  const spacerRow = row + 1;
  ws.getRow(spacerRow).height = 8;
}

function renderDonutSection(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  const totalValue = chartData.reduce((sum, d) => sum + (d.value || d.absolute || 0), 0);
  const barAreaWidth = endCol - startCol - 6;

  const headerRow = startRow;
  ws.getRow(headerRow).height = 20;
  const headers = [
    { col: startCol, label: '', w: 1 },
    { col: startCol + 1, label: 'Segment', w: 2 },
    { col: startCol + 3, label: 'Share', w: 1 },
    { col: startCol + 4, label: 'Value', w: 1 },
    { col: startCol + 5, label: 'Distribution', w: barAreaWidth }
  ];

  headers.forEach(h => {
    const cell = ws.getCell(headerRow, h.col);
    cell.value = h.label;
    cell.font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.textLight } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  chartData.forEach((item, i) => {
    const row = startRow + 1 + i;
    const colorIdx = i % theme.donutColors.length;
    const pct = totalValue > 0 ? (item.value || item.absolute || 0) / totalValue : 0;
    const barLen = Math.max(1, Math.round(pct * Math.max(1, barAreaWidth)));

    ws.getRow(row).height = 28;

    const swatchCell = ws.getCell(row, startCol);
    swatchCell.value = '';
    swatchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.donutColors[colorIdx] } };
    swatchCell.border = {
      top: { style: 'thin', color: { argb: theme.cardBg } },
      bottom: { style: 'thin', color: { argb: theme.cardBg } },
      left: { style: 'thin', color: { argb: theme.cardBg } },
      right: { style: 'thin', color: { argb: theme.cardBg } }
    };

    ws.mergeCells(row, startCol + 1, row, startCol + 2);
    const nameCell = ws.getCell(row, startCol + 1);
    nameCell.value = item.name;
    nameCell.font = { name: theme.fontFamily, size: 11, color: { argb: theme.textDark } };
    nameCell.alignment = { vertical: 'middle' };

    const pctCell = ws.getCell(row, startCol + 3);
    pctCell.value = `${Math.round(pct * 100)}%`;
    pctCell.font = { name: theme.fontFamily, size: 12, bold: true, color: { argb: theme.donutColors[colorIdx] } };
    pctCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const absCell = ws.getCell(row, startCol + 4);
    if (item.absolute) {
      absCell.value = item.absolute;
      absCell.numFmt = '$#,##0';
    } else {
      absCell.value = item.value;
    }
    absCell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMid } };
    absCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let c = 0; c < barLen && (startCol + 5 + c) <= endCol; c++) {
      ws.getCell(row, startCol + 5 + c).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: theme.donutColors[colorIdx] }
      };
    }
  });

  const totalRow = startRow + 1 + chartData.length + 1;
  if (totalRow <= endRow) {
    ws.getRow(totalRow - 1).height = 4;
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(totalRow - 1, c).border = { bottom: { style: 'thin', color: { argb: theme.divider } } };
    }
    ws.mergeCells(totalRow, startCol, totalRow, startCol + 2);
    ws.getCell(totalRow, startCol).value = 'Total';
    ws.getCell(totalRow, startCol).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.textDark } };
    ws.getCell(totalRow, startCol + 3).value = '100%';
    ws.getCell(totalRow, startCol + 3).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.primary } };
    ws.getCell(totalRow, startCol + 3).alignment = { horizontal: 'center' };
  }
}

function renderBarSection(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  const maxVal = Math.max(...chartData.map(d => d.value || d.absolute || 0));
  const barMaxWidth = endCol - startCol - 4;

  const headerRow = startRow;
  ws.getRow(headerRow).height = 18;
  ws.getCell(headerRow, startCol).value = 'Period';
  ws.getCell(headerRow, startCol).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.textLight } };
  ws.getCell(headerRow, endCol).value = 'Value';
  ws.getCell(headerRow, endCol).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.textLight } };
  ws.getCell(headerRow, endCol).alignment = { horizontal: 'right' };

  chartData.forEach((item, i) => {
    const row = startRow + 1 + i;
    if (row > endRow) return;
    const val = item.value || item.absolute || 0;
    const barLen = maxVal > 0 ? Math.max(1, Math.round((val / maxVal) * barMaxWidth)) : 0;
    const isMax = val === maxVal;

    ws.getRow(row).height = 22;

    ws.mergeCells(row, startCol, row, startCol + 1);
    const labelCell = ws.getCell(row, startCol);
    labelCell.value = item.name || `Item ${i}`;
    labelCell.font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const barColor = isMax ? theme.primary : theme.accent;
    for (let c = 0; c < barLen && (startCol + 2 + c) <= (endCol - 1); c++) {
      ws.getCell(row, startCol + 2 + c).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: barColor }
      };
    }

    const valCell = ws.getCell(row, endCol);
    valCell.value = val;
    valCell.font = { name: theme.fontFamily, size: 10, bold: isMax, color: { argb: isMax ? theme.primary : theme.textDark } };
    valCell.numFmt = '#,##0';
    valCell.alignment = { horizontal: 'right', vertical: 'middle' };
  });
}

function renderLineSection(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  chartData: any[],
  theme: ExcelTheme
) {
  const { startCol, startRow, endCol, endRow } = range;
  const actualData = chartData.filter(d => d.value !== null && d.value !== undefined);
  const forecastData = chartData.filter(d => d.forecast !== null && d.forecast !== undefined);
  const allValues = [...actualData.map(d => d.value), ...forecastData.map(d => d.forecast)].filter(Boolean) as number[];
  const maxVal = Math.max(...allValues, 1);
  const sparkWidth = endCol - startCol - 4;

  const colHeaders = [
    { col: startCol, label: 'Period' },
    { col: startCol + 2, label: 'Value' },
    { col: startCol + 3, label: '' },
  ];
  colHeaders.forEach(h => {
    ws.getCell(startRow, h.col).value = h.label;
    ws.getCell(startRow, h.col).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.textLight } };
  });
  ws.getRow(startRow).height = 18;

  actualData.forEach((item, i) => {
    const row = startRow + 1 + i;
    if (row > endRow) return;
    ws.getRow(row).height = 20;

    ws.mergeCells(row, startCol, row, startCol + 1);
    ws.getCell(row, startCol).value = item.name;
    ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    ws.getCell(row, startCol).alignment = { vertical: 'middle' };

    ws.getCell(row, startCol + 2).value = item.value;
    ws.getCell(row, startCol + 2).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.primary } };
    ws.getCell(row, startCol + 2).numFmt = '#,##0';
    ws.getCell(row, startCol + 2).alignment = { horizontal: 'right', vertical: 'middle' };

    const barLen = Math.max(1, Math.round((item.value / maxVal) * sparkWidth));
    for (let c = 0; c < barLen && (startCol + 3 + c) <= endCol; c++) {
      ws.getCell(row, startCol + 3 + c).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: theme.primaryLight }
      };
    }

    if (i % 2 === 1) {
      ws.getCell(row, startCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
      ws.getCell(row, startCol + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
    }
  });

  if (forecastData.length > 0) {
    const gapRow = startRow + 1 + actualData.length;
    if (gapRow + 1 <= endRow) {
      ws.getRow(gapRow).height = 6;
      for (let c = startCol; c <= endCol; c++) {
        ws.getCell(gapRow, c).border = { bottom: { style: 'dotted', color: { argb: theme.divider } } };
      }

      const fLabelRow = gapRow + 1;
      ws.mergeCells(fLabelRow, startCol, fLabelRow, startCol + 2);
      ws.getCell(fLabelRow, startCol).value = '📈  FORECAST';
      ws.getCell(fLabelRow, startCol).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.accent } };
      ws.getRow(fLabelRow).height = 20;

      forecastData.forEach((item, i) => {
        const row = fLabelRow + 1 + i;
        if (row > endRow) return;
        ws.getRow(row).height = 20;

        ws.mergeCells(row, startCol, row, startCol + 1);
        ws.getCell(row, startCol).value = item.name;
        ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, italic: true, color: { argb: theme.textMid } };

        ws.getCell(row, startCol + 2).value = item.forecast;
        ws.getCell(row, startCol + 2).font = { name: theme.fontFamily, size: 10, color: { argb: theme.accent } };
        ws.getCell(row, startCol + 2).numFmt = '#,##0';
        ws.getCell(row, startCol + 2).alignment = { horizontal: 'right' };

        const barLen = Math.max(1, Math.round((item.forecast / maxVal) * sparkWidth));
        for (let c = 0; c < barLen && (startCol + 3 + c) <= endCol; c++) {
          ws.getCell(row, startCol + 3 + c).fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: theme.accentLight }
          };
        }
      });
    }
  }
}

function renderChartPlaceholder(
  ws: ExcelJS.Worksheet,
  range: CellRange,
  type: string,
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
  cell.value = `No data available for ${formatChartTitle(type)}`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMuted }, italic: true };
}

