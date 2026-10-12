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

function cleanHeader(h: any, i: number, seen: Set<string>): string {
  let name = String(h ?? '').trim() || `Column ${i + 1}`;
  let n = 2;
  const base = name;
  while (seen.has(name)) name = `${base} (${n++})`;
  seen.add(name);
  return name;
}

function toPayload(name: string, rows: Record<string, any>[], sourceType: ImportPayload['sourceType']): ImportPayload {
  const cleaned = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ''));
  if (!cleaned.length) throw new ImportError('The file has no data rows. Check that the first row holds column names and data starts on row 2.');
  const names = Array.from(new Set(cleaned.flatMap((r) => Object.keys(r))));
  const columns = names.map((n) => ({ name: n, type: inferType(cleaned.map((r) => r[n])) }));
  return { defaultName: name, columns, rows: cleaned, rowCount: cleaned.length, sourceType };
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
  return toPayload(baseName(file.name), result.data, 'csv');
}

async function parseExcel(file: File): Promise<ImportPayload> {
  const ExcelJS: any = (await import('exceljs')).default ?? (await import('exceljs'));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  // Use the sheet with the most filled rows (dashboards often have a cover sheet first).
  const sheets: any[] = wb.worksheets.filter((ws: any) => ws.state !== 'hidden');
  if (!sheets.length) throw new ImportError('The workbook has no visible sheets.');
  const sheet = sheets.reduce((best, ws) => (ws.actualRowCount > best.actualRowCount ? ws : best), sheets[0]);

  const cellValue = (v: any): any => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') {
      if ('result' in v) return cellValue(v.result);        // formula
      if ('richText' in v) return v.richText.map((t: any) => t.text).join('');
      if ('text' in v) return v.text;                        // hyperlink
      if ('error' in v) return null;
    }
    return v;
  };

  // Header row = first row with at least two non-empty cells.
  let headerRowNo = 1;
  for (let r = 1; r <= Math.min(sheet.rowCount, 20); r++) {
    const vals = (sheet.getRow(r).values as any[]).slice(1).map(cellValue).filter((v) => v !== null && String(v).trim() !== '');
    if (vals.length >= 2) { headerRowNo = r; break; }
  }
  const seen = new Set<string>();
  const headerVals = (sheet.getRow(headerRowNo).values as any[]).slice(1).map(cellValue);
  const headers = headerVals.map((h, i) => cleanHeader(h, i, seen));
  const rows: Record<string, any>[] = [];
  for (let r = headerRowNo + 1; r <= sheet.rowCount; r++) {
    const vals = (sheet.getRow(r).values as any[]).slice(1).map(cellValue);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? null; });
    rows.push(row);
  }
  return toPayload(`${baseName(file.name)}${sheets.length > 1 ? ` · ${sheet.name}` : ''}`, rows, 'excel');
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
