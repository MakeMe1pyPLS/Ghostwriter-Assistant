// Impact vs effort quadrant. Top-left (high impact, low effort) is "Do first".
// Every point is a focusable button; the list below is the text twin.
import { useState } from "react";
import { cn } from "@/lib/utils";

export type IEPoint = { id: string; label: string; impact: number; effort: number }; // 1..5

export function ImpactEffort({ points, onSelect }: { points: IEPoint[]; onSelect?: (id: string) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const pos = (p: IEPoint) => ({ left: `${((p.effort - 0.5) / 5) * 100}%`, top: `${(1 - (p.impact - 0.5) / 5) * 100}%` });
  const cur = points.find((p) => p.id === active);
  return (
    <div className="space-y-3">
      <div className="relative ml-7 mb-7">
      <div className="relative h-[260px] sm:h-auto sm:aspect-[16/10] rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-[var(--chart-grid)]" />
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[var(--chart-grid)]" />
        <span className="absolute left-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">Do first</span>
        <span className="absolute right-2 top-2 text-[11px] font-bold text-slate-600">Plan it</span>
        <span className="absolute left-2 bottom-2 text-[11px] font-bold text-slate-600">Quick wins later</span>
        <span className="absolute right-2 bottom-2 text-[11px] font-bold text-slate-600">Think twice</span>
        {points.map((p) => (
          <button key={p.id} type="button" aria-label={`${p.label}: impact ${p.impact} of 5, effort ${p.effort} of 5`}
            onMouseEnter={() => setActive(p.id)} onFocus={() => setActive(p.id)} onMouseLeave={() => setActive(null)} onBlur={() => setActive(null)} onClick={() => onSelect?.(p.id)}
            className="absolute -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary" style={pos(p)}>
            <span className={cn("h-3.5 w-3.5 rounded-full ring-2 ring-[var(--chart-surface)] transition-transform", active === p.id && "scale-150")} style={{ background: "var(--chart-1)" }} />
          </button>
        ))}
      </div>
        <span aria-hidden className="absolute text-[11px] font-bold text-slate-600 whitespace-nowrap" style={{ left: -16, top: "50%", transform: "translate(-50%, -50%) rotate(-90deg)" }}>Impact →</span>
        <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-[11px] font-bold text-slate-600">Effort →</span>
      </div>
      <p aria-live="polite" className="min-h-5 text-[13px] font-semibold text-slate-800">{cur ? `${cur.label} · impact ${cur.impact}/5 · effort ${cur.effort}/5` : "Hover or focus a dot for details."}</p>
    </div>
  );
}
