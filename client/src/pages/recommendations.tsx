import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import {
  useOperationsIntel,
  SeverityBadge,
  GeneratedByBadge,
  SEVERITY_STYLES,
  sectorLabel,
  type OperationsIntelItem,
} from "@/components/analyst/operations-shared";
import {
  Lightbulb,
  Search,
  Info,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ListChecks,
} from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";

function RecommendationCard({ item, rank }: { item: OperationsIntelItem; rank: number }) {
  const s = SEVERITY_STYLES[item.severity];
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden"
      data-testid={`recommendation-card-${item.id}`}
    >
      <div className={`h-1 w-full`} style={{ background: s.bar }} />
      <div className="p-5 md:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-xs">
              {rank}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-black text-slate-900 truncate">{item.title}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {item.affectedWorkflow}
              </span>
            </div>
          </div>
          <SeverityBadge severity={item.severity} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-[#F4F7FA] rounded-xl border border-slate-100 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Search className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                Issue Detected
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.issueDetected}</p>
          </div>
          <div className="bg-[#F4F7FA] rounded-xl border border-slate-100 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Why It Matters
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.reasoning}</p>
          </div>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-[9px] font-black uppercase tracking-widest text-teal-700">
              Recommended Action
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800 leading-relaxed">{item.recommendedAction}</p>

          {item.actionPlanSteps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-teal-200/60">
              <div className="flex items-center gap-1.5 mb-2.5">
                <ListChecks className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[9px] font-black uppercase tracking-widest text-teal-700">
                  Action Plan
                </span>
              </div>
              <ol className="space-y-2">
                {item.actionPlanSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 mt-0.5 shrink-0 rounded-full bg-white text-teal-700 text-[10px] font-black flex items-center justify-center border border-teal-200 shadow-sm">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 p-3.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 block">
              Expected Outcome
            </span>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-0.5">
              {item.expectedOutcome}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { metrics, sector } = useSectorData();
  const { businessStructure } = useDashboardStore();
  const { data, loading, error, reload } = useOperationsIntel(sector, metrics, businessStructure);

  const items = useMemo(
    () => (data?.items || []).slice().sort((a, b) => a.priorityRank - b.priorityRank),
    [data]
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 shadow-sm">
                  <Lightbulb className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight uppercase">
                    AI Recommendations
                  </h1>
                  <p className="text-[11px] md:text-xs font-medium text-slate-500 mt-0.5">
                    Prioritized actions with step-by-step plans · {sectorLabel(sector)}
                  </p>
                </div>
              </div>
              {data && (
                <div className="flex items-center gap-3">
                  <GeneratedByBadge generatedBy={data.generatedBy} />
                  <button
                    onClick={reload}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors"
                    data-testid="button-refresh-recommendations"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            <UpgradeBanner feature="recommendations" />

            {loading && (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">Could not load recommendations.</p>
                <button
                  onClick={reload}
                  className="mt-3 text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700"
                  data-testid="button-retry-recommendations"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="space-y-4">
                {items.map((item, i) => (
                  <RecommendationCard key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="w-6 h-6 text-teal-500" />
                </div>
                <p className="text-sm font-black text-slate-800">No recommendations available</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Connect data or adjust your sector to generate AI recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
