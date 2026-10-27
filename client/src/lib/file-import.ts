// Client-side file import: CSV, Excel (.xlsx) and JSON are parsed in the
// browser, so importing works on any deployment and files never leave the
// device until the user chooses to share them.
import Papa from 'papaparse';
import type { ImportPayload } from '@/components/DatasetImportResolver';

export const ACCEPTED_DATA_FILES = '.csv,.tsv,.txt,.xlsx,.xlsm,.json';
const MAX_BYTES = 25 * 1024 * 1024;

export class ImportError extends Error {}

function inferType(values: any[]): string {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== '').slice(0, 50);
  if (!sample.length) return 'unknown';
  if (sample.every((v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v.replace(/[$,%\s]/g, '')))))) return 'number';
  if (sample.every((v) => typeof v === 'boolean' || /^(true|false|yes|no)$/i.test(String(v)))) return 'boolean';
  if (sample.every((v) => v instanceof Date || (typeof v === 'string' && /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v) && !isNaN(Date.parse(v))))) return 'date';
  return 'string';
}

/** "$12,450.50" → 12450.5, "94.5%" → 94.5, "(1,200)" → -1200. null if it isn't a number. */
export function toNumber(v: any): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let t = v.trim();
  if (!t) return null;
  const negative = /^\(.*\)$/.test(t);
  t = t.replace(/^\(|\)$/g, '').replace(/[$€£¥%,\s]/g, '');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? (negative ? -n : n) : null;
}

function toIsoDate(v: any): any {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v !== 'string' || !v.trim()) return v;
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const y = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${y}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
}

function cleanHeader(h: any, i: number, seen: Set<string>): string {
  let name = String(h ?? '').trim() || `Column ${i + 1}`;
  let n = 2;
  const base = name;
  while (seen.has(name)) name = `${base} (${n++})`;
  seen.add(name);
  return name;
}

function toPayload(name: string, rows: Record<string, any>[], sourceType: ImportPayload['sourceType'], notes: string[] = []): ImportPayload {
  const cleaned = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ''));
  if (!cleaned.length) throw new ImportError('The file has no data rows. Check that the first row holds column names and data starts on row 2.');
  const names = Array.from(new Set(cleaned.flatMap((r) => Object.keys(r))));
  const columns = names.map((n) => ({ name: n, type: inferType(cleaned.map((r) => r[n])) }));
  // Store money, percents and dates as real values so charts and KPIs can use them.
  for (const col of columns) {
    if (col.type === 'number') for (const r of cleaned) { const n = toNumber(r[col.name]); if (n !== null) r[col.name] = n; }
    if (col.type === 'date') for (const r of cleaned) r[col.name] = toIsoDate(r[col.name]);
  }
  return { defaultName: name, columns, rows: cleaned, rowCount: cleaned.length, sourceType, notes };
}

const TOTAL_ROW = /^(grand\s+)?(sub)?totals?\b/i;

/** Drops "Total" rows at the end of a table (they would double-count in charts). */
function dropTotals(rows: Record<string, any>[], notes: string[]) {
  let dropped = 0;
  while (rows.length) {
    const first = Object.values(rows[rows.length - 1]).find((v) => v !== null && v !== undefined && String(v).trim() !== '');
    if (first === undefined) { rows.pop(); continue; }
    if (!TOTAL_ROW.test(String(first).trim())) break;
    rows.pop(); dropped++;
  }
  if (dropped) notes.push(`Left out ${dropped === 1 ? 'the "Total" row' : `${dropped} total rows`} at the bottom so totals aren't counted twice.`);
}

async function parseDelimited(file: File): Promise<ImportPayload> {
  const text = await file.text();
  const result = Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
    // Papa Parse may call transformHeader more than once per column, so cache
    // the cleaned name by column index (otherwise every header became "Name (2)").
    transformHeader: (() => {
      const seen = new Set<string>();
      const byIndex = new Map<number, string>();
      return (h: string, index: number) => {
        if (!byIndex.has(index)) byIndex.set(index, cleanHeader(h, index, seen));
        return byIndex.get(index)!;
      };
    })(),
  });
  if (result.errors.length && !result.data.length) throw new ImportError(`Could not read the file: ${result.errors[0].message}`);
  const notes: string[] = [];
  // A row with more values than column names usually has an unquoted comma
  // (Acme, Inc.). Its values would land in the wrong columns, so leave it out
  // and say which one.
  const bad: string[] = [];
  const rows = result.data.filter((r) => {
    if (!('__parsed_extra' in r)) return true;
    const first = Object.values(r).find((v) => v !== null && v !== undefined && String(v).trim() !== '');
    bad.push(String(first ?? '').slice(0, 30));
    return false;
  });
  if (bad.length) {
    const which = bad.slice(0, 3).map((b) => `"${b}"`).join(', ') + (bad.length > 3 ? ` and ${bad.length - 3} more` : '');
    notes.push(`Left out ${bad.length === 1 ? '1 row' : `${bad.length} rows`} with more values than columns (starting ${which}). This usually means a comma inside a value, like Acme, Inc. Put that value in quotes, or save the file from Excel as CSV, and import again.`);
  }
  dropTotals(rows, notes);
  return toPayload(baseName(file.name), rows, 'csv', notes);
}

async function parseExcel(file: File): Promise<ImportPayload> {
  const ExcelJS: any = (await import('exceljs')).default ?? (await import('exceljs'));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  // Use the sheet with the most filled rows (dashboards often have a cover sheet first).
  const sheets: any[] = wb.worksheets.filter((ws: any) => ws.state !== 'hidden');
  if (!sheets.length) throw new ImportError('The workbook has no visible sheets.');
  const sheet = sheets.reduce((best, ws) => (ws.actualRowCount > best.actualRowCount ? ws : best), sheets[0]);

  const notes: string[] = [];
  let unsavedFormulas = 0;
  const cellValue = (v: any, counting = false): any => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') {
      if ('formula' in v || 'sharedFormula' in v) {           // formula: use the saved result
        if (v.result === undefined || v.result === null) { if (counting) unsavedFormulas++; return null; }
        return cellValue(v.result);
      }
      if ('result' in v) return cellValue(v.result);
      if ('richText' in v) return v.richText.map((t: any) => t.text).join('');
      if ('text' in v) return cellValue(v.text);               // hyperlink
      return null;                                            // errors (#DIV/0!) and anything unknown
    }
    return v;
  };
  const rowValues = (r: number, counting = false) => (sheet.getRow(r).values as any[]).slice(1).map((v) => cellValue(v, counting));
  const filled = (vals: any[]) => vals.filter((v) => v !== null && String(v).trim() !== '');

  // Header row: skip title rows above the table. A merged title repeats one
  // value across its cells, so count distinct values, and take the first row
  // that is nearly as wide as the widest of the first 20.
  const scan = Math.min(sheet.rowCount, 20);
  const widths: number[] = [];
  for (let r = 1; r <= scan; r++) widths[r] = new Set(filled(rowValues(r)).map(String)).size;
  const widest = Math.max(0, ...widths.slice(1));
  let headerRowNo = 1;
  for (let r = 1; r <= scan; r++) if (widths[r] >= Math.max(2, Math.ceil(widest * 0.6))) { headerRowNo = r; break; }
  // A one-cell title above the table makes a better dataset name than the file name.
  let title = '';
  for (let r = 1; r < headerRowNo; r++) { const v = filled(rowValues(r)); if (v.length && new Set(v.map(String)).size === 1) { title = String(v[0]).trim(); break; } }
  const seen = new Set<string>();
  const headerVals = (sheet.getRow(headerRowNo).values as any[]).slice(1).map(cellValue);
  const headers = headerVals.map((h, i) => cleanHeader(h, i, seen));
  const rows: Record<string, any>[] = [];
  for (let r = headerRowNo + 1; r <= sheet.rowCount; r++) {
    const vals = rowValues(r, true);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? null; });
    rows.push(row);
  }
  dropTotals(rows, notes);
  if (unsavedFormulas) notes.push(`${unsavedFormulas} formula ${unsavedFormulas === 1 ? 'cell has' : 'cells have'} no saved result, so ${unsavedFormulas === 1 ? 'it is' : 'they are'} blank here. Open the file in Excel, save it, and import again to bring those values in.`);
  if (sheets.length > 1) notes.push(`Imported the sheet "${sheet.name}" (it has the most rows). Other sheets: ${sheets.filter((w) => w !== sheet).map((w) => `"${w.name}"`).join(', ')}.`);
  const name = title || `${baseName(file.name)}${sheets.length > 1 ? ` · ${sheet.name}` : ''}`;
  return toPayload(name.slice(0, 80), rows, 'excel', notes);
}

async function parseJson(file: File): Promise<ImportPayload> {
  let data: any;
  try { data = JSON.parse(await file.text()); } catch { throw new ImportError('The file is not valid JSON.'); }
  const flatten = (obj: any, prefix = ''): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
      else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
    }
    return out;
  };
  let arr: any[] | null = Array.isArray(data) ? data : null;
  if (!arr && data && typeof data === 'object') {
    const key = Object.keys(data).find((k) => Array.isArray(data[k]) && data[k].length && typeof data[k][0] === 'object');
    if (key) arr = data[key];
  }
  if (!arr) arr = [data];
  return toPayload(baseName(file.name), arr.map((x) => (x && typeof x === 'object' ? flatten(x) : { value: x })), 'json');
}

function baseName(n: string) {
  return n.replace(/\.[^.]+$/, '');
}

export async function parseDataFile(file: File): Promise<ImportPayload> {
  if (file.size > MAX_BYTES) throw new ImportError('That file is larger than 25 MB. Split it or export a smaller date range.');
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (['csv', 'tsv', 'txt'].includes(ext)) return parseDelimited(file);
  if (['xlsx', 'xlsm'].includes(ext)) return parseExcel(file);
  if (ext === 'json') return parseJson(file);
  if (ext === 'xls') throw new ImportError('Older .xls files are not supported. In Excel, choose File → Save As → Excel Workbook (.xlsx), then import again.');
  throw new ImportError('Choose a CSV, Excel (.xlsx) or JSON file.');
}
