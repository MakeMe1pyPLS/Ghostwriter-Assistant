import * as ExcelNS from 'exceljs';
import type ExcelJSTypes from 'exceljs';
// exceljs is CommonJS: the namespace or its default holds the API, depending on the bundler.
const ExcelJS: typeof ExcelJSTypes = ((ExcelNS as any).default ?? ExcelNS) as any;
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

/** Builds the dashboard workbook. Runs on the server and in the browser (exceljs works in both). */
export async function generateExcelDashboard(request: ExcelExportRequest): Promise<Uint8Array> {
  const { spec, data, layouts, widgets } = request;
  const theme = getExcelTheme();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChainInsideIQ';
  workbook.created = new Date();

  const dashSheet = workbook.addWorksheet('Dashboard', {
    views: [{ showGridLines: false, zoomScale: 90 }],
    properties: { tabColor: { argb: theme.primary } }
  });
  // Prints as a one-page-wide landscape report.
  dashSheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } } as any;

  const dataSheet = workbook.addWorksheet('Data', {
    properties: { tabColor: { argb: theme.accent } }
  });

  const specSheet = workbook.addWorksheet('Spec', {
    properties: { tabColor: { argb: 'FF64748B' } }
  });

  setupColumnWidths(dashSheet);
  setupDashboardHeader(dashSheet, spec, theme);

  const placements = computeWidgetPlacements(widgets, layouts);

  // Cards side by side share sheet rows. Each renderer asks for its own row
  // heights; keep the tallest request per row so no card gets squashed.
  const firstGridRow = Math.min(...placements.map((p) => p.range.startRow), Infinity);
  const wantHeight = new Map<number, number>();
  const realGetRow = dashSheet.getRow.bind(dashSheet);
  (dashSheet as any).getRow = (r: number) => {
    const row = realGetRow(r);
    if (r < firstGridRow) return row;
    return new Proxy(row, {
      set(target: any, prop, value) {
        if (prop === 'height') wantHeight.set(r, Math.max(wantHeight.get(r) ?? 0, Number(value) || 0));
        else target[prop] = value;
        return true;
      },
      get(target: any, prop) {
        const v = target[prop];
        return typeof v === 'function' ? v.bind(target) : v;
      },
    });
  };

  let dataRowOffset = setupDataSheetHeader(dataSheet, spec, theme);

  for (const placement of placements) {
    const widget = widgets.find((w: any) => w.id === placement.widgetId);
    if (!widget) continue;

    const effectiveType = placement.type;

    try {
      if (effectiveType === 'kpi') {
        const metric = resolveMetric(widget, data);
        renderKpiCard(dashSheet, placement.range, widget, metric, theme);

        if (metric) {
          // The card's number reads from the Data sheet, so editing the data updates the dashboard.
          const valueCell = dashSheet.getCell(placement.range.startRow + 2, placement.range.startCol);
          valueCell.value = { formula: `Data!C${dataRowOffset}`, result: metric.value } as any;
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
      } else if (['summary', 'forecast', 'progress', 'insights', 'opportunity-risk'].includes(effectiveType)) {
        renderExecutiveSummary(dashSheet, placement.range, widget, data, theme);
      } else {
        renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
      }
    } catch (err: any) {
      console.error(`Excel render error for widget ${widget.id}: ${err.message}`);
      renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
    }
  }

  (dashSheet as any).getRow = realGetRow;
  wantHeight.forEach((h, r) => { realGetRow(r).height = h; });

  addDashboardFooter(dashSheet, placements, theme);

  populateSpecSheet(specSheet, spec, widgets, layouts, theme);

  finalizeDataSheet(dataSheet, theme);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

function setupColumnWidths(ws: ExcelJSTypes.Worksheet) {
  ws.getColumn(1).width = 3;
  for (let i = 2; i <= 26; i++) {
    ws.getColumn(i).width = 11;
  }
  ws.getColumn(27).width = 3;
}

function setupDashboardHeader(ws: ExcelJSTypes.Worksheet, spec: any, theme: ExcelTheme) {
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

function setupDataSheetHeader(dataSheet: ExcelJSTypes.Worksheet, spec: any, theme: ExcelTheme): number {
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

function finalizeDataSheet(dataSheet: ExcelJSTypes.Worksheet, theme: ExcelTheme) {
  dataSheet.getColumn(1).width = 28;
  dataSheet.getColumn(2).width = 14;
  dataSheet.getColumn(3).width = 18;
  dataSheet.getColumn(4).width = 14;
  dataSheet.getColumn(5).width = 22;
}

function renderExecutiveSummary(ws: ExcelJSTypes.Worksheet, range: any, widget: any, data: any, theme: ExcelTheme) {
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

function renderUnsupportedPlaceholder(ws: ExcelJSTypes.Worksheet, range: any, type: string, theme: ExcelTheme) {
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

function addDashboardFooter(ws: ExcelJSTypes.Worksheet, placements: any[], theme: ExcelTheme) {
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

function populateSpecSheet(ws: ExcelJSTypes.Worksheet, spec: any, widgets: any[], layouts: any, theme: ExcelTheme) {
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

const norm = (s: string) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The numbers a KPI card shows: the metric the card was set to, or for a KPI-library
 * card the metric with the same name. A library KPI with no data yet gets an empty
 * value to fill in on the Data sheet, never another KPI's numbers.
 */
function resolveMetric(widget: any, data: any) {
  const all: any[] = data.allMetrics?.length ? data.allMetrics : data.metrics;
  if (widget.customMetricId) {
    const m = all.find((x: any) => x.label === widget.customMetricId);
    if (m) return m;
  }
  if (widget.libraryKpiId) {
    const name = widget.title || '';
    return all.find((x: any) => norm(x.label) === norm(name)) ?? { label: name || 'KPI', value: '', trend: '', isPositive: true, helpText: 'No data yet: enter the value on the Data sheet.' };
  }
  return data.metrics[widget.metricIndex ?? 0] || data.metrics[0];
}
