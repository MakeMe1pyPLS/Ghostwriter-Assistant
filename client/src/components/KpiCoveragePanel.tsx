// "What we calculated": the KPIs worked out from the active dataset, how each one
// was calculated, and plainly what is missing for the ones that could not be.
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleDashed, Info, Minus } from "lucide-react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { calculateKpis, roleName, type KpiResult, type Role } from "@shared/kpi-engine";
import { cn } from "@/lib/utils";

const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function ChangeLine({ r }: { r: KpiResult }) {
  if (!r.change) return <p className="text-[12px] text-slate-600">No change shown: needs dated rows covering two weeks or more.</p>;
  const { amount, better, text, windowLabel } = r.change;
  const Arrow = amount > 0 ? ArrowUpRight : amount < 0 ? ArrowDownRight : Minus;
  const tone = better === null ? "text-slate-600" : better ? "text-success" : "text-danger";
  return (
    <p className="text-[12px] text-slate-600">
      <span className={cn("inline-flex items-center gap-0.5 font-bold", tone)}>
        <Arrow className="w-3.5 h-3.5" aria-hidden />{text}
        <span className="ml-1">{better === null ? "No change" : better ? "Better" : "Worse"}</span>
      </span>{" "}
      <span>({windowLabel})</span>
    </p>
  );
}

export function KpiCoveragePanel() {
  const { datasetLibrary, activeDatasetBySector, selectedSector } = useDashboardStore();

  const dataset = useMemo(() => {
    const live = datasetLibrary.filter((d) => !d.archived && d.rows.length > 0);
    const activeId = activeDatasetBySector[selectedSector];
    return live.find((d) => d.id === activeId) ?? [...live].sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [datasetLibrary, activeDatasetBySector, selectedSector]);

  const run = useMemo(() => (dataset ? calculateKpis(dataset.rows, dataset.columns.map((c) => c.name)) : null), [dataset]);

  if (!dataset || !run) {
    return (
      <section className="rounded-card border border-slate-200 bg-white p-5 shadow-card" data-testid="kpi-coverage-empty">
        <h2 className="text-lg font-black tracking-tight text-slate-900">What we calculated</h2>
        <p className="mt-1 text-sm text-slate-600">Upload a file above and this shows which KPIs we could work out from it, and how. Nothing is shown until there is real data.</p>
      </section>
    );
  }

  const ok = run.results.filter((r) => r.status === "ok");
  const notOk = run.results.filter((r) => r.status !== "ok");
  const partial = dataset.rowCount > dataset.rows.length;

  return (
    <section className="rounded-card border border-slate-200 bg-white p-5 shadow-card space-y-5" data-testid="kpi-coverage">
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">What we calculated</h2>
        <p className="mt-1 text-sm text-slate-600">
          From <span className="font-bold text-slate-800">{dataset.name}</span>: {dataset.rows.length.toLocaleString()} rows
          {run.dateRange && <> from {fmtDate(run.dateRange.from)} to {fmtDate(run.dateRange.to)}</>}.
          {" "}{ok.length} of {run.results.length} KPIs could be calculated.
        </p>
        {partial && (
          <p className="mt-2 flex items-start gap-2 rounded-xl border border-warning-line bg-warning-soft p-3 text-[13px] text-warning" role="note">
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            Only the first {dataset.rows.length.toLocaleString()} of your {dataset.rowCount.toLocaleString()} rows are kept in this browser, so these numbers cover those rows.
          </p>
        )}
        {run.notes.map((n) => <p key={n} className="mt-2 text-[13px] text-slate-600">{n}</p>)}
      </div>

      {ok.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ok.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 p-4 space-y-1.5" data-testid={`kpi-calculated-${r.id}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-slate-700">{r.label}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden />Calculated</span>
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900 leading-none">{r.display}</p>
              <ChangeLine r={r} />
              <p className="text-[12px] text-slate-600"><span className="font-bold text-slate-800">How: </span>{r.how}</p>
              <p className="text-[12px] text-slate-600">
                <span className="font-bold text-slate-800">Your columns: </span>
                {(Object.entries(r.columns) as [Role, string][]).map(([role, col]) => `${roleName(role)} = "${col}"`).join("; ")}
              </p>
              {r.limits.map((l) => <p key={l} className="text-[12px] text-warning">{l}</p>)}
            </li>
          ))}
        </ul>
      )}

      {ok.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          None of your column names matched the data our KPIs need. Rename a column (for example "Revenue", "Orders", "Order Date") or add one, then import again.
        </p>
      )}

      {notOk.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-slate-800">Not calculated yet</h3>
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {notOk.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5 p-3 text-[13px]" data-testid={`kpi-missing-${r.id}`}>
                <CircleDashed className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" aria-hidden />
                <div>
                  <p className="font-bold text-slate-800">{r.label}</p>
                  <p className="text-slate-600">
                    {r.status === "needs-data" ? <>Needs: {r.missing?.join(", ")}.</> : r.limits[r.limits.length - 1]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
