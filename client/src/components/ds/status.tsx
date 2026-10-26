// Status is never colour alone: every state is an icon, a word and a colour.
// Colours come from the semantic tokens (text-success, bg-warning-soft…).
import { AlertTriangle, CheckCircle2, Clock, FlaskConical, Info, Minus, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "good" | "watch" | "problem" | "info" | "neutral" | "soon" | "sample";

export const STATUS: Record<Status, { icon: any; label: string; box: string; text: string; mark: string }> = {
  good: { icon: CheckCircle2, label: "Healthy", box: "bg-success-soft border-success-line", text: "text-success", mark: "var(--chart-good)" },
  watch: { icon: AlertTriangle, label: "Watch", box: "bg-warning-soft border-warning-line", text: "text-warning", mark: "var(--chart-warn)" },
  problem: { icon: OctagonAlert, label: "Problem", box: "bg-danger-soft border-danger-line", text: "text-danger", mark: "var(--chart-bad)" },
  info: { icon: Info, label: "Info", box: "bg-info-soft border-info-line", text: "text-info", mark: "var(--chart-1)" },
  neutral: { icon: Minus, label: "No data", box: "bg-slate-50 border-slate-200", text: "text-slate-600", mark: "var(--chart-muted)" },
  soon: { icon: Clock, label: "Coming soon", box: "bg-slate-100 border-slate-200", text: "text-slate-700", mark: "var(--chart-muted)" },
  sample: { icon: FlaskConical, label: "Sample data", box: "bg-white border-slate-200", text: "text-slate-600", mark: "var(--chart-muted)" },
};

export function StatusChip({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", s.box, s.text, className)}>
      <Icon className="w-3.5 h-3.5" aria-hidden /> {label ?? s.label}
    </span>
  );
}

/** Marks a screen or chart as made-up demo data. */
export const SampleBadge = ({ className }: { className?: string }) => <StatusChip status="sample" className={className} />;
