// Exports that keep the Builder layout, for the tools people report in.
//  • Excel: a dashboard sheet with each card where it sits on the grid. KPI
//    numbers are formulas that read from the Data sheet, so editing the data
//    updates the dashboard.
//  • Google Sheets: the same workbook; Google Sheets opens .xlsx files.
//  • Power BI: Power BI-ready tables, a layout guide with card positions on a
//    1280×720 page, and a matching colour theme.
// Everything is built in the browser (exceljs is loaded only when needed).
import { downloadBlob } from '@/lib/client-export';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function tryServer(body: unknown): Promise<Blob | null> {
  try {
    const res = await fetch('/api/export/excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || type.includes('text/html')) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/** The layout-matching dashboard workbook (server if available, otherwise built here). */
export async function buildDashboardWorkbook(payload: any): Promise<Blob> {
  const fromServer = await tryServer(payload);
  if (fromServer) return fromServer;
  const { generateExcelDashboard } = await import('@shared/excel/excel-renderer');
  const bytes = await generateExcelDashboard({
    spec: payload.spec ?? { widgets: payload.widgets ?? [], meta: {} },
    data: {
      metrics: payload.data?.metrics ?? [],
      chartData: payload.data?.chartData ?? [],
      donutData: payload.data?.donutData ?? [],
      allMetrics: payload.data?.allMetrics ?? [],
    },
    layouts: payload.layouts ?? {},
    widgets: payload.widgets ?? [],
  });
  return new Blob([bytes], { type: XLSX });
}

export async function exportExcelDashboard(payload: any, filename: string) {
  downloadBlob(await buildDashboardWorkbook(payload), filename);
}

// ------------------------------------------------------------------ Power BI

const PBI_W = 1280;
const PBI_H = 720;
const VISUAL: Record<string, string> = {
  kpi: 'Card (or KPI visual)', trend: 'Line chart', line: 'Line chart', area: 'Area chart', bar: 'Clustered column chart',
  donut: 'Donut chart', pie: 'Pie chart', table: 'Table', progress: 'Gauge', insights: 'Text box (Smart narrative)',
  summary: 'Text box (Smart narrative)', forecast: 'Line chart with forecast', 'opportunity-risk': 'Table', chat: 'Q&A visual',
};

/** Card positions in Power BI's default 16:9 page (1280×720), from the 12-column grid. */
export function powerBiLayout(widgets: any[], layout: any[]) {
  const rows = Math.max(1, ...layout.map((l) => l.y + l.h));
  const colW = PBI_W / 12;
  const rowH = Math.min(PBI_H / rows, colW); // keep cards readable; the page can scroll if taller
  return layout
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((l) => {
      const w = widgets.find((x) => x.id === l.i) ?? {};
      const type = w.chartType || w.type || 'card';
      return {
        Card: w.title || w.name || (type === 'kpi' ? 'KPI card' : type),
        'Power BI visual': VISUAL[type] ?? 'Card',
        'X (px)': Math.round(l.x * colW),
        'Y (px)': Math.round(l.y * rowH),
        'Width (px)': Math.round(l.w * colW),
        'Height (px)': Math.round(l.h * rowH),
        'Grid (x, y, w, h)': `${l.x}, ${l.y}, ${l.w}, ${l.h}`,
      };
    });
}

/** A Power BI report theme with the app's colours (View → Themes → Browse for themes). */
export function powerBiTheme(name = 'ChainInsideIQ') {
  return {
    name,
    dataColors: ['#0F766E', '#14B8A6', '#0EA5E9', '#6366F1', '#F59E0B', '#F43F5E', '#10B981', '#64748B'],
    background: '#FFFFFF',
    foreground: '#0F172A',
    tableAccent: '#0F766E',
    good: '#10B981',
    neutral: '#F59E0B',
    bad: '#F43F5E',
  };
}

export async function exportPowerBiPack(input: { sector: string; widgets: any[]; layout: any[]; metrics: any[]; chartData?: any[]; donutData?: any[] }, baseName: string) {
  const mod: any = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ChainInsideIQ';
  wb.created = new Date();

  const guide = wb.addWorksheet('How to use');
  guide.columns = [{ width: 4 }, { width: 110 }];
  const steps = [
    'Build this dashboard in Power BI Desktop',
    '',
    '1. Open Power BI Desktop → Home → Get data → Excel workbook, and pick this file.',
    '2. Tick the tables KPIs, Trend and Breakdown (they are named Excel tables), then Load.',
    '3. View → Themes → Browse for themes, and pick the ChainInsideIQ theme .json downloaded with this file.',
    '4. Add one visual per row of the "Layout" sheet. In the Format pane → General → Properties, set X, Y, Width and Height to the numbers shown,',
    '   so the report matches the layout you built in ChainInsideIQ (page size 1280 × 720).',
    '5. To refresh later, export again from ChainInsideIQ and replace this file, then click Refresh in Power BI.',
    '',
    'ChainInsideIQ does not create .pbix files; this pack gives you the data, layout and colours to build the report in a few minutes.',
  ];
  steps.forEach((s, i) => {
    const c = guide.getCell(i + 2, 2);
    c.value = s;
    c.font = i === 0 ? { bold: true, size: 14, color: { argb: 'FF0F766E' } } : { size: 11 };
  });

  const addTable = (sheetName: string, tableName: string, rows: Record<string, any>[]) => {
    if (!rows.length) return;
    const ws = wb.addWorksheet(sheetName);
    const cols = Object.keys(rows[0]);
    ws.addTable({
      name: tableName,
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: cols.map((name) => ({ name, filterButton: true })),
      rows: rows.map((r) => cols.map((c) => r[c] ?? null)),
    });
    ws.columns = cols.map((c) => ({ width: Math.min(40, Math.max(12, c.length + 6)) }));
  };

  const num = (v: any) => {
    const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  addTable('KPIs', 'KPIs', (input.metrics ?? []).map((m: any) => ({
    KPI: m.label, Value: num(m.value), 'Display value': String(m.value ?? ''), Change: String(m.trend ?? ''),
    Status: m.isPositive ? 'On track' : 'At risk', Sector: input.sector,
  })));
  addTable('Trend', 'Trend', (input.chartData ?? []).filter((d: any) => d && d.value != null).map((d: any) => ({ Period: String(d.name ?? d.date ?? ''), Value: num(d.value) })));
  addTable('Breakdown', 'Breakdown', (input.donutData ?? []).map((d: any) => ({ Category: String(d.name ?? ''), Value: num(d.value) })));
  addTable('Layout', 'Layout', powerBiLayout(input.widgets, input.layout));

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buf], { type: XLSX }), `${baseName}_powerbi.xlsx`);
  // A second download right after the first; browsers allow it from the same click.
  setTimeout(() => {
    downloadBlob(new Blob([JSON.stringify(powerBiTheme(), null, 2)], { type: 'application/json' }), `${baseName}_powerbi_theme.json`);
  }, 400);
}
