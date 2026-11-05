import { calculateKpis, mapColumns, parseNumber, parseDate, parseBool, formatKpiValue } from '../shared/kpi-engine';
let fails = 0;
const t = (ok: boolean, m: string, extra?: any) => { console.log(ok ? 'PASS' : 'FAIL', m, ok ? '' : JSON.stringify(extra)); if (!ok) fails++; };
const near = (a: number | undefined, b: number, eps = 0.01) => a !== undefined && Math.abs(a - b) <= eps;

// ---- fixture with known answers
const rows: any[] = [];
const start = Date.UTC(2026, 8, 1);
for (let d = 0; d < 40; d++) rows.push({
  'Order Date': new Date(start + d * 86400000).toISOString().slice(0, 10),
  'Revenue ($)': `$${(1000 + 10 * d).toLocaleString('en-US')}`, Orders: 20, COGS: 600, Sessions: 1000, 'Ad Spend': 200,
  'New Customers': 10, Returns: 1, 'On Time': d >= 35 ? 'No' : 'Yes',
});
const run = calculateKpis(rows);
const by = (id: string) => run.results.find((r) => r.id === id)!;
t(run.results.length === 12, '12 KPI definitions');
t(near(by('revenue').value, 47800), 'revenue sums with $ strings', by('revenue').value);
t(near(by('orders').value, 800), 'orders', by('orders').value);
t(near(by('aov').value, 59.75), 'AOV', by('aov').value);
t(near(by('gross-margin').value, 49.79, 0.01), 'gross margin', by('gross-margin').value);
t(near(by('conversion').value, 2), 'conversion', by('conversion').value);
t(near(by('roas').value, 5.975, 0.001), 'ROAS', by('roas').value);
t(near(by('cac').value, 20), 'CAC', by('cac').value);
t(near(by('return-rate').value, 5), 'return rate', by('return-rate').value);
t(near(by('on-time').value, 87.5), 'on-time rate', by('on-time').value);
t(by('revenue').change?.amount === 18.3 && by('revenue').change?.better === true, 'revenue change +18.3% and better', by('revenue').change);
t(by('on-time').change?.amount === -25 && by('on-time').change?.kind === 'points' && by('on-time').change?.better === false, 'on-time change -25 pts and worse', by('on-time').change);
t(by('cac').change?.amount === 0 && by('cac').change?.better === null, 'flat CAC has no better/worse', by('cac').change);
t(by('revenue').display === '$47,800', 'display formats $', by('revenue').display);
t(by('net-margin').status === 'needs-data' && by('net-margin').missing![0].includes('net profit'), 'missing net profit says so', by('net-margin'));
t(by('opex-ratio').status === 'needs-data', 'missing expenses -> needs-data');
t(by('fulfilment-time').status === 'needs-data', 'no ship date -> needs-data');
t(run.dateRange?.datedRows === 40, 'date range found');

// ---- no dates: values but no change
const nodate = calculateKpis(rows.map(({ ['Order Date']: _, ...r }) => r));
t(nodate.results.find((r) => r.id === 'revenue')!.change === undefined, 'no date column -> no change shown');
t(nodate.results.find((r) => r.id === 'revenue')!.status === 'ok', 'no date column -> value still calculated');

// ---- short span: under 14 days no change
const short = calculateKpis(rows.slice(0, 10));
t(short.results.find((r) => r.id === 'revenue')!.change === undefined, '10 days of data -> no change (needs 2 weeks)');

// ---- weak alias flagged, skipped rows reported
const weak = calculateKpis([{ Amount: '100', Orders: 2 }, { Amount: 'n/a', Orders: 3 }, { Amount: '(20)', Orders: 1 }]);
const wr = weak.results.find((r) => r.id === 'revenue')!;
t(wr.status === 'ok' && near(wr.value, 80), 'parentheses are negative, n/a skipped', wr);
t(wr.limits.some((l) => l.includes('matched as revenue')), 'weak "Amount" match is flagged', wr.limits);
t(wr.limits.some((l) => l.includes('1 row skipped')), 'skipped rows reported', wr.limits);

// ---- zero denominator never gives Infinity
const zero = calculateKpis([{ Revenue: 100, 'Ad Spend': 0 }]);
t(zero.results.find((r) => r.id === 'roas')!.status === 'not-enough-data', 'ad spend 0 -> not enough data, not Infinity', zero.results.find((r) => r.id === 'roas'));

// ---- order IDs, distinct count; line items
const ids = calculateKpis([{ 'Order ID': 'A1', Revenue: 10 }, { 'Order ID': 'A1', Revenue: 5 }, { 'Order ID': 'B2', Revenue: 15 }]);
t(near(ids.results.find((r) => r.id === 'orders')!.value, 2), 'distinct order IDs', ids.results.find((r) => r.id === 'orders'));
t(near(ids.results.find((r) => r.id === 'aov')!.value, 15), 'AOV with line items = 30/2', ids.results.find((r) => r.id === 'aov'));

// ---- delivered vs promised dates
const dd = calculateKpis([
  { 'Delivered Date': '2026-09-03', 'Promised Date': '2026-09-03' },
  { 'Delivered Date': '2026-09-05', 'Promised Date': '2026-09-04' },
  { 'Delivered Date': '2026-09-02', 'Promised Date': '2026-09-04' },
  { 'Delivered Date': '', 'Promised Date': '2026-09-04' },
]);
const ot = dd.results.find((r) => r.id === 'on-time')!;
t(ot.status === 'ok' && near(ot.value, 66.67, 0.01), 'on-time from dates = 2 of 3 (blank row skipped)', ot);

// ---- ship time
const st = calculateKpis([{ 'Order Date': '2026-09-01', 'Ship Date': '2026-09-03' }, { 'Order Date': '2026-09-02', 'Ship Date': '2026-09-03' }, { 'Order Date': '2026-09-05', 'Ship Date': '2026-09-01' }]);
t(near(st.results.find((r) => r.id === 'fulfilment-time')!.value, 1.5), 'order-to-ship avg 1.5 days, negative pair ignored', st.results.find((r) => r.id === 'fulfilment-time'));

// ---- junk input never throws
for (const bad of [[], [{}], [null as any, undefined as any, 5 as any], [{ a: { b: 1 } }]]) {
  let ok = true; try { const r = calculateKpis(bad as any); ok = r.results.every((x) => x.status !== 'ok'); } catch { ok = false; }
  t(ok, 'junk input is safe: ' + JSON.stringify(bad));
}

// ---- column mapping
const m = mapColumns(['Order ID', 'Order Date', 'Total Revenue', 'Ship Date']);
t(m.map.revenue?.column === 'Total Revenue' && !m.map.revenue.loose, '"Total Revenue" -> revenue (strong contains)', m.map);
t(m.map.orderDate?.column === 'Order Date' && m.map.shipDate?.column === 'Ship Date' && m.map.orderId?.column === 'Order ID', 'ids and dates mapped separately', m.map);
const amb = mapColumns(['Sales', 'Revenue']);
t(amb.notes.length === 0 || amb.map.revenue !== undefined, 'ambiguity does not crash');

// ---- parsers
t(parseNumber('$1,234.50') === 1234.5 && parseNumber('12%') === 12 && parseNumber('abc') === null && parseNumber('') === null, 'parseNumber');
t(parseDate('2026-09-01') !== null && parseDate('9/1/2026') !== null && parseDate('Sep 1 2026') !== null && parseDate('12') === null && parseDate('1234') === null && parseDate('Order 5') === null && parseDate('hello') === null && parseDate('12') === null, 'parseDate');
t(parseBool('Yes') === true && parseBool('Late') === false && parseBool('maybe') === null, 'parseBool');
t(formatKpiValue(0.5, '$') === '$0.50' && formatKpiValue(94.24, '%') === '94.2%' && formatKpiValue(1234.6, '#') === '1,235', 'formatting');
console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exitCode = fails ? 1 : 0;
