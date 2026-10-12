// What data a business needs to track its goal, and how well an uploaded file
// covers it. Used by the onboarding interview ("Do you have this data already,
// or should we start fresh?") and to build a starter tracking sheet.
import { getIndustry, kpisForIndustry, type IndustryKpi } from './kpi-industries';
import { pickKpisForGoal, type GoalId, type DataStatus } from './growth';

export type { DataStatus };

export interface DataNeed {
  kpi: IndustryKpi;
  /** Raw numbers you record to calculate the KPI, taken from its formula. */
  inputs: string[];
}

const SPLIT = /\s*(?:÷|×|\/|\*|\+|−|–|-(?=\s)|\bdivided by\b|\btimes\b|\bminus\b|\bplus\b)\s*/i;

function tidy(s: string): string {
  const t = s.replace(/[()]/g, '').replace(/\b(the|a|an|total|number of|#)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}

/**
 * "Cost of food sold ÷ food revenue" → ["Cost of food sold", "Food revenue"].
 * Returns [] when the KPI is best recorded directly: growth rates ("this period
 * vs last period") and durations ("order to food delivered").
 */
export function inputsFromFormula(formula: string): string[] {
  if (/\b(this|last|prior|previous) period\b/i.test(formula)) return [];
  if (!/[÷×/*+−–]|\b(minus|plus|divided)\b/i.test(formula)) {
    // Single quantity: a duration ("A to B") is recorded as the KPI itself.
    if (/\bto\b/i.test(formula)) return [];
  }
  const parts = formula.split(SPLIT).map(tidy).filter((p) => p && p.length > 2 && !/^\d+(\.\d+)?%?$/.test(p));
  // Drop near-duplicates ("Customers at start" vs "Customers at start of period").
  const out: string[] = [];
  for (const part of parts) {
    const k = part.toLowerCase();
    if (out.some((o) => o.toLowerCase() === k || k.startsWith(o.toLowerCase() + ' '))) continue;
    out.push(part);
  }
  return out.slice(0, 4);
}

/** The KPIs that matter for this goal (target first) and the raw inputs behind each. */
export function dataNeedsFor(industryId: string, goal: GoalId, targetKpi?: string, count = 4): DataNeed[] {
  const pool = kpisForIndustry(industryId);
  const picked = pickKpisForGoal(industryId, goal, count + 1);
  const target = targetKpi ? pool.find((k) => k.name === targetKpi) : undefined;
  const list = [target, ...picked].filter((k): k is IndustryKpi => !!k);
  const unique = list.filter((k, i) => list.findIndex((x) => x.name === k.name) === i).slice(0, count);
  return unique.map((kpi) => ({ kpi, inputs: inputsFromFormula(kpi.formula) }));
}

/** Every distinct raw input across the needs, in order. */
export function allInputs(needs: DataNeed[]): string[] {
  const seen = new Map<string, string>();
  for (const n of needs) {
    // A KPI recorded directly is its own input.
    const list = n.inputs.length ? n.inputs : [n.kpi.name];
    for (const i of list) {
      const k = i.toLowerCase();
      if ([...seen.keys()].some((s) => s === k || k.startsWith(s + ' ') || s.startsWith(k + ' '))) continue;
      seen.set(k, i);
    }
  }
  return [...seen.values()];
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['and', 'the', 'for', 'per', 'all'].includes(w));

/**
 * Which needed inputs a file's columns already cover, by shared words
 * ("Food revenue" ↔ "Revenue (food)"). Approximate by design — it's a guide.
 */
export function matchColumns(inputs: string[], columns: string[]): { matched: { input: string; column: string }[]; missing: string[] } {
  const cols = columns.map((c) => ({ c, w: new Set(words(c)) }));
  const matched: { input: string; column: string }[] = [];
  const missing: string[] = [];
  for (const input of inputs) {
    const iw = words(input);
    let best: { c: string; score: number } | null = null;
    for (const col of cols) {
      const score = iw.filter((w) => col.w.has(w) || [...col.w].some((cw) => cw.startsWith(w) || w.startsWith(cw))).length / Math.max(1, iw.length);
      if (score > (best?.score ?? 0)) best = { c: col.c, score };
    }
    // Every word must match for short names; long names can miss one word.
    const needed = iw.length >= 3 ? 0.66 : 1;
    if (best && best.score >= needed) matched.push({ input, column: best.c });
    else missing.push(input);
  }
  return { matched, missing };
}

/** Rows for a starter weekly tracking sheet: one row per week, a column per input. */
export function trackingSheetRows(needs: DataNeed[], weeks = 12, start = new Date()): { tracker: Record<string, any>[]; guide: Record<string, any>[] } {
  const inputs = allInputs(needs);
  const monday = new Date(start);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const tracker = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i * 7);
    const row: Record<string, any> = { 'Week starting': d.toISOString().slice(0, 10) };
    for (const input of inputs) row[input] = '';
    for (const n of needs) if (!(n.kpi.name in row)) row[n.kpi.name] = '';
    return row;
  });
  const guide = needs.map((n) => ({
    KPI: n.kpi.name,
    'How it’s calculated': n.kpi.formula,
    Unit: n.kpi.unit,
    'Better when': n.kpi.direction === 'up' ? 'Higher' : 'Lower',
    'Numbers to record': n.inputs.join(', ') || `Record ${n.kpi.name.toLowerCase()} directly`,
  }));
  return { tracker, guide };
}

export function industryName(industryId?: string): string {
  return getIndustry(industryId)?.name ?? 'your industry';
}
