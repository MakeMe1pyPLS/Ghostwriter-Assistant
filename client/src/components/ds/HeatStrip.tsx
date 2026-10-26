// Stage x day grid on the teal sequential ramp. Darker = longer wait. Every cell is a
// focusable button with the real value in its label, and the legend says what dark means.
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HeatStrip({ rows, columns, unit = "h", caption }: {
  rows: { label: string; values: number[] }[]; columns: string[]; unit?: string; caption?: string;
}) {
  const all = rows.flatMap((r) => r.values);
  const lo = Math.min(...all), hi = Math.max(...all);
  const step = (v: number) => Math.min(5, Math.max(0, Math.round(((v - lo) / (hi - lo || 1)) * 5)));
  const [tip, setTip] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="space-y-1.5" style={{ minWidth: 112 + columns.length * 40 }}>
          {rows.map((r) => (
            <div key={r.label} className="grid items-center gap-x-1.5" style={{ gridTemplateColumns: `112px repeat(${columns.length}, minmax(0, 1fr))` }}>
              <span className="text-[12px] font-semibold text-slate-700 truncate pr-2">{r.label}</span>
              {r.values.map((v, i) => {
                const msg = `${r.label}, ${columns[i]}: ${v} ${unit}`;
                return (
                  <button key={i} type="button" aria-label={msg} onMouseEnter={() => setTip(msg)} onFocus={() => setTip(msg)} onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}
                    className="h-10 rounded-md border border-[var(--chart-surface)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    style={{ background: `var(--chart-seq-${step(v) + 1})` }} />
                );
              })}
            </div>
          ))}
          <div className="grid gap-x-1.5 text-[11px] text-slate-600" style={{ gridTemplateColumns: `112px repeat(${columns.length}, minmax(0, 1fr))` }}>
            <span />
            {columns.map((c, i) => <span key={c} className={cn("text-center", i % 2 && "invisible sm:visible")}>{c}</span>)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-2" aria-hidden>
          Shorter wait
          <span className="inline-flex overflow-hidden rounded-sm">{[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className="h-3 w-5" style={{ background: `var(--chart-seq-${n})` }} />)}</span>
          Longer wait
        </span>
        <span aria-live="polite" className="min-h-4 font-semibold text-slate-800">{tip ?? caption ?? ""}</span>
      </div>
    </div>
  );
}
