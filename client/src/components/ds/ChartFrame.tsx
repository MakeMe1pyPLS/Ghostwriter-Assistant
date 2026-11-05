// The card every chart sits in: title, one-line question it answers, an optional
// "Sample data" badge, and a Chart / Table switch. The table is the accessible twin
// of the chart, so no value depends on hovering.
import { useId, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DsCard } from "./surface";
import { SampleBadge } from "./status";

export type ChartTable = { columns: string[]; rows: (string | number)[][] };

export function ChartFrame({ title, question, sample, table, actions, children, className }: {
  title: string; question?: string; sample?: boolean; table?: ChartTable; actions?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const id = useId();
  return (
    <DsCard className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-base font-black tracking-tight text-slate-900">{title}</h3>
          {question && <p className="text-[13px] text-slate-600 mt-0.5">{question}</p>}
        </div>
        <div className="flex items-center gap-2">
          {sample && <SampleBadge />}
          {actions}
          {table && (
            <div role="group" aria-label="Show as" className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {([["chart", "Chart", BarChart3], ["table", "Table", Table2]] as const).map(([k, l, Icon]) => (
                <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}
                  className={cn("inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                    view === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}>
                  <Icon className="w-3.5 h-3.5" aria-hidden /> {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div id={id}>
        {view === "chart" || !table ? children : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>{table.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 font-bold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {r.map((cell, j) => <td key={j} className={cn("px-3 py-2 text-slate-800", j === 0 ? "font-semibold" : "tabular-nums")}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DsCard>
  );
}
