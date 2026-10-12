// Export with a browser fallback. The server renders the richest files (the
// styled Excel workbook); when it is unreachable the browser builds the same
// CSV/JSON files and a clean multi-sheet Excel workbook itself.
import { generateCsvExport } from '@shared/exporters/csv-exporter';
import { generateJsonExport } from '@shared/exporters/json-exporter';
import { generateDatasetExport, generateDatasetCsv } from '@shared/exporters/dataset-exporter';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function tryServer(path: string, body: unknown): Promise<Blob | null> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const type = res.headers.get('content-type') || '';
    // A frontend-only host answers /api/* with index.html: treat that as "no server".
    if (!res.ok || type.includes('text/html')) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

const csvBlob = (text: string) => new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
const jsonBlob = (obj: unknown) => new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });

export async function exportCsv(body: { metrics: any[]; chartData?: any[]; sector?: string; dateRange?: string }, filename: string) {
  const blob = (await tryServer('/api/export/csv', body)) ?? csvBlob(generateCsvExport(body));
  downloadBlob(blob, filename);
}

export async function exportJsonSpec(body: any, filename: string) {
  const blob = (await tryServer('/api/export/json', body)) ?? jsonBlob(generateJsonExport(body));
  downloadBlob(blob, filename);
}

export async function exportDataset(body: { metrics: any[]; chartData?: any[]; donutData?: any[]; sector?: string; dateRange?: string }, format: 'json' | 'csv', filename: string) {
  const blob = (await tryServer('/api/export/dataset', { ...body, format }))
    ?? (format === 'csv' ? csvBlob(generateDatasetCsv(body)) : jsonBlob(generateDatasetExport(body)));
  downloadBlob(blob, filename);
}

/** Builds a simple, well-formatted workbook in the browser. */
export async function buildBasicWorkbook(sheets: { name: string; rows: Record<string, any>[] }[]): Promise<Blob> {
  const mod: any = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ChainInsideIQ';
  wb.created = new Date();
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    const cols = Array.from(new Set(sheet.rows.flatMap((r) => Object.keys(r))));
    ws.columns = cols.map((c) => ({ header: c, key: c, width: Math.min(48, Math.max(12, c.length + 4)) }));
    sheet.rows.forEach((r) => ws.addRow(r));
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportExcel(serverPayload: any, fallback: { metrics: any[]; chartData?: any[]; donutData?: any[] }, filename: string) {
  let blob = await tryServer('/api/export/excel', serverPayload);
  // Same layout-matching dashboard the server makes, built in the browser.
  if (!blob && serverPayload?.widgets?.length) {
    try {
      const { buildDashboardWorkbook } = await import('@/lib/bi-export');
      blob = await buildDashboardWorkbook(serverPayload);
    } catch (e) {
      console.warn('[export] dashboard workbook failed, using the simple workbook', e);
    }
  }
  if (!blob) {
    blob = await buildBasicWorkbook([
      { name: 'KPIs', rows: (fallback.metrics || []).map((m: any) => ({ KPI: m.label, Value: m.value, Trend: m.trend, Direction: m.isPositive ? 'Favorable' : 'Unfavorable' })) },
      { name: 'Trend', rows: fallback.chartData || [] },
      { name: 'Breakdown', rows: fallback.donutData || [] },
    ].filter((s) => s.rows.length));
  }
  downloadBlob(blob, filename);
}
