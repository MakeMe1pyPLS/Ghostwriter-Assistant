// KPI engine: turns the rows a customer uploaded into real KPI values.
//
// RAW ROWS -> find the columns -> clean the numbers -> calculate -> compare periods.
//
// Rules this file keeps:
//  * It only calculates a KPI when the columns it needs are really there. Otherwise
//    the result says exactly what is missing. It never guesses or fills in sample values.
//  * Every result says which columns it used, how many rows, and what limits apply
//    (skipped rows, a loosely matched column, no dates, and so on).
//  * "Change" compares the latest stretch of dated rows with the stretch before it.
//    Without enough dated rows there is no change, and it says so.
//
// Pure TypeScript with no dependencies, so the browser and the server can share it.

export type KpiUnitKind = '%' | '$' | '#' | 'days' | 'x';
export type KpiStatus = 'ok' | 'needs-data' | 'not-enough-data';
export type Row = Record<string, unknown>;

export type Role =
  | 'revenue' | 'cogs' | 'expenses' | 'netProfit' | 'orders' | 'orderId' | 'sessions' | 'adSpend'
  | 'newCustomers' | 'returns' | 'onTime' | 'orderDate' | 'shipDate' | 'deliveredDate' | 'promisedDate';

interface RoleSpec {
  /** Plain name for messages. */
  name: string;
  /** Normalised header names that clearly mean this role. */
  strong: string[];
  /** Names that often mean it but are ambiguous; used last and flagged. */
  weak?: string[];
  /** Match only the whole header (no "contains" matching). */
  exact?: boolean;
}

const ROLES: Record<Role, RoleSpec> = {
  revenue: { name: 'revenue or sales', strong: ['revenue', 'sales', 'netsales', 'totalsales', 'grosssales', 'ordertotal', 'ordervalue', 'turnover'], weak: ['amount', 'total', 'value'] },
  cogs: { name: 'cost of goods sold', strong: ['cogs', 'costofgoods', 'costofgoodssold', 'costofsales', 'productcost'] },
  expenses: { name: 'operating expenses', strong: ['expenses', 'operatingexpenses', 'opex', 'overhead', 'totalexpenses'] },
  netProfit: { name: 'net profit', strong: ['netprofit', 'netincome'], weak: ['profit'] },
  orders: { name: 'number of orders', strong: ['orders', 'ordercount', 'numorders', 'numberoforders', 'transactions'] },
  orderId: { name: 'an order ID', strong: ['orderid', 'ordernumber', 'orderno', 'transactionid', 'invoiceid', 'invoice', 'order'], exact: true },
  sessions: { name: 'website visits (sessions)', strong: ['sessions', 'visits', 'visitors', 'sitevisits', 'traffic'] },
  adSpend: { name: 'advertising spend', strong: ['adspend', 'advertisingspend', 'marketingspend', 'adcost', 'mediaspend'], weak: ['spend'] },
  newCustomers: { name: 'new customers', strong: ['newcustomers', 'newcustomer', 'customersacquired', 'newbuyers', 'newusers', 'signups'] },
  returns: { name: 'returns', strong: ['returns', 'returnedorders', 'returned', 'refunds'] },
  onTime: { name: 'an on-time yes/no column', strong: ['ontime', 'ontimedelivery', 'deliveredontime', 'isontime', 'ontimeflag'] },
  orderDate: { name: 'an order date', strong: ['orderdate', 'date', 'createdat', 'created', 'day', 'period', 'month', 'timestamp', 'datetime'], exact: true },
  shipDate: { name: 'a ship date', strong: ['shipdate', 'shippeddate', 'shippedat', 'shipped', 'dispatchdate', 'fulfilleddate'], exact: true },
  deliveredDate: { name: 'a delivered date', strong: ['delivereddate', 'deliverydate', 'deliveredat', 'arrivaldate'], exact: true },
  promisedDate: { name: 'a promised or due date', strong: ['promiseddate', 'promisedeliverydate', 'expecteddate', 'duedate', 'eta', 'requireddate', 'promisedby'], exact: true },
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface ColumnMatch { column: string; loose: boolean }
export type ColumnMap = Partial<Record<Role, ColumnMatch>>;

/** Work out which uploaded column plays which role. Exposed so the UI can show it. */
export function mapColumns(headers: string[]): { map: ColumnMap; notes: string[] } {
  const map: ColumnMap = {};
  const notes: string[] = [];
  const used = new Set<string>();
  const normed = headers.map((h) => ({ h, n: norm(h) }));

  for (const role of Object.keys(ROLES) as Role[]) {
    const spec = ROLES[role];
    const free = normed.filter((x) => !used.has(x.h));
    const exactStrong = free.filter((x) => spec.strong.includes(x.n));
    const containsStrong = spec.exact ? [] : free.filter((x) => spec.strong.some((a) => a.length >= 6 && x.n.includes(a)));
    const weak = free.filter((x) => (spec.weak ?? []).includes(x.n));
    const pool = exactStrong.length ? exactStrong : containsStrong.length ? containsStrong : weak;
    if (!pool.length) continue;
    const pick = pool[0];
    map[role] = { column: pick.h, loose: pool === weak };
    used.add(pick.h);
    if (pool.length > 1) notes.push(`Several columns could be ${spec.name} (${pool.map((p) => p.h).join(', ')}). Used "${pick.h}".`);
  }

  // A date column named something like "Invoice Date" that no role claimed can serve as the order date.
  if (!map.orderDate) {
    const d = normed.find((x) => !used.has(x.h) && x.n.endsWith('date'));
    if (d) { map.orderDate = { column: d.h, loose: true }; used.add(d.h); }
  }
  return { map, notes };
}

// ---------------------------------------------------------------- cleaning

/** Parse "$1,234.50", "(12)", "12%", "1 234". Returns null for blanks and text. */
export function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let s = v.trim();
  if (!s || /^(n\/?a|null|none|-|--)$/i.test(s)) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/[$€£,\s%]/g, '');
  if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function parseBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : null;
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'on time', 'ontime', 'on-time'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'late', 'delayed'].includes(s)) return false;
  return null;
}

const DAY = 86_400_000;
/** Dates as epoch ms. Accepts ISO and US-style strings, Date objects and Excel serial numbers. */
export function parseDate(v: unknown): number | null {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : null;
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) return Math.round((v - 25569) * DAY); // Excel serial day
    return null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  // Only text that looks like a date: 2026-09-01, 9/1/2026, Sep 1 2026, 1 Sep 2026.
  if (!/\d{4}-\d{1,2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s)) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  const y = new Date(t).getUTCFullYear();
  return y >= 1990 && y <= 2100 ? t : null;
}

// ---------------------------------------------------------------- calculating

export interface KpiResult {
  id: string;
  label: string;
  unit: KpiUnitKind;
  /** Is a higher number better? */
  direction: 'up' | 'down';
  status: KpiStatus;
  value?: number;
  /** The value ready to show, e.g. "$12,450" or "94.2%". */
  display?: string;
  /** Change between the latest stretch of dated rows and the one before it. */
  change?: { amount: number; kind: 'percent' | 'points'; text: string; better: boolean | null; windowLabel: string };
  /** The formula in plain words. */
  how: string;
  /** Roles to the real column names used. */
  columns: Partial<Record<Role, string>>;
  rowsUsed: number;
  /** Anything the reader should know before trusting the number. */
  limits: string[];
  /** When it could not be calculated: the data it needs. */
  missing?: string[];
}

export interface KpiRun {
  results: KpiResult[];
  rowCount: number;
  columns: ColumnMap;
  notes: string[];
  /** The date range of the dated rows, if any. */
  dateRange?: { from: number; to: number; datedRows: number };
}

type Cols = ColumnMap;

/** Sums and counts over one set of rows, counting what had to be skipped. */
class Agg {
  skipped: Partial<Record<Role, number>> = {};
  constructor(private rows: Row[], private cols: Cols) {}
  get n() { return this.rows.length; }
  has(r: Role) { return !!this.cols[r]; }
  private col(r: Role) { return this.cols[r]!.column; }
  sum(r: Role): number {
    let s = 0, skip = 0;
    for (const row of this.rows) {
      const v = parseNumber(row[this.col(r)]);
      if (v === null) skip++; else s += v;
    }
    if (skip) this.skipped[r] = skip;
    return s;
  }
  distinct(r: Role): number {
    const set = new Set<string>();
    let skip = 0;
    for (const row of this.rows) {
      const v = row[this.col(r)];
      if (v === null || v === undefined || String(v).trim() === '') skip++; else set.add(String(v).trim());
    }
    if (skip) this.skipped[r] = skip;
    return set.size;
  }
  /** Orders: a count column if there is one, otherwise distinct order IDs. */
  orderCount(): number | null {
    if (this.has('orders')) return this.sum('orders');
    if (this.has('orderId')) return this.distinct('orderId');
    return null;
  }
  shareTrue(r: Role): { yes: number; total: number } {
    let yes = 0, total = 0, skip = 0;
    for (const row of this.rows) {
      const b = parseBool(row[this.col(r)]);
      if (b === null) skip++; else { total++; if (b) yes++; }
    }
    if (skip) this.skipped[r] = skip;
    return { yes, total };
  }
  /** Average days between two date columns (skips pairs that are missing or negative). */
  avgDaysBetween(from: Role, to: Role): { avg: number; used: number; negatives: number } {
    let sum = 0, used = 0, neg = 0;
    for (const row of this.rows) {
      const a = parseDate(row[this.col(from)]), b = parseDate(row[this.col(to)]);
      if (a === null || b === null) continue;
      if (b < a) { neg++; continue; }
      sum += (b - a) / DAY; used++;
    }
    return { avg: used ? sum / used : 0, used, negatives: neg };
  }
  onTimeFromDates(): { yes: number; total: number } {
    let yes = 0, total = 0;
    for (const row of this.rows) {
      const d = parseDate(row[this.col('deliveredDate')]), p = parseDate(row[this.col('promisedDate')]);
      if (d === null || p === null) continue;
      total++; if (d <= p + DAY - 1) yes++; // delivered on or before the promised day
    }
    return { yes, total };
  }
}

interface Spec {
  id: string;
  label: string;
  unit: KpiUnitKind;
  direction: 'up' | 'down';
  how: string;
  /** Roles the formula reads, for the "columns used" list. */
  uses: (c: Cols) => Role[];
  /** What is missing, in plain words. Empty means it can be calculated. */
  missing: (c: Cols) => string[];
  /** The number, or null (with a reason) when the data cannot support it. */
  calc: (a: Agg, c: Cols) => { value: number | null; reason?: string };
}

const need = (c: Cols, ...roles: Role[]) => roles.filter((r) => !c[r]).map((r) => ROLES[r].name);
const ordersOrId = (c: Cols) => (c.orders || c.orderId ? [] : ['number of orders (a count column or an order ID column)']);
const ratio = (num: number, den: number, what: string) => (den === 0 ? { value: null, reason: `${what} is zero, so this can't be worked out.` } : { value: num / den });

const SPECS: Spec[] = [
  {
    id: 'revenue', label: 'Revenue', unit: '$', direction: 'up', how: 'Add up the revenue column.',
    uses: () => ['revenue'], missing: (c) => need(c, 'revenue'), calc: (a) => ({ value: a.sum('revenue') }),
  },
  {
    id: 'orders', label: 'Orders', unit: '#', direction: 'up', how: 'Add up the orders column, or count different order IDs.',
    uses: (c) => (c.orders ? ['orders'] : ['orderId']), missing: ordersOrId, calc: (a) => ({ value: a.orderCount() }),
  },
  {
    id: 'aov', label: 'Average order value', unit: '$', direction: 'up', how: 'Revenue divided by number of orders.',
    uses: (c) => ['revenue', c.orders ? 'orders' : 'orderId'],
    missing: (c) => [...need(c, 'revenue'), ...ordersOrId(c)],
    calc: (a) => ratio(a.sum('revenue'), a.orderCount() ?? 0, 'The number of orders'),
  },
  {
    id: 'gross-margin', label: 'Gross margin', unit: '%', direction: 'up', how: '(Revenue minus cost of goods) divided by revenue.',
    uses: () => ['revenue', 'cogs'], missing: (c) => need(c, 'revenue', 'cogs'),
    calc: (a) => { const r = a.sum('revenue'); const x = ratio(r - a.sum('cogs'), r, 'Revenue'); return x.value === null ? x : { value: x.value * 100 }; },
  },
  {
    id: 'net-margin', label: 'Net profit margin', unit: '%', direction: 'up', how: 'Net profit divided by revenue.',
    uses: () => ['netProfit', 'revenue'], missing: (c) => need(c, 'revenue', 'netProfit'),
    calc: (a) => { const x = ratio(a.sum('netProfit'), a.sum('revenue'), 'Revenue'); return x.value === null ? x : { value: x.value * 100 }; },
  },
  {
    id: 'opex-ratio', label: 'Operating expenses ratio', unit: '%', direction: 'down', how: 'Operating expenses divided by revenue.',
    uses: () => ['expenses', 'revenue'], missing: (c) => need(c, 'revenue', 'expenses'),
    calc: (a) => { const x = ratio(a.sum('expenses'), a.sum('revenue'), 'Revenue'); return x.value === null ? x : { value: x.value * 100 }; },
  },
  {
    id: 'conversion', label: 'Conversion rate', unit: '%', direction: 'up', how: 'Orders divided by website visits.',
    uses: (c) => [c.orders ? 'orders' : 'orderId', 'sessions'], missing: (c) => [...ordersOrId(c), ...need(c, 'sessions')],
    calc: (a) => { const x = ratio(a.orderCount() ?? 0, a.sum('sessions'), 'Website visits'); return x.value === null ? x : { value: x.value * 100 }; },
  },
  {
    id: 'roas', label: 'Return on ad spend', unit: 'x', direction: 'up', how: 'Revenue divided by advertising spend.',
    uses: () => ['revenue', 'adSpend'], missing: (c) => need(c, 'revenue', 'adSpend'),
    calc: (a) => ratio(a.sum('revenue'), a.sum('adSpend'), 'Advertising spend'),
  },
  {
    id: 'cac', label: 'Customer acquisition cost', unit: '$', direction: 'down', how: 'Advertising spend divided by new customers.',
    uses: () => ['adSpend', 'newCustomers'], missing: (c) => need(c, 'adSpend', 'newCustomers'),
    calc: (a) => ratio(a.sum('adSpend'), a.sum('newCustomers'), 'New customers'),
  },
  {
    id: 'return-rate', label: 'Return rate', unit: '%', direction: 'down', how: 'Returns divided by orders.',
    uses: (c) => ['returns', c.orders ? 'orders' : 'orderId'], missing: (c) => [...need(c, 'returns'), ...ordersOrId(c)],
    calc: (a) => { const x = ratio(a.sum('returns'), a.orderCount() ?? 0, 'The number of orders'); return x.value === null ? x : { value: x.value * 100 }; },
  },
  {
    id: 'on-time', label: 'On-time delivery rate', unit: '%', direction: 'up',
    how: 'Share of deliveries marked on time, or delivered on or before the promised date.',
    uses: (c) => (c.onTime ? ['onTime'] : ['deliveredDate', 'promisedDate']),
    missing: (c) => (c.onTime || (c.deliveredDate && c.promisedDate) ? [] : ['an on-time yes/no column, or both a delivered date and a promised date']),
    calc: (a, c) => {
      const s = c.onTime ? a.shareTrue('onTime') : a.onTimeFromDates();
      return s.total === 0 ? { value: null, reason: 'No rows had a usable on-time answer or both dates.' } : { value: (s.yes / s.total) * 100 };
    },
  },
  {
    id: 'fulfilment-time', label: 'Order to ship time', unit: 'days', direction: 'down', how: 'Average days from order date to ship date.',
    uses: () => ['orderDate', 'shipDate'], missing: (c) => need(c, 'orderDate', 'shipDate'),
    calc: (a) => { const r = a.avgDaysBetween('orderDate', 'shipDate'); return r.used === 0 ? { value: null, reason: 'No rows had both an order date and a ship date.' } : { value: r.avg }; },
  },
];

// ---------------------------------------------------------------- formatting

export function formatKpiValue(value: number, unit: KpiUnitKind): string {
  const abs = Math.abs(value);
  switch (unit) {
    case '$': return `${value < 0 ? '-' : ''}$${abs >= 100_000 ? Math.round(abs).toLocaleString('en-US') : abs.toLocaleString('en-US', { maximumFractionDigits: abs < 100 ? 2 : 0, minimumFractionDigits: abs < 100 ? 2 : 0 })}`;
    case '%': return `${value.toFixed(1)}%`;
    case 'x': return `${value.toFixed(2)}x`;
    case 'days': return `${value.toFixed(1)} days`;
    default: return Math.round(value).toLocaleString('en-US');
  }
}

// ---------------------------------------------------------------- running it

const MIN_WINDOW_DAYS = 7;

export function calculateKpis(rows: Row[], headersHint?: string[]): KpiRun {
  const clean = (rows ?? []).filter((r) => r && typeof r === 'object');
  const headers = headersHint?.length ? headersHint : Array.from(new Set(clean.flatMap((r) => Object.keys(r))));
  const { map, notes } = mapColumns(headers);

  // Date range and the two comparison windows.
  let dateRange: KpiRun['dateRange'];
  let windows: { cur: Row[]; prev: Row[]; label: string } | null = null;
  if (map.orderDate) {
    const dated = clean.map((r) => ({ r, t: parseDate(r[map.orderDate!.column]) })).filter((x): x is { r: Row; t: number } => x.t !== null);
    if (dated.length >= 2 && dated.length >= clean.length * 0.5) {
      const from = Math.min(...dated.map((x) => x.t)), to = Math.max(...dated.map((x) => x.t));
      dateRange = { from, to, datedRows: dated.length };
      const spanDays = Math.floor((to - from) / DAY) + 1;
      const win = Math.min(30, Math.floor(spanDays / 2));
      if (win >= MIN_WINDOW_DAYS) {
        const curStart = to - (win - 1) * DAY, prevStart = curStart - win * DAY;
        const cur = dated.filter((x) => x.t >= curStart).map((x) => x.r);
        const prev = dated.filter((x) => x.t >= prevStart && x.t < curStart).map((x) => x.r);
        if (cur.length && prev.length) windows = { cur, prev, label: `latest ${win} days vs the ${win} days before` };
      }
    } else if (dated.length < clean.length * 0.5) {
      notes.push(`Only ${dated.length} of ${clean.length} rows had a readable date in "${map.orderDate.column}", so changes over time are not shown.`);
    }
  }

  const results: KpiResult[] = SPECS.map((spec) => {
    const base = { id: spec.id, label: spec.label, unit: spec.unit, direction: spec.direction, how: spec.how };
    const missing = spec.missing(map);
    if (missing.length) return { ...base, status: 'needs-data' as const, columns: {}, rowsUsed: 0, limits: [], missing };

    const used = spec.uses(map);
    const columns: Partial<Record<Role, string>> = {};
    const limits: string[] = [];
    for (const r of used) {
      const m = map[r]!;
      columns[r] = m.column;
      if (m.loose) limits.push(`"${m.column}" was matched as ${ROLES[r].name} by its name. Check that is right.`);
    }

    const a = new Agg(clean, map);
    const out = spec.calc(a, map);
    for (const [r, n] of Object.entries(a.skipped)) limits.push(`${n} row${n === 1 ? '' : 's'} skipped: blank or unreadable "${map[r as Role]!.column}".`);
    if (out.value === null || !Number.isFinite(out.value)) {
      return { ...base, status: 'not-enough-data' as const, columns, rowsUsed: clean.length, limits: [...limits, out.reason ?? 'Not enough usable data.'] };
    }

    const result: KpiResult = { ...base, status: 'ok', value: out.value, display: formatKpiValue(out.value, spec.unit), columns, rowsUsed: clean.length, limits };

    if (windows) {
      const c = spec.calc(new Agg(windows.cur, map), map).value;
      const p = spec.calc(new Agg(windows.prev, map), map).value;
      if (c !== null && p !== null && Number.isFinite(c) && Number.isFinite(p)) {
        const isPct = spec.unit === '%';
        const amount = isPct ? c - p : p === 0 ? NaN : ((c - p) / Math.abs(p)) * 100;
        if (Number.isFinite(amount)) {
          const rounded = Math.round(amount * 10) / 10;
          const better = rounded === 0 ? null : (rounded > 0) === (spec.direction === 'up');
          result.change = {
            amount: rounded, kind: isPct ? 'points' : 'percent', better, windowLabel: windows.label,
            text: `${rounded > 0 ? '+' : ''}${rounded}${isPct ? ' pts' : '%'}`,
          };
        }
      }
    }
    return result;
  });

  return { results, rowCount: clean.length, columns: map, notes, dateRange };
}

/** What each role is called in plain words (for showing "columns used"). */
export const roleName = (r: Role) => ROLES[r].name;

/** The numbers this engine can calculate from an uploaded file, without running it. */
export const CALCULABLE_KPIS: { id: string; label: string; unit: KpiUnitKind; direction: 'up' | 'down'; how: string }[] =
  SPECS.map(({ id, label, unit, direction, how }) => ({ id, label, unit, direction, how }));
