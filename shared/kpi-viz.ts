// Picks the right visual for a KPI from the KPI library, from its unit, name and
// direction. Used by the Builder's card library so every KPI lands on the grid
// as the chart that reads best for it.
import type { IndustryKpi } from './kpi-industries';

export type KpiVizType = 'kpi' | 'progress' | 'trend' | 'bar';

export interface KpiViz {
  /** Widget type the Builder adds. */
  type: KpiVizType;
  /** Chart style for trend widgets. */
  chartType?: 'area' | 'line' | 'bar' | 'progress';
  /** Plain name shown in the library ("Gauge", "Line chart"…). */
  label: string;
  /** Default size in classic grid cells (12 columns across). */
  w: number;
  h: number;
  /** One line on why this visual fits. */
  why: string;
}

const has = (name: string, ...words: string[]) => words.some((w) => name.includes(w));

export function vizForKpi(kpi: Pick<IndustryKpi, 'name' | 'unit' | 'direction' | 'category'>): KpiViz {
  const n = kpi.name.toLowerCase();

  // Money that builds up over time reads best as a trend.
  if (kpi.unit === '$' && has(n, 'revenue', 'sales', 'income', 'bookings', 'mrr', 'arr', 'gmv', 'spend', 'payroll')) {
    return { type: 'trend', chartType: 'area', label: 'Area chart', w: 4, h: 3, why: 'Totals that build up over time show best as a trend.' };
  }
  // Volumes and counts compare well as bars.
  if (kpi.unit === '#' && has(n, 'orders', 'volume', 'units', 'visits', 'sessions', 'tickets', 'leads', 'shipments', 'deliveries', 'bookings', 'covers', 'calls', 'appointments', 'signups', 'downloads', 'jobs')) {
    return { type: 'bar', chartType: 'bar', label: 'Bar chart', w: 4, h: 3, why: 'Counts per period compare well side by side.' };
  }
  // Rates with a natural 0–100% target read like a gauge.
  if (kpi.unit === '%' && !has(n, 'growth', 'change', 'margin', 'churn', 'return on', 'roi', 'roas')
    && has(n, 'on-time', 'on time', 'utilization', 'utilisation', 'occupancy', 'accuracy', 'fill rate', 'yield', 'uptime', 'adherence', 'completion', 'compliance', 'availability', 'attendance', 'retention', 'resolution', 'perfect order', 'first-time', 'first time', 'capacity', 'efficiency', 'oee', 'satisfaction')) {
    return { type: 'progress', chartType: 'progress', label: 'Gauge', w: 2, h: 3, why: 'A rate toward 100% reads at a glance as a gauge.' };
  }
  // Margins and growth rates: a line shows the direction.
  if (kpi.unit === '%' && has(n, 'growth', 'margin', 'conversion', 'churn', 'rate')) {
    return { type: 'trend', chartType: 'line', label: 'Line chart', w: 4, h: 3, why: 'Rates matter most for their direction over time.' };
  }
  // Everything else: a KPI card with the value, change and a short reason.
  return { type: 'kpi', label: 'KPI card', w: 2, h: 2, why: 'One headline number with its change vs last period.' };
}

/** Normalised name for matching a library KPI to a metric in the user's data. */
export const kpiKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
