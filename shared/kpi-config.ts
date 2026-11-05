// Per-client KPI choices: which of the calculable numbers appear in this client's
// summary and report, and an optional target for each.
//
// Honest limits, repeated in the app: only numbers the engine can calculate from the
// client's uploaded file can be chosen (CALCULABLE_KPIS). A target is the consultant's
// own goal and is compared with the calculated value as it is; it is not a forecast and
// not an industry benchmark. Targets are private to the consultant and are not shown to
// people the workspace is shared with. Percent targets use the same 0 to 100 scale the
// engine shows ("94.2%").
//
// Pure TypeScript with no dependencies.
import { CALCULABLE_KPIS, formatKpiValue, type KpiUnitKind } from './kpi-engine';

export const MAX_KPIS = 8;

export interface KpiConfig {
  /** KPI ids to show, in this order. Empty means "use the standard set". */
  ids: string[];
  /** Target per KPI id, in that KPI's own unit. */
  targets: Record<string, number>;
}

export const emptyKpiConfig = (): KpiConfig => ({ ids: [], targets: {} });
const info = (id: string) => CALCULABLE_KPIS.find((k) => k.id === id);

/** The largest target we accept for a unit. Percent can't exceed 100. */
export const targetMax = (unit: KpiUnitKind) => (unit === '%' ? 100 : 1e12);

/** Safe on anything that came from storage. Unknown ids, duplicates and bad numbers are dropped. */
export function cleanKpiConfig(raw: unknown): KpiConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<KpiConfig>;
  const ids: string[] = [];
  for (const id of Array.isArray(r.ids) ? r.ids : []) {
    if (typeof id === 'string' && info(id) && !ids.includes(id) && ids.length < MAX_KPIS) ids.push(id);
  }
  const targets: Record<string, number> = {};
  const src = r.targets && typeof r.targets === 'object' ? (r.targets as Record<string, unknown>) : {};
  for (const k of CALCULABLE_KPIS) {
    const v = src[k.id];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= targetMax(k.unit)) targets[k.id] = v;
  }
  return { ids, targets };
}

/** Choose or drop a KPI. A dropped KPI keeps no target. The standard set is not editable one by one: choosing starts a list of your own. */
export function toggleKpi(cfg: KpiConfig | undefined, id: string, startFrom: string[] = []): KpiConfig {
  const c = cleanKpiConfig(cfg);
  if (!info(id)) return c;
  const base = c.ids.length ? c.ids : cleanKpiConfig({ ids: startFrom }).ids;
  if (base.includes(id)) {
    const ids = base.filter((x) => x !== id);
    const { [id]: _drop, ...targets } = c.targets;
    return { ids, targets };
  }
  if (base.length >= MAX_KPIS) return { ids: base, targets: c.targets };
  return { ids: [...base, id], targets: c.targets };
}

/** Set a target, or clear it with null. A target on a KPI that is not chosen is ignored. */
export function setKpiTarget(cfg: KpiConfig | undefined, id: string, value: number | null): KpiConfig {
  const c = cleanKpiConfig(cfg);
  const k = info(id);
  if (!k) return c;
  const targets = { ...c.targets };
  if (value === null || !Number.isFinite(value) || value < 0 || value > targetMax(k.unit)) delete targets[id];
  else targets[id] = value;
  return { ids: c.ids, targets };
}

export interface TargetStatus { state: 'met' | 'behind'; target: string; text: string }

/** Compare a calculated value with its target, respecting which direction is better. */
export function targetStatus(kpi: { id: string; value: number }, target: number | undefined): TargetStatus | undefined {
  const k = info(kpi.id);
  if (!k || target === undefined || !Number.isFinite(kpi.value) || !Number.isFinite(target)) return undefined;
  const met = k.direction === 'up' ? kpi.value >= target : kpi.value <= target;
  const targetText = formatKpiValue(target, k.unit);
  if (met) return { state: 'met', target: targetText, text: `Target ${targetText} met` };
  const gap = Math.abs(kpi.value - target);
  const gapText = k.unit === '%' ? `${gap.toFixed(1)} points` : formatKpiValue(gap, k.unit);
  return { state: 'behind', target: targetText, text: `Target ${targetText}: ${gapText} ${k.direction === 'up' ? 'below' : 'above'}` };
}
