import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  ListChecks,
  Search,
  GitBranch,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Workflow,
} from "lucide-react";
import { getAllMetrics } from "@/hooks/use-sector-data";
import {
  SeverityBadge,
  GeneratedByBadge,
  SEVERITY_STYLES,
  sectorLabel,
  type Severity,
  type OperationsIntelItem,
  type OperationsIntelResult,
} from "@/components/analyst/operations-shared";
import type {
  TopPriority,
  HealthPillar,
  CommandCenterResult,
  CommandCenterRequest,
} from "@shared/ai-types";

// Consultant-grade preview shown near the end of the Generate and Enhance
// wizards, BEFORE the dashboard is built. It projects from the existing
// /api/ai/command-center and /api/ai/operations-intel endpoints (no new AI
// logic) to brief the user on the key opportunity, largest risk, recommended
// focus, top priorities, and an operational pipeline. Degrades gracefully to
// the rule-based engine and never blocks the user from proceeding.

function gradeColor(grade: string): string {
  switch (grade) {
    case "Strong":
      return "text-emerald-600";
    case "Stable":
      return "text-primary";
    case "At Risk":
      return "text-amber-600";
    default:
      return "text-red-600";
  }
}

function ringColor(score: number): string {
  if (score >= 90) return "#059669";
  if (score >= 78) return "#0F766E";
  if (score >= 65) return "#D97706";
  return "#DC2626";
}

const PIPELINE_STAGES = [
  { key: "issueDetected", label: "Issue", icon: Search, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  { key: "rootCause", label: "Root Cause", icon: GitBranch, color: "text-red-600", bg: "bg-red-50 border-red-100" },
  { key: "recommendedAction", label: "Recommendation", icon: Target, color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
] as const;

function PipelineRow({ item, rank }: { item: OperationsIntelItem; rank: number }) {
  const s = SEVERITY_STYLES[item.severity];
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      data-testid={`preview-pipeline-${item.id}`}
    >
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-black text-slate-900 truncate">{item.title}</h4>
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

      <div className="p-4 space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-0">
          {PIPELINE_STAGES.map((stage, i) => {
            const value = item[stage.key as keyof OperationsIntelItem] as string;
            return (
              <div key={stage.key} className="flex flex-col lg:flex-row lg:items-stretch lg:flex-1 min-w-0">
                <div className={`flex-1 rounded-xl border p-3 ${stage.bg} min-w-0`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{value}</p>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="flex items-center justify-center py-1 lg:px-1 shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-300 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {item.actionPlanSteps.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ListChecks className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Action Plan</span>
            </div>
            <ol className="space-y-1">
              {item.actionPlanSteps.map((stepText, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-slate-600 leading-relaxed">
                  <span className="mt-0.5 w-4 h-4 shrink-0 rounded-md bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                    {i + 1}
                  </span>
                  {stepText}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 block mb-0.5">
              Expected Outcome
            </span>
            <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{item.expectedOutcome}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  tone,
  title,
  body,
}: {
  icon: any;
  label: string;
  tone: "emerald" | "red" | "teal";
  title: string;
  body: string;
}) {
  const tones: Record<string, { ring: string; iconBg: string; labelText: string }> = {
    emerald: { ring: "border-emerald-100", iconBg: "bg-emerald-50 text-emerald-600", labelText: "text-emerald-600" },
    red: { ring: "border-red-100", iconBg: "bg-red-50 text-red-600", labelText: "text-red-600" },
    teal: { ring: "border-teal-100", iconBg: "bg-teal-50 text-teal-700", labelText: "text-teal-700" },
  };
  const t = tones[tone];
  return (
    <div
      className={`bg-white rounded-2xl border ${t.ring} shadow-sm p-4 flex flex-col`}
      data-testid={`preview-highlight-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${t.labelText}`}>{label}</span>
      </div>
      <p className="text-sm font-black text-slate-900 leading-snug mb-1">{title}</p>
      <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}

export function ExecutivePreview({
  sector,
  businessStructure,
  variant = "generate",
}: {
  sector: string;
  businessStructure?: string;
  variant?: "generate" | "enhance";
}) {
  const metrics = useMemo(() => {
    const all = getAllMetrics(1);
    const key = sector === "unified-chain" ? "unified" : sector;
    let m = all.filter((x) => x.category === key);
    if (!m.length) m = all.filter((x) => x.category === "unified");
    return m;
  }, [sector]);

  const [cc, setCc] = useState<CommandCenterResult | null>(null);
  const [ops, setOps] = useState<OperationsIntelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const payload: CommandCenterRequest = {
      sector,
      businessStructure,
      metrics: metrics.map((m) => ({
        label: m.label,
        value: m.value,
        trend: m.trend,
        isPositive: m.isPositive,
      })),
    };
    const body = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };
    try {
      const [ccRes, opsRes] = await Promise.all([
        fetch("/api/ai/command-center", { method: "POST", headers, body }),
        fetch("/api/ai/operations-intel", { method: "POST", headers, body }),
      ]);
      if (!ccRes.ok || !opsRes.ok) throw new Error("request failed");
      setCc((await ccRes.json()) as CommandCenterResult);
      setOps((await opsRes.json()) as OperationsIntelResult);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector, businessStructure]);

  useEffect(() => {
    load();
  }, [load]);

  const accent = variant === "enhance" ? "text-indigo-600" : "text-primary";
  const accentBg = variant === "enhance" ? "bg-indigo-500/10" : "bg-primary/10";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" data-testid="preview-loading">
        <div className="h-24 rounded-3xl bg-slate-100" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || (!cc && !ops)) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
        data-testid="preview-error"
      >
        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700 mb-1">Preview unavailable</p>
        <p className="text-[12px] text-slate-500 font-medium mb-4">
          We couldn't load the executive preview, but you can still continue and generate your dashboard.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary"
          data-testid="button-preview-retry"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const opportunity = ops?.items.find((i) => i.type === "opportunity");
  const risk = ops?.items.find((i) => i.type === "bottleneck") ?? ops?.items[0];
  const weakestPillar = cc?.healthBreakdown.slice().sort((a, b) => a.score - b.score)[0];
  const topPriority = cc?.topPriorities[0];
  const generatedBy = cc?.generatedBy ?? ops?.generatedBy ?? "rule-based";
  const pipelineItems = ops?.items.slice(0, 2) ?? [];
  const priorities = cc?.topPriorities.slice(0, 3) ?? [];

  const focusTitle = weakestPillar
    ? `Strengthen ${weakestPillar.pillar}`
    : topPriority?.title ?? "Consolidate recent gains";
  const focusBody = weakestPillar
    ? `Lowest-scoring pillar at ${weakestPillar.score}/100. ${topPriority?.recommendedAction ?? "Clear the top priorities below first."}`
    : topPriority?.recommendedAction ?? "Maintain momentum and monitor leading indicators.";

  return (
    <div className="space-y-5" data-testid="executive-preview">
      {/* Header band: health + summary */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${accentBg}`}>
              <Sparkles className={`w-4 h-4 ${variant === "enhance" ? "text-indigo-300" : "text-teal-300"}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${variant === "enhance" ? "text-indigo-300" : "text-teal-300"}`}>
              AI Executive Preview
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {sectorLabel(sector === "unified-chain" ? "unified" : sector)}
            </span>
          </div>
          {cc && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tabular-nums" data-testid="preview-health-score">
                {cc.healthScore}
              </span>
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: ringColor(cc.healthScore) }}
              >
                {cc.healthGrade}
              </span>
            </div>
          )}
        </div>
        {cc && (
          <p className="text-[13px] leading-relaxed text-slate-100 font-medium" data-testid="preview-executive-summary">
            {cc.executiveSummary}
          </p>
        )}
      </div>

      {/* Key opportunity / largest risk / recommended focus */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HighlightCard
          icon={TrendingUp}
          tone="emerald"
          label="Key Opportunity"
          title={opportunity?.title ?? "Consolidate strengths"}
          body={opportunity?.recommendedAction ?? "Core metrics are steady — press recent gains further."}
        />
        <HighlightCard
          icon={AlertTriangle}
          tone="red"
          label="Largest Risk"
          title={risk?.title ?? topPriority?.title ?? "No material decline"}
          body={risk?.rootCause ?? topPriority?.whyItMatters ?? "Watch for early warning signs across pillars."}
        />
        <HighlightCard
          icon={Target}
          tone="teal"
          label="Recommended Focus"
          title={focusTitle}
          body={focusBody}
        />
      </div>

      {/* Top priorities */}
      {priorities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className={`w-4 h-4 ${accent}`} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Top Priorities</h3>
          </div>
          <div className="space-y-2">
            {priorities.map((p, i) => {
              const sev = SEVERITY_STYLES[p.severity];
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                  data-testid={`preview-priority-${i}`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} />
                    <span className="font-black text-slate-900 text-sm flex-1 min-w-0 truncate">{p.title}</span>
                    <SeverityBadge severity={p.severity} />
                  </div>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-1.5">{p.whyItMatters}</p>
                  <div className="flex items-start gap-1.5">
                    <Target className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{p.recommendedAction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Operational pipeline */}
      {pipelineItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Workflow className={`w-4 h-4 ${accent}`} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Operational Pipeline</h3>
            </div>
            <GeneratedByBadge generatedBy={generatedBy} />
          </div>
          <div className="space-y-3">
            {pipelineItems.map((item, i) => (
              <PipelineRow key={item.id} item={item} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
