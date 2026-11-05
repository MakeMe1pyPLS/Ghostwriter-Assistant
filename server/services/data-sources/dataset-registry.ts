import { randomUUID } from 'crypto';

export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  sample?: any;
}

export interface Dataset {
  id: string;
  name: string;
  source_type: 'csv' | 'sql' | 'google-sheets' | 'api';
  columns: DatasetColumn[];
  rows: Record<string, any>[];
  row_count: number;
  created_at: string;
  source_meta?: Record<string, any>;
}

// Rows the server read while importing, kept briefly so the browser can fetch them in pages.
// The browser keeps its own copy, so these are removed after an hour and the store is capped.
// Ids are random and are never listed: knowing the id is what allows reading the rows.
const datasets: Map<string, Dataset> = new Map();
const KEEP_MS = 60 * 60 * 1000;
const KEEP_MAX = 100;
const addedAt = new Map<string, number>();

export function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'unknown' {
  const samples = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 20);
  if (samples.length === 0) return 'unknown';

  const allNumbers = samples.every(v => !isNaN(Number(v)));
  if (allNumbers) return 'number';

  const allBooleans = samples.every(v => ['true', 'false', '0', '1'].includes(String(v).toLowerCase()));
  if (allBooleans) return 'boolean';

  const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
  const allDates = samples.every(v => datePattern.test(String(v)));
  if (allDates) return 'date';

  return 'string';
}

export function inferColumns(rows: Record<string, any>[]): DatasetColumn[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map(name => ({
    name,
    type: detectColumnType(rows.map(r => r[name])),
    sample: rows[0][name]
  }));
}

export function registerDataset(ds: Omit<Dataset, 'id' | 'created_at' | 'row_count'>): Dataset {
  sweep();
  const id = `ds_${randomUUID()}`;
  const dataset: Dataset = {
    ...ds,
    id,
    row_count: ds.rows.length,
    created_at: new Date().toISOString()
  };
  datasets.set(id, dataset);
  addedAt.set(id, Date.now());
  return dataset;
}

export function getDataset(id: string): Dataset | undefined {
  return datasets.get(id);
}

function sweep() {
  const now = Date.now();
  addedAt.forEach((t, id) => { if (now - t > KEEP_MS) { datasets.delete(id); addedAt.delete(id); } });
  while (datasets.size >= KEEP_MAX) {
    const oldest = datasets.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    datasets.delete(oldest); addedAt.delete(oldest);
  }
}

export function getDatasetRows(id: string, limit = 100, offset = 0): Record<string, any>[] {
  const ds = datasets.get(id);
  if (!ds) return [];
  return ds.rows.slice(offset, offset + limit);
}