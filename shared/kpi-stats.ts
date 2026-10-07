// Size of the KPI Library, for marketing and pricing copy. Kept as plain numbers
// so the landing page doesn't download the whole library. kpi-industries.ts
// checks these against the real data and warns in the console if they drift.
// After adding or removing KPIs or industries, update these three numbers.
export const KPI_COUNTS = {
  /** Every KPI entry in the library. */
  kpis: 347,
  /** Industries you can pick (not counting the cross-industry sets). */
  industries: 45,
  /** KPIs in the "AI & automation" set. */
  aiKpis: 22,
} as const;
