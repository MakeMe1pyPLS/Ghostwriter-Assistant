import { analyseGtm, detectGtmKind, templateCsv, AD_TEMPLATE_HEADERS } from '../shared/gtm-engine';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) { fails++; } };
const near = (a: number | undefined, b: number, eps = 0.001) => a !== undefined && Math.abs(a - b) <= eps;

// ---- Ads: five campaigns, hand-calculated.
// total spend 6,120; clicks 3,555; impressions 480,500; conversions 190; revenue 15,000
// account ROAS 2.451, CPA 32.21, CTR 0.74%, CVR 5.34%
const camp = (Campaign: string, Channel: string, Spend: number, Impressions: number, Clicks: number, Conversions: number, Revenue: number) => ({ Campaign, Channel, Spend, Impressions, Clicks, Conversions, Revenue });
const ads = [
  camp('Brand Search', 'Google', 1000, 20000, 1000, 100, 6000),
  camp('Prospecting Broad', 'Meta', 4000, 400000, 2000, 40, 4000),
  camp('Retargeting', 'Meta', 500, 10000, 400, 50, 5000),
  camp('Video Test', 'YouTube', 600, 50000, 150, 0, 0),
  camp('Tiny Test', 'TikTok', 20, 500, 5, 0, 0),
];
const r = analyseGtm(ads);
ok(r.kind === 'ads' && r.dimension === 'campaign', 'detected as ads by campaign', [r.kind, r.dimension]);
ok(near(r.totals?.spend, 6120, 0.01) && near(r.totals?.roas, 15000 / 6120) && near(r.totals?.cpa, 6120 / 190), 'totals correct', r.totals);
const row = (n: string) => r.table.find((t) => t.name === n)!;
ok(near(row('Brand Search').roas, 6) && near(row('Brand Search').cpa, 10) && near(row('Brand Search').ctr, 0.05) && near(row('Brand Search').cvr, 0.1), 'Brand Search metrics', row('Brand Search'));
ok(row('Video Test').cpa === undefined && row('Video Test').roas === 0, 'zero conversions: CPA undefined (no Infinity), ROAS 0', row('Video Test'));
const ids = r.findings.map((f) => f.id);
ok(ids.includes('no-results-video-test'), 'flags spend with no conversions', ids);
ok(ids.includes('weak-return-prospecting-broad'), 'flags big spend with far-below-average return', ids);
ok(ids.includes('working-retargeting') && ids.includes('working-brand-search'), 'finds the two working campaigns', ids);
ok(!ids.some((i) => i.includes('tiny-test')), 'tiny campaign is not judged', ids);
ok(r.notes.some((n) => n.includes('Too early to judge') && n.includes('Tiny Test')), 'tiny campaign listed as too early', r.notes);
ok(ids.includes('channel-concentration'), 'Meta holds 73.5% of spend: noted', ids);
ok(r.findings[0].kind === 'wrong' && r.findings.at(-1)!.kind === 'note', 'ordered: fix first, notes last', r.findings.map((f) => f.kind));
const nr = r.findings.find((f) => f.id === 'no-results-video-test')!;
ok(nr.confidence === 'low' && /150 clicks/.test(nr.confidenceReason), 'zero-conversion finding is low confidence at 150 clicks', nr);
ok(r.findings.every((f) => /^Possible reasons?|^This is|^This is what/.test(f.why) || f.why.startsWith('Possible')), 'every "why" is worded as a possibility', r.findings.map((f) => f.why.slice(0, 30)));
ok(r.findings.every((f) => f.evidence.length > 0 && f.evidence.every((e) => e.source === 'your-data')), 'every finding has evidence from the file');
ok(r.notes.some((n) => n.includes('not an industry benchmark')), 'states it is not a benchmark');

// ---- Messy headers and formats
const messy = analyseGtm([
  { 'Campaign name': 'A', 'Amount spent (USD)': '$1,200.50', 'Impressions': '30,000', 'Link clicks': '600', 'Purchases': '30', 'Purchase conversion value': '$4,800' },
  { 'Campaign name': 'B', 'Amount spent (USD)': '$800.00', 'Impressions': '20,000', 'Link clicks': '400', 'Purchases': '20', 'Purchase conversion value': '$1,000' },
]);
ok(messy.kind === 'ads' && near(messy.totals?.spend, 2000.5), 'reads $ and comma formats and Meta-style headers', messy.totals);
ok(near(messy.totals?.roas, 5800 / 2000.5), 'ROAS from "Purchase conversion value"', messy.totals);

// ---- No revenue column: falls back to cost per conversion, and says so
const noRev = analyseGtm([
  { Campaign: 'Cheap', Spend: 100, Clicks: 500, Conversions: 50 },
  { Campaign: 'Costly', Spend: 900, Clicks: 1500, Conversions: 30 },
]);
ok(noRev.notes.some((n) => n.includes('no revenue column')), 'says there is no revenue column', noRev.notes);
ok(noRev.findings.some((f) => f.id === 'costly-costly'), 'compares cost per conversion without revenue', noRev.findings.map((f) => f.id));

// ---- Channel only, and no dimension at all
const chOnly = analyseGtm([{ Channel: 'Google', Spend: 100, Clicks: 100 }, { Channel: 'Meta', Spend: 100, Clicks: 100 }]);
ok(chOnly.kind === 'ads' && chOnly.dimension === 'channel', 'channel-only file works', [chOnly.kind, chOnly.dimension]);
const none = analyseGtm([{ Spend: 100, Clicks: 100 }, { Spend: 50, Clicks: 20 }]);
ok(none.dimension === 'all' && none.table.length === 1 && none.table[0].name === 'All ads', 'no campaign/channel column: one row', none.table);

// ---- Trend: spend +50%, ROAS 4 → 3
const day = (i: number) => new Date(Date.UTC(2026, 8, 1) + i * 86400000).toISOString().slice(0, 10);
const trend = analyseGtm(Array.from({ length: 28 }, (_, i) => ({ Date: day(i), Campaign: 'X', Spend: i < 14 ? 100 : 150, Clicks: 100, Conversions: 10, Revenue: i < 14 ? 400 : 450 })));
const tf = trend.findings.find((f) => f.id === 'spend-up-efficiency-down');
ok(!!tf && tf.what.includes('$1,400') && tf.what.includes('$2,100') && tf.what.includes('4.00x') && tf.what.includes('3.00x'), 'flags spend up, efficiency down with exact numbers', tf?.what);
const flat = analyseGtm(Array.from({ length: 28 }, (_, i) => ({ Date: day(i), Campaign: 'X', Spend: 100, Clicks: 100, Conversions: 10, Revenue: 400 })));
ok(!flat.findings.some((f) => f.id === 'spend-up-efficiency-down'), 'no false alarm when steady');
const short = analyseGtm(Array.from({ length: 7 }, (_, i) => ({ Date: day(i), Campaign: 'X', Spend: 100, Clicks: 100, Conversions: 10, Revenue: 400 })));
ok(short.notes.some((n) => n.includes('under two weeks')), 'short span says no trend');

// ---- Bad input never throws
ok(analyseGtm([]).kind === 'unknown', 'empty file');
ok(analyseGtm([{ foo: 1, bar: 2 }]).kind === 'unknown' && analyseGtm([{ foo: 1 }]).needs.ads.length > 0, 'unrecognised file lists what each kind needs');
const bad = analyseGtm([{ Campaign: 'A', Spend: 'n/a', Clicks: 5 }, { Campaign: 'B', Spend: 100, Clicks: 5 }]);
ok(bad.rowsUsed === 1 && bad.notes.some((n) => n.includes('1 rows were skipped')), 'skips unreadable spend and says so', bad.notes);
const zero = analyseGtm([{ Campaign: 'A', Spend: 0, Clicks: 5 }]);
ok(zero.findings.length === 0 && zero.notes.some((n) => n.includes('zero')), 'zero total spend: nothing to judge');
ok(!/NaN|Infinity/.test(JSON.stringify([r, messy, noRev, trend, zero])), 'no NaN or Infinity anywhere');

// ---- Pipeline: hand-calculated.
// Referral: 8 won, 2 lost (80%). Cold: 2 won, 18 lost (10%). Overall: 10 won of 30 closed = 33.3%.
const deals: any[] = [];
const d = (i: number) => day(i % 20);
for (let i = 0; i < 8; i++) deals.push({ Deal: `R${i}`, Stage: 'Closed Won', Amount: 1000, Created: day(0), Closed: day(10), Source: 'Referral' });
for (let i = 0; i < 2; i++) deals.push({ Deal: `RL${i}`, Stage: 'Closed Lost', Amount: 1000, Created: day(0), Closed: day(12), Source: 'Referral', 'Lost reason': 'Price' });
for (let i = 0; i < 2; i++) deals.push({ Deal: `C${i}`, Stage: 'Closed Won', Amount: 500, Created: day(0), Closed: day(30), Source: 'Cold', });
for (let i = 0; i < 18; i++) deals.push({ Deal: `CL${i}`, Stage: 'Closed Lost', Amount: 500, Created: day(0), Closed: day(25), Source: 'Cold', 'Lost reason': i < 9 ? 'No budget' : 'Price' });
// 4 open deals created on day 0 while the file runs to day 30, so they are 30 days old vs average cycle (8*10+2*30)/10 = 14 days: 30 > 28.
for (let i = 0; i < 4; i++) deals.push({ Deal: `O${i}`, Stage: 'Negotiation', Amount: 2000, Created: day(0), Closed: '', Source: 'Referral' });
const p = analyseGtm(deals);
ok(p.kind === 'pipeline' && p.deals?.won === 10 && p.deals.lost === 20 && p.deals.open === 4, 'counts won/lost/open', p.deals);
ok(near(p.deals?.winRate, 1 / 3) && near(p.deals?.avgWonAmount, (8 * 1000 + 2 * 500) / 10) && near(p.deals?.avgCycleDays, 14), 'win rate, average deal, cycle', p.deals);
const pid = p.findings.map((f) => f.id);
ok(pid.includes('high-win-source-referral') && pid.includes('low-win-source-cold'), 'good and bad sources found', pid);
ok(pid.includes('stalled-deals') && p.findings.find((f) => f.id === 'stalled-deals')!.evidence.some((e) => e.value === '$8,000'), 'stalled open deals valued at $8,000', p.findings.find((f) => f.id === 'stalled-deals'));
const lr = p.findings.find((f) => f.id === 'top-lost-reason');
ok(!!lr && lr.what.includes('11 of 20') && lr.what.includes('"Price"') && lr.kind === 'note', 'most common lost reason: "Price", 11 of 20', lr?.what);
ok(p.findings.every((f) => f.evidence.length > 0), 'every pipeline finding has evidence');
const smallP = analyseGtm(deals.slice(0, 12));
ok(smallP.findings.length === 0 && smallP.notes.some((n) => n.includes('at least 20')), 'too few closed deals: no comparisons, says why', smallP.notes);
ok(detectGtmKind(['Deal', 'Stage', 'Amount']) === 'pipeline' && detectGtmKind(['Campaign', 'Spend', 'Clicks']) === 'ads' && detectGtmKind(['Name', 'Notes']) === 'unknown', 'kind detection');
ok(templateCsv('ads') === AD_TEMPLATE_HEADERS.join(',') + '\n' && templateCsv('pipeline').split('\n').length === 2, 'templates are headers only, no data');
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
