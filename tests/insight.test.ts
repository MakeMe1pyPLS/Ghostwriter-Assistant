import { calculateKpis } from '../shared/kpi-engine';
import { standardiseInsight, compareOutcome, relatedKpis } from '../shared/insight';
let fails = 0; const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const start = Date.UTC(2026, 8, 1);
const mk = (n: number, onTimeFrom = 35, rev = 1000) => Array.from({ length: n }, (_, d) => ({ 'Order Date': new Date(start + d * 86400000).toISOString().slice(0, 10), 'Revenue ($)': rev + 10 * d, Orders: 20, COGS: 600, Sessions: 1000, 'Ad Spend': 200, 'New Customers': 10, Returns: 1, 'On Time': d >= onTimeFrom ? 'No' : 'Yes' }));
const run = calculateKpis(mk(40));
const item: any = { id: 'b1', type: 'bottleneck', title: 'Late deliveries are hurting repeat orders', severity: 'high', priorityRank: 1, affectedWorkflow: 'Delivery', currentState: 'On-time rate is slipping', issueDetected: 'Deliveries are arriving late more often.', rootCause: 'Carrier handoff is slow.', reasoning: '', recommendedAction: 'Call the carrier', actionPlanSteps: ['Audit last 20 late orders', 'Agree a cut-off time'], estimatedImpact: 'About 1 in 8 orders late', expectedOutcome: '' };

const a = standardiseInsight(item, { run, totalRows: 40 });
ok(a.basis === 'verified' && a.basisLabel === 'Verified from your data', 'verified when evidence comes from own data', a.basis);
ok(a.evidence.some((e) => e.kpiId === 'on-time' && e.source === 'your-data' && e.value === '87.5%'), 'on-time evidence with real value', a.evidence);
ok(!a.evidence.some((e) => e.kpiId === 'revenue'), 'unrelated KPIs are not attached', a.evidence.map((e) => e.kpiId));
ok(a.baseline?.kpiId === 'on-time' && Math.abs(a.baseline.value - 87.5) < 0.01, 'baseline captured on the lead KPI', a.baseline);
ok(a.next === 'Audit last 20 late orders' && a.nextSteps.length === 2, 'next step is the first action step');
ok(a.why === 'Carrier handoff is slow.', 'why kept as given (rendered as hypothesis by UI)');
ok(a.confidence === 'medium' && /uses 40 rows/.test(a.confidenceReason), 'confidence medium with reason', [a.confidence, a.confidenceReason]);

// root-cause text must not choose evidence
const sneaky = { ...item, issueDetected: 'Something is off.', title: 'Problem', affectedWorkflow: 'Ops', currentState: 'Unclear', rootCause: 'Revenue and returns and late and margin' };
ok(standardiseInsight(sneaky, { run, totalRows: 40 }).basis === 'hypothesis', 'root cause text does not create evidence');
const h = standardiseInsight(sneaky, { run });
ok(h.confidence === 'low' && h.baseline === undefined && h.basisLabel === 'AI hypothesis', 'no matching number → low, hypothesis, no baseline', h);

// partial rows
const p = standardiseInsight(item, { run, totalRows: 5000 });
ok(p.caveats.some((c) => c.includes('first 40 of 5,000')), 'partial rows caveat', p.caveats);

// high confidence needs 2+ evidence, a change, 100+ rows, not partial
const big = calculateKpis(mk(200, 190));
const multi = { ...item, title: 'Late deliveries and returns', issueDetected: 'Returns and late orders are up', currentState: 'delivery slipping' };
const hi = standardiseInsight(multi, { run: big, totalRows: 200 });
ok(hi.evidence.length >= 2 && hi.confidence === 'high', 'high confidence when well backed', [hi.evidence.map((e) => e.kpiId), hi.confidence, hi.confidenceReason]);
const hiPartial = standardiseInsight(multi, { run: big, totalRows: 9000 });
ok(hiPartial.confidence === 'medium', 'partial file caps confidence at medium', hiPartial.confidence);

// sample data
const s = standardiseInsight(item, { run: null, sampleMetrics: [{ label: 'Delivery', value: '91%', trend: '-2%', isPositive: false }] });
ok(s.basis === 'sample' && s.confidence === 'low' && s.baseline === undefined && s.evidence.every((e) => e.source === 'sample'), 'sample data is labelled and never verified', s);
const none = standardiseInsight(item, {});
ok(none.basis === 'sample' && none.evidence.length === 0, 'no data at all: sample label, no evidence');

// outcomes
const base = a.baseline!;
const better = compareOutcome(base, calculateKpis(mk(40, 40)));  // all on time now
ok(better.status === 'compared' && better.better === true && /pts/.test(better.changeText!), 'on-time improved → better', better);
const worse = compareOutcome(base, calculateKpis(mk(40, 20)));
ok(worse.better === false, 'on-time dropped → worse', worse);
const same = compareOutcome(base, calculateKpis(mk(40, 35)));
ok(same.better === null, 'unchanged → no real change', same);
ok(compareOutcome(base, null).status === 'no-new-data', 'no run → no-new-data');
ok(compareOutcome(base, calculateKpis([{ foo: 1 }])).status === 'no-new-data', 'KPI missing in new data → no-new-data');
ok(better.note.includes('does not prove'), 'always says before/after is not proof');
// direction: cost going down is better
const cacBase = { kpiId: 'cac', label: 'Customer acquisition cost', value: 20, display: '$20.00', unit: '$' as const, direction: 'down' as const, at: 1 };
const cheaper = compareOutcome(cacBase, calculateKpis(mk(40).map((r) => ({ ...r, 'Ad Spend': 100 }))));
ok(cheaper.better === true && /^-/.test(cheaper.changeText!), 'lower CAC is better', cheaper);
// zero baseline doesn't divide by zero
const z = compareOutcome({ ...cacBase, value: 0, display: '$0' }, calculateKpis(mk(40)));
ok(!/NaN|Infinity/.test(JSON.stringify(z)), 'zero baseline safe', z);
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
