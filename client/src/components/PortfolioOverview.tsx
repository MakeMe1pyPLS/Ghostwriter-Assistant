// Consultant overview: who needs attention, whether the fixes are moving numbers,
// and every client side by side. Numbers come from each client's own uploaded
// files; nothing is shared between clients.
import { useLocation } from "wouter";
import { AlertTriangle, CalendarClock, CircleDashed, ClipboardCheck, Database, Hourglass, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientsStore } from "@/hooks/use-clients-store";
import { usePortfolio } from "@/hooks/use-portfolio";
import type { AttentionKind } from "@shared/consultant";

const KIND: Record<AttentionKind, { label: string; icon: typeof AlertTriangle }> = {
  "wrong-way": { label: "Moved the wrong way", icon: TrendingDown },
  overdue: { label: "Overdue", icon: AlertTriangle },
  "review-due": { label: "Review due", icon: CalendarClock },
  assessment: { label: "Assessment late", icon: ClipboardCheck },
  "no-data": { label: "No data", icon: Database },
  quiet: { label: "Quiet", icon: Hourglass },
};

export function PortfolioOverview() {
  const { summaries, portfolio } = usePortfolio();
  const switchTo = useClientsStore((s) => s.switchTo);
  const [, navigate] = useLocation();
  if (!summaries.length) return null;
  const o = portfolio.outcomes;
  const open = (id: string, to: string) => { switchTo(id); navigate(to); };

  return (
    <section className="space-y-4" aria-labelledby="portfolio-title" data-testid="portfolio">
      <h2 id="portfolio-title" className="text-lg font-black tracking-tight text-slate-900">Across all clients</h2>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="portfolio-attention">
          <h3 className="text-base font-black text-slate-900">Needs attention</h3>
          {portfolio.attention.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nothing needs attention right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {portfolio.attention.slice(0, 8).map((a, i) => {
                const k = KIND[a.kind];
                return (
                  <li key={`${a.clientId}-${a.kind}-${i}`} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:bg-white/5 dark:border-white/10" data-testid="attention-item">
                    <k.icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900"><span>{a.clientName}</span> <span className="font-semibold text-slate-600">· {k.label}</span></p>
                      <p className="text-sm text-slate-700">{a.text}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg font-bold shrink-0 min-h-10" onClick={() => open(a.clientId, a.kind === "no-data" ? "/data" : "/plan")}>Open</Button>
                  </li>
                );
              })}
            </ul>
          )}
          {portfolio.attention.length > 8 && <p className="mt-2 text-xs text-slate-600">Showing the 8 most urgent of {portfolio.attention.length}.</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="portfolio-outcomes">
          <h3 className="text-base font-black text-slate-900">Are the fixes working?</h3>
          {o.tracked === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No fixes are being tracked against a number yet. When you track a finding that comes from a client's uploaded data, its before and after shows up here.</p>
          ) : (
            <>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {[["Moved the right way", o.improved], ["Moved the wrong way", o.worse], ["No real change", o.same], ["Waiting for newer data", o.noData]].map(([l, n]) => (
                  <div key={l as string} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:bg-white/5 dark:border-white/10">
                    <dt className="text-xs font-bold text-slate-600">{l}</dt>
                    <dd className="text-xl font-black tabular-nums text-slate-900">{n as number}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-slate-600">{o.tracked} tracked fix{o.tracked > 1 ? "es" : ""}. This compares each client's numbers before and after. Other things may have changed too, so it does not prove a fix caused the change.</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-black text-slate-900">Clients side by side</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]" data-testid="portfolio-table">
            <caption className="sr-only">Each client's status, data, headline numbers, actions and fix results</caption>
            <thead>
              <tr className="text-xs text-slate-600">
                <th scope="col" className="text-left p-2 font-bold">Client</th>
                <th scope="col" className="text-left p-2 font-bold">Data</th>
                <th scope="col" className="text-left p-2 font-bold">Headline numbers</th>
                <th scope="col" className="text-right p-2 font-bold">Open / overdue</th>
                <th scope="col" className="text-right p-2 font-bold">Fixes (right way / wrong way)</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-white/10 align-top" data-testid={`portfolio-row-${s.id}`}>
                  <th scope="row" className="text-left p-2 font-bold text-slate-900">{s.name}<span className="block text-xs font-semibold text-slate-600">{s.status}</span></th>
                  <td className="p-2 text-slate-700">
                    {s.hasData
                      ? <>{s.datasetName}{s.partial && <span className="block text-xs text-slate-600">First {s.rowsUsed?.toLocaleString()} rows only</span>}</>
                      : <span className="inline-flex items-center gap-1 text-slate-600"><CircleDashed className="w-3.5 h-3.5" aria-hidden /> None yet</span>}
                  </td>
                  <td className="p-2 text-slate-700">
                    {s.kpis.length ? s.kpis.slice(0, 3).map((k) => (
                      <span key={k.id} className="block">{k.label}: <span className="font-bold">{k.display}</span>{k.changeText ? <span className="text-slate-600"> ({k.changeText}{k.better === true ? ", better" : k.better === false ? ", worse" : ""})</span> : null}{k.target && <span className={k.target.state === "met" ? "block text-xs font-semibold text-emerald-800" : "block text-xs font-semibold text-amber-800"}>{k.target.text}</span>}</span>
                    )) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-2 text-right tabular-nums">{s.actions.open} / <span className={s.actions.overdue ? "font-black" : ""}>{s.actions.overdue}</span></td>
                  <td className="p-2 text-right tabular-nums">{s.outcomes.items.length ? `${s.outcomes.improved} / ${s.outcomes.worse}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-600">Numbers come from each client's own uploaded file (the one chosen as active, or the newest). Clients with no file show no numbers. Nothing is shared between clients.</p>
      </div>
    </section>
  );
}
