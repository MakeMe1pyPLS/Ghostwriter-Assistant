export function formatExportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportFilename(type: string, sector: string, ext: string): string {
  return `chaininsideiq_${type}_${sector}_${formatExportDate()}.${ext}`;
}

export function sectorLabel(sector: string): string {
  const labels: Record<string, string> = {
    ecommerce: 'E-commerce',
    logistics: 'Logistics',
    manufacturing: 'Manufacturing',
    unified: 'Unified',
    custom: 'Custom'
  };
  return labels[sector] || sector;
}

export function dateRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  };
  return labels[range] || range;
}

export async function downloadFromResponse(response: Response, fallbackFilename: string) {
  const disposition = response.headers.get('content-disposition');
  let filename = fallbackFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportPayloadBase {
  sector: string;
  dateRange: string;
  metrics: any[];
  chartData: any[];
  donutData: any[];
}

export function buildDashboardPayload(base: ExportPayloadBase & { widgets?: any[]; layouts?: any; allMetrics?: any[] }) {
  return {
    sector: base.sector,
    dateRange: base.dateRange,
    metrics: base.metrics,
    chartData: base.chartData,
    donutData: base.donutData,
    widgets: base.widgets || [],
    layouts: base.layouts || {},
    theme: { mode: 'light', primary: '#0F766E' }
  };
}

export function buildExcelPayload(base: ExportPayloadBase & { widgets?: any[]; layouts?: any; allMetrics?: any[] }) {
  return {
    sector: base.sector,
    spec: {
      meta: {
        title: `${sectorLabel(base.sector)} Dashboard`,
        sectorContext: base.sector
      },
      widgets: base.widgets || [],
      globalConfig: { theme: 'light', dateRange: base.dateRange, primaryColor: 'teal' }
    },
    data: {
      metrics: base.metrics,
      chartData: base.chartData,
      donutData: base.donutData,
      allMetrics: base.allMetrics || []
    },
    layouts: base.layouts || {},
    widgets: base.widgets || []
  };
}