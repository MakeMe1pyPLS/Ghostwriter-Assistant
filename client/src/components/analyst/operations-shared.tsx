import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Metric } from "@/hooks/use-sector-data";
import { fetchOperationsIntel, ENGINE_LABELS } from "@/lib/intel-client";
import type { AIEngineId } from "@shared/ai-types";
import type { ActionItem } from "@/hooks/use-growth-store";
import { LevelPill } from "@/components/viz";

// Shared types + helpers for the operations intelligence pages (Bottleneck
// Detection, AI Recommendations, Operations Pipeline). All three project from
// the single /api/ai/operations-intel endpoint.

import type {
  Severity,
  OperationsIntelItem,
  OperationsIntelResult,
  AnalystBottleneck,
  AnalystAction,
  AnalystResponse,
  CommandCenterRequest,
} from "@shared/ai-types";

export type {
  Severity,
  OperationsIntelItem,
  OperationsIntelResult,
  AnalystBottleneck,
  AnalystAction,
  AnalystResponse,
};

export const SEVERITY_STYLES: Record<
  Severity,
  { dot: string; badge: string; label: string; bar: string; text: string; soft: string }
> = {
  high: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "High",
    bar: "#DC2626",
    text: "text-red-700",
    soft: "bg-red-50 border-red-100",
  },
  medium: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Medium",
    bar: "#D97706",
    text: "text-amber-700",
    soft: "bg-amber-50 border-amber-100",
  },
  low: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Low",
    bar: "#059669",
    text: "text-emerald-700",
    soft: "bg-emerald-50 border-emerald-100",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span data-testid={`severity-${severity}`}>
      <LevelPill level={severity} />
    </span>
  );
}

export function GeneratedByBadge({ generatedBy }: { generatedBy: AIEngineId }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500" title="The engine that produced this analysis">
      <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden />
      Analysis by {ENGINE_LABELS[generatedBy] ?? generatedBy}
    </span>
  );
}

/* ---- Derived views. Each comes from data the app really has, and the UI
   says how it was worked out. ---- */

/** The road from spotting an issue to fixing it. */
export const FIX_STAGES = ["Spotted", "Cause found", "Fix planned", "In progress", "Fixed"] as const;

/**
 * Where an issue sits on that road. Every issue from the analyst arrives with a
 * root cause and a recommended fix ("Fix planned"). Tracking it as actions moves
 * it on: any action started or finished → "In progress", all done → "Fixed".
 */
export function fixStageIndex(item: OperationsIntelItem, actions: Pick<ActionItem, "source" | "sourceRef" | "status">[]): number {
  const mine = actions.filter((a) => a.source === "bottleneck" && a.sourceRef === item.title);
  if (mine.length && mine.every((a) => a.status === "done")) return 4;
  if (mine.some((a) => a.status !== "todo")) return 3;
  if (item.recommendedAction) return 2;
  if (item.rootCause) return 1;
  return 0;
}

/** Board status of an issue's tracked actions, if any. */
export function trackedStatus(item: OperationsIntelItem, actions: Pick<ActionItem, "source" | "sourceRef" | "status">[]): "untracked" | "todo" | "doing" | "done" {
  const mine = actions.filter((a) => a.source === "bottleneck" && a.sourceRef === item.title);
  if (!mine.length) return "untracked";
  if (mine.every((a) => a.status === "done")) return "done";
  if (mine.some((a) => a.status !== "todo")) return "doing";
  return "todo";
}

/** Suggested timing, from severity. */
export const TIMING: Record<Severity, string> = { high: "Now", medium: "This week", low: "Later" };

/** Effort, from how many steps the plan has. 0–1 for charts. */
export function effortOf(item: OperationsIntelItem): { score: number; label: "Low effort" | "Medium effort" | "High effort" } {
  const n = Math.max(1, item.actionPlanSteps.length);
  if (n <= 2) return { score: 0.2, label: "Low effort" };
  if (n <= 4) return { score: 0.5, label: "Medium effort" };
  return { score: 0.85, label: "High effort" };
}

export const IMPACT_SCORE: Record<Severity, number> = { high: 0.85, medium: 0.55, low: 0.25 };

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
      const json: OperationsIntelResult = await fetchOperationsIntel(payload);
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
