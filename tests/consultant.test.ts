import { summariseClient, rollUp, type ClientInput } from '../shared/consultant';
import { calculateKpis } from '../shared/kpi-engine';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

const NOW = Date.UTC(2026, 10, 5, 12); // 5 Nov 2026
const DAYMS = 86400000;
const day = (i: number) => new Date(Date.UTC(2026, 8, 1) + i * DAYMS).toISOString().slice(0, 10);
const mk = (n: number, onTimeFrom: number, rev = 1000) => Array.from({ length: n }, (_, d) => ({ 'Order Date': day(d), 'Revenue ($)': rev + 10 * d, Orders: 20, COGS: 600, Sessions: 1000, 'Ad Spend': 200, 'New Customers': 10, Returns: 1, 'On Time': d >= onTimeFrom ? 'No' : 'Yes' }));
const baseRun = calculateKpis(mk(40, 35));
const onTime = baseRun.results.find((r) => r.id === 'on-time')!;
const baseline = { kpiId: 'on-time', label: 'On-time delivery rate', value: onTime.value!, display: onTime.display!, unit: '%' as const, direction: 'up' as const, at: NOW - 20 * DAYMS };
const act = (id: string, status: 'todo' | 'doing' | 'done', dueDate?: string, withBaseline = false) => ({ id, title: `Action ${id}`, status, dueDate, createdAt: NOW - 30 * DAYMS, baseline: withBaseline ? baseline : undefined });

// Client A: data uploaded, outcome got worse (more late), 1 overdue, review due in 3 days.
const A: ClientInput = { id: 'a', name: 'Alpha Foods', status: 'Active', nextReview: '2026-11-08', actions: [act('1', 'doing', '2026-11-01', true), act('2', 'done'), act('3', 'todo', '2026-12-01')],
  dataset: { name: 'alpha.csv', rows: mk(40, 20), rowCount: 40 }, lastActivity: NOW - 2 * DAYMS };
// Client B: data uploaded, outcome improved, nothing overdue.
const B: ClientInput = { id: 'b', name: 'Bravo Parts', status: 'Active', actions: [act('4', 'doing', '2026-12-10', true)], dataset: { name: 'bravo.csv', rows: mk(40, 40), rowCount: 5000 }, lastActivity: NOW - 1 * DAYMS };
// Client C: active, no data, quiet for 45 days.
const C: ClientInput = { id: 'c', name: 'Charlie Co', status: 'Active', actions: [], lastActivity: NOW - 45 * DAYMS };
// Client D: paused, no data: should not be nagged.
const D: ClientInput = { id: 'd', name: 'Delta Ltd', status: 'Paused', nextReview: '2026-11-01', actions: [act('5', 'todo', '2026-10-01')], lastActivity: NOW - 90 * DAYMS };

const [sa, sb, sc, sd] = [A, B, C, D].map((c) => summariseClient(c, NOW));
ok(sa.actions.total === 3 && sa.actions.done === 1 && sa.actions.open === 2 && sa.actions.overdue === 1, 'A: action counts', sa.actions);
ok(sa.hasData && sa.kpis.some((k) => k.id === 'revenue' && k.display === '$47,800'), 'A: shows revenue from its own file ($47,800)', sa.kpis);
ok(sa.outcomes.worse === 1 && sa.outcomes.improved === 0, 'A: on-time got worse since the fix started', sa.outcomes);
ok(sb.outcomes.improved === 1 && sb.outcomes.worse === 0, 'B: on-time improved', sb.outcomes);
ok(sb.partial === true && sa.partial === false, 'B: partial file flagged; A is not partial', [sb.partial, sa.partial]);
ok(sa.attention.map((x) => x.kind).join() === 'wrong-way,overdue,review-due', 'A needs attention: wrong way, overdue, review due (in that order)', sa.attention);
ok(sb.attention.length === 0, 'B: nothing needs attention', sb.attention);
ok(sc.attention.map((x) => x.kind).join() === 'no-data,quiet' && !sc.hasData && sc.kpis.length === 0, 'C: no data and quiet, no invented numbers', sc);
ok(sd.attention.map((x) => x.kind).join() === 'overdue', 'D (paused): only the overdue action, no review/no-data/quiet nagging', sd.attention);

const p = rollUp([sa, sb, sc, sd]);
ok(p.clients === 4 && p.withData === 2 && p.openActions === 4 && p.overdueActions === 2, 'roll-up counts', p);
ok(p.outcomes.tracked === 2 && p.outcomes.improved === 1 && p.outcomes.worse === 1, 'roll-up outcomes', p.outcomes);
ok(p.attention[0].kind === 'wrong-way' && p.attention[0].clientName === 'Alpha Foods', 'most urgent item first', p.attention[0]);
ok(p.attention.every((x, i, a) => i === 0 || a[i - 1].priority <= x.priority), 'attention sorted by priority');

// Isolation: a client's summary uses only its own rows.
const alone = summariseClient({ ...A, dataset: A.dataset }, NOW);
ok(JSON.stringify(alone) === JSON.stringify(sa), 'summary does not depend on other clients');

// Outcomes with no new data.
const noRows = summariseClient({ ...A, dataset: undefined }, NOW);
ok(noRows.outcomes.noData === 1 && noRows.outcomes.worse === 0 && noRows.attention.every((x) => x.kind !== 'wrong-way'), 'no data: outcome is "no new data", never "worse"', noRows.outcomes);

// Junk and empty never throw.
ok(rollUp([]).clients === 0 && rollUp([]).attention.length === 0, 'empty roll-up');
const junk = summariseClient({ id: 'j', name: 'J', status: 'Active', actions: [], dataset: { name: 'x', rows: [null as any, 5 as any], rowCount: 2 } }, NOW);
ok(!/NaN|Infinity|undefined undefined/.test(JSON.stringify(junk)), 'junk rows do not throw or produce NaN');
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
