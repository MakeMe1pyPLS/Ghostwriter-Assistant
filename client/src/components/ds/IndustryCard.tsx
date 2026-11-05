// One industry on the Industries screen: an illustration, its name, how many KPIs are
// tracked, and one line of what it is for. Counts come from the real KPI library.
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Illo, type IlloKey } from "./illustrations";

export function IndustryCard({ name, kpiCount, blurb, art = "generic", selected, onSelect }: {
  name: string; kpiCount: number; blurb: string; art?: IlloKey; selected?: boolean; onSelect?: () => void;
}) {
  const Art = Illo[art];
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={cn("group text-left rounded-card border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-primary min-h-[44px]",
        selected ? "border-2 border-primary" : "border-slate-200")}>
      <div className="flex h-28 items-center justify-center rounded-xl bg-slate-50 p-3 text-primary [&_svg]:h-full [&_svg]:w-auto"><Art /></div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-black tracking-tight text-slate-900">{name}</h3>
        <ArrowRight className="mt-1 w-4 h-4 text-slate-500 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <p className="mt-1 text-[13px] text-slate-600">{blurb}</p>
      <p className="mt-2 text-[12px] font-bold text-slate-800">{kpiCount} KPIs tracked</p>
    </button>
  );
}
