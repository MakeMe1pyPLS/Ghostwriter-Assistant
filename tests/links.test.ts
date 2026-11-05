import { findPossibleLinks, requiredStrength, weeklySeries } from '../shared/links';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

// Seeded random numbers so the tests are repeatable.
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const START = Date.UTC(2026, 0, 5); // a Monday
const DAYMS = 86400000;

/** 14 rows a week. spend[w] and onTimeRate[w] decide the week's numbers. */
function build(weeks: number, spendOf: (w: number) => number, onTimeOf: (w: number) => number): any[] {
  const rows: any[] = [];
  for (let w = 0; w < weeks; w++) {
    const spend = spendOf(w), rate = Math.max(0, Math.min(1, onTimeOf(w)));
    const yes = Math.round(14 * rate);
    for (let k = 0; k < 14; k++) {
      rows.push({
        Date: new Date(START + (w * 7 + Math.floor(k / 2)) * DAYMS).toISOString().slice(0, 10),
        Revenue: 1000, Orders: 20, COGS: 600, Sessions: 1000, 'Ad Spend': spend / 14 * 2, 'New Customers': 10, Returns: 1, 'On Time': k < yes ? 'Yes' : 'No',
      });
    }
  }
  return rows;
}

// 1. A real, built-in relationship: more spend, fewer on-time deliveries (same week).
{
  const r = rng(7); const spend = Array.from({ length: 24 }, () => 100 + 80 * (r() - 0.5) * 2);
  const rows = build(24, (w) => spend[w], (w) => 0.9 - 0.004 * (spend[w] - 100));
  const rep = findPossibleLinks(rows);
  ok(rep.status === 'ok' && rep.weeksUsed === 24, 'reads 24 weeks', rep);
  const cac = rep.links.find((l) => (l.a.id === 'cac' && l.b.id === 'on-time') || (l.a.id === 'on-time' && l.b.id === 'cac'));
  ok(!!cac && cac.direction === 'opposite' && cac.lagWeeks === 0, 'finds: higher CAC (more spend) ↔ lower on-time', rep.links.map((l) => l.id));
  ok(rep.links.every((l) => l.a.area !== l.b.area), 'only cross-area links');
  ok(rep.links.every((l) => /could be a coincidence/.test(l.otherExplanations) && /does not show that one causes/.test(l.otherExplanations)), 'every link says it is not proof');
  ok(rep.links.every((l) => !/\b(causes|caused|because|leads to|drives)\b/i.test(l.sentence)), 'sentences use no causal words', rep.links.map((l) => l.sentence));
  ok(rep.links.length <= 5 && new Set(rep.links.map((l) => [l.a.id, l.b.id].sort().join())).size === rep.links.length, 'at most 5, one per pair');
  ok(rep.links.every((l) => Math.abs(l.r) >= requiredStrength(l.weeks)), 'all pass the strength bar');
}

// 1b. Redundant and mechanical links are not shown.
{
  const r = rng(7); const spend = Array.from({ length: 24 }, () => 100 + 80 * (r() - 0.5) * 2);
  const rep = findPossibleLinks(build(24, (w) => spend[w], (w) => 0.9 - 0.004 * (spend[w] - 100)));
  const onTimeLinks = rep.links.filter((l) => l.a.id === 'on-time' || l.b.id === 'on-time');
  ok(onTimeLinks.length === 1, 'CAC and ROAS both come from ad spend: only the stronger is shown', onTimeLinks.map((l) => l.id));
  // Revenue changes while spend is flat: revenue vs ROAS moves together only because ROAS is revenue / spend.
  const rev = Array.from({ length: 24 }, (_, w) => 800 + ((w * 37) % 11) * 40);
  const rows: any[] = [];
  for (let w = 0; w < 24; w++) for (let k = 0; k < 14; k++) rows.push({ Date: new Date(START + (w * 7 + Math.floor(k / 2)) * DAYMS).toISOString().slice(0, 10), Revenue: rev[w], Orders: 20, COGS: 600, Sessions: 1000, 'Ad Spend': 100, 'New Customers': 10, Returns: 1, 'On Time': 'Yes' });
  const m = findPossibleLinks(rows);
  ok(m.status === 'ok' && m.links.length === 0, 'flat spend, moving revenue: every apparent link is arithmetic (revenue, ROAS, AOV, margin share a column), so none is reported', m.links.map((l) => l.id));
}

// 2. Unrelated numbers: no links, across many random seeds.
{
  let falseAlarms = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const r = rng(seed * 101), r2 = rng(seed * 977 + 5);
    const spend = Array.from({ length: 16 }, () => 100 + 80 * (r() - 0.5) * 2);
    const rate = Array.from({ length: 16 }, () => 0.5 + 0.4 * r2());
    falseAlarms += findPossibleLinks(build(16, (w) => spend[w], (w) => rate[w])).links.length;
  }
  ok(falseAlarms <= 1, `30 unrelated random files: ${falseAlarms} false links (allowed: 1)`, falseAlarms);
}

// 3. Two numbers that only share a trend (spend creeping up, on-time creeping down, independent wobble).
{
  let falseAlarms = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const r = rng(seed * 31), r2 = rng(seed * 57 + 3);
    const spend = Array.from({ length: 20 }, (_, w) => 80 + w * 4 + 6 * (r() - 0.5));
    const rate = Array.from({ length: 20 }, (_, w) => 0.95 - w * 0.012 + 0.03 * (r2() - 0.5));
    falseAlarms += findPossibleLinks(build(20, (w) => spend[w], (w) => rate[w])).links.filter((l) => (l.a.id === 'cac' || l.b.id === 'cac') && (l.a.id === 'on-time' || l.b.id === 'on-time')).length;
  }
  ok(falseAlarms === 0, 'shared-trend-only pairs are rejected (20 files)', falseAlarms);
}

// 4. One-week delay: this week's spend, next week's on-time.
{
  const r = rng(11); const spend = Array.from({ length: 26 }, () => 100 + 80 * (r() - 0.5) * 2);
  const rep = findPossibleLinks(build(26, (w) => spend[w], (w) => (w === 0 ? 0.9 : 0.9 - 0.004 * (spend[w - 1] - 100))));
  const l = rep.links.find((x) => (x.a.id === 'cac' && x.b.id === 'on-time'));
  ok(!!l && l.lagWeeks === 1 && l.sentence.includes('the following week'), 'finds the one-week delay', rep.links.map((x) => [x.id, x.lagWeeks]));
}

// 5. Not enough data / no dates / junk.
ok(findPossibleLinks(build(6, () => 100, () => 0.9)).status === 'not-enough-data', 'under 8 weeks: says so');
ok(findPossibleLinks([{ A: 1, B: 2 }, { A: 2, B: 3 }]).status === 'no-dates', 'no date column: says so');
ok(findPossibleLinks([]).status === 'no-dates' && findPossibleLinks([null as any, 5 as any, {}]).links.length === 0, 'empty and junk input do not throw');
{
  const rep = findPossibleLinks(build(20, (w) => 100 + (w % 5) * 20, () => 1));
  ok(rep.notes.some((n) => n.includes('barely change') && n.includes('On-time')), 'constant on-time is skipped and named', rep.notes);
}
ok(!/NaN|Infinity/.test(JSON.stringify(findPossibleLinks(build(20, (w) => 100 + (w % 7) * 15, (w) => 0.6 + (w % 4) * 0.1)))), 'no NaN or Infinity');

// 6. Weekly series are the same numbers the KPI engine gives.
{
  const ws = weeklySeries(build(10, () => 140, () => 0.5))!;
  ok(ws.weeks.length === 10 && ws.series['on-time'].every((v) => v === 50) && ws.series['revenue'].every((v) => v === 14000), 'weekly series: on-time 50%, revenue 14,000 each week', ws.series['on-time']);
}
ok(requiredStrength(8) > 0.85 && requiredStrength(30) < 0.6 && requiredStrength(2) === 1, 'strength bar falls as weeks grow');
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
