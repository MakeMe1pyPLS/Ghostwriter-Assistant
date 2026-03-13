import ExcelJS from 'exceljs';
import { getExcelTheme } from './theme-mapper';
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
    views: [{ showGridLines: false }]
  });

  const dataSheet = workbook.addWorksheet('Data');

  const specSheet = workbook.addWorksheet('Spec');

  setupDashboardHeader(dashSheet, spec, theme);

  for (let i = 1; i <= 26; i++) {
    const col = dashSheet.getColumn(i);
    col.width = 12;
  }

  const placements = computeWidgetPlacements(widgets, layouts);

  let dataRowOffset = 1;

  dataSheet.getCell(1, 1).value = 'Widget';
  dataSheet.getCell(1, 1).font = { bold: true, name: theme.fontFamily, size: 10, color: { argb: theme.headerText } };
  dataSheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
  dataSheet.getCell(1, 2).value = 'Source Data';
  dataSheet.getCell(1, 2).font = { bold: true, name: theme.fontFamily, size: 10, color: { argb: theme.headerText } };
  dataSheet.getCell(1, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
  dataRowOffset = 3;

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
          dataSheet.getCell(dataRowOffset, 1).value = `KPI: ${metric.label}`;
          dataSheet.getCell(dataRowOffset, 2).value = metric.value;
          dataSheet.getCell(dataRowOffset, 3).value = metric.trend;
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

        dataSheet.getCell(dataRowOffset, 1).value = 'Table Data';
        dataSheet.getCell(dataRowOffset, 1).font = { bold: true, name: theme.fontFamily };
        dataRowOffset++;
        data.metrics.forEach((m: any) => {
          dataSheet.getCell(dataRowOffset, 1).value = m.label;
          dataSheet.getCell(dataRowOffset, 2).value = m.value;
          dataSheet.getCell(dataRowOffset, 3).value = m.trend;
          dataRowOffset++;
        });
        dataRowOffset++;
      } else if (['summary', 'forecast', 'progress'].includes(effectiveType)) {
        renderSummaryBlock(dashSheet, placement.range, widget, data, theme);
      } else {
        renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
      }
    } catch (err: any) {
      console.error(`Excel render error for widget ${widget.id}: ${err.message}`);
      renderUnsupportedPlaceholder(dashSheet, placement.range, effectiveType, theme);
    }
  }

  populateSpecSheet(specSheet, spec, widgets, layouts, theme);

  dataSheet.getColumn(1).width = 25;
  dataSheet.getColumn(2).width = 18;
  dataSheet.getColumn(3).width = 15;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function setupDashboardHeader(ws: ExcelJS.Worksheet, spec: any, theme: any) {
  ws.mergeCells(1, 2, 1, 12);
  const titleCell = ws.getCell(1, 2);
  titleCell.value = spec?.meta?.title || 'ChainInsideIQ Dashboard';
  titleCell.font = { name: theme.fontFamily, size: 18, bold: true, color: { argb: theme.textDark } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells(2, 2, 2, 12);
  const subtitleCell = ws.getCell(2, 2);
  subtitleCell.value = `Sector: ${spec?.meta?.sectorContext || 'General'} • Generated: ${new Date().toLocaleDateString()}`;
  subtitleCell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textMid } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells(3, 2, 3, 12);
  const accentBar = ws.getCell(3, 2);
  accentBar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
  ws.getRow(3).height = 4;

  ws.getRow(1).height = 35;
  ws.getRow(2).height = 20;
}

function renderSummaryBlock(ws: ExcelJS.Worksheet, range: any, widget: any, data: any, theme: any) {
  const { startCol, startRow, endCol, endRow } = range;
  ws.mergeCells(startRow, startCol, startRow, endCol);
  const titleCell = ws.getCell(startRow, startCol);
  titleCell.value = widget.title || 'Executive Summary';
  titleCell.font = { name: theme.fontFamily, size: 11, bold: true, color: { argb: theme.textDark } };

  const metricsToShow = data.metrics.slice(0, 4);
  metricsToShow.forEach((m: any, i: number) => {
    const row = startRow + 1 + i;
    if (row > endRow) return;
    ws.getCell(row, startCol).value = m.label;
    ws.getCell(row, startCol).font = { name: theme.fontFamily, size: 9, color: { argb: theme.textMid } };
    ws.getCell(row, startCol + 2).value = m.value;
    ws.getCell(row, startCol + 2).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.primary } };
  });
}

function renderUnsupportedPlaceholder(ws: ExcelJS.Worksheet, range: any, type: string, theme: any) {
  const { startCol, startRow, endCol, endRow } = range;
  ws.mergeCells(startRow, startCol, endRow, endCol);
  const cell = ws.getCell(startRow, startCol);
  cell.value = `[${type} widget — export not yet supported]`;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = { name: theme.fontFamily, size: 10, color: { argb: theme.textLight }, italic: true };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  cell.border = {
    top: { style: 'thin', color: { argb: theme.cardBorder } },
    left: { style: 'thin', color: { argb: theme.cardBorder } },
    bottom: { style: 'thin', color: { argb: theme.cardBorder } },
    right: { style: 'thin', color: { argb: theme.cardBorder } }
  };
}

function populateSpecSheet(ws: ExcelJS.Worksheet, spec: any, widgets: any[], layouts: any, theme: any) {
  ws.getCell(1, 1).value = 'Dashboard Specification';
  ws.getCell(1, 1).font = { name: theme.fontFamily, size: 14, bold: true, color: { argb: theme.textDark } };

  ws.getCell(3, 1).value = 'Title';
  ws.getCell(3, 2).value = spec?.meta?.title || 'Untitled';
  ws.getCell(4, 1).value = 'Sector';
  ws.getCell(4, 2).value = spec?.meta?.sectorContext || 'General';
  ws.getCell(5, 1).value = 'Generated';
  ws.getCell(5, 2).value = new Date().toISOString();
  ws.getCell(6, 1).value = 'Widget Count';
  ws.getCell(6, 2).value = widgets.length;

  [3, 4, 5, 6].forEach(r => {
    ws.getCell(r, 1).font = { name: theme.fontFamily, size: 10, bold: true, color: { argb: theme.textMid } };
    ws.getCell(r, 2).font = { name: theme.fontFamily, size: 10, color: { argb: theme.textDark } };
  });

  ws.getCell(8, 1).value = 'Widget ID';
  ws.getCell(8, 2).value = 'Type';
  ws.getCell(8, 3).value = 'Chart Type';
  ws.getCell(8, 4).value = 'Style Preset';
  [1, 2, 3, 4].forEach(c => {
    ws.getCell(8, c).font = { name: theme.fontFamily, size: 9, bold: true, color: { argb: theme.headerText } };
    ws.getCell(8, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
  });

  widgets.forEach((w: any, i: number) => {
    const row = 9 + i;
    ws.getCell(row, 1).value = w.id;
    ws.getCell(row, 2).value = w.type;
    ws.getCell(row, 3).value = w.chartType || '-';
    ws.getCell(row, 4).value = w.stylePreset || 'soft';
  });

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 15;
  ws.getColumn(4).width = 15;
}