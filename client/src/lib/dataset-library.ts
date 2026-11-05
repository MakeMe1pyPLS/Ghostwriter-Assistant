import type { Sector } from "@/hooks/use-dashboard-store";
import { calculateKpis } from "@shared/kpi-engine";

export interface ManagedDatasetColumn {
  name: string;
  type?: string;
}

export interface ManagedDataset {
  id: string;
  name: string;
  sector: Sector;
  columns: ManagedDatasetColumn[];
  rows: Record<string, any>[];
  rowCount: number;
  sourceType: 'csv' | 'excel' | 'json' | 'sql' | 'google-sheets' | 'api';
  createdAt: number;
  archived: boolean;
}

/** Maximum rows persisted per dataset to keep localStorage within sane bounds. */
export const MAX_PERSISTED_ROWS = 1000;

export const SECTOR_LABELS: Record<Sector, string> = {
  ecommerce: 'E-Commerce',
  logistics: 'Logistics',
  manufacturing: 'Manufacturing',
  unified: 'Unified Supply Chain',
  custom: 'Custom',
};

/**
 * Sector classification keyword dictionary. Matched as case-insensitive
 * substrings against column names. Deterministic and fully offline.
 */
const SECTOR_KEYWORDS: Record<Exclude<Sector, 'custom'>, string[]> = {
  ecommerce: [
    'order', 'revenue', 'sales', 'product', 'sku', 'customer', 'cart',
    'checkout', 'aov', 'conversion', 'price', 'discount', 'coupon', 'store',
    'gmv', 'basket', 'refund', 'return', 'campaign', 'roas', 'cart_value',
  ],
  logistics: [
    'shipment', 'ship', 'delivery', 'deliver', 'carrier', 'transit', 'freight',
    'warehouse', 'route', 'tracking', 'dispatch', 'fulfillment', 'lane', 'port',
    'eta', 'package', 'parcel', 'mile', 'depot', 'cargo',
  ],
  manufacturing: [
    'production', 'produce', 'unit', 'defect', 'yield', 'downtime', 'throughput',
    'machine', 'batch', 'assembly', 'scrap', 'quality', 'oee', 'capacity',
    'output', 'factory', 'plant', 'line', 'shift',
  ],
  unified: [
    'bullwhip', 'cash-to-cash', 'cash_to_cash', 'perfect order', 'perfect_order',
    'atp', 'supply chain', 'supply_chain', 'cross-sector', 'cross_sector',
    'inventory turnover', 'inventory_turnover', 'end-to-end',
  ],
};

export interface SectorDetection {
  sector: Sector;
  confidence: 'high' | 'medium' | 'low';
  matchedColumns: string[];
}

/**
 * Deterministically infer the most likely sector for a dataset from its column
 * names. No network calls, no AI. Returns 'custom' when nothing matches.
 */
export function classifySector(columnNames: string[]): SectorDetection {
  const normalized = columnNames.map((c) => String(c).toLowerCase().trim());
  const scores: Record<string, number> = { ecommerce: 0, logistics: 0, manufacturing: 0, unified: 0 };
  const matched: Record<string, Set<string>> = {
    ecommerce: new Set(), logistics: new Set(), manufacturing: new Set(), unified: new Set(),
  };

  for (const col of normalized) {
    if (!col) continue;
    (Object.keys(SECTOR_KEYWORDS) as Array<keyof typeof SECTOR_KEYWORDS>).forEach((sec) => {
      for (const kw of SECTOR_KEYWORDS[sec]) {
        if (col.includes(kw)) {
          scores[sec] += 1;
          matched[sec].add(col);
          break; // count each column at most once per sector
        }
      }
    });
  }

  let best: Exclude<Sector, 'custom'> | null = null;
  let bestScore = 0;
  let secondScore = 0;
  (Object.keys(scores) as Array<Exclude<Sector, 'custom'>>).forEach((sec) => {
    if (scores[sec] > bestScore) {
      secondScore = bestScore;
      bestScore = scores[sec];
      best = sec;
    } else if (scores[sec] > secondScore) {
      secondScore = scores[sec];
    }
  });

  if (!best || bestScore === 0) {
    return { sector: 'custom', confidence: 'low', matchedColumns: [] };
  }

  const lead = bestScore - secondScore;
  const confidence: SectorDetection['confidence'] =
    bestScore >= 3 && lead >= 2 ? 'high' : bestScore >= 2 ? 'medium' : 'low';

  return { sector: best, confidence, matchedColumns: Array.from(matched[best]) };
}

/** Derive simple metric cards from the first row of a dataset's rows. */
/**
 * Real KPIs from an uploaded dataset. Each value comes from the shared KPI engine,
 * which only calculates what your columns support and says how it did it. If none of
 * your columns match a KPI, the first few columns are shown as plain values, labelled
 * as such (never as a KPI with a trend).
 */
export function deriveMetricsFromRows(
  rows: Record<string, any>[],
  sector: Sector,
  totalRows?: number,
): Array<{ category: Sector; label: string; value: string; trend: string; isPositive: boolean; helpText: string }> {
  if (!rows || rows.length === 0) return [];
  const run = calculateKpis(rows);
  const ok = run.results.filter((r) => r.status === 'ok');
  if (ok.length > 0) {
    const partial = totalRows && totalRows > rows.length ? ` Only ${rows.length.toLocaleString()} of ${totalRows.toLocaleString()} rows are kept in this browser.` : '';
    return ok.map((r) => ({
      category: sector,
      label: r.label,
      value: r.display ?? '',
      trend: r.change?.text ?? '—',
      isPositive: r.change ? r.change.better !== false : true,
      helpText: `${r.how} Calculated from your file: ${r.rowsUsed.toLocaleString()} rows${r.change ? `, change is the ${r.change.windowLabel}` : ', no change shown (needs dated rows over two weeks or more)'}.${partial}`,
    }));
  }
  const firstRow = rows[0];
  return Object.keys(firstRow).slice(0, 4).map((key) => ({
    category: sector,
    label: key,
    value: String(firstRow[key]),
    trend: '—',
    isPositive: true,
    helpText: `The first value in your column "${key}". We could not match your columns to a KPI yet. See Data Sources, "What we calculated", for what each KPI needs.`,
  }));
}

export function deriveChartFromRows(
  rows: Record<string, any>[],
): Array<{ name: string; value: number }> | null {
  if (!rows || rows.length === 0) return null;
  const firstRow = rows[0];
  const firstNumericKey = Object.keys(firstRow).find((k) => !isNaN(Number(firstRow[k])) && firstRow[k] !== '' && firstRow[k] !== null);
  const firstStringKey = Object.keys(firstRow).find((k) => isNaN(Number(firstRow[k])));
  if (!firstNumericKey || !firstStringKey) return null;
  return rows.slice(0, 30).map((row, i) => ({
    name: String(row[firstStringKey] ?? `Row ${i}`),
    value: Number(row[firstNumericKey]) || 0,
  }));
}
