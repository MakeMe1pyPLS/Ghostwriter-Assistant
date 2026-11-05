// Possible links between numbers from different parts of the business, for
// example "in weeks when ad spend was higher, on-time delivery tended to be lower".
//
// What this is: a careful pattern check on the person's own uploaded rows.
// What this is NOT: proof of cause. Every link is worded "possible link, not
// proven" and says what else could explain it.
//
// To keep chance matches out, it:
// - needs at least 8 weeks of data,
// - only compares numbers from different areas (sales, marketing, operations, finance),
// - uses a strict strength threshold that rises as more pairs are checked,
// - ignores matches that exist only because two numbers both drift up or down over time
//   (week-to-week changes must agree, and the match must survive removing each number's drift),
// - skips numbers that barely move.
//
// Pure TypeScript with no dependencies.
import { calculateKpis, mapColumns, parseDate, type Row } from './kpi-engine';
import type { Confidence } from './insight';

const DAY = 86400000;
const WEEK = 7 * DAY;
/** 1970-01-05 was a Monday: the offset that makes weeks start on Monday. */
const MONDAY = 4 * DAY;

export type Area = 'Sales' | 'Marketing' | 'Operations' | 'Finance';

export const KPI_AREA: Record<string, Area> = {
  revenue: 'Sales', orders: 'Sales', aov: 'Sales',
  conversion: 'Marketing', roas: 'Marketing', cac: 'Marketing',
  'return-rate': 'Operations', 'on-time': 'Operations', 'fulfilment-time': 'Operations',
  'gross-margin': 'Finance', 'net-margin': 'Finance', 'opex-ratio': 'Finance',
};

/** The columns each KPI is calculated from. Two KPIs that share one are linked by arithmetic, not by the business. */
const KPI_INPUTS: Record<string, string[]> = {
  revenue: ['revenue'], orders: ['orders'], aov: ['revenue', 'orders'],
  conversion: ['orders', 'sessions'], roas: ['revenue', 'adSpend'], cac: ['adSpend', 'newCustomers'],
  'return-rate': ['returns', 'orders'], 'on-time': ['onTime', 'dates'], 'fulfilment-time': ['dates'],
  'gross-margin': ['revenue', 'cogs'], 'net-margin': ['revenue', 'netProfit'], 'opex-ratio': ['revenue', 'expenses'],
};
const shareInput = (a: string, b: string) => (KPI_INPUTS[a] ?? []).some((x) => (KPI_INPUTS[b] ?? []).includes(x));

export interface WeeklySeries {
  /** Start of each week (UTC ms), oldest first. */
  weeks: number[];
  /** KPI id to one value per week (null when that week could not be calculated). */
  series: Record<string, (number | null)[]>;
  labels: Record<string, string>;
  rowsPerWeek: number[];
}

export interface PossibleLink {
  id: string;
  a: { id: string; label: string; area: Area };
  b: { id: string; label: string; area: Area };
  /** 0 = same week; 1 = a this week vs b the following week. */
  lagWeeks: 0 | 1;
  /** Correlation between -1 and 1. */
  r: number;
  weeks: number;
  direction: 'together' | 'opposite';
  confidence: Confidence;
  confidenceReason: string;
  /** One plain sentence: what moved with what. */
  sentence: string;
  /** What else could explain it. */
  otherExplanations: string;
  /** A check the person can do, not an instruction to change anything. */
  check: string;
}

export interface LinksReport {
  status: 'ok' | 'not-enough-data' | 'no-dates';
  weeksUsed: number;
  links: PossibleLink[];
  notes: string[];
  pairsChecked: number;
}

const MIN_WEEKS = 8;
const MIN_ROWS_PER_WEEK = 5;

/** Split rows into weeks and calculate each KPI for each week with the same KPI engine. */
export function weeklySeries(rows: Row[], headersHint?: string[]): WeeklySeries | null {
  const clean = (rows ?? []).filter((r) => r && typeof r === 'object');
  const headers = headersHint?.length ? headersHint : Array.from(new Set(clean.flatMap((r) => Object.keys(r))));
  const { map } = mapColumns(headers);
  if (!map.orderDate) return null;
  const col = map.orderDate.column;
  const byWeek = new Map<number, Row[]>();
  for (const r of clean) {
    const t = parseDate(r[col]);
    if (t === null) continue;
    const wk = Math.floor((t - MONDAY) / WEEK) * WEEK + MONDAY; // weeks start on Monday
    const list = byWeek.get(wk);
    if (list) list.push(r); else byWeek.set(wk, [r]);
  }
  let weeks = [...byWeek.keys()].sort((a, b) => a - b);
  if (!weeks.length) return null;
  // The first and last week of a file are often cut short. A short week looks like a crash in
  // every total, which would create false patterns, so drop an edge week that has under 70% of the usual rows.
  const counts = weeks.map((w) => byWeek.get(w)!.length).sort((a, b) => a - b);
  const typical = counts[Math.floor(counts.length / 2)];
  while (weeks.length > 2 && byWeek.get(weeks[0])!.length < typical * 0.7) { byWeek.delete(weeks[0]); weeks = weeks.slice(1); }
  while (weeks.length > 2 && byWeek.get(weeks[weeks.length - 1])!.length < typical * 0.7) { byWeek.delete(weeks[weeks.length - 1]); weeks = weeks.slice(0, -1); }
  // Fill gaps so a missing week is a gap, not squashed together.
  const all: number[] = [];
  for (let w = weeks[0]; w <= weeks[weeks.length - 1]; w += WEEK) all.push(w);
  const series: Record<string, (number | null)[]> = {};
  const labels: Record<string, string> = {};
  const rowsPerWeek: number[] = [];
  all.forEach((w, i) => {
    const wr = byWeek.get(w) ?? [];
    rowsPerWeek.push(wr.length);
    const run = wr.length >= MIN_ROWS_PER_WEEK ? calculateKpis(wr, headers) : null;
    for (const id of Object.keys(KPI_AREA)) {
      (series[id] ??= new Array(all.length).fill(null));
      const res = run?.results.find((x) => x.id === id);
      if (res && res.status === 'ok' && res.value !== undefined && Number.isFinite(res.value)) {
        series[id][i] = res.value;
        labels[id] = res.label;
      }
    }
  });
  return { weeks: all, series, labels, rowsPerWeek };
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) return null;
  const r = sxy / Math.sqrt(sxx * syy);
  return Number.isFinite(r) ? Math.max(-1, Math.min(1, r)) : null;
}

/** Aligned pairs: a[i] with b[i + lag], dropping weeks where either is missing. */
function pairs(a: (number | null)[], b: (number | null)[], lag: 0 | 1): { x: number[]; y: number[]; dx: number[]; dy: number[]; at: number[] } {
  const x: number[] = [], y: number[] = [], dx: number[] = [], dy: number[] = [], at: number[] = [];
  let prev: [number, number] | null = null;
  for (let i = 0; i + lag < a.length; i++) {
    const va = a[i], vb = b[i + lag];
    if (va === null || vb === null) { prev = null; continue; }
    x.push(va); y.push(vb); at.push(i);
    if (prev) { dx.push(va - prev[0]); dy.push(vb - prev[1]); }
    prev = [va, vb];
  }
  return { x, y, dx, dy, at };
}

/** What is left of a series after removing its steady drift over time (a straight line through the weeks). */
function detrend(vals: number[], at: number[]): number[] {
  const n = vals.length;
  const mt = at.reduce((s, v) => s + v, 0) / n, mv = vals.reduce((s, v) => s + v, 0) / n;
  let stt = 0, stv = 0;
  for (let i = 0; i < n; i++) { stt += (at[i] - mt) ** 2; stv += (at[i] - mt) * (vals[i] - mv); }
  const slope = stt === 0 ? 0 : stv / stt;
  return vals.map((v, i) => v - (mv + slope * (at[i] - mt)));
}

/** How little a series may vary before we ignore it (relative to its size). */
function barelyMoves(vals: (number | null)[]): boolean {
  const v = vals.filter((x): x is number => x !== null);
  if (v.length < 2) return true;
  const mean = v.reduce((s, a) => s + a, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, a) => s + (a - mean) ** 2, 0) / v.length);
  return sd === 0 || sd < Math.abs(mean) * 0.01;
}

/** Strength needed so a match is unlikely to be chance, even after checking many pairs (z = 3.3, about 1 in 1,000). */
export function requiredStrength(n: number): number {
  if (n <= 3) return 1;
  return Math.tanh(3.3 / Math.sqrt(n - 3));
}

const pctWord = (r: number) => `${Math.round(Math.abs(r) * 100)}%`;

export function findPossibleLinks(rows: Row[], headersHint?: string[]): LinksReport {
  const notes: string[] = [];
  let ws: WeeklySeries | null = null;
  try { ws = weeklySeries(rows, headersHint); } catch { ws = null; }
  if (!ws) return { status: 'no-dates', weeksUsed: 0, links: [], notes: ['Links need a date column so numbers can be compared week by week.'], pairsChecked: 0 };

  const usable = ws.rowsPerWeek.filter((n) => n >= MIN_ROWS_PER_WEEK).length;
  if (usable < MIN_WEEKS) {
    return { status: 'not-enough-data', weeksUsed: usable, links: [], pairsChecked: 0, notes: [`Needs at least ${MIN_WEEKS} weeks with ${MIN_ROWS_PER_WEEK}+ rows each. Your file has ${usable}. Upload more history to look for links.`] };
  }

  const ids = Object.keys(KPI_AREA).filter((id) => ws!.series[id] && ws!.series[id].some((v) => v !== null) && !barelyMoves(ws!.series[id]));
  const skipped = Object.keys(KPI_AREA).filter((id) => ws!.series[id]?.some((v) => v !== null) && !ids.includes(id));
  if (skipped.length) notes.push(`Skipped, as they barely change from week to week: ${skipped.map((s) => ws!.labels[s] ?? s).join(', ')}.`);

  const found: PossibleLink[] = [];
  let checked = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;
      const A = ids[i], B = ids[j];
      if (KPI_AREA[A] === KPI_AREA[B]) continue; // cross-functional links only
      if (shareInput(A, B)) continue; // built from the same column, so they move together by arithmetic
      for (const lag of [0, 1] as const) {
        if (lag === 0 && j < i) continue; // same-week pair is symmetric; count once
        checked++;
        const { x, y, dx, dy, at } = pairs(ws.series[A], ws.series[B], lag);
        const n = x.length;
        if (n < MIN_WEEKS) continue;
        const r = pearson(x, y);
        if (r === null || Math.abs(r) < requiredStrength(n)) continue;
        // Must also hold for week-to-week changes, so two numbers that merely both drift do not count.
        const rd = pearson(dx, dy);
        if (rd === null || Math.sign(rd) !== Math.sign(r) || Math.abs(rd) < 0.4) continue;
        // And after removing each number's steady drift, they must still move together.
        const rr = pearson(detrend(x, at), detrend(y, at));
        if (rr === null || Math.sign(rr) !== Math.sign(r) || Math.abs(rr) < requiredStrength(n - 2)) continue;

        const together = r > 0;
        const la = ws.labels[A] ?? A, lb = ws.labels[B] ?? B;
        const when = lag === 0 ? 'In weeks when' : 'In weeks when';
        const tail = lag === 0 ? '' : ', the following week';
        found.push({
          id: `${A}-${B}-lag${lag}`,
          a: { id: A, label: la, area: KPI_AREA[A] },
          b: { id: B, label: lb, area: KPI_AREA[B] },
          lagWeeks: lag, r, weeks: n,
          direction: together ? 'together' : 'opposite',
          confidence: n >= 20 && Math.abs(r) >= 0.75 ? 'high' : n >= 12 ? 'medium' : 'low',
          confidenceReason: `Based on ${n} weeks. The match is ${pctWord(r)} of a perfect pattern, and the week-to-week changes agree. More weeks (20+) with a strong match give higher confidence.`,
          sentence: `${when} ${la} (${KPI_AREA[A]}) was higher, ${lb} (${KPI_AREA[B]}) tended to be ${together ? 'higher' : 'lower'}${tail}.`,
          otherExplanations: 'This could be a coincidence, or something else could be moving both, such as a sale, a season, a stock-out or a change in how data was recorded. It does not show that one causes the other.',
          check: `Look at the weeks where ${la} was highest and lowest, and note what else was different in those weeks.`,
        });
      }
    }
  }

  // Strongest first; at most five so the list stays readable; one link per pair of numbers.
  found.sort((p, q) => Math.abs(q.r) - Math.abs(p.r));
  // One link per pair, and one per "number and area": if ROAS and CAC both match on-time delivery
  // (both come from ad spend), show only the stronger, so the list is not the same finding twice.
  const seen = new Set<string>();
  const links = found.filter((l) => {
    const keys = [[l.a.id, l.b.id].sort().join('|'), `${l.b.id}@${l.a.area}`, `${l.a.id}@${l.b.area}`];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  }).slice(0, 5);

  notes.push(`${checked} pairs of numbers from different areas were checked over ${usable} weeks. Only strong, consistent patterns are shown.`);
  if (!links.length) notes.push('No pattern was strong enough to show. That is normal: most numbers are not linked, and a short history cannot show weak links.');
  return { status: 'ok', weeksUsed: usable, links, notes, pairsChecked: checked };
}
