// Company types: which kind of business each company in a structure is.
//
// The KPI library already knows 45 kinds of business. The older sector switcher
// only knows three families (e-commerce, logistics, manufacturing) plus "custom".
// A company type is the real answer ("dental practice"); its sector family is
// what the existing sample data, Hub and data sharing still key on. Keeping both
// means nothing built on sectors breaks while every kind of business can be picked.
import { BUSINESS_INDUSTRIES, INDUSTRY_GROUPS, getIndustry, type Industry, type IndustryGroup } from './kpi-industries';

export type SectorFamily = 'ecommerce' | 'logistics' | 'manufacturing' | 'custom';
export type StructureId = 'single' | 'partnered' | 'unified-chain';

const FAMILY_BY_INDUSTRY: Record<string, SectorFamily> = {
  ecommerce: 'ecommerce', 'retail-store': 'ecommerce', grocery: 'ecommerce', wholesale: 'ecommerce',
  '3pl': 'logistics', trucking: 'logistics', 'last-mile': 'logistics', 'freight-forwarding': 'logistics',
  manufacturing: 'manufacturing', 'food-production': 'manufacturing', construction: 'manufacturing',
  agriculture: 'manufacturing', energy: 'manufacturing',
};

/** The sector family an industry belongs to, or "custom" when it has none. */
export const sectorFamilyFor = (industryId: string | undefined | null): SectorFamily =>
  (industryId && FAMILY_BY_INDUSTRY[industryId]) || 'custom';

/** How many companies a structure covers: you, plus up to two partners. */
export const MAX_COMPANIES: Record<StructureId, number> = { single: 1, partnered: 2, 'unified-chain': 3 };

export const SLOT_LABELS: Record<StructureId, string[]> = {
  single: ['Your company'],
  partnered: ['Your company', 'Partner company'],
  'unified-chain': ['Your company', 'Partner company 1', 'Partner company 2'],
};

/**
 * Keep known industries by slot, at most as many as the structure allows. An empty
 * string means "this slot is not chosen yet"; trailing empty slots are dropped.
 */
export function cleanCompanyTypes(ids: unknown, structure: StructureId): string[] {
  if (!Array.isArray(ids)) return [];
  const out = ids.slice(0, MAX_COMPANIES[structure]).map((x) => {
    const ind = typeof x === 'string' ? getIndustry(x) : undefined;
    return ind && ind.group !== 'Every business' ? ind.id : '';
  });
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

/** Company types for someone who set up before company types existed. */
export function legacyCompanyTypes(sectors: string[]): string[] {
  const map: Record<string, string> = { ecommerce: 'ecommerce', logistics: '3pl', manufacturing: 'manufacturing' };
  return sectors.map((s) => map[s]).filter(Boolean);
}

/** The distinct sector families for a list of company types, in order. Never empty. */
export function familiesFor(ids: string[]): SectorFamily[] {
  const out: SectorFamily[] = [];
  for (const id of ids) {
    if (!id) continue;
    const f = sectorFamilyFor(id);
    if (!out.includes(f)) out.push(f);
  }
  return out.length ? out : ['custom'];
}

/** All company types, grouped for a picker (groups in library order). */
export const COMPANY_TYPE_GROUPS: { group: IndustryGroup; types: Industry[] }[] = INDUSTRY_GROUPS
  .filter((g) => g !== 'Every business')
  .map((group) => ({ group, types: BUSINESS_INDUSTRIES.filter((i) => i.group === group) }))
  .filter((g) => g.types.length > 0);

/** Plain name for a company type, or "Not chosen". */
export const companyTypeName = (id: string | undefined | null) => getIndustry(id)?.name ?? 'Not chosen';
