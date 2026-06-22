import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Metric } from "@/hooks/use-sector-data";

// Shared types + helpers for the operations intelligence pages (Bottleneck
// Detection, AI Recommendations, Operations Pipeline). All three project from
// the single /api/ai/operations-intel endpoint.

export type Severity = "high" | "medium" | "low";

export interface OperationsIntelItem {
  id: string;
  type: "bottleneck" | "opportunity";
  title: string;
  severity: Severity;
  priorityRank: number;
  affectedWorkflow: string;
  currentState: string;
  issueDetected: string;
  rootCause: string;
  reasoning: string;
  recommendedAction: string;
  actionPlanSteps: string[];
  estimatedImpact: string;
  expectedOutcome: string;
}

export interface OperationsIntelResult {
  items: OperationsIntelItem[];
  generatedBy: "claude" | "rule-based";
}

export const SEVERITY_STYLES: Record<
  Severity,
  { dot: string; badge: string; label: string; bar: string; text: string; soft: string }
> = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "High",
    bar: "#DC2626",
    text: "text-red-600",
    soft: "bg-red-50 border-red-100",
  },
  medium: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Medium",
    bar: "#D97706",
    text: "text-amber-600",
    soft: "bg-amber-50 border-amber-100",
  },
  low: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Low",
    bar: "#059669",
    text: "text-emerald-600",
    soft: "bg-emerald-50 border-emerald-100",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${s.badge}`}
      data-testid={`severity-${severity}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function GeneratedByBadge({ generatedBy }: { generatedBy: "claude" | "rule-based" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
      <Sparkles className="w-3 h-3 text-teal-500" />
      {generatedBy === "claude" ? "AI · Claude" : "AI · Demo Engine"}
    </span>
  );
}

// Fetches operations intelligence with a content-based metrics key so the
// effect only re-runs when the metric values actually change (prevents the
// fetch loop that array identity changes would otherwise cause).
export function useOperationsIntel(
  sector: string,
  metrics: Metric[],
  businessStructure?: string
) {
  const [data, setData] = useState<OperationsIntelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const metricsKey = useMemo(
    () => JSON.stringify(metrics.map((m) => [m.label, m.value, m.trend, m.isPositive])),
    [metrics]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/operations-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          businessStructure,
          metrics: metrics.map((m) => ({
            label: m.label,
            value: m.value,
            trend: m.trend,
            isPositive: m.isPositive,
          })),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const json = (await res.json()) as OperationsIntelResult;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector, businessStructure, metricsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

const SECTOR_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  logistics: "Logistics",
  manufacturing: "Manufacturing",
  unified: "Unified Supply Chain",
  custom: "Custom Operations",
};

export function sectorLabel(sector: string): string {
  return SECTOR_LABELS[sector] || sector;
}
