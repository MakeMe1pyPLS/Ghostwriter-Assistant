// The one thing that is holding the business back, said in a sentence. Hero card:
// what is wrong, what it costs, and the single next step.
import { OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "./status";

export function BottleneckCard({ title, because, cost, next, action, className }: {
  title: string; because: string; cost: string; next: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("rounded-card border-2 bg-white p-5 sm:p-6 shadow-card", className)} style={{ borderColor: "var(--chart-bad)" }} aria-label="Biggest bottleneck">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status="problem" label="Biggest bottleneck" />
      </div>
      <h2 className="mt-3 flex items-start gap-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
        <OctagonAlert className="mt-1 w-5 h-5 shrink-0 text-danger" aria-hidden />{title}
      </h2>
      <p className="mt-2 text-sm text-slate-700">{because}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><dt className="text-[12px] font-bold text-slate-600">What it costs you</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{cost}</dd></div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><dt className="text-[12px] font-bold text-slate-600">Do this week</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{next}</dd></div>
      </dl>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
