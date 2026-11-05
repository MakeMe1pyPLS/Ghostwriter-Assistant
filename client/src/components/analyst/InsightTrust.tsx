// "How sure are we?" for any finding: where it came from (your data, sample data,
// or an AI hypothesis), the numbers behind it, a confidence level with its reason,
// and anything to know before trusting it. Opens with one tap.
import { useMemo, useState } from "react";
import { ChevronDown, FlaskConical, HelpCircle, ShieldCheck } from "lucide-react";
import { useKpiRun } from "@/hooks/use-kpi-run";
import { standardiseInsight, type Confidence, type InsightBasis } from "@shared/insight";
import type { OperationsIntelItem } from "@shared/ai-types";
import { cn } from "@/lib/utils";

const BASIS_STYLE: Record<InsightBasis, { icon: typeof ShieldCheck; cls: string }> = {
  verified: { icon: ShieldCheck, cls: "text-success border-success-line bg-success-soft" },
  sample: { icon: FlaskConical, cls: "text-slate-700 border-slate-300 bg-slate-50 dark:bg-white/5" },
  hypothesis: { icon: HelpCircle, cls: "text-warning border-warning-line bg-warning-soft" },
};
const CONF_WORD: Record<Confidence, string> = { high: "High", medium: "Medium", low: "Low" };

export function InsightTrust({ item }: { item: OperationsIntelItem }) {
  const { run, totalRows } = useKpiRun();
  const insight = useMemo(() => standardiseInsight(item, { run, totalRows }), [item, run, totalRows]);
  const [open, setOpen] = useState(false);
  const b = BASIS_STYLE[insight.basis];

  return (
    <div className="rounded-control border border-slate-200 bg-white p-3 text-sm dark:bg-white/5" data-testid={`insight-trust-${item.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-bold", b.cls)} data-testid="insight-basis">
          <b.icon className="w-3.5 h-3.5" aria-hidden /> {insight.basisLabel}
        </span>
        <span className="inline-flex items-center rounded-pill border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700" data-testid="insight-confidence">
          Confidence: {CONF_WORD[insight.confidence]}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="ml-auto inline-flex items-center gap-1 min-h-10 px-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          data-testid="insight-toggle"
        >
          How we know <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-white/10" data-testid="insight-detail">
          <p className="text-slate-700">{insight.basisDetail}</p>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-1">Numbers behind it</p>
            {insight.evidence.length ? (
              <ul className="space-y-1.5">
                {insight.evidence.map((e) => (
                  <li key={e.label} className="text-slate-700" data-testid="insight-evidence">
                    <span className="font-bold">{e.label}: {e.value}</span>
                    {e.change && <span className="text-slate-600">, {e.change}{e.better === true ? " (better)" : e.better === false ? " (worse)" : ""}</span>}
                    {e.how && <span className="block text-xs text-slate-600">How: {e.how}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">{insight.basis === "sample" ? "Sample data has no numbers of yours to show." : "No calculated number of yours matches this finding."}</p>
            )}
          </div>

          <p className="text-slate-700"><span className="font-bold">Why this confidence: </span>{insight.confidenceReason}</p>

          {insight.caveats.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-0.5">
              {insight.caveats.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}

          <p className="text-xs text-slate-600">The reason given for a finding is a possible explanation. Your data shows what changed, not what caused it.</p>
        </div>
      )}
    </div>
  );
}
