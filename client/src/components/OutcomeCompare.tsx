// Before and after for a tracked fix: the KPI value when work started against
// the latest calculation from the data in the app. Says plainly when there is
// no newer number, and never claims the action caused the change.
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { useKpiRun } from "@/hooks/use-kpi-run";
import { compareOutcome, type InsightBaseline } from "@shared/insight";
import { cn } from "@/lib/utils";

export function OutcomeCompare({ baseline }: { baseline: InsightBaseline }) {
  const { run } = useKpiRun();
  const o = useMemo(() => compareOutcome(baseline, run), [baseline, run]);
  const startedOn = new Date(baseline.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const Arrow = o.better === null || o.better === undefined ? Minus : (o.changeText ?? "").startsWith("-") ? ArrowDownRight : ArrowUpRight;
  const tone = o.better === null || o.better === undefined ? "text-slate-700" : o.better ? "text-success" : "text-danger";
  const word = o.better === null ? "No real change" : o.better ? "Moved the right way" : "Moved the wrong way";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:bg-white/5 dark:border-white/10" data-testid="outcome-compare">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Before and after: {baseline.label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-sm text-slate-700"><span className="text-xs text-slate-600">Before ({startedOn}): </span><span className="font-black tabular-nums">{o.before}</span></p>
        {o.status === "compared" && (
          <>
            <p className="text-sm text-slate-700"><span className="text-xs text-slate-600">Now: </span><span className="font-black tabular-nums">{o.after}</span></p>
            <p className={cn("inline-flex items-center gap-1 text-sm font-bold", tone)}><Arrow className="w-4 h-4" aria-hidden />{o.changeText} · {word}</p>
          </>
        )}
      </div>
      {o.status === "no-new-data" && <p className="mt-1 text-xs text-slate-600">{o.message}</p>}
      <p className="mt-2 flex gap-1.5 text-xs text-slate-600"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />{o.note}</p>
    </div>
  );
}
