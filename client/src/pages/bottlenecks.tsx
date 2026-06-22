import { useMemo, useState } from "react";
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
  AlertOctagon,
  ChevronDown,
  Activity,
  Search,
  GitBranch,
  Target,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";

function BottleneckCard({ item, rank }: { item: OperationsIntelItem; rank: number }) {
  const [open, setOpen] = useState(rank === 1);
  const s = SEVERITY_STYLES[item.severity];

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden"
      data-testid={`bottleneck-card-${item.id}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-slate-50/60 transition-colors"
        data-testid={`bottleneck-toggle-${item.id}`}
      >
        <div
          className="w-9 h-9 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm"
          style={{ boxShadow: `0 4px 12px ${s.bar}22` }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm md:text-base font-black text-slate-900 truncate">{item.title}</h3>
            <SeverityBadge severity={item.severity} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Activity className="w-3 h-3" />
            <span className="truncate">{item.affectedWorkflow}</span>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 md:px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">
          <div className="grid sm:grid-cols-3 gap-3 pt-4">
            <DetailBlock icon={Activity} label="Current State" text={item.currentState} tone="slate" />
            <DetailBlock icon={Search} label="Issue Detected" text={item.issueDetected} tone="amber" />
            <DetailBlock icon={GitBranch} label="Root Cause" text={item.rootCause} tone="red" />
          </div>

          <div className={`rounded-xl border p-4 ${s.soft}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown className={`w-3.5 h-3.5 ${s.text}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${s.text}`}>
                Estimated Impact
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">{item.estimatedImpact}</p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-700">
                Recommended Action
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">{item.recommendedAction}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: any;
  label: string;
  text: string;
  tone: "slate" | "amber" | "red";
}) {
  const toneMap = {
    slate: "text-slate-500",
    amber: "text-amber-600",
    red: "text-red-600",
  } as const;
  return (
    <div className="bg-[#F4F7FA] rounded-xl border border-slate-100 p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${toneMap[tone]}`} />
        <span className={`text-[9px] font-black uppercase tracking-widest ${toneMap[tone]}`}>{label}</span>
      </div>
      <p className="text-xs font-medium text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

export default function BottlenecksPage() {
  const { metrics, sector } = useSectorData();
  const { businessStructure } = useDashboardStore();
  const { data, loading, error, reload } = useOperationsIntel(sector, metrics, businessStructure);

  const bottlenecks = useMemo(
    () =>
      (data?.items || [])
        .filter((i) => i.type === "bottleneck")
        .sort((a, b) => a.priorityRank - b.priorityRank),
    [data]
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 shadow-sm">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight uppercase">
                    Bottleneck Detection
                  </h1>
                  <p className="text-[11px] md:text-xs font-medium text-slate-500 mt-0.5">
                    Operational constraints ranked by business impact · {sectorLabel(sector)}
                  </p>
                </div>
              </div>
              {data && (
                <div className="flex items-center gap-3">
                  <GeneratedByBadge generatedBy={data.generatedBy} />
                  <button
                    onClick={reload}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors"
                    data-testid="button-refresh-bottlenecks"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            <UpgradeBanner feature="bottlenecks" />

            {loading && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">Could not load bottleneck analysis.</p>
                <button
                  onClick={reload}
                  className="mt-3 text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700"
                  data-testid="button-retry-bottlenecks"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && bottlenecks.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-black text-slate-800">No critical bottlenecks detected</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Operations are running within normal parameters for this sector.
                </p>
              </div>
            )}

            {!loading && !error && bottlenecks.length > 0 && (
              <div className="space-y-3">
                {bottlenecks.map((item, i) => (
                  <BottleneckCard key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
