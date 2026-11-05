// The standard shape for every finding the app shows: what, why, impact, next
// step, evidence and confidence, plus a plain label for where it came from.
//
// This file adds no new analysis. It takes a finding the analyst already
// produced (an OperationsIntelItem) and the numbers calculated from the
// person's own data (kpi-engine), then says how well the finding is backed up.
// It never invents a number: evidence is only what the KPI engine calculated
// from uploaded rows, or, on sample data, the sample metrics, labelled as such.
//
// Pure TypeScript, no dependencies, so the client and server can both use it.
import type { OperationsIntelItem, CommandCenterMetric } from './ai-types';
import type { KpiRun, KpiResult } from './kpi-engine';

/** Where the evidence comes from. */
export type InsightBasis = 'verified' | 'sample' | 'hypothesis';
export type Confidence = 'high' | 'medium' | 'low';

export interface InsightEvidence {
  label: string;
  value: string;
  /** e.g. "+18.3% (latest 20 days vs the 20 days before)" */
  change?: string;
  /** Is the change in the good direction? null when unclear. */
  better?: boolean | null;
  source: 'your-data' | 'sample';
  /** How the number was worked out, in plain words. */
  how?: string;
  kpiId?: string;
}

/** A KPI value captured when someone starts fixing a finding, so we can compare later. */
export interface InsightBaseline {
  kpiId: string;
  label: string;
  value: number;
  display: string;
  unit: '%' | '$' | '#' | 'days' | 'x';
  direction: 'up' | 'down';
  at: number;
}

export interface StandardInsight {
  what: string;
  /** Always a possible reason, never stated as proven. */
  why: string;
  impact: string;
  next: string;
  nextSteps: string[];
  evidence: InsightEvidence[];
  confidence: Confidence;
  confidenceReason: string;
  basis: InsightBasis;
  /** Short badge text, e.g. "Verified from your data". */
  basisLabel: string;
  /** One sentence on what the badge means. */
  basisDetail: string;
  /** Things to know before trusting it. */
  caveats: string[];
  /** The number to compare before and after, only when it came from the person's own data. */
  baseline?: InsightBaseline;
}

export interface InsightContext {
  /** Numbers calculated from the active uploaded dataset, if there is one. */
  run?: KpiRun | null;
  /** How many rows the original file had (the browser keeps only the first part). */
  totalRows?: number;
  /** The dashboard's metrics, used as evidence only when there is no uploaded data. */
  sampleMetrics?: CommandCenterMetric[];
  now?: number;
}

/** Words in a finding that point at each KPI. Matched against the finding's own text. */
const KPI_WORDS: Record<string, string[]> = {
  revenue: ['revenue', 'sales'],
  orders: ['order volume', 'orders'],
  aov: ['average order', 'order value', 'aov', 'basket'],
  'gross-margin': ['gross margin', 'margin', 'cost of goods', 'cogs'],
  'net-margin': ['net margin', 'net profit', 'profit'],
  'opex-ratio': ['operating expense', 'expenses', 'opex', 'overhead'],
  conversion: ['conversion'],
  roas: ['return on ad', 'roas', 'ad spend', 'advertising'],
  cac: ['acquisition cost', 'cac'],
  'return-rate': ['return rate', 'returns', 'returned'],
  'on-time': ['on-time', 'on time', 'late', 'delivery'],
  'fulfilment-time': ['fulfil', 'ship time', 'processing time', 'order to ship', 'order-to-ship', 'lead time'],
};

const hits = (text: string, words: string[]) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);

function findingText(item: OperationsIntelItem): string {
  // Not the root cause: that is the AI's guess, and we don't want it choosing the evidence.
  return [item.title, item.affectedWorkflow, item.currentState, item.issueDetected].join(' ').toLowerCase();
}

function evidenceFromResult(r: KpiResult): InsightEvidence {
  return {
    kpiId: r.id,
    label: r.label,
    value: r.display ?? '',
    change: r.change ? `${r.change.text} (${r.change.windowLabel})` : undefined,
    better: r.change ? r.change.better : undefined,
    source: 'your-data',
    how: r.how,
  };
}

/** Which calculated KPIs relate to this finding, best match first. At most 3. */
export function relatedKpis(item: OperationsIntelItem, run: KpiRun): KpiResult[] {
  const text = findingText(item);
  return run.results
    .filter((r) => r.status === 'ok' && r.value !== undefined)
    .map((r) => ({ r, score: hits(text, KPI_WORDS[r.id] ?? [r.label.toLowerCase()]) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.r);
}

function relatedSample(item: OperationsIntelItem, metrics: CommandCenterMetric[]): InsightEvidence[] {
  const text = findingText(item);
  return metrics
    .filter((m) => text.includes(m.label.toLowerCase()))
    .slice(0, 3)
    .map((m) => ({ label: m.label, value: m.value, change: m.trend && m.trend !== '—' ? m.trend : undefined, better: m.isPositive, source: 'sample' as const }));
}

/** Confidence is a rule, not a feeling. The reason is always shown with it. */
function rateConfidence(evidence: InsightEvidence[], results: KpiResult[], partial: boolean): { level: Confidence; reason: string } {
  if (!evidence.length) {
    return { level: 'low', reason: 'None of your calculated numbers match this finding directly, so treat it as a lead to check, not a fact.' };
  }
  const withChange = evidence.filter((e) => e.change).length;
  const minRows = Math.min(...evidence.map((e) => results.find((r) => r.id === e.kpiId)?.rowsUsed ?? 0));
  if (evidence.length >= 2 && withChange >= 1 && minRows >= 100 && !partial) {
    return { level: 'high', reason: `${evidence.length} of your own numbers back it, at least one shows a change over time, and they use ${minRows.toLocaleString()}+ rows.` };
  }
  if (minRows >= 30) {
    const why: string[] = [];
    if (evidence.length < 2) why.push('only one number backs it');
    if (!withChange) why.push('there is no change over time yet');
    if (partial) why.push('only part of your file is used');
    if (minRows < 100) why.push(`it uses ${minRows} rows`);
    return { level: 'medium', reason: `Backed by your data, but ${why.join(' and ') || 'some checks are not met'}.` };
  }
  return { level: 'low', reason: `Backed by only ${minRows} rows of your data. Add more data to firm it up.` };
}

/**
 * Turn one analyst finding into the standard insight.
 * `basis` is "verified" only when at least one evidence number was calculated from the person's own rows.
 */
export function standardiseInsight(item: OperationsIntelItem, ctx: InsightContext = {}): StandardInsight {
  const now = ctx.now ?? Date.now();
  const caveats: string[] = [];
  const run = ctx.run ?? null;
  const partial = !!(run && ctx.totalRows && ctx.totalRows > run.rowCount);

  let evidence: InsightEvidence[] = [];
  let basis: InsightBasis;
  let rating: { level: Confidence; reason: string };
  let baseline: InsightBaseline | undefined;

  if (run) {
    const related = relatedKpis(item, run);
    evidence = related.map(evidenceFromResult);
    if (partial) caveats.push(`Only the first ${run.rowCount.toLocaleString()} of ${ctx.totalRows!.toLocaleString()} rows in your file are used.`);
    related.forEach((r) => r.limits.forEach((l) => { if (!caveats.includes(l)) caveats.push(l); }));
    rating = rateConfidence(evidence, run.results, partial);
    basis = evidence.length ? 'verified' : 'hypothesis';
    const lead = related.find((r) => r.value !== undefined && r.display);
    if (lead && basis === 'verified') {
      baseline = { kpiId: lead.id, label: lead.label, value: lead.value as number, display: lead.display as string, unit: lead.unit, direction: lead.direction, at: now };
    }
  } else {
    evidence = relatedSample(item, ctx.sampleMetrics ?? []);
    basis = 'sample';
    rating = { level: 'low', reason: 'This is based on sample numbers, not yours. Upload your own data to get a real confidence rating.' };
    caveats.push('Sample data: nothing here describes your real business yet.');
  }

  const label: Record<InsightBasis, [string, string]> = {
    verified: ['Verified from your data', 'The numbers below were calculated from the file you uploaded. The reason is still a hypothesis.'],
    sample: ['Sample data', 'These numbers are examples, not yours.'],
    hypothesis: ['AI hypothesis', 'Your uploaded data has no number that matches this finding, so it is a lead to check, not a verified fact.'],
  };

  return {
    what: item.issueDetected,
    why: item.rootCause,
    impact: item.estimatedImpact,
    next: item.actionPlanSteps[0] ?? item.recommendedAction,
    nextSteps: item.actionPlanSteps.length ? item.actionPlanSteps : [item.recommendedAction],
    evidence,
    confidence: rating.level,
    confidenceReason: rating.reason,
    basis,
    basisLabel: label[basis][0],
    basisDetail: label[basis][1],
    caveats,
    baseline,
  };
}

// ---------------------------------------------------------------------------
// Before and after
// ---------------------------------------------------------------------------

export interface Outcome {
  status: 'compared' | 'no-new-data';
  before: string;
  after?: string;
  /** e.g. "+4.2 pts" or "-12%" */
  changeText?: string;
  /** Moved the good way (true), the bad way (false), or not meaningfully (null). */
  better?: boolean | null;
  /** Always shown: a before/after comparison is not proof the action caused it. */
  note: string;
  message: string;
}

const NOT_PROOF = 'This compares your numbers before and after. Other things may have changed too, so it does not prove the action caused it.';

/** Compare the number captured when work started with the latest calculation. */
export function compareOutcome(baseline: InsightBaseline, run: KpiRun | null | undefined): Outcome {
  const now = run?.results.find((r) => r.id === baseline.kpiId);
  if (!run || !now || now.status !== 'ok' || now.value === undefined || !now.display) {
    return { status: 'no-new-data', before: baseline.display, note: NOT_PROOF, message: 'Upload newer data to see whether this number moved.' };
  }
  const diff = now.value - baseline.value;
  let changeText: string;
  let relative: number;
  if (baseline.unit === '%') {
    changeText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pts`;
    relative = Math.abs(diff) / 0.5; // under half a point counts as no real change
  } else if (baseline.value !== 0) {
    const pct = (diff / Math.abs(baseline.value)) * 100;
    changeText = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    relative = Math.abs(pct) / 1; // under 1% counts as no real change
  } else {
    changeText = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
    relative = diff === 0 ? 0 : 99;
  }
  const better = relative < 1 ? null : baseline.direction === 'up' ? diff > 0 : diff < 0;
  const word = better === null ? 'No real change' : better ? 'Moved the right way' : 'Moved the wrong way';
  return {
    status: 'compared',
    before: baseline.display,
    after: now.display,
    changeText,
    better,
    note: NOT_PROOF,
    message: `${baseline.label}: ${baseline.display} before, ${now.display} now (${changeText}). ${word}.`,
  };
}
