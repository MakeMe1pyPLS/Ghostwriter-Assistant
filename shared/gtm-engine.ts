// Go-to-market analysis from uploaded files: ad exports (campaigns, channels,
// spend, clicks, conversions) and deal exports (stage, amount, source, dates).
//
// Rules this file follows:
// - Every number is calculated from the rows. Nothing is invented or estimated.
// - Judgements compare a campaign, channel or source with the SAME file's own
//   average. We do not quote industry benchmarks, because we have none we can source.
// - Each finding says how sure we are and why, and gives a possible reason, never
//   a proven cause.
// - Small samples are not judged. They are listed as "too early to tell".
//
// Pure TypeScript with no dependencies, so the client and tests can both use it.
import { parseNumber, parseDate, formatKpiValue, type Row } from './kpi-engine';
import type { Confidence, InsightEvidence } from './insight';

export type GtmKind = 'ads' | 'pipeline' | 'unknown';

export interface GtmFinding {
  id: string;
  /** wrong = something to fix, right = something working, note = worth knowing. */
  kind: 'wrong' | 'right' | 'note';
  area: 'ads' | 'pipeline';
  title: string;
  what: string;
  /** A possible reason, never stated as proven. */
  why: string;
  impact: string;
  next: string;
  evidence: InsightEvidence[];
  confidence: Confidence;
  confidenceReason: string;
}

export interface GtmRow {
  name: string;
  spend: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  ctr?: number;
  cpc?: number;
  cvr?: number;
  cpa?: number;
  roas?: number;
  /** Share of all spend. */
  share: number;
}

export interface DealGroup { name: string; closed: number; won: number; winRate: number; wonAmount: number }
export interface DealSummary {
  total: number; won: number; lost: number; open: number;
  winRate?: number; avgWonAmount?: number; avgCycleDays?: number;
  groups: DealGroup[];
}

export interface GtmReport {
  kind: GtmKind;
  rowCount: number;
  rowsUsed: number;
  /** Role to the column that was used. */
  columns: Record<string, string>;
  dimension?: 'campaign' | 'channel' | 'all';
  /** Ads: one row per campaign or channel. Empty for deal files. */
  table: GtmRow[];
  totals?: GtmRow;
  /** Deals: the overall picture and each source or segment with enough closed deals. */
  deals?: DealSummary;
  findings: GtmFinding[];
  /** Plain notes: what was skipped, what is too early to judge. */
  notes: string[];
  /** When the file could not be read as either kind: what each kind needs. */
  needs: { ads: string[]; pipeline: string[] };
  dateRange?: { from: number; to: number };
}

// ---------------------------------------------------------------------------
// Column matching
// ---------------------------------------------------------------------------

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

type Aliases<R extends string> = Record<R, { name: string; aliases: string[] }>;

const AD_ROLES: Aliases<'campaign' | 'channel' | 'spend' | 'impressions' | 'clicks' | 'conversions' | 'revenue' | 'date'> = {
  campaign: { name: 'campaign name', aliases: ['campaign', 'campaign name', 'ad campaign', 'ad set', 'ad set name', 'ad group', 'ad group name', 'ad name', 'creative'] },
  channel: { name: 'channel or platform', aliases: ['channel', 'platform', 'network', 'source', 'medium', 'publisher', 'ad platform', 'source medium'] },
  spend: { name: 'spend', aliases: ['spend', 'cost', 'amount spent', 'ad spend', 'total cost', 'amount spent usd', 'cost usd'] },
  impressions: { name: 'impressions', aliases: ['impressions', 'impr', 'views'] },
  clicks: { name: 'clicks', aliases: ['clicks', 'link clicks', 'all clicks'] },
  conversions: { name: 'conversions', aliases: ['conversions', 'purchases', 'results', 'leads', 'all conversions', 'website purchases', 'orders', 'sales count'] },
  revenue: { name: 'revenue from ads', aliases: ['revenue', 'conversion value', 'purchase value', 'purchase conversion value', 'conv value', 'total conversion value', 'website purchase value', 'sales', 'sales value'] },
  date: { name: 'date', aliases: ['date', 'day', 'week', 'month', 'reporting starts', 'reporting date'] },
};

const DEAL_ROLES: Aliases<'stage' | 'amount' | 'created' | 'closed' | 'source' | 'segment' | 'lostReason'> = {
  stage: { name: 'deal stage or status', aliases: ['stage', 'deal stage', 'status', 'deal status', 'outcome', 'pipeline stage', 'result'] },
  amount: { name: 'deal amount', aliases: ['amount', 'deal amount', 'deal value', 'value', 'deal size', 'opportunity amount', 'arr', 'contract value'] },
  created: { name: 'created date', aliases: ['created', 'created date', 'create date', 'date created', 'opened', 'open date', 'created at'] },
  closed: { name: 'closed date', aliases: ['closed', 'close date', 'closed date', 'date closed', 'closed at', 'won date'] },
  source: { name: 'lead source', aliases: ['source', 'lead source', 'channel', 'origin', 'deal source', 'campaign source'] },
  segment: { name: 'segment (industry, size or region)', aliases: ['segment', 'industry', 'company size', 'region', 'customer segment', 'vertical', 'tier', 'size'] },
  lostReason: { name: 'lost reason', aliases: ['lost reason', 'loss reason', 'reason lost', 'closed lost reason', 'reason'] },
};

function matchRoles<R extends string>(headers: string[], roles: Aliases<R>): Partial<Record<R, string>> {
  const out: Partial<Record<R, string>> = {};
  const claimed = new Set<string>();
  const keys = Object.keys(roles) as R[];
  const normed = headers.map((h) => ({ h, n: norm(h) }));
  for (const r of keys) {
    const hit = normed.find((x) => !claimed.has(x.h) && roles[r].aliases.includes(x.n));
    if (hit) { out[r] = hit.h; claimed.add(hit.h); }
  }
  for (const r of keys) {
    if (out[r]) continue;
    const hit = normed.find((x) => !claimed.has(x.h) && roles[r].aliases.some((a) => a.length >= 8 && x.n.includes(a)));
    if (hit) { out[r] = hit.h; claimed.add(hit.h); }
  }
  return out;
}

/** Column names: the file's own list if given, otherwise every key seen in the first rows. */
const headersOf = (rows: Row[], hint?: string[]) => {
  if (hint && hint.length) return hint;
  const seen = new Set<string>();
  for (const r of rows.slice(0, 50)) Object.keys(r).forEach((k) => seen.add(k));
  return [...seen];
};

/** What each kind of file needs, in plain words. */
export const GTM_NEEDS = {
  ads: ['A spend or cost column', 'At least one of: clicks, impressions or conversions', 'Best: a campaign or channel column, and a revenue (conversion value) column'],
  pipeline: ['A stage or status column (with values like Won, Lost or Open)', 'A deal amount column', 'Best: created and closed dates, and a lead source column'],
};

/** Header rows for blank templates people can fill in. These contain no data. */
export const AD_TEMPLATE_HEADERS = ['Date', 'Campaign', 'Channel', 'Spend', 'Impressions', 'Clicks', 'Conversions', 'Revenue'];
export const PIPELINE_TEMPLATE_HEADERS = ['Deal', 'Stage', 'Amount', 'Created', 'Closed', 'Source', 'Segment', 'Lost reason'];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const money = (n: number) => formatKpiValue(n, '$');
const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
const times = (n: number) => `${n.toFixed(2)}x`;
const safeDiv = (a: number, b: number) => (b > 0 ? a / b : undefined);
const ev = (label: string, value: string, how?: string): InsightEvidence => ({ label, value, how, source: 'your-data' });
const DAY = 86400000;

function levelFor(n: number, high: number, medium: number): Confidence {
  return n >= high ? 'high' : n >= medium ? 'medium' : 'low';
}

// ---------------------------------------------------------------------------
// Ads
// ---------------------------------------------------------------------------

interface Agg { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; rows: number }
const blank = (): Agg => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, rows: 0 });

function toRow(name: string, a: Agg, totalSpend: number, has: { impressions: boolean; clicks: boolean; conversions: boolean; revenue: boolean }): GtmRow {
  return {
    name,
    spend: a.spend,
    impressions: has.impressions ? a.impressions : undefined,
    clicks: has.clicks ? a.clicks : undefined,
    conversions: has.conversions ? a.conversions : undefined,
    revenue: has.revenue ? a.revenue : undefined,
    ctr: has.impressions && has.clicks ? safeDiv(a.clicks, a.impressions) : undefined,
    cpc: has.clicks ? safeDiv(a.spend, a.clicks) : undefined,
    cvr: has.clicks && has.conversions ? safeDiv(a.conversions, a.clicks) : undefined,
    cpa: has.conversions ? safeDiv(a.spend, a.conversions) : undefined,
    roas: has.revenue ? safeDiv(a.revenue, a.spend) : undefined,
    share: totalSpend > 0 ? a.spend / totalSpend : 0,
  };
}

const MIN_SHARE_TO_JUDGE = 0.05;
const MIN_CLICKS_TO_JUDGE = 100;
const MIN_CONVERSIONS_TO_JUDGE = 5;

function analyseAds(rows: Row[], headers: string[]): GtmReport {
  const cols = matchRoles(headers, AD_ROLES);
  const notes: string[] = [];
  const has = { impressions: !!cols.impressions, clicks: !!cols.clicks, conversions: !!cols.conversions, revenue: !!cols.revenue };
  const dimCol = cols.campaign ?? cols.channel;
  const dimension: 'campaign' | 'channel' | 'all' = cols.campaign ? 'campaign' : cols.channel ? 'channel' : 'all';

  const groups = new Map<string, Agg>();
  const channels = new Map<string, Agg>();
  const total = blank();
  let used = 0;
  const dated: { t: number; spend: number; revenue: number; conversions: number }[] = [];

  for (const row of rows) {
    const spend = parseNumber(row[cols.spend!]);
    if (spend === null || spend < 0) continue;
    const num = (c?: string) => (c ? parseNumber(row[c]) ?? 0 : 0);
    const add = (a: Agg) => {
      a.spend += spend; a.impressions += num(cols.impressions); a.clicks += num(cols.clicks);
      a.conversions += num(cols.conversions); a.revenue += num(cols.revenue); a.rows += 1;
    };
    add(total);
    const key = dimCol ? String(row[dimCol] ?? '').trim() || '(blank)' : 'All ads';
    if (!groups.has(key)) groups.set(key, blank());
    add(groups.get(key)!);
    if (cols.channel) {
      const ck = String(row[cols.channel] ?? '').trim() || '(blank)';
      if (!channels.has(ck)) channels.set(ck, blank());
      add(channels.get(ck)!);
    }
    if (cols.date) {
      const t = parseDate(row[cols.date]);
      if (t !== null) dated.push({ t, spend, revenue: num(cols.revenue), conversions: num(cols.conversions) });
    }
    used++;
  }
  if (used < rows.length) notes.push(`${rows.length - used} rows were skipped because their spend was blank, negative or not a number.`);

  const table = [...groups.entries()].map(([n, a]) => toRow(n, a, total.spend, has)).sort((a, b) => b.spend - a.spend);
  const totals = toRow('All ads', total, total.spend, has);
  const findings: GtmFinding[] = [];
  const small: string[] = [];
  const colsUsed: Record<string, string> = {};
  (Object.keys(cols) as (keyof typeof cols)[]).forEach((k) => { if (cols[k]) colsUsed[k] = cols[k]!; });

  if (total.spend <= 0) {
    return { kind: 'ads', rowCount: rows.length, rowsUsed: used, columns: colsUsed, dimension, table, totals, findings, notes: [...notes, 'Total spend is zero, so there is nothing to judge.'], needs: GTM_NEEDS_PAIR };
  }

  const accountRoas = totals.roas;
  const accountCpa = totals.cpa;
  const accountCtr = totals.ctr;
  const accountCvr = totals.cvr;
  const label = dimension === 'channel' ? 'channel' : 'campaign';

  for (const r of table) {
    if (r.name === 'All ads' && dimension === 'all') continue;
    const enoughSpend = r.share >= MIN_SHARE_TO_JUDGE;
    const clicks = r.clicks ?? 0;
    const conv = r.conversions ?? 0;
    const idBase = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!enoughSpend || (has.clicks && clicks < MIN_CLICKS_TO_JUDGE && conv < MIN_CONVERSIONS_TO_JUDGE)) {
      small.push(r.name);
      if (!enoughSpend) continue;
    }

    // 1. Spend with nothing to show for it.
    if (has.conversions && conv === 0 && has.clicks && clicks >= MIN_CLICKS_TO_JUDGE) {
      findings.push({
        id: `no-results-${idBase}`, kind: 'wrong', area: 'ads',
        title: `${r.name} spent ${money(r.spend)} with no conversions`,
        what: `${r.name} used ${pct(r.share)} of your ad spend and got ${clicks.toLocaleString()} clicks, but no conversions are recorded.`,
        why: 'Possible reasons, not proven: conversion tracking may not be set up for this ' + label + ', the offer or landing page may not match the ad, or the audience may be wrong. Check tracking first.',
        impact: `${money(r.spend)} in this file with no recorded return.`,
        next: `Check that conversions are tracked for ${r.name}. If they are, pause it or cut its budget this week and move the money to a ${label} that converts.`,
        evidence: [ev('Spend', money(r.spend)), ev('Clicks', clicks.toLocaleString()), ev('Conversions', '0'), ev('Share of spend', pct(r.share))],
        confidence: levelFor(clicks, 1000, 300),
        confidenceReason: `${clicks.toLocaleString()} clicks with no conversions. More clicks make a zero result more convincing (1,000+ is high).`,
      });
      continue;
    }

    // 2. Big spend, much worse return than the account's own average.
    if (r.share >= 0.10 && conv >= MIN_CONVERSIONS_TO_JUDGE) {
      if (has.revenue && accountRoas !== undefined && r.roas !== undefined && r.roas < accountRoas * 0.5) {
        findings.push({
          id: `weak-return-${idBase}`, kind: 'wrong', area: 'ads',
          title: `${r.name} returns far less than your average`,
          what: `${r.name} takes ${pct(r.share)} of spend and returns ${times(r.roas)} (revenue per $1 of ads). Your average across all ads is ${times(accountRoas)}.`,
          why: 'Possible reasons, not proven: the audience may be too broad, the ad may attract browsers instead of buyers, or the offer may not fit this ' + label + '.',
          impact: `If it matched your average return, the same ${money(r.spend)} would bring in about ${money(r.spend * accountRoas)} instead of ${money(r.revenue ?? 0)}. Treat that as a ceiling: returns usually fall when money moves.`,
          next: `Cut ${r.name}'s budget by about a quarter this week and watch whether total revenue holds. Test one change to its audience or offer.`,
          evidence: [ev('Return on ad spend', times(r.roas), 'Revenue divided by spend'), ev('Your average', times(accountRoas)), ev('Share of spend', pct(r.share)), ev('Conversions', conv.toLocaleString())],
          confidence: levelFor(conv, 30, 10),
          confidenceReason: `Based on ${conv.toLocaleString()} conversions (30+ is high, 10+ is medium).`,
        });
        continue;
      }
      if (!has.revenue && accountCpa !== undefined && r.cpa !== undefined && r.cpa > accountCpa * 2) {
        findings.push({
          id: `costly-${idBase}`, kind: 'wrong', area: 'ads',
          title: `${r.name} costs far more per conversion`,
          what: `Each conversion from ${r.name} costs ${money(r.cpa)}. Your average across all ads is ${money(accountCpa)}.`,
          why: 'Possible reasons, not proven: a broader audience, weaker ad, or a landing page that converts less.',
          impact: `${pct(r.share)} of your spend is going to the most expensive conversions.`,
          next: `Cut ${r.name}'s budget by about a quarter and compare cost per conversion after a week.`,
          evidence: [ev('Cost per conversion', money(r.cpa)), ev('Your average', money(accountCpa)), ev('Share of spend', pct(r.share))],
          confidence: levelFor(conv, 30, 10),
          confidenceReason: `Based on ${conv.toLocaleString()} conversions (30+ is high, 10+ is medium).`,
        });
        continue;
      }
    }

    // 3. Working well, with room to grow.
    if (conv >= 10 && r.share <= 0.25) {
      const strongRoas = has.revenue && accountRoas !== undefined && r.roas !== undefined && r.roas >= accountRoas * 1.5;
      const strongCpa = !has.revenue && accountCpa !== undefined && r.cpa !== undefined && r.cpa <= accountCpa * 0.67;
      if (strongRoas || strongCpa) {
        findings.push({
          id: `working-${idBase}`, kind: 'right', area: 'ads',
          title: `${r.name} is working better than most of your ads`,
          what: strongRoas
            ? `${r.name} returns ${times(r.roas!)} per $1 of ads against your average of ${times(accountRoas!)}, on only ${pct(r.share)} of spend.`
            : `${r.name} gets conversions for ${money(r.cpa!)} each against your average of ${money(accountCpa!)}, on only ${pct(r.share)} of spend.`,
          why: 'Possible reasons, not proven: a well-matched audience or offer. Returns often fall as spend grows, so treat this as a test.',
          impact: `It is one of your better-performing ${label}s, with real volume (${conv.toLocaleString()} conversions).`,
          next: `Raise ${r.name}'s budget by about 20% for two weeks and check that its return holds before going further.`,
          evidence: strongRoas
            ? [ev('Return on ad spend', times(r.roas!)), ev('Your average', times(accountRoas!)), ev('Share of spend', pct(r.share)), ev('Conversions', conv.toLocaleString())]
            : [ev('Cost per conversion', money(r.cpa!)), ev('Your average', money(accountCpa!)), ev('Share of spend', pct(r.share))],
          confidence: levelFor(conv, 30, 10),
          confidenceReason: `Based on ${conv.toLocaleString()} conversions (30+ is high, 10+ is medium).`,
        });
        continue;
      }
    }

    // 4. Few people click.
    if (has.impressions && has.clicks && accountCtr !== undefined && r.ctr !== undefined && (r.impressions ?? 0) >= 5000 && r.ctr < accountCtr * 0.5) {
      findings.push({
        id: `low-ctr-${idBase}`, kind: 'wrong', area: 'ads',
        title: `Few people click ${r.name}`,
        what: `${r.name} was shown ${(r.impressions ?? 0).toLocaleString()} times and ${pct(r.ctr, 2)} clicked. Your average is ${pct(accountCtr, 2)}.`,
        why: 'Possible reasons, not proven: the image or headline may not stand out, or the ad may be shown to the wrong people.',
        impact: `Low click rates usually mean paying for views that do not turn into visits.`,
        next: `Test a new headline or image against ${r.name} this week and compare click rates.`,
        evidence: [ev('Click rate', pct(r.ctr, 2), 'Clicks divided by impressions'), ev('Your average', pct(accountCtr, 2)), ev('Impressions', (r.impressions ?? 0).toLocaleString())],
        confidence: levelFor(r.impressions ?? 0, 100000, 20000),
        confidenceReason: `Based on ${(r.impressions ?? 0).toLocaleString()} impressions (100,000+ is high, 20,000+ is medium).`,
      });
      continue;
    }

    // 5. People click but do not convert.
    if (has.clicks && has.conversions && accountCtr !== undefined && accountCvr !== undefined && r.ctr !== undefined && r.cvr !== undefined
      && clicks >= MIN_CLICKS_TO_JUDGE && r.ctr >= accountCtr && r.cvr < accountCvr * 0.5) {
      findings.push({
        id: `click-no-buy-${idBase}`, kind: 'wrong', area: 'ads',
        title: `People click ${r.name} but few convert`,
        what: `${r.name} gets clicks at ${pct(r.ctr, 2)} (your average is ${pct(accountCtr, 2)}), but only ${pct(r.cvr)} of clicks convert against your average of ${pct(accountCvr)}.`,
        why: 'Possible reasons, not proven: the landing page may not match what the ad promised, the price or offer may put people off, or checkout may be hard.',
        impact: 'The ad is doing its job and the step after the click is losing people.',
        next: `Open ${r.name}'s landing page on your phone and check it matches the ad. Fix the biggest gap first.`,
        evidence: [ev('Click rate', pct(r.ctr, 2)), ev('Clicks that convert', pct(r.cvr)), ev('Your average', pct(accountCvr))],
        confidence: levelFor(clicks, 1000, 300),
        confidenceReason: `Based on ${clicks.toLocaleString()} clicks (1,000+ is high, 300+ is medium).`,
      });
    }
  }

  // 6. Too much in one channel.
  if (cols.channel && channels.size >= 2) {
    const ranked = [...channels.entries()].map(([n, a]) => ({ n, spend: a.spend })).sort((a, b) => b.spend - a.spend);
    const topShare = ranked[0].spend / total.spend;
    if (topShare >= 0.7) {
      findings.push({
        id: 'channel-concentration', kind: 'note', area: 'ads',
        title: `${pct(topShare, 0)} of your ad spend is on ${ranked[0].n}`,
        what: `${ranked[0].n} takes ${money(ranked[0].spend)} of ${money(total.spend)}. The other ${ranked.length - 1} channel${ranked.length > 2 ? 's share' : ' gets'} the rest.`,
        why: 'This is not wrong by itself, but a change in that channel (price, policy, audience) would hit most of your results.',
        impact: 'Results depend heavily on one channel.',
        next: `Check whether ${ranked[0].n} is actually your best return before adding more. If it is, keep going. If not, test a small budget elsewhere.`,
        evidence: [ev('Share of spend', pct(topShare, 0)), ev('Channels in this file', String(ranked.length))],
        confidence: 'high',
        confidenceReason: 'This is a direct count of spend in your file.',
      });
    }
  }

  // 7. Spend rose but efficiency fell.
  let dateRange: GtmReport['dateRange'];
  if (dated.length >= 2 && cols.date) {
    const times_ = dated.map((d) => d.t);
    const from = Math.min(...times_); const to = Math.max(...times_);
    dateRange = { from, to };
    const spanDays = Math.floor((to - from) / DAY) + 1;
    if (spanDays >= 14 && dated.length >= 0.5 * rows.length) {
      const win = Math.min(14, Math.floor(spanDays / 2));
      const cut = to - win * DAY;
      const prevFrom = cut - win * DAY;
      const sum = (lo: number, hi: number) => dated.filter((d) => d.t > lo && d.t <= hi).reduce((s, d) => ({ spend: s.spend + d.spend, revenue: s.revenue + d.revenue, conv: s.conv + d.conversions }), { spend: 0, revenue: 0, conv: 0 });
      const now = sum(cut, to); const before = sum(prevFrom, cut);
      if (before.spend > 0 && now.spend >= before.spend * 1.2) {
        const eff = has.revenue ? { n: safeDiv(now.revenue, now.spend), b: safeDiv(before.revenue, before.spend), name: 'return on ad spend', fmt: times, worse: (n: number, b: number) => n <= b * 0.85 }
          : has.conversions ? { n: safeDiv(now.spend, now.conv), b: safeDiv(before.spend, before.conv), name: 'cost per conversion', fmt: money, worse: (n: number, b: number) => n >= b * 1.15 } : null;
        if (eff && eff.n !== undefined && eff.b !== undefined && eff.worse(eff.n, eff.b)) {
          findings.push({
            id: 'spend-up-efficiency-down', kind: 'wrong', area: 'ads',
            title: 'You spent more recently, and each dollar did less',
            what: `Spend went from ${money(before.spend)} to ${money(now.spend)} (latest ${win} days vs the ${win} days before), while ${eff.name} went from ${eff.fmt(eff.b)} to ${eff.fmt(eff.n)}.`,
            why: 'Possible reasons, not proven: more budget often reaches less-interested people, or something else changed in the same period (offer, season, tracking).',
            impact: `${money(now.spend - before.spend)} more was spent for a weaker ${eff.name}.`,
            next: 'Find the campaign whose spend grew most in the latest period and roll its budget back to the earlier level for a week.',
            evidence: [ev('Spend, latest period', money(now.spend)), ev('Spend, period before', money(before.spend)), ev(`${eff.name}, latest`, eff.fmt(eff.n)), ev(`${eff.name}, before`, eff.fmt(eff.b))],
            confidence: levelFor(Math.round(now.conv + before.conv), 60, 20),
            confidenceReason: `Compares two ${win}-day periods using ${Math.round(now.conv + before.conv).toLocaleString()} conversions in total (60+ is high, 20+ is medium).`,
          });
        }
      }
    } else if (cols.date) {
      notes.push('Dates cover under two weeks, so no trend over time is shown.');
    }
  }

  if (small.length) notes.push(`Too early to judge: ${small.slice(0, 6).join(', ')}${small.length > 6 ? ` and ${small.length - 6} more` : ''}. They have too little spend or too few clicks for a fair comparison.`);
  if (!has.revenue) notes.push('There is no revenue column, so we compare cost per conversion instead of return on ad spend.');
  if (!has.conversions) notes.push('There is no conversions column, so we cannot tell which ads lead to sales. Add one for a fuller picture.');
  notes.push('Everything above compares your ads with your own average in this file. It is not an industry benchmark.');

  // Order: things to fix first, then what works, then notes.
  const rank = { wrong: 0, right: 1, note: 2 } as const;
  findings.sort((a, b) => rank[a.kind] - rank[b.kind]);

  return { kind: 'ads', rowCount: rows.length, rowsUsed: used, columns: colsUsed, dimension, table, totals, findings, notes, needs: GTM_NEEDS_PAIR, dateRange };
}

const GTM_NEEDS_PAIR = { ads: GTM_NEEDS.ads, pipeline: GTM_NEEDS.pipeline };

// ---------------------------------------------------------------------------
// Pipeline (deals)
// ---------------------------------------------------------------------------

type Outcome = 'won' | 'lost' | 'open';
const outcomeOf = (v: unknown): Outcome => {
  const s = String(v ?? '').toLowerCase();
  if (/\bwon\b|closed won|\bwin\b/.test(s)) return 'won';
  if (/\blost\b|closed lost|\bloss\b/.test(s)) return 'lost';
  return 'open';
};

const MIN_CLOSED_OVERALL = 20;
const MIN_CLOSED_GROUP = 10;

function analysePipeline(rows: Row[], headers: string[]): GtmReport {
  const cols = matchRoles(headers, DEAL_ROLES);
  const notes: string[] = [];
  const colsUsed: Record<string, string> = {};
  (Object.keys(cols) as (keyof typeof cols)[]).forEach((k) => { if (cols[k]) colsUsed[k] = cols[k]!; });

  interface Deal { outcome: Outcome; amount: number | null; created: number | null; closed: number | null; source?: string; segment?: string; reason?: string }
  const deals: Deal[] = rows.map((r) => ({
    outcome: outcomeOf(r[cols.stage!]),
    amount: parseNumber(r[cols.amount!]),
    created: cols.created ? parseDate(r[cols.created]) : null,
    closed: cols.closed ? parseDate(r[cols.closed]) : null,
    source: cols.source ? String(r[cols.source] ?? '').trim() || undefined : undefined,
    segment: cols.segment ? String(r[cols.segment] ?? '').trim() || undefined : undefined,
    reason: cols.lostReason ? String(r[cols.lostReason] ?? '').trim() || undefined : undefined,
  }));

  const won = deals.filter((d) => d.outcome === 'won');
  const lost = deals.filter((d) => d.outcome === 'lost');
  const open = deals.filter((d) => d.outcome === 'open');
  const closed = won.length + lost.length;
  const findings: GtmFinding[] = [];

  const winRate = closed > 0 ? won.length / closed : undefined;
  const wonAmounts = won.map((d) => d.amount).filter((a): a is number => a !== null);
  const avgWon = wonAmounts.length ? wonAmounts.reduce((s, a) => s + a, 0) / wonAmounts.length : undefined;
  const cycles = won.filter((d) => d.created !== null && d.closed !== null && d.closed >= d.created).map((d) => (d.closed! - d.created!) / DAY);
  const avgCycle = cycles.length ? cycles.reduce((s, c) => s + c, 0) / cycles.length : undefined;

  const groupsOut: DealGroup[] = [];

  notes.push(`${rows.length.toLocaleString()} deals: ${won.length} won, ${lost.length} lost, ${open.length} still open.`);
  if (winRate !== undefined) notes.push(`Win rate is ${pct(winRate)} of closed deals (won ÷ (won + lost)). Open deals are not counted.`);
  if (avgWon !== undefined) notes.push(`Average won deal: ${money(avgWon)}.`);
  if (avgCycle !== undefined) notes.push(`Average time to win: ${Math.round(avgCycle)} days.`);
  if (closed < MIN_CLOSED_OVERALL) notes.push(`Only ${closed} deals are closed. We compare sources or segments once there are at least ${MIN_CLOSED_OVERALL}.`);

  const byDim = (key: 'source' | 'segment', labelName: string) => {
    const groups = new Map<string, { won: number; lost: number; amount: number }>();
    for (const d of deals) {
      const k = d[key];
      if (!k || d.outcome === 'open') continue;
      const g = groups.get(k) ?? { won: 0, lost: 0, amount: 0 };
      if (d.outcome === 'won') { g.won++; g.amount += d.amount ?? 0; } else g.lost++;
      groups.set(k, g);
    }
    if (winRate === undefined || closed < MIN_CLOSED_OVERALL) return;
    const small: string[] = [];
    for (const [name, g] of groups) {
      const n = g.won + g.lost;
      if (n < MIN_CLOSED_GROUP) { small.push(name); continue; }
      const rate = g.won / n;
      const idBase = `${key}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const conf = levelFor(n, 40, 20);
      const confReason = `Based on ${n} closed deals from ${name} (40+ is high, 20+ is medium).`;
      if (rate < winRate * 0.5) {
        findings.push({
          id: `low-win-${idBase}`, kind: 'wrong', area: 'pipeline',
          title: `Deals from ${name} rarely close`,
          what: `${name} won ${g.won} of ${n} closed deals (${pct(rate, 0)}). All your deals win ${pct(winRate, 0)}.`,
          why: `Possible reasons, not proven: ${name} may bring people who are not a good fit, or your follow-up for this ${labelName} may be slower.`,
          impact: `${lost.length ? `${g.lost} lost deals` : 'Lost deals'} from ${name} used sales time that better-fit ${labelName}s could have used.`,
          next: `Look at the last 5 lost ${name} deals and write down what they had in common. Tighten who you let into the pipeline from ${name}.`,
          evidence: [ev('Win rate', pct(rate, 0)), ev('Your overall win rate', pct(winRate, 0)), ev('Closed deals', String(n))],
          confidence: conf, confidenceReason: confReason,
        });
      } else if (rate >= winRate * 1.5) {
        findings.push({
          id: `high-win-${idBase}`, kind: 'right', area: 'pipeline',
          title: `Deals from ${name} close well`,
          what: `${name} won ${g.won} of ${n} closed deals (${pct(rate, 0)}) against ${pct(winRate, 0)} overall${g.won ? `, worth ${money(g.amount)}` : ''}.`,
          why: `Possible reasons, not proven: ${name} may reach people who are a good fit. This is a lead on who your best customers are, not a guarantee.`,
          impact: `${name} is where your sales time is best spent.`,
          next: `Write down what the ${g.won} ${name} wins have in common (size, industry, problem). Aim more of your outreach at that profile.`,
          evidence: [ev('Win rate', pct(rate, 0)), ev('Your overall win rate', pct(winRate, 0)), ev('Closed deals', String(n))],
          confidence: conf, confidenceReason: confReason,
        });
      }
      groupsOut.push({ name: `${labelName}: ${name}`, closed: n, won: g.won, winRate: rate, wonAmount: g.amount });
    }
    if (small.length) notes.push(`Too few closed deals to compare: ${small.slice(0, 5).join(', ')}${small.length > 5 ? ` and ${small.length - 5} more` : ''} (under ${MIN_CLOSED_GROUP} each).`);
  };
  byDim('source', 'source');
  byDim('segment', 'segment');

  // Stalled open deals.
  const dates = deals.flatMap((d) => [d.created, d.closed]).filter((t): t is number => t !== null);
  if (avgCycle !== undefined && cycles.length >= 5 && dates.length) {
    const asOf = Math.max(...dates);
    const stalled = open.filter((d) => d.created !== null && (asOf - d.created) / DAY > avgCycle * 2);
    if (stalled.length >= 3) {
      const value = stalled.reduce((s, d) => s + (d.amount ?? 0), 0);
      findings.push({
        id: 'stalled-deals', kind: 'wrong', area: 'pipeline',
        title: `${stalled.length} open deals are much older than a normal win`,
        what: `${stalled.length} open deals have been open more than twice your average time to win (${Math.round(avgCycle)} days), worth ${money(value)}.`,
        why: 'Possible reasons, not proven: they may have gone quiet, be waiting on a decision, or be dead deals nobody closed out.',
        impact: `${money(value)} of your open pipeline may be less real than it looks.`,
        next: 'Go through these deals this week. Contact each or mark it lost, so your pipeline total can be trusted.',
        evidence: [ev('Stalled deals', String(stalled.length)), ev('Value', money(value)), ev('Average time to win', `${Math.round(avgCycle)} days`)],
        confidence: levelFor(cycles.length, 20, 10),
        confidenceReason: `"Normal" is based on ${cycles.length} won deals with dates (20+ is high, 10+ is medium). Dates are measured up to the latest date in your file.`,
      });
    }
  }

  // Most common lost reason.
  if (cols.lostReason && lost.length >= 10) {
    const counts = new Map<string, number>();
    lost.forEach((d) => { if (d.reason) counts.set(d.reason, (counts.get(d.reason) ?? 0) + 1); });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / lost.length >= 0.3) {
      findings.push({
        id: 'top-lost-reason', kind: 'note', area: 'pipeline',
        title: `"${top[0]}" is the most common reason deals are lost`,
        what: `${top[1]} of ${lost.length} lost deals (${pct(top[1] / lost.length, 0)}) were lost for "${top[0]}".`,
        why: 'This is what was recorded by your team. It can differ from the real reason, so confirm it with a few lost customers.',
        impact: 'Fixing the biggest reason wins back more than fixing a rare one.',
        next: `Call two lost customers who gave "${top[0]}" and ask what would have changed their mind.`,
        evidence: [ev('Lost for this reason', `${top[1]} of ${lost.length}`)],
        confidence: levelFor(lost.length, 50, 20),
        confidenceReason: `Based on ${lost.length} lost deals with a recorded reason (50+ is high, 20+ is medium).`,
      });
    }
  }

  if (!cols.created || !cols.closed) notes.push('Add created and closed dates to see how long deals take and which open deals have stalled.');
  if (!cols.source) notes.push('Add a lead source column to see which sources win.');
  notes.push('Everything above compares your sources and segments with your own overall win rate, not an industry benchmark.');

  const rank = { wrong: 0, right: 1, note: 2 } as const;
  findings.sort((a, b) => rank[a.kind] - rank[b.kind]);

  const allDates = dates.length ? { from: Math.min(...dates), to: Math.max(...dates) } : undefined;
  const deals_: DealSummary = { total: rows.length, won: won.length, lost: lost.length, open: open.length, winRate, avgWonAmount: avgWon, avgCycleDays: avgCycle, groups: groupsOut.sort((a, b) => b.closed - a.closed) };
  return { kind: 'pipeline', rowCount: rows.length, rowsUsed: rows.length, columns: colsUsed, table: [], deals: deals_, findings, notes, needs: GTM_NEEDS_PAIR, dateRange: allDates };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Decide what kind of file this is. Returns 'unknown' when it fits neither. */
export function detectGtmKind(headers: string[]): GtmKind {
  const ads = matchRoles(headers, AD_ROLES);
  const deals = matchRoles(headers, DEAL_ROLES);
  const adsOk = !!ads.spend && !!(ads.clicks || ads.impressions || ads.conversions);
  const dealsOk = !!deals.stage && !!deals.amount;
  if (adsOk && !dealsOk) return 'ads';
  if (dealsOk && !adsOk) return 'pipeline';
  if (adsOk && dealsOk) return ads.impressions || ads.clicks ? 'ads' : 'pipeline';
  return 'unknown';
}

export function analyseGtm(rows: Row[], headersHint?: string[]): GtmReport {
  try {
    const headers = headersOf(rows, headersHint);
    const kind = detectGtmKind(headers);
    if (!rows.length || kind === 'unknown') {
      return { kind: 'unknown', rowCount: rows.length, rowsUsed: 0, columns: {}, table: [], findings: [], notes: rows.length ? ['We could not tell whether this is an ad export or a deals export from its column names.'] : ['This file has no rows.'], needs: GTM_NEEDS_PAIR };
    }
    return kind === 'ads' ? analyseAds(rows, headers) : analysePipeline(rows, headers);
  } catch {
    return { kind: 'unknown', rowCount: rows.length, rowsUsed: 0, columns: {}, table: [], findings: [], notes: ['This file could not be read. Check that it is a normal table with a header row.'], needs: GTM_NEEDS_PAIR };
  }
}

/** A blank CSV (headers only) people can fill in. Contains no data. */
export function templateCsv(kind: 'ads' | 'pipeline'): string {
  return (kind === 'ads' ? AD_TEMPLATE_HEADERS : PIPELINE_TEMPLATE_HEADERS).join(',') + '\n';
}
