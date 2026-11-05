// The KPIs calculated from the dataset the dashboard is using right now.
// Findings, evidence and before/after comparisons all read from this one place,
// so they agree with the numbers on the Dashboard.
import { useMemo } from "react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { calculateKpis, type KpiRun } from "@shared/kpi-engine";

export interface ActiveKpiRun {
  /** null when the person has not uploaded data (the app is showing sample numbers). */
  run: KpiRun | null;
  /** Rows in the original file; the browser keeps only the first part. */
  totalRows?: number;
  datasetName?: string;
}

export function useKpiRun(): ActiveKpiRun {
  const { datasetLibrary, activeDatasetBySector, selectedSector } = useDashboardStore();
  return useMemo(() => {
    const activeId = activeDatasetBySector[selectedSector];
    const ds = activeId ? datasetLibrary.find((d) => d.id === activeId && !d.archived && d.rows.length > 0) : undefined;
    if (!ds) return { run: null };
    return { run: calculateKpis(ds.rows, ds.columns.map((c) => c.name)), totalRows: ds.rowCount, datasetName: ds.name };
  }, [datasetLibrary, activeDatasetBySector, selectedSector]);
}
