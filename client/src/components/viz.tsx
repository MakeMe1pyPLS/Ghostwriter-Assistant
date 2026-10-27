// Shared visual building blocks for the app's analysis screens (Pipeline,
// Bottlenecks, Recommendations, KPI Library, Dashboard). One look everywhere:
// sentence-case titles, nothing smaller than 12px, and status always shown with
// an icon and a word as well as a colour. Rules: docs/BRAND.md → "Visual system".
import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/components/motion";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/* ------------------------------------------------------------ Page header --- */

/** Title, one plain sentence and optional actions. One per page. */
export function PageHeader({ icon: Icon, title, subtitle, meta, actions }: {
  icon?: IconType; title: string; subtitle?: ReactNode; meta?: ReactNode; actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex w-11 h-11 shrink-0 rounded-control bg-white border border-slate-200 items-center justify-center shadow-card">
            <Icon className="w-5 h-5 text-primary" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 text-balance">{title}</h1>
          {subtitle && <p className="text-sm sm:text-[15px] text-slate-500 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
          {meta && <div className="flex flex-wrap items-center gap-2 mt-2">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/* ----------------------------------------------------------------- Status --- */

export type Level = "high" | "medium" | "low";

export const LEVEL: Record<Level, { icon: IconType; text: string; box: string; fill: string; word: string }> = {
  high: { icon: OctagonAlert, text: "text-danger", box: "bg-danger-soft border-danger-line", fill: "bg-rose-600 dark:bg-rose-400", word: "High impact" },
  medium: { icon: AlertTriangle, text: "text-warning", box: "bg-warning-soft border-warning-line", fill: "bg-amber-500 dark:bg-amber-400", word: "Medium impact" },
  low: { icon: Info, text: "text-info", box: "bg-info-soft border-info-line", fill: "bg-sky-600 dark:bg-sky-400", word: "Low impact" },
};

/** Icon + word + colour. Never colour alone. */
export function LevelPill({ level, label, className }: { level: Level; label?: string; className?: string }) {
  const l = LEVEL[level];
  const Icon = l.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-bold whitespace-nowrap", l.box, l.text, className)}>
      <Icon className="w-3.5 h-3.5" aria-hidden /> {label ?? l.word}
    </span>
  );
}

/** Three-step meter for severity. Filled steps = level. */
export function LevelMeter({ level, className }: { level: Level; className?: string }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} role="img" aria-label={`${LEVEL[level].word}: ${n} of 3`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("w-1.5 rounded-sm", i < n ? LEVEL[level].fill : "bg-slate-200")} style={{ height: 6 + i * 4 }} />
      ))}
    </span>
  );
}

/** Small neutral label chip (sentence case, 12px). */
export function Tag({ children, icon: Icon, className }: { children: ReactNode; icon?: IconType; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-pill border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 whitespace-nowrap", className)}>
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />}{children}
    </span>
  );
}

/** Label above a block of text. Replaces the old 9px uppercase eyebrows. */
export function FieldLabel({ icon: Icon, children, className }: { icon?: IconType; children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1", className)}>
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />}{children}
    </p>
  );
}

/* --------------------------------------------------------------- Surfaces --- */

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-slate-200 bg-white shadow-card", className)} {...rest}>{children}</div>;
}

/** Friendly empty state: what this space is for and what to do next. */
export function EmptyState({ icon: Icon = CheckCircle2, title, body, action }: { icon?: IconType; title: string; body: string; action?: ReactNode }) {
  return (
    <Panel className="p-8 sm:p-10 text-center">
      <EmptyArt />
      <div className="w-12 h-12 -mt-9 relative rounded-2xl bg-white border border-slate-200 shadow-card flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6 text-primary" aria-hidden />
      </div>
      <p className="mt-4 text-base font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Panel>
  );
}

function EmptyArt() {
  return (
    <svg viewBox="0 0 160 56" className="w-40 h-14 mx-auto text-slate-200" aria-hidden>
      <path d="M8 44h144" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[20, 52, 84, 116].map((x, i) => (
        <g key={x}>
          <circle cx={x + 12} cy="28" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          {i < 3 && <path d={`M${x + 22} 28h10`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </g>
      ))}
    </svg>
  );
}

export function LoadingCards({ count = 3, height = 120 }: { count?: number; height?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-slate-200 bg-white animate-pulse" style={{ height }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- Stage flow --- */

export interface FlowStage { key: string; label: string; hint?: string; count: number; icon?: IconType }

/**
 * Connected stages. Each node shows how many items sit there; the band under it
 * grows with that number. The stage with the most work waiting is marked.
 */
export function StageFlow({ stages, highlightKey, highlightLabel = "Most waiting", onSelect, selectedKey }: {
  stages: FlowStage[]; highlightKey?: string; highlightLabel?: string; onSelect?: (key: string) => void; selectedKey?: string;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <ol className="grid gap-2 sm:gap-0 sm:grid-flow-col sm:auto-cols-fr" aria-label="Stages">
      {stages.map((s, i) => {
        const hot = s.key === highlightKey && s.count > 0;
        const selected = s.key === selectedKey;
        const Icon = s.icon;
        const Body = onSelect ? "button" : "div";
        return (
          <li key={s.key} className="relative flex sm:flex-col items-stretch">
            <Body
              {...(onSelect ? { type: "button" as const, onClick: () => onSelect(s.key), "aria-pressed": selected } : {})}
              className={cn(
                "relative flex-1 sm:mx-1 rounded-control border p-3 sm:p-4 text-left transition-colors",
                hot ? "border-danger-line bg-danger-soft" : "border-slate-200 bg-white",
                selected && "ring-2 ring-primary/40",
                onSelect && "hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("flex items-center gap-1.5 text-sm font-bold", hot ? "text-danger" : "text-slate-700")}>
                  {Icon && <Icon className="w-4 h-4" aria-hidden />}{s.label}
                </span>
                <span className="text-xs font-semibold text-slate-400 sm:hidden">Step {i + 1}</span>
              </div>
              <p className={cn("mt-1 text-3xl font-black tabular-nums tracking-tight", hot ? "text-danger" : "text-slate-900")}>{s.count}</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
                <motion.div
                  className={cn("h-full rounded-full", hot ? "bg-rose-600 dark:bg-rose-400" : "bg-teal-600 dark:bg-teal-400")}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / max) * 100}%` }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.05 }}
                />
              </div>
              {s.hint && <p className="mt-2 text-xs text-slate-500 leading-snug">{s.hint}</p>}
              {hot && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-danger">
                  <OctagonAlert className="w-3.5 h-3.5" aria-hidden /> {highlightLabel}
                </span>
              )}
            </Body>
            {i < stages.length - 1 && (
              <span aria-hidden className="hidden sm:block absolute top-1/2 -right-1.5 z-10 w-3 h-3 rotate-45 border-t border-r border-slate-300 bg-[#F4F7FA] dark:bg-transparent" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Where one item sits in a list of stages (dots joined by a line). */
export function StageTrack({ stages, current, className }: { stages: string[]; current: number; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="flex items-center" aria-label={`Stage ${current + 1} of ${stages.length}: ${stages[current]}`}>
        {stages.map((label, i) => (
          <li key={label} className={cn("flex items-center", i < stages.length - 1 && "flex-1")}>
            <span
              title={label}
              className={cn(
                "w-3 h-3 rounded-full border-2 shrink-0",
                i < current && "bg-teal-600 border-teal-600 dark:bg-teal-400 dark:border-teal-400",
                i === current && "bg-white border-teal-600 ring-4 ring-teal-600/15 dark:border-teal-400",
                i > current && "bg-white border-slate-300",
              )}
            />
            {i < stages.length - 1 && <span className={cn("h-0.5 flex-1 mx-1", i < current ? "bg-teal-600 dark:bg-teal-400" : "bg-slate-200")} />}
          </li>
        ))}
      </ol>
      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{stages[0]}</span>
        <span className="font-bold text-teal-700 dark:text-teal-300">{stages[current]}</span>
        <span>{stages[stages.length - 1]}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ Impact vs effort --- */

export interface QuadrantPoint { id: string; label: string; rank: number; impact: number; effort: number; tone: Level }

/**
 * 2×2 of impact (up) vs effort (right). Impact and effort are 0–1. Points are
 * numbered by priority; selecting one scrolls to its card.
 */
export function ImpactEffortChart({ points, onSelect, impactNote, effortNote }: {
  points: QuadrantPoint[]; onSelect?: (id: string) => void; impactNote?: string; effortNote?: string;
}) {
  const W = 320, H = 220, pad = 28;
  const x = (e: number) => pad + e * (W - pad * 2);
  const y = (i: number) => H - pad - i * (H - pad * 2);
  // Spread points that land on the same spot so every number stays visible.
  const seen = new Map<string, number>();
  const placed = points.map((p) => {
    const k = `${p.impact.toFixed(2)}:${p.effort.toFixed(2)}`;
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return { ...p, dx: (n % 3) * 22 - (n > 0 ? 11 : 0), dy: Math.floor(n / 3) * 22 };
  });
  const fill: Record<Level, string> = { high: "fill-rose-600 dark:fill-rose-400", medium: "fill-amber-500 dark:fill-amber-400", low: "fill-sky-600 dark:fill-sky-400" };
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Impact versus effort chart. Top left is quick wins.">
        <rect x={pad} y={pad} width={(W - pad * 2) / 2} height={(H - pad * 2) / 2} className="fill-emerald-50 dark:fill-emerald-400/10" rx="6" />
        <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} className="stroke-slate-200" strokeDasharray="3 4" />
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} className="stroke-slate-200" strokeDasharray="3 4" />
        <rect x={pad} y={pad} width={W - pad * 2} height={H - pad * 2} fill="none" className="stroke-slate-200" rx="6" />
        <text x={pad + 8} y={pad + 16} className="fill-emerald-700 dark:fill-emerald-300 text-[11px] font-bold">Quick wins</text>
        <text x={W - pad - 8} y={pad + 16} textAnchor="end" className="fill-slate-500 text-[11px] font-bold">Big projects</text>
        <text x={pad + 8} y={H - pad - 8} className="fill-slate-500 text-[11px] font-bold">Small tweaks</text>
        <text x={W - pad - 8} y={H - pad - 8} textAnchor="end" className="fill-slate-500 text-[11px] font-bold">Rethink</text>
        <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-slate-500 text-[11px]">More effort →</text>
        <text x={10} y={H / 2} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`} className="fill-slate-500 text-[11px]">More impact →</text>
        {placed.map((p) => (
          <g key={p.id} transform={`translate(${x(p.effort) + p.dx} ${y(p.impact) + p.dy})`}
            className={cn(onSelect && "cursor-pointer")} onClick={() => onSelect?.(p.id)}
            role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`${p.rank}. ${p.label}`}
            onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(p.id); } }}>
            <circle r="11" className={fill[p.tone]} />
            <text textAnchor="middle" dy="4" className="fill-white text-[11px] font-black">{p.rank}</text>
            <title>{`${p.rank}. ${p.label}`}</title>
          </g>
        ))}
      </svg>
      {(impactNote || effortNote) && (
        <figcaption className="mt-2 text-xs text-slate-500 leading-relaxed">{[impactNote, effortNote].filter(Boolean).join(" ")}</figcaption>
      )}
    </figure>
  );
}

/* -------------------------------------------------------- Category bars --- */

/** Horizontal bars for a breakdown (e.g. KPIs per category). */
export function BreakdownBars({ rows, onSelect, selected }: {
  rows: { key: string; label: string; value: number }[]; onSelect?: (key: string) => void; selected?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const active = r.key === selected;
        const Comp = onSelect ? "button" : "div";
        return (
          <li key={r.key}>
            <Comp {...(onSelect ? { type: "button" as const, onClick: () => onSelect(r.key), "aria-pressed": active } : {})}
              className={cn("w-full grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 rounded-lg px-2 py-1.5 text-left", onSelect && "hover:bg-slate-50", active && "bg-teal-50 dark:bg-teal-400/10")}>
              <span className={cn("text-sm truncate", active ? "font-bold text-teal-700 dark:text-teal-300" : "text-slate-600")}>{r.label}</span>
              <span className="h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
                <span className={cn("block h-full rounded-full", active ? "bg-teal-600 dark:bg-teal-400" : "bg-slate-300")} style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-700 text-right">{r.value}</span>
            </Comp>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------- Industry artwork --- */

export type ArtKey =
  | "every" | "retail" | "food" | "logistics" | "manufacturing" | "services"
  | "tech" | "health" | "home" | "finance" | "education" | "media";

/**
 * Small line illustrations, one per industry group, all in the same style:
 * 64×48, 1.75px strokes in ink, one teal shape for the "thing that matters".
 */
export function IndustryArt({ art, className }: { art: ArtKey; className?: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const accent = "fill-teal-500/25 stroke-teal-600 dark:stroke-teal-300";
  const scenes: Record<ArtKey, ReactNode> = {
    every: (<><circle cx="32" cy="24" r="15" {...s} /><path d="M17 24h30M32 9c5 4 5 26 0 30M32 9c-5 4-5 26 0 30" {...s} /><circle cx="46" cy="12" r="5" className={accent} strokeWidth={1.75} /></>),
    retail: (<><path d="M12 20h40l-3-9H15z" {...s} /><path d="M14 20v19h36V20" {...s} /><rect x="27" y="28" width="10" height="11" rx="1" className={accent} strokeWidth={1.75} /><path d="M18 26h5M41 26h5" {...s} /></>),
    food: (<><path d="M14 30h30a12 12 0 0 1-12 10h-6a12 12 0 0 1-12-10z" {...s} /><path d="M44 31h3a4 4 0 0 1 0 8h-4" {...s} /><path d="M24 22c0-3 3-3 3-6M31 22c0-3 3-3 3-6" {...s} /><circle cx="50" cy="13" r="4" className={accent} strokeWidth={1.75} /></>),
    logistics: (<><rect x="8" y="16" width="28" height="18" rx="2" {...s} /><path d="M36 22h9l7 7v5H36z" {...s} /><circle cx="17" cy="37" r="4" {...s} /><circle cx="45" cy="37" r="4" {...s} /><rect x="13" y="20" width="10" height="9" rx="1" className={accent} strokeWidth={1.75} /></>),
    manufacturing: (<><path d="M8 40V22l10 6v-6l10 6v-6l10 6V12h8v28z" {...s} /><path d="M8 40h48" {...s} /><rect x="40" y="6" width="4" height="6" {...s} /><rect x="14" y="31" width="6" height="5" className={accent} strokeWidth={1.75} /></>),
    services: (<><rect x="12" y="17" width="40" height="23" rx="3" {...s} /><path d="M25 17v-4h14v4M12 26h40" {...s} /><rect x="28" y="23" width="8" height="7" rx="1.5" className={accent} strokeWidth={1.75} /></>),
    tech: (<><rect x="12" y="10" width="40" height="25" rx="2" {...s} /><path d="M8 39h48" {...s} /><path d="M20 26l5-5 5 4 6-8 6 5" {...s} /><circle cx="42" cy="22" r="3.5" className={accent} strokeWidth={1.75} /></>),
    health: (<><path d="M32 40s-16-9-16-20a8 8 0 0 1 16-2 8 8 0 0 1 16 2c0 11-16 20-16 20z" {...s} /><path d="M27 24h10M32 19v10" className="stroke-teal-600 dark:stroke-teal-300" fill="none" strokeWidth={2} strokeLinecap="round" /></>),
    home: (<><path d="M12 24L32 9l20 15" {...s} /><path d="M16 21v19h32V21" {...s} /><rect x="28" y="28" width="8" height="12" className={accent} strokeWidth={1.75} /><path d="M40 13v-4h4v7" {...s} /></>),
    finance: (<><path d="M10 40h44M14 36V22M24 36V22M40 36V22M50 36V22M10 18l22-10 22 10z" {...s} /><circle cx="32" cy="27" r="5" className={accent} strokeWidth={1.75} /></>),
    education: (<><path d="M8 20l24-10 24 10-24 10z" {...s} /><path d="M18 25v9c4 4 24 4 28 0v-9" {...s} /><path d="M52 21v11" {...s} /><circle cx="52" cy="34" r="2.5" className={accent} strokeWidth={1.75} /></>),
    media: (<><rect x="10" y="12" width="44" height="26" rx="3" {...s} /><path d="M28 19v12l10-6z" className={accent} strokeWidth={1.75} /><path d="M22 42h20" {...s} /></>),
  };
  return (
    <svg viewBox="0 0 64 48" className={cn("text-slate-700 dark:text-slate-300", className)} aria-hidden>
      {scenes[art]}
    </svg>
  );
}
