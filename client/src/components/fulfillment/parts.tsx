// Small pieces shared by the fulfillment screens. Status is always shown with an
// icon and a word as well as a colour.
import { AlertTriangle, CheckCircle2, OctagonAlert, FlaskConical, ShieldAlert, Info } from "lucide-react";
import type { Health } from "@shared/fulfillment";
import { cn } from "@/lib/utils";

export type Tone = "ok" | "watch" | "bottleneck" | "info";

export const TONE: Record<Tone, { box: string; text: string; bar: string; icon: any; label: string }> = {
  ok: { box: "bg-success-soft border-success-line", text: "text-success", bar: "bg-emerald-600 dark:bg-emerald-400", icon: CheckCircle2, label: "On pace" },
  watch: { box: "bg-warning-soft border-warning-line", text: "text-warning", bar: "bg-amber-600 dark:bg-amber-400", icon: AlertTriangle, label: "Watch" },
  bottleneck: { box: "bg-danger-soft border-danger-line", text: "text-danger", bar: "bg-rose-600 dark:bg-rose-400", icon: OctagonAlert, label: "Bottleneck" },
  info: { box: "bg-info-soft border-info-line", text: "text-info", bar: "bg-sky-600 dark:bg-sky-400", icon: Info, label: "Info" },
};

export function HealthBadge({ health, className, label }: { health: Health; className?: string; label?: string }) {
  const t = TONE[health];
  const Icon = t.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-black whitespace-nowrap", t.box, t.text, className)}>
      <Icon className="w-3.5 h-3.5" aria-hidden /> {label ?? t.label}
    </span>
  );
}

export function Chip({ tone, children, className }: { tone: "ok" | "watch" | "bottleneck" | "info" | "neutral"; children: React.ReactNode; className?: string }) {
  if (tone === "neutral") {
    return <span className={cn("inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600 whitespace-nowrap dark:border-white/10 dark:bg-white/5 dark:text-slate-300", className)}>{children}</span>;
  }
  const t = TONE[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap", t.box, t.text, className)}>{children}</span>;
}

/** A small line of recent values. The last point is marked. */
export function Sparkline({ values, tone = "info", label, className }: { values: number[]; tone?: Tone; label: string; className?: string }) {
  const w = 120, h = 32, pad = 3;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1), h - pad - ((v - min) / span) * (h - pad * 2)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full h-8", TONE[tone].text, className)} role="img" aria-label={label} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />
    </svg>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300", className)} title="Every name and number on this screen is made up for the demo.">
      <FlaskConical className="w-3 h-3" aria-hidden /> Sample data
    </span>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        {eyebrow && <p className="text-xs font-bold text-primary">{eyebrow}</p>}
        <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export const Card = ({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-card border border-slate-200 bg-white shadow-card p-4 sm:p-5", className)} {...rest}>{children}</div>
);

export const SharedNote = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-start gap-2 text-[13px] text-slate-600"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" aria-hidden /> <span>{children}</span></p>
);

export const hrs = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${Math.round(h * 10) / 10} h`);
