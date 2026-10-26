// One KPI: plain label, the number, the change vs last period, a sparkline, and a
// tap-to-open explanation. Direction (arrow and sign) is separate from good or bad
// (colour plus a word), so nothing depends on colour alone.
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DsCard } from "./surface";
import { Sparkline } from "./Sparkline";
import { compact, signed } from "./format";
import { SampleBadge } from "./status";
import { useCountUp } from "./use-count-up";

export type KpiDelta = {
  /** Change as a number in the same unit as `deltaUnit` (e.g. 1.2 for +1.2%). */
  change: number;
  deltaUnit?: string;
  /** Is a rise good news (on-time rate) or bad news (cost, days)? */
  upIsGood?: boolean;
  /** What it is compared to: "last week". */
  vs: string;
};

export type KpiCardProps = {
  label: string;
  value: number;
  /** Shown after the number: "%", " days", " h". Prefix like "$" goes in `prefix`. */
  unit?: string;
  prefix?: string;
  decimals?: number;
  delta?: KpiDelta;
  series?: number[];
  /** Plain-English help: what it is and why it matters. */
  help?: { means: string; why: string };
  sample?: boolean;
  className?: string;
};

export function KpiCard({ label, value, unit = "", prefix = "", decimals = 0, delta, series, help, sample, className }: KpiCardProps) {
  const { ref, value: shown } = useCountUp(value, { decimals });
  const fmt = (n: number) => (decimals ? n.toFixed(decimals) : compact(n));

  let dir: "up" | "down" | "flat" = "flat";
  let good: boolean | null = null;
  if (delta) {
    dir = delta.change > 0 ? "up" : delta.change < 0 ? "down" : "flat";
    good = dir === "flat" ? null : (dir === "up") === (delta.upIsGood ?? true);
  }
  const Arrow = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const tone = good === null ? "text-slate-600" : good ? "text-success" : "text-danger";
  const word = good === null ? "No change" : good ? "Better" : "Worse";

  return (
    <DsCard className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-slate-600 leading-tight">{label}</h3>
        <div className="flex items-center gap-1 -mr-2 -mt-2">
          {sample && <SampleBadge className="mr-1" />}
          {help && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label={`What does ${label} mean?`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-primary">
                  <Info className="w-4 h-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 text-[13px] leading-relaxed">
                <p className="font-black text-slate-900">{label}</p>
                <p className="mt-2 text-slate-600"><span className="font-bold text-slate-800">What it is. </span>{help.means}</p>
                <p className="mt-2 text-slate-600"><span className="font-bold text-slate-800">Why it matters. </span>{help.why}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <p className="text-4xl font-black tracking-tight text-slate-900 leading-none">
        <span ref={ref as React.Ref<HTMLSpanElement>}>{prefix}{fmt(shown)}</span>
        {unit && <span className="ml-0.5 text-xl font-bold text-slate-600">{unit}</span>}
      </p>

      {delta && (
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
          <span className={cn("inline-flex items-center gap-0.5 font-bold", tone)}>
            <Arrow className="w-4 h-4" aria-hidden />
            {signed(delta.change, delta.deltaUnit ?? "")}
            <span className="ml-1">{word}</span>
          </span>
          <span className="text-slate-600">vs {delta.vs}</span>
        </p>
      )}

      {series && series.length > 1 && (
        <Sparkline values={series} label={`${label}, last ${series.length} periods. Now ${prefix}${fmt(value)}${unit}.`} tone={good === false ? "problem" : "brand"} className="mt-auto" />
      )}
    </DsCard>
  );
}
