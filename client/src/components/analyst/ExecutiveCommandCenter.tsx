import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import type { Metric } from "@/hooks/use-sector-data";

type Severity = "high" | "medium" | "low";

interface TopPriority {
  id: string;
  title: string;
  severity: Severity;
  whatHappened: string;
  whyItMatters: string;
  businessImpact: string;
  recommendedAction: string;
  expectedOutcome: string;
}

interface HealthPillar {
  pillar: string;
  score: number;
}

interface CommandCenterResult {
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthPillar[];
  executiveSummary: string;
  topPriorities: TopPriority[];
  alerts: { label: string; severity: Severity }[];
  generatedBy: "claude" | "rule-based";
}

const SEVERITY_STYLES: Record<Severity, { dot: string; badge: string; label: string }> = {
  high: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", label: "High" },
  medium: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium" },
  low: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low" },
};

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

function HealthRing({ score, grade }: { score: number; grade: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-[140px] h-[140px] shrink-0" data-testid="health-ring">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={ringColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-slate-900 tabular-nums" data-testid="text-health-score">
          {score}
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${gradeColor(grade)}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function PriorityCard({ priority, index }: { priority: TopPriority; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const sev = SEVERITY_STYLES[priority.severity];

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      data-testid={`priority-card-${index}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/60 transition-colors"
        data-testid={`button-priority-toggle-${index}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm truncate">{priority.title}</span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sev.badge}`}>
              {sev.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{priority.whatHappened}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-50" data-testid={`priority-detail-${index}`}>
          <IntelRow icon={Activity} label="What happened" tone="slate" text={priority.whatHappened} />
          <IntelRow icon={Zap} label="Why it matters" tone="amber" text={priority.whyItMatters} />
          <IntelRow icon={AlertTriangle} label="Business impact" tone="red" text={priority.businessImpact} />
          <IntelRow icon={Target} label="Recommended action" tone="teal" text={priority.recommendedAction} />
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Expected outcome</span>
              <p className="text-[12px] text-emerald-800 leading-relaxed mt-0.5">{priority.expectedOutcome}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TONE_STYLES: Record<string, string> = {
  slate: "text-slate-500",
  amber: "text-amber-600",
  red: "text-red-600",
  teal: "text-primary",
};

function IntelRow({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  text: string;
  tone: string;
}) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TONE_STYLES[tone]}`} />
      <div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${TONE_STYLES[tone]}`}>{label}</span>
        <p className="text-[12px] text-slate-700 leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-pulse" data-testid="command-center-loading">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-[260px]" />
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm h-[260px]" />
    </div>
  );
}

export function ExecutiveCommandCenter({
  sector,
  metrics,
  businessStructure,
}: {
  sector: string;
  metrics: Metric[];
  businessStructure?: string;
}) {
  const [data, setData] = useState<CommandCenterResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const payload = useMemo(
    () => ({
      sector,
      businessStructure,
      metrics: metrics.map((m) => ({
        label: m.label,
        value: m.value,
        trend: m.trend,
        isPositive: m.isPositive,
      })),
    }),
    [sector, businessStructure, metrics]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("request failed");
      const json = (await res.json()) as CommandCenterResult;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <div
        className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white"
        data-testid="command-center-error"
      >
        <p className="text-[12px] text-slate-500 font-medium">Could not load the executive briefing.</p>
        <button
          onClick={load}
          className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5"
          data-testid="button-command-center-retry"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6" data-testid="executive-command-center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Business Health Score */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Health Score</span>
          </div>
          <div className="flex items-center gap-5">
            <HealthRing score={data.healthScore} grade={data.healthGrade} />
            <div className="flex-1 min-w-0 space-y-2">
              {data.healthBreakdown.map((p) => (
                <div key={p.pillar} data-testid={`pillar-${p.pillar.replace(/\s+/g, "-").toLowerCase()}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600 truncate pr-2">{p.pillar}</span>
                    <span className="text-[10px] font-black text-slate-900 tabular-nums">{p.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.score}%`, backgroundColor: ringColor(p.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700 shadow-lg p-5 sm:p-6 flex flex-col text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-300" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-300">
                AI Executive Summary
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {data.generatedBy === "claude" ? "· Claude" : "· Demo Engine"}
              </span>
            </div>
            <button
              onClick={load}
              className="text-slate-400 hover:text-white transition-colors"
              title="Regenerate briefing"
              data-testid="button-command-center-refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-100 font-medium" data-testid="text-executive-summary">
            {data.executiveSummary}
          </p>
          {data.alerts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-4">
              {data.alerts.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200"
                  data-testid={`alert-chip-${i}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLES[a.severity].dot}`} />
                  {a.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Priorities */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Top Priorities Requiring Attention
          </span>
          <span className="text-[9px] font-bold text-slate-300">· {data.topPriorities.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.topPriorities.map((p, i) => (
            <PriorityCard key={p.id} priority={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
