// "Possible links between your numbers": patterns where a number from one part of
// the business tends to move with a number from another (for example ad cost and
// on-time delivery). Always worded as a possible link, never as a cause.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, GitBranch } from "lucide-react";
import { Panel } from "@/components/viz";
import { useKpiRun } from "@/hooks/use-kpi-run";
import { findPossibleLinks } from "@shared/links";
import { cn } from "@/lib/utils";

export function PossibleLinksPanel() {
  const { run, rows, headers } = useKpiRun();
  const report = useMemo(() => (run && rows ? findPossibleLinks(rows, headers) : null), [run, rows, headers]);
  const [open, setOpen] = useState(false);

  const summary = !report
    ? "Upload your own data with a date column and we will look for numbers that move together."
    : report.status !== "ok"
      ? report.notes[0]
      : report.links.length
        ? `${report.links.length} possible link${report.links.length > 1 ? "s" : ""} found over ${report.weeksUsed} weeks. None is proven.`
        : `No strong pattern found over ${report.weeksUsed} weeks.`;

  return (
    <Panel className="p-4 sm:p-5" data-testid="possible-links">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 text-left min-h-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="possible-links-toggle"
      >
        <GitBranch className="w-5 h-5 text-primary shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-slate-900">Possible links between your numbers</span>
          <span className="block text-sm text-slate-600">{summary}</span>
        </span>
        <ChevronDown className={cn("w-5 h-5 text-slate-500 transition-transform shrink-0", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-white/10" data-testid="possible-links-body">
          <p className="text-sm text-slate-700">
            These are patterns where two numbers from different parts of the business moved together week by week. <span className="font-bold">A pattern is not a cause.</span> Treat each one as a question to look into.
          </p>
          {report?.links.map((l) => (
            <article key={l.id} className="rounded-control border border-slate-200 bg-slate-50 p-4 space-y-2 dark:bg-white/5" data-testid="possible-link">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-pill border border-warning-line bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">Possible link, not proven</span>
                <span className="inline-flex items-center rounded-pill border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">Confidence: {l.confidence[0].toUpperCase() + l.confidence.slice(1)}</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{l.sentence}</p>
              <p className="text-xs text-slate-600">{l.confidenceReason}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">Other explanations: </span>{l.otherExplanations}</p>
              <p className="text-sm text-slate-700"><span className="font-bold">A check you can do: </span>{l.check}</p>
              <Link href={`/insights?ask=${encodeURIComponent(`I see a possible link: ${l.sentence} What else could explain it, and how can I test it?`)}`} className="inline-flex items-center min-h-10 text-sm font-bold text-primary underline-offset-2 hover:underline">
                Ask the analyst about this
              </Link>
            </article>
          ))}
          {report?.notes.map((n) => <p key={n} className="text-xs text-slate-600">{n}</p>)}
        </div>
      )}
    </Panel>
  );
}
