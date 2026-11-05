// A bullet gauge: the value as a bar, the target as a marker line, both labelled in
// words. Used when a number only means something against a goal. The marker label
// says exactly what the marker is ("Your target"), so no outside benchmark is implied.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS, type Status } from "./status";

export function TargetGauge({ label, value, target, max, unit = "", markerLabel = "Your target", higherIsBetter = true, className }: {
  label: string; value: number; target: number; max?: number; unit?: string; markerLabel?: string; higherIsBetter?: boolean; className?: string;
}) {
  const reduce = useReducedMotion();
  const top = max ?? Math.max(value, target) * 1.15;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / top) * 100))}%`;
  const ratio = higherIsBetter ? value / target : target / value;
  const status: Status = ratio >= 1 ? "good" : ratio >= 0.9 ? "watch" : "problem";
  const s = STATUS[status];
  const Icon = s.icon;
  const gap = Math.abs(value - target);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-black text-slate-900 tabular-nums">{value}{unit}</p>
      </div>
      <div role="img" aria-label={`${label}: ${value}${unit}. ${markerLabel}: ${target}${unit}. ${s.label}.`}
        className="relative h-3 rounded-full" style={{ background: "var(--chart-track)" }}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: s.mark }}
          initial={reduce ? { width: pct(value) } : { width: 0 }} whileInView={{ width: pct(value) }} viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} />
        <span aria-hidden className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-slate-900" style={{ left: pct(target) }} />
      </div>
      <div className="flex items-center justify-between gap-3 text-[12px] text-slate-600">
        <span className={cn("inline-flex items-center gap-1 font-bold", s.text)}><Icon className="w-3.5 h-3.5" aria-hidden />{s.label}{ratio < 1 ? `, ${gap.toFixed(gap % 1 ? 1 : 0)}${unit} ${higherIsBetter ? "short" : "over"}` : ""}</span>
        <span>{markerLabel} {target}{unit}</span>
      </div>
    </div>
  );
}
