// A recommendation as a plan someone can finish: what, why, how (checklist), when, how
// big, who, and where it stands. One primary action: change the status.
import { useState } from "react";
import { CalendarClock, Check, Circle, CircleDot, Gauge, Hammer, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { DsCard } from "./surface";

export type ActionState = "todo" | "doing" | "done";
const STATES: { id: ActionState; label: string; icon: any }[] = [
  { id: "todo", label: "To do", icon: Circle }, { id: "doing", label: "In progress", icon: CircleDot }, { id: "done", label: "Done", icon: Check },
];
const LEVEL = ["", "Low", "Low-medium", "Medium", "Medium-high", "High"];

export function ActionCard({ what, why, how, when, owner, impact, effort, initial = "todo", onChange }: {
  what: string; why: string; how: string[]; when: string; owner?: string; impact: 1 | 2 | 3 | 4 | 5; effort: 1 | 2 | 3 | 4 | 5;
  initial?: ActionState; onChange?: (s: ActionState) => void;
}) {
  const [state, setState] = useState<ActionState>(initial);
  const [done, setDone] = useState<boolean[]>(how.map(() => false));
  const set = (s: ActionState) => { setState(s); onChange?.(s); };
  return (
    <DsCard className={cn("space-y-4", state === "done" && "opacity-80")}>
      <div>
        <h3 className="text-base font-black tracking-tight text-slate-900">{what}</h3>
        <p className="mt-1 text-sm text-slate-600"><span className="font-bold text-slate-800">Why: </span>{why}</p>
      </div>
      <ul className="space-y-1.5">
        {how.map((h, i) => (
          <li key={i}>
            <label className="flex items-start gap-2.5 min-h-10 cursor-pointer text-sm text-slate-800">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--chart-1)] dark:[color-scheme:dark]" checked={done[i]} onChange={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))} />
              <span className={cn(done[i] && "line-through text-slate-500")}>{h}</span>
            </label>
          </li>
        ))}
      </ul>
      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate-600">
        <div className="inline-flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" aria-hidden /><dt className="sr-only">When</dt><dd className="font-semibold text-slate-800">{when}</dd></div>
        {owner && <div className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" aria-hidden /><dt className="sr-only">Owner</dt><dd className="font-semibold text-slate-800">{owner}</dd></div>}
        <div className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" aria-hidden /><dt>Impact</dt><dd className="font-semibold text-slate-800">{LEVEL[impact]}</dd></div>
        <div className="inline-flex items-center gap-1.5"><Hammer className="w-3.5 h-3.5" aria-hidden /><dt>Effort</dt><dd className="font-semibold text-slate-800">{LEVEL[effort]}</dd></div>
      </dl>
      <div role="group" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {STATES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={state === id} onClick={() => set(id)}
            className={cn("inline-flex items-center justify-center gap-1.5 min-h-10 rounded-lg text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
              state === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}>
            <Icon className="w-4 h-4" aria-hidden />{label}
          </button>
        ))}
      </div>
    </DsCard>
  );
}
