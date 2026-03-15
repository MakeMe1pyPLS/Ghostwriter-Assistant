import ExcelJS from 'exceljs';
import { getExcelTheme, ExcelTheme } from './theme-mapper';
import { computeWidgetPlacements } from './layout-engine';
import { renderKpiCard } from './kpi-renderer';
import { renderChart } from './chart-renderer';
import { renderTable } from './table-renderer';

interface ExcelExportRequest {
  spec: {
    meta?: { title?: string; sectorContext?: string };
    widgets: any[];
    globalConfig?: any;
  };
  data: {
    metrics: any[];
    chartData: any[];
    donutData: any[];
    allMetrics?: any[];
  };
  layouts: Record<string, any[]>;
  widgets: any[];
}

export async function generateExcelDashboard(request: ExcelExportRequest): Promise<Buffer> {
  const { spec, data, layouts, widgets } = request;
  const theme = getExcelTheme();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChainInsideIQ';
  workbook.created = new Date();

  const dashSheet = workbook.addWorksheet('Dashboard', {
    views: [{ showGridLines: false, zoomScale: 90 }],
    properties: { tabColor: { argb: theme.primary } }
  });

  const dataSheet = workbook.addWorksheet('Data', {
    properties: { tabColor: { argb: theme.accent } }
  });

  const specSheet = workbook.addWorksheet('Spec', {
    properties: { tabColor: { argb: 'FF64748B' } }
  });

  setupColumnWidths(dashSheet);
  setupDashboardHeader(dashSheet, spec, theme);

  const placements = computeWidgetPlacements(widgets, layouts);

  let dataRowOffset = setupDataSheetHeader(dataSheet, spec, theme);

  for (const placement of placements) {
    const widget = widgets.find((w: any) => w.id === placement.widgetId);
    if (!widget) continue;

    const effectiveType = placement.type;

    try {
      if (effectiveType === 'kpi') {
        const metricIndex = widget.metricIndex ?? 0;
        const metric = data.metrics[metricIndex] || data.metrics[0];
        renderKpiCard(dashSheet, placement.range, widget, metric, theme);

        if (metric) {
          dataSheet.getCell(dataRowOffset, 1).value = metric.label;
          dataSheet.getCell(dataRowOffset, 1).font = { name: theme.fontFamily, size: 10 };
          dataSheet.getCell(dataRowOffset, 2).value = 'KPI';
          dataSheet.getCell(dataRowOffset, 2).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
          dataSheet.getCell(dataRowOffset, 3).value = metric.value;
          dataSheet.getCell(dataRowOffset, 3).font = { name: theme.fontFamily, size: 10, bold: true };
          dataSheet.getCell(dataRowOffset, 4).value = metric.trend;
          const tc = metric.isPositive ? theme.positiveTrend : theme.negativeTrend;
          dataSheet.getCell(dataRowOffset, 4).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: tc } };
          if (dataRowOffset % 2 === 0) {
            for (let c = 1; c <= 5; c++) {
              dataSheet.getCell(dataRowOffset, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
            }
          }
          dataRowOffset++;
        }
      } else if (['trend', 'line', 'area'].includes(effectiveType)) {
        const chartDataFiltered = data.chartData.filter((d: any) => d.value !== null);
        dataRowOffset = renderChart(dashSheet, dataSheet, placement.range, widget, chartDataFiltered.length > 0 ? data.chartData : [], theme, dataRowOffset);
      } else if (effectiveType === 'bar') {
        dataRowOffset = renderChart(dashSheet, dataSheet, placement.range, widget, data.chartData.filter((d: any) => d.value !== null), theme, dataRowOffset);
      } else if (['donut', 'pie'].includes(effectiveType)) {
        dataRowOffset = renderChart(dashSheet, dataSheet, placement.range, { ...widget, chartType: 'donut' }, data.donutData, theme, dataRowOffset);
      } else if (effectiveType === 'table') {
        renderTable(dashSheet, placement.range, widget, data.metrics, theme);

        dataSheet.getCell(dataRowOffset, 1).value = `── Table: ${widget.title || 'Metrics'} ──`;
        dataSheet.getCell(dataRowOffset, 1).font = { bold: true, name: theme.fontFamily, size: 10, color: { argb: theme.primary } };
        dataSheet.mergeCells(dataRowOffset, 1, dataRowOffset, 5);
        dataRowOffset++;
        data.metrics.forEach((m: any) => {
          dataSheet.getCell(dataRowOffset, 1).value = m.label;
          dataSheet.getCell(dataRowOffset, 2).value = 'Table Row';
          dataSheet.getCell(dataRowOffset, 2).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
          dataSheet.getCell(dataRowOffset, 3).value = m.value;
          dataSheet.getCell(dataRowOffset, 4).value = m.trend;
          dataSheet.getCell(dataRowOffset, 5).value = m.isPositive ? 'Positive' : 'Negative';
          dataRowOffset++;
        });
        dataRowOffset++;
      } else if (['summary', 'forecast', 'progress'].includes(effectiveType)) {
        renderExecutiveSummary(dashSheet, placement.range, widget, data, theme);
      } else {
        renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
      }
    } catch (err: any) {
      console.error(`Excel render error for widget ${widget.id}: ${err.message}`);
      renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
    }
  }

  addDashboardFooter(dashSheet, placements, theme);

  populateSpecSheet(specSheet, spec, widgets, layouts, theme);

  finalizeDataSheet(dataSheet, theme);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function setupColumnWidths(ws: ExcelJS.Worksheet) {
  ws.getColumn(1).width = 3;
  for (let i = 2; i <= 26; i++) {
    ws.getColumn(i).width = 11;
  }
  ws.getColumn(27).width = 3;
}

function setupDashboardHeader(ws: ExcelJS.Worksheet, spec: any, theme: ExcelTheme) {
  for (let c = 1; c <= 27; c++) {
    ws.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    ws.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    ws.getCell(3, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
  }

  ws.getRow(1).height = 12;

  ws.mergeCells(2, 2, 2, 14);
  const titleCell = ws.getCell(2, 2);
  titleCell.value = spec?.meta?.title || 'ChainInsideIQ Dashboard';
  titleCell.font = { name: theme.fontFamilyHeading, size: 20, bold: true, color: { argb: theme.headerText } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(2).height = 40;

  ws.mergeCells(2, 18, 2, 25);
  const brandCell = ws.getCell(2, 18);
  brandCell.value = 'ChainInsideIQ';
  brandCell.font = { name: theme.fontFamilyHeading, size: 11, bold: true, color: { argb: theme.accent } };
  brandCell.alignment = { vertical: 'middle', horizontal: 'right' };

  ws.mergeCells(3, 2, 3, 14);
  const subtitleCell = ws.getCell(3, 2);
  const sectorName = (spec?.meta?.sectorContext || 'General').charAt(0).toUpperCase() + (spec?.meta?.sectorContext || 'General').slice(1);
  subtitleCell.value = `${sectorName} Sector Analysis  •  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  subtitleCell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMuted } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(3).height = 22;

  for (let c = 2; c <= 25; c++) {
    ws.getCell(4, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
  }
  ws.getRow(4).height = 4;

  ws.getRow(5).height = 6;
  ws.getRow(6).height = 10;
}

function setupDataSheetHeader(dataSheet: ExcelJS.Worksheet, spec: any, theme: ExcelTheme): number {
  dataSheet.mergeCells(1, 1, 1, 5);
  dataSheet.getCell(1, 1).value = `${spec?.meta?.title || 'Dashboard'} — Source Data`;
  dataSheet.getCell(1, 1).font = { name: theme.fontFamilyHeading, size: 14, bold: true, color: { argb: theme.textDark } };
  dataSheet.getRow(1).height = 30;

  dataSheet.mergeCells(2, 1, 2, 5);
  dataSheet.getCell(2, 1).value = `Generated: ${new Date().toISOString()}  •  Sector: ${spec?.meta?.sectorContext || 'General'}`;
  dataSheet.getCell(2, 1).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };

  for (let c = 1; c <= 5; c++) {
    dataSheet.getCell(3, c).border = { bottom: { style: 'medium', color: { argb: theme.primary } } };
  }
  dataSheet.getRow(3).height = 4;

  const headerRow = 4;
  const headers = ['Metric Name', 'Source Type', 'Value', 'Trend', 'Notes'];
  headers.forEach((h, i) => {
    const cell = dataSheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: theme.primary } } };
  });
  dataSheet.getRow(headerRow).height = 24;

  return 5;
}

function finalizeDataSheet(dataSheet: ExcelJS.Worksheet, theme: ExcelTheme) {
  dataSheet.getColumn(1).width = 28;
  dataSheet.getColumn(2).width = 14;
  dataSheet.getColumn(3).width = 18;
  dataSheet.getColumn(4).width = 14;
  dataSheet.getColumn(5).width = 22;
}

function renderExecutiveSummary(ws: ExcelJS.Worksheet, range: any, widget: any, data: any, theme: ExcelTheme) {
  const { startCol, startRow, endCol, endRow } = range;

  for (let c = startCol; c <= endCol; c++) {
    ws.getCell(startRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primarySoft } };
    ws.getCell(startRow, c).border = { bottom: { style: 'medium', color: { argb: theme.primary } } };
  }
  ws.mergeCells(startRow, startCol, startRow, endCol);
  const titleCell = ws.getCell(startRow, startCol);
  titleCell.value = `  ${widget.title || 'Executive Summary'}`;
  titleCell.font = { name: theme.fontFamilyHeading, size: 12, bold: true, color: { argb: theme.primaryDark } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(startRow).height = 30;

  ws.getRow(startRow + 1).height = 8;

  let currentRow = startRow + 2;

  const posMetrics = data.metrics.filter((m: any) => m.isPositive);
  const negMetrics = data.metrics.filter((m: any) => !m.isPositive);

  if (currentRow <= endRow) {
    ws.mergeCells(currentRow, startCol, currentRow, endCol);
    ws.getCell(currentRow, startCol).value = '  KEY HIGHLIGHTS';
    ws.getCell(currentRow, startCol).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.positiveTrend } };
    ws.getRow(currentRow).height = 18;
    currentRow++;
  }

  posMetrics.slice(0, 3).forEach((m: any) => {
    if (currentRow > endRow) return;
    ws.mergeCells(currentRow, startCol, currentRow, endCol);
    ws.getCell(currentRow, startCol).value = `    ✓  ${m.label}: ${m.value} (${m.trend})`;
    ws.getCell(currentRow, startCol).font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };
    ws.getRow(currentRow).height = 22;
    currentRow++;
  });

  if (negMetrics.length > 0 && currentRow + 1 <= endRow) {
    currentRow++;
    ws.mergeCells(currentRow, startCol, currentRow, endCol);
    ws.getCell(currentRow, startCol).value = '  AREAS FOR REVIEW';
    ws.getCell(currentRow, startCol).font = { name: theme.fontFamily, size: 8, bold: true, color: { argb: theme.negativeTrend } };
    ws.getRow(currentRow).height = 18;
    currentRow++;

    negMetrics.slice(0, 2).forEach((m: any) => {
      if (currentRow > endRow) return;
      ws.mergeCells(currentRow, startCol, currentRow, endCol);
      ws.getCell(currentRow, startCol).value = `    ⚠  ${m.label}: ${m.value} (${m.trend})`;
      ws.getCell(currentRow, startCol).font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMid } };
      ws.getRow(currentRow).height = 22;
      currentRow++;
    });
  }

  if (currentRow + 1 <= endRow) {
    currentRow++;
    ws.mergeCells(currentRow, startCol, currentRow, endCol);
    ws.getCell(currentRow, startCol).value = `    Report generated by ChainInsideIQ on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    ws.getCell(currentRow, startCol).font = { name: theme.fontFamily, size: 8, italic: true, color: { argb: theme.textMuted } };
  }

  for (let r = startRow; r <= endRow; r++) {
    const border: any = {};
    if (r === startRow) border.top = { style: 'thin', color: { argb: theme.cardBorder } };
    if (r === endRow) border.bottom = { style: 'thin', color: { argb: theme.cardBorder } };
    ws.getCell(r, startCol).border = { ...border, left: { style: 'thin', color: { argb: theme.cardBorder } } };
    ws.getCell(r, endCol).border = { ...border, right: { style: 'thin', color: { argb: theme.cardBorder } } };
  }
}

function renderUnsupportedPlaceholder(ws: ExcelJS.Worksheet, range: any, type: string, theme: ExcelTheme) {
  const { startCol, startRow, endCol, endRow } = range;
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.sectionBg } };
    }
  }
  const midRow = Math.floor((startRow + endRow) / 2);
  ws.mergeCells(midRow, startCol, midRow, endCol);
  const cell = ws.getCell(midRow, startCol);
  cell.value = `${type} widget — export coming soon`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMuted }, italic: true };
}

function addDashboardFooter(ws: ExcelJS.Worksheet, placements: any[], theme: ExcelTheme) {
  let maxRow = 0;
  placements.forEach(p => {
    if (p.range.endRow > maxRow) maxRow = p.range.endRow;
  });

  const footerRow = maxRow + 3;

  for (let c = 2; c <= 25; c++) {
    ws.getCell(footerRow, c).border = { top: { style: 'thin', color: { argb: theme.divider } } };
  }

  ws.mergeCells(footerRow + 1, 2, footerRow + 1, 14);
  ws.getCell(footerRow + 1, 2).value = `Generated by ChainInsideIQ  •  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  •  Confidential`;
  ws.getCell(footerRow + 1, 2).font = { name: theme.fontFamily, size: 8, italic: true, color: { argb: theme.textMuted } };
  ws.getRow(footerRow + 1).height = 18;

  ws.mergeCells(footerRow + 1, 18, footerRow + 1, 25);
  ws.getCell(footerRow + 1, 18).value = 'www.chaininsideiq.com';
  ws.getCell(footerRow + 1, 18).font = { name: theme.fontFamily, size: 8, color: { argb: theme.accent } };
  ws.getCell(footerRow + 1, 18).alignment = { horizontal: 'right' };
}

function populateSpecSheet(ws: ExcelJS.Worksheet, spec: any, widgets: any[], layouts: any, theme: ExcelTheme) {
  ws.mergeCells(1, 1, 1, 5);
  ws.getCell(1, 1).value = 'Dashboard Specification';
  ws.getCell(1, 1).font = { name: theme.fontFamilyHeading, size: 16, bold: true, color: { argb: theme.textDark } };
  ws.getRow(1).height = 35;

  for (let c = 1; c <= 5; c++) {
    ws.getCell(2, c).border = { bottom: { style: 'medium', color: { argb: theme.primary } } };
  }
  ws.getRow(2).height = 4;

  const meta = [
    ['Title', spec?.meta?.title || 'Untitled'],
    ['Sector', spec?.meta?.sectorContext || 'General'],
    ['Generated', new Date().toLocaleString()],
    ['Widgets', widgets.length.toString()],
    ['Theme', spec?.globalConfig?.theme || 'light'],
    ['Version', '1.0.0']
  ];

  meta.forEach(([label, value], i) => {
    const row = 4 + i;
    ws.getCell(row, 1).value = label;
    ws.getCell(row, 1).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.textMid } };
    ws.mergeCells(row, 2, row, 3);
    ws.getCell(row, 2).value = value;
    ws.getCell(row, 2).font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };
    if (i % 2 === 0) {
      for (let c = 1; c <= 5; c++) {
        ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
      }
    }
  });

  const tableHeaderRow = 4 + meta.length + 1;
  ws.getRow(tableHeaderRow).height = 24;
  const tableHeaders = ['Widget ID', 'Type', 'Viz Override', 'Style', 'Metric'];
  tableHeaders.forEach((h, i) => {
    const cell = ws.getCell(tableHeaderRow, i + 1);
    cell.value = h;
    cell.font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  widgets.forEach((w: any, i: number) => {
    const row = tableHeaderRow + 1 + i;
    ws.getCell(row, 1).value = w.id;
    ws.getCell(row, 1).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    ws.getCell(row, 2).value = w.type;
    ws.getCell(row, 3).value = w.chartType || '—';
    ws.getCell(row, 4).value = w.stylePreset || 'soft';
    ws.getCell(row, 5).value = w.metricIndex !== undefined ? `Index ${w.metricIndex}` : '—';

    [1, 2, 3, 4, 5].forEach(c => {
      ws.getCell(row, c).font = ws.getCell(row, c).font || { name: theme.fontFamily, size: 9 };
      ws.getCell(row, c).border = { bottom: { style: 'hair', color: { argb: theme.divider } } };
    });

    if (i % 2 === 1) {
      for (let c = 1; c <= 5; c++) {
        ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.rowStripe } };
      }
    }
  });

  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;
}