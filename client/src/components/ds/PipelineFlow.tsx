// The process as a row of stages (a column on phones). The link between two stages is
// as thick as the volume that passes through it, so a squeeze is visible at a glance.
// The slowest stage is outlined, labelled in words, and shows work piling up.
// Selecting a stage opens a drawer with the detail.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { STATUS, StatusChip, type Status } from "./status";
import { compact } from "./format";

export type Stage = {
  id: string; name: string; /** items moving through per period */ volume: number; /** typical wait in hours */ waitHours: number;
  status: Status; /** plain one-line reading */ note: string; /** what to do next, if anything */ next?: string;
};

export function PipelineFlow({ stages, unitLabel = "orders", onOpen }: { stages: Stage[]; unitLabel?: string; onOpen?: (s: Stage) => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Stage | null>(null);
  const maxVol = Math.max(...stages.map((s) => s.volume));
  const slowest = stages.reduce((a, b) => (b.waitHours > a.waitHours ? b : a), stages[0]);
  const thick = (v: number) => Math.max(4, Math.round((v / maxVol) * 22)); // px

  return (
    <>
      <ol className="flex flex-col lg:flex-row lg:items-stretch">
        {stages.map((s, i) => {
          const st = STATUS[s.status];
          const isSlow = s.id === slowest.id && s.status === "problem";
          const Icon = st.icon;
          const next = stages[i + 1];
          return (
            <li key={s.id} className="flex flex-col lg:flex-row lg:flex-1 lg:min-w-0">
              <button type="button" onClick={() => { setOpen(s); onOpen?.(s); }}
                aria-label={`${s.name}: ${compact(s.volume)} ${unitLabel}, ${s.waitHours} hour wait, ${st.label}. Open details.`}
                className={cn("relative flex-1 text-left rounded-card border bg-white p-4 shadow-card transition-shadow hover:shadow-pop focus-visible:outline-2 focus-visible:outline-primary min-h-[112px]",
                  isSlow ? "border-2 border-[var(--chart-bad)]" : "border-slate-200")}>
                {isSlow && <span className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[var(--chart-bad)] px-2 py-0.5 text-[11px] font-black text-white"><Icon className="w-3 h-3" aria-hidden />Slowest stage</span>}
                <p className="text-[13px] font-black text-slate-900">{s.name}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 leading-none tabular-nums">{s.waitHours}<span className="ml-0.5 text-sm font-bold text-slate-600">h wait</span></p>
                <p className="mt-1 text-[12px] text-slate-600">{compact(s.volume)} {unitLabel}</p>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <StatusChip status={s.status} />
                  {isSlow && (
                    <span aria-hidden className="flex items-end gap-0.5">
                      {[10, 14, 8, 12].map((h, k) => (
                        <motion.span key={k} className="w-2 rounded-sm" style={{ height: h, background: "var(--chart-bad)", opacity: 0.85 - k * 0.15 }}
                          initial={reduce ? false : { y: -6, opacity: 0 }} whileInView={{ y: 0, opacity: 0.85 - k * 0.15 }} viewport={{ once: true }} transition={{ delay: k * 0.08, type: "spring", stiffness: 260, damping: 22 }} />
                      ))}
                    </span>
                  )}
                </div>
              </button>
              {next && (
                <div aria-hidden className="flex items-center justify-center lg:w-9 lg:shrink-0 h-6 lg:h-auto">
                  <span className="rounded-full lg:hidden" style={{ width: thick(next.volume), height: "100%", background: "var(--chart-seq-3)" }} />
                  <span className="hidden lg:block w-full rounded-full" style={{ height: thick(next.volume), background: "var(--chart-seq-3)" }} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] text-slate-600">Link thickness shows how much work passes between stages.</p>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.name}</SheetTitle>
                <SheetDescription>{open.note}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4 text-sm">
                <StatusChip status={open.status} />
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3"><dt className="text-[12px] text-slate-600">Typical wait</dt><dd className="text-xl font-black text-slate-900">{open.waitHours} h</dd></div>
                  <div className="rounded-xl border border-slate-200 p-3"><dt className="text-[12px] text-slate-600">Volume</dt><dd className="text-xl font-black text-slate-900">{compact(open.volume)}</dd></div>
                </dl>
                {open.next && <p className="rounded-xl bg-slate-50 border border-slate-200 p-3"><span className="font-bold text-slate-800">Do this week. </span><span className="text-slate-700">{open.next}</span></p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
