import { cleanKpiConfig, toggleKpi, setKpiTarget, targetStatus, MAX_KPIS, emptyKpiConfig } from '../shared/kpi-config';
import { CALCULABLE_KPIS } from '../shared/kpi-engine';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

ok(CALCULABLE_KPIS.length >= 10 && CALCULABLE_KPIS.every((k) => k.id && k.label && ['up', 'down'].includes(k.direction)), 'the engine lists what it can calculate', CALCULABLE_KPIS.length);
ok(['revenue', 'gross-margin', 'return-rate', 'on-time'].every((id) => CALCULABLE_KPIS.some((k) => k.id === id)), 'the usual KPIs are in the list');

// Cleaning
let c = cleanKpiConfig(undefined);
ok(c.ids.length === 0 && Object.keys(c.targets).length === 0, 'nothing in, empty config out', c);
c = cleanKpiConfig({ ids: ['revenue', 'revenue', 'made-up', 5, null, 'roas'], targets: { revenue: 5000, roas: -1, 'gross-margin': 'high', cac: NaN, 'return-rate': 250, bogus: 3, 'on-time': 95 } });
ok(c.ids.join() === 'revenue,roas', 'unknown ids, duplicates and non-strings are dropped', c.ids);
ok(c.targets.revenue === 5000 && c.targets['on-time'] === 95 && !('roas' in c.targets) && !('gross-margin' in c.targets) && !('cac' in c.targets) && !('bogus' in c.targets), 'bad targets are dropped, good ones kept', c.targets);
ok(!('return-rate' in c.targets), 'a percent target over 100 is rejected');
ok(cleanKpiConfig({ ids: CALCULABLE_KPIS.map((k) => k.id) }).ids.length === MAX_KPIS, `at most ${MAX_KPIS} KPIs`);
ok(cleanKpiConfig('x').ids.length === 0 && cleanKpiConfig([1]).ids.length === 0 && cleanKpiConfig({ ids: 'revenue' }).ids.length === 0, 'junk is safe');
ok(!('extra' in cleanKpiConfig({ ids: [], targets: {}, extra: 1 })), 'unknown fields are not kept');

// Choosing
let cfg = toggleKpi(undefined, 'conversion', ['revenue', 'orders']);
ok(cfg.ids.join() === 'revenue,orders,conversion', 'first change starts from the standard set and adds', cfg.ids);
cfg = toggleKpi(cfg, 'orders');
ok(cfg.ids.join() === 'revenue,conversion', 'toggling a chosen KPI removes it', cfg.ids);
cfg = setKpiTarget(cfg, 'revenue', 20000);
cfg = toggleKpi(cfg, 'revenue');
ok(!cfg.ids.includes('revenue') && !('revenue' in cfg.targets), 'removing a KPI removes its target', cfg);
ok(toggleKpi(cfg, 'not-a-kpi').ids.join() === cfg.ids.join(), 'unknown id changes nothing');
let full = emptyKpiConfig();
for (const k of CALCULABLE_KPIS) full = toggleKpi(full, k.id);
ok(full.ids.length === MAX_KPIS, 'cannot choose more than the maximum', full.ids.length);

// Targets
cfg = setKpiTarget(emptyKpiConfig(), 'gross-margin', 40);
ok(cfg.targets['gross-margin'] === 40, 'set a target');
ok(!('gross-margin' in setKpiTarget(cfg, 'gross-margin', null).targets), 'null clears it');
ok(!('gross-margin' in setKpiTarget(cfg, 'gross-margin', 140).targets) && !('gross-margin' in setKpiTarget(cfg, 'gross-margin', -3).targets) && !('gross-margin' in setKpiTarget(cfg, 'gross-margin', NaN).targets), 'an impossible target clears rather than stores');

// Comparing: direction matters
let t = targetStatus({ id: 'gross-margin', value: 36.8 }, 40);
ok(t?.state === 'behind' && t.text === 'Target 40.0%: 3.2 points below', 'higher-is-better, below target', t);
t = targetStatus({ id: 'gross-margin', value: 40 }, 40);
ok(t?.state === 'met' && t.text === 'Target 40.0% met', 'exactly on target counts as met', t);
t = targetStatus({ id: 'return-rate', value: 7.5 }, 5);
ok(t?.state === 'behind' && t.text === 'Target 5.0%: 2.5 points above', 'lower-is-better, above target is behind', t);
t = targetStatus({ id: 'return-rate', value: 4 }, 5);
ok(t?.state === 'met', 'lower-is-better, under target is met', t);
t = targetStatus({ id: 'revenue', value: 42000 }, 50000);
ok(t?.state === 'behind' && t.text === 'Target $50,000: $8,000 below', 'dollars', t);
ok(targetStatus({ id: 'revenue', value: 1 }, undefined) === undefined, 'no target, no status');
ok(targetStatus({ id: 'nope', value: 1 }, 5) === undefined && targetStatus({ id: 'revenue', value: NaN }, 5) === undefined, 'unknown KPI or bad value gives no status');

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
