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
  Workflow,
  Activity,
  Search,
  GitBranch,
  Target,
  ListChecks,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";

const STAGES = [
  { key: "currentState", label: "Current State", icon: Activity, color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  { key: "issueDetected", label: "Issue Detected", icon: Search, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  { key: "rootCause", label: "Root Cause", icon: GitBranch, color: "text-red-600", bg: "bg-red-50 border-red-100" },
  { key: "recommendedAction", label: "Recommendation", icon: Target, color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
  { key: "expectedOutcome", label: "Expected Outcome", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
] as const;

function PipelineRow({ item, rank }: { item: OperationsIntelItem; rank: number }) {
  const s = SEVERITY_STYLES[item.severity];
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden"
      data-testid={`pipeline-row-${item.id}`}
    >
      <div className="flex items-center gap-3 p-4 md:p-5 border-b border-slate-100">
        <div
          className="w-8 h-8 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs"
          style={{ boxShadow: `0 4px 12px ${s.bar}22` }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm md:text-base font-black text-slate-900 truncate">{item.title}</h3>
            <span
              className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                item.type === "bottleneck"
                  ? "bg-red-50 text-red-600 border-red-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}
            >
              {item.type}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {item.affectedWorkflow}
          </span>
        </div>
        <SeverityBadge severity={item.severity} />
      </div>

      <div className="p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-0">
          {STAGES.map((stage, i) => {
            const value = item[stage.key as keyof OperationsIntelItem] as string;
            return (
              <div key={stage.key} className="flex flex-col lg:flex-row lg:items-stretch lg:flex-1 min-w-0">
                <div className={`flex-1 rounded-xl border p-3.5 ${stage.bg} min-w-0`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{value}</p>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="flex items-center justify-center py-1 lg:px-1 shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-300 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {item.actionPlanSteps.length > 0 && (
          <div className="mt-4 bg-[#F4F7FA] rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ListChecks className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-700">
                Action Plan
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.actionPlanSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-sm"
                >
                  <span className="w-4 h-4 shrink-0 rounded-full bg-teal-50 text-teal-700 text-[9px] font-black flex items-center justify-center border border-teal-200">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
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
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                  <Workflow className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight uppercase">
                    Operations Pipeline
                  </h1>
                  <p className="text-[11px] md:text-xs font-medium text-slate-500 mt-0.5">
                    From signal to resolution — every issue traced end to end · {sectorLabel(sector)}
                  </p>
                </div>
              </div>
              {data && (
                <div className="flex items-center gap-3">
                  <GeneratedByBadge generatedBy={data.generatedBy} />
                  <button
                    onClick={reload}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors"
                    data-testid="button-refresh-pipeline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            <UpgradeBanner feature="pipeline" />

            {loading && (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">Could not load the operations pipeline.</p>
                <button
                  onClick={reload}
                  className="mt-3 text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700"
                  data-testid="button-retry-pipeline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="space-y-4">
                {items.map((item, i) => (
                  <PipelineRow key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <Workflow className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-black text-slate-800">Pipeline is clear</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  No active operational flows require attention right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
