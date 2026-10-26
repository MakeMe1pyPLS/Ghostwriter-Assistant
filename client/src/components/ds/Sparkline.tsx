// A small line of recent values. The line is quiet; the latest stretch and the end
// dot wear the accent. SVG stretches to fit; the dot is an HTML element so it stays round.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SparkTone = "brand" | "good" | "watch" | "problem" | "muted";
const COLOR: Record<SparkTone, string> = {
  brand: "var(--chart-1)", good: "var(--chart-good)", watch: "var(--chart-warn)", problem: "var(--chart-bad)", muted: "var(--chart-muted)",
};

export function Sparkline({ values, label, tone = "brand", area = true, className }: {
  values: number[]; label: string; tone?: SparkTone; area?: boolean; className?: string;
}) {
  const reduce = useReducedMotion();
  if (values.length < 2) return null;
  const W = 100, H = 32, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i * W) / (values.length - 1),
    H - pad - ((v - min) / span) * (H - pad * 2),
  ] as const);
  const path = (p: readonly (readonly [number, number])[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const recent = Math.max(2, Math.ceil(values.length / 4)); // the latest stretch
  const tail = pts.slice(-recent);
  const last = pts[pts.length - 1];
  const color = COLOR[tone];
  return (
    <div className={cn("relative h-8 w-full", className)} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        {area && <path d={`${path(pts)} L${W} ${H} L0 ${H} Z`} fill={color} opacity="0.1" />}
        <path d={path(pts)} fill="none" stroke="var(--chart-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.7" />
        <motion.path d={path(tail)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span aria-hidden className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full ring-2 ring-[var(--chart-surface)]"
        style={{ left: `${last[0]}%`, top: `${(last[1] / H) * 100}%`, background: color }} />
    </div>
  );
}
