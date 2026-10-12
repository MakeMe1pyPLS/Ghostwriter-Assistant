// Printable client progress report: goal, plan, progress, consulting decisions,
// open actions and next review. Uses the browser's print dialog, so it saves to
// PDF on every device without extra libraries.
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Printer, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useClientsStore, workspaceStats, isOverdue } from "@/hooks/use-clients-store";
import { GOALS } from "@shared/growth";
import { getIndustry } from "@shared/kpi-industries";
import { cn } from "@/lib/utils";

const fmt = (iso?: string) => (iso ? new Date(iso + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
const fmtTs = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ClientReportPage() {
  const [, params] = useRoute<{ id: string }>("/clients/:id/report");
  const client = useClientsStore((s) => s.clients.find((c) => c.id === params?.id));
  const workspaceFor = useClientsStore((s) => s.workspaceFor);
  const ws = useMemo(() => (client ? workspaceFor(client.id) : null), [client, workspaceFor]);
  const [showNotes, setShowNotes] = useState(false);

  // Paper is white: print in the light theme even when the app is in dark mode.
  useEffect(() => {
    const root = document.documentElement;
    let wasDark = false;
    const before = () => { wasDark = root.classList.contains("dark"); root.classList.remove("dark"); };
    const after = () => { if (wasDark) root.classList.add("dark"); };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);

  if (!client) {
    return (
      <div className="min-h-[100dvh] bg-[#F4F7FA] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-black text-slate-900">Client not found</p>
          <Link href="/clients" className="text-primary font-bold text-sm">Back to clients</Link>
        </div>
      </div>
    );
  }

  const g = ws?.growth;
  const profile = g?.profile;
  const plan = g?.plan;
  const stats = workspaceStats(ws);
  const actions = g?.actions ?? [];
  const since = Date.now() - 30 * 86_400_000;
  const recentDone = actions.filter((a) => a.status === "done" && (a.completedAt ?? 0) >= since).slice(0, 8);
  const open = actions
    .filter((a) => a.status !== "done")
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 10);
  const decisions = (g?.consultSessions ?? []).filter((s) => s.chosenOptionId).slice(0, 5);
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const goal = GOALS.find((x) => x.id === profile?.goal)?.label;

  return (
    <div className="min-h-[100dvh] bg-[#F4F7FA] print:bg-white">
      {/* Toolbar (hidden when printing) */}
      <div className="print:hidden sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-[860px] mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/clients" className="inline-flex items-center gap-1.5 h-10 px-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" /> Clients
          </Link>
          <label className="ml-auto flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer h-10 px-2">
            <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} /> Include notes
          </label>
          <Button onClick={() => window.print()} className="h-10 rounded-xl font-bold" data-testid="report-print"><Printer className="w-4 h-4 mr-1.5" /> Print or save PDF</Button>
        </div>
      </div>

      <article className="max-w-[860px] mx-auto bg-white my-4 sm:my-8 print:my-0 rounded-3xl print:rounded-none border border-slate-200 print:border-0 p-5 sm:p-10 print:p-0 text-slate-900 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-primary">Progress report</p>
            <h1 className="text-3xl font-black tracking-tight mt-1">{client.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {getIndustry(client.industryId ?? profile?.industryId)?.name ?? "Industry not set"} · {client.engagement} · {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <Logo size={30} />
        </header>

        {!plan ? (
          <p className="text-slate-500">No growth plan yet. Run the AI interview in this client’s workspace to build one.</p>
        ) : (
          <>
            <section className="grid sm:grid-cols-3 gap-3">
              <Stat label="Goal" value={goal ?? "—"} sub={profile?.targetKpi ? `${profile.targetKpi}${profile.targetValue ? ` → ${profile.targetValue}` : ""}` : undefined} />
              <Stat label="Actions done" value={`${stats.done} of ${stats.total}`} sub={`${pct}% complete`} />
              <Stat label="Overdue" value={String(stats.overdue)} sub={stats.overdue ? "Needs attention" : "All on schedule"} tone={stats.overdue ? "bad" : "good"} />
            </section>

            <section>
              <H2>The plan</H2>
              <p className="font-bold">{plan.headline}</p>
              <p className="text-sm text-slate-600 mt-1">{plan.summary}</p>
              <p className="text-sm mt-3"><span className="font-bold">North Star:</span> {plan.northStar.name} → {plan.northStar.target}</p>
              <div className="h-2 rounded-full bg-slate-100 mt-4 overflow-hidden print:border print:border-slate-300" aria-hidden>
                <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <ol className="mt-4 grid sm:grid-cols-3 gap-3">
                {plan.phases.map((ph) => {
                  const ids = new Set(ph.steps.map((s) => s.id));
                  const phActions = actions.filter((a) => a.phaseId === ph.id || (a.sourceRef && ids.has(a.sourceRef)));
                  const d = phActions.filter((a) => a.status === "done").length;
                  return (
                    <li key={ph.id} className="rounded-2xl border border-slate-200 p-3 break-inside-avoid">
                      <p className="text-[11px] font-bold text-slate-400">{ph.window}</p>
                      <p className="text-sm font-black">{ph.title}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{d}/{phActions.length || ph.steps.length} steps done</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )}

        {recentDone.length > 0 && (
          <section className="break-inside-avoid">
            <H2>Done in the last 30 days</H2>
            <ul className="space-y-1.5">
              {recentDone.map((a) => (
                <li key={a.id} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /><span>{a.title} <span className="text-slate-400">· {a.completedAt ? fmtTs(a.completedAt) : ""}</span></span></li>
              ))}
            </ul>
          </section>
        )}

        {decisions.length > 0 && (
          <section className="break-inside-avoid">
            <H2>Decisions from consulting sessions</H2>
            <ul className="space-y-3">
              {decisions.map((s) => {
                const o = s.result.options.find((x) => x.id === s.chosenOptionId)!;
                return (
                  <li key={s.id} className="rounded-2xl border border-slate-200 p-3.5">
                    <p className="text-[11px] font-bold text-slate-400">{s.title} · {fmtTs(s.decidedAt ?? s.createdAt)}</p>
                    <p className="text-sm font-black">{o?.title}</p>
                    <p className="text-[13px] text-slate-600">{s.result.headline}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {open.length > 0 && (
          <section>
            <H2>Next actions</H2>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400">
                    <th className="font-black py-2 px-1">Action</th><th className="font-black py-2 px-1">Owner</th><th className="font-black py-2 px-1">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {open.map((a) => (
                    <tr key={a.id} className="break-inside-avoid">
                      <td className="py-2 px-1 font-semibold">{a.title}</td>
                      <td className="py-2 px-1 text-slate-600">{a.owner}</td>
                      <td className={cn("py-2 px-1 whitespace-nowrap", isOverdue(a) ? "text-rose-600 font-bold" : "text-slate-600")}>{fmt(a.dueDate)}{isOverdue(a) ? " (overdue)" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showNotes && client.notes.length > 0 && (
          <section className="break-inside-avoid">
            <H2>Notes</H2>
            <ul className="space-y-2">
              {client.notes.slice(0, 10).map((n) => <li key={n.id} className="text-sm"><span className="text-slate-400">{fmtTs(n.createdAt)}:</span> <span className="whitespace-pre-wrap">{n.text}</span></li>)}
            </ul>
          </section>
        )}

        <footer className="border-t border-slate-200 pt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <p><span className="font-bold">Next review:</span> {fmt(client.nextReview)}</p>
          {client.contactName && <p><span className="font-bold">Contact:</span> {client.contactName}</p>}
          <p className="text-slate-400 w-full text-xs mt-2">Prepared with ChainInsideIQ. Figures come from the numbers entered in this workspace.</p>
        </footer>
      </article>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{children}</h2>;
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 break-inside-avoid">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={cn("text-xl font-black mt-1", tone === "bad" ? "text-rose-600" : tone === "good" ? "text-emerald-700" : "text-slate-900")}>{value}</p>
      {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
