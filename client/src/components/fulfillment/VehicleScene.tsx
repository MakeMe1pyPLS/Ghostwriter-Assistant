// Side-view vehicle drawings for the fulfillment screens. Original artwork in
// the brand's line style (docs/BRAND.md → Visual system).
//
// <VehicleScene> splits the cargo area into sections, one per load line, each
// as wide as that line's share of the vehicle's capacity (by weight or by
// volume). It shows how much of the vehicle each line uses. It does NOT say
// where anything sits: that would be a load plan, which this app doesn't make.
//
// <VehicleIcon> is the small version for pickers and order cards.
import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import type { VehicleId } from "@shared/fulfillment";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/components/motion";

export interface LoadSection { key: string; label: string; share: number }

/** Section colours, in order. Distinct in hue and lightness, readable in both themes. */
export const SECTION_COLORS = [
  "fill-teal-600 dark:fill-teal-400",
  "fill-sky-600 dark:fill-sky-400",
  "fill-violet-600 dark:fill-violet-400",
  "fill-amber-500 dark:fill-amber-400",
  "fill-emerald-700 dark:fill-emerald-400",
  "fill-indigo-500 dark:fill-indigo-300",
  "fill-slate-500 dark:fill-slate-400",
] as const;
export const SECTION_DOTS = ["bg-teal-600", "bg-sky-600", "bg-violet-600", "bg-amber-500", "bg-emerald-700", "bg-indigo-500", "bg-slate-500"] as const;

const W = 400, H = 160, GROUND = 146;

/** Where the cargo area sits in each drawing: x, y, width, height. */
const CARGO: Record<VehicleId, [number, number, number, number]> = {
  "cargo-van": [16, 40, 222, 78],
  "box-truck": [10, 18, 262, 100],
  "trailer-53": [6, 24, 300, 92],
};

function Wheel({ cx, r = 13 }: { cx: number; r?: number }) {
  const cy = GROUND - r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-slate-800 dark:fill-slate-200" />
      <circle cx={cx} cy={cy} r={r * 0.48} className="fill-slate-300 dark:fill-slate-600" />
      <circle cx={cx} cy={cy} r={r * 0.16} className="fill-slate-800 dark:fill-slate-200" />
    </g>
  );
}

const ink = { className: "stroke-slate-500 dark:stroke-slate-400", strokeWidth: 1.75, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const body = "fill-white dark:fill-slate-800";
const glass = "fill-sky-100 dark:fill-sky-400/20";

/** Everything except the cargo area. */
function Chassis({ id }: { id: VehicleId }) {
  if (id === "cargo-van") {
    return (
      <g>
        <path d="M238 40h46c10 0 18 4 24 12l22 30c12 2 34 8 40 14 4 4 6 10 6 18v14H238z" className={body} {...ink} />
        <path d="M290 50h12c4 0 8 2 10 6l18 26h-40z" className={glass} {...ink} />
        <path d="M352 104h22" {...ink} fill="none" />
        <rect x="364" y="94" width="10" height="5" rx="2" className="fill-amber-300 dark:fill-amber-400/70" />
        <path d="M16 118h360v10H16z" className="fill-slate-200 dark:fill-slate-700" />
        <Wheel cx={70} r={14} /><Wheel cx={318} r={14} />
      </g>
    );
  }
  if (id === "box-truck") {
    return (
      <g>
        <path d="M276 44h46c8 0 14 4 18 10l20 28c14 2 26 6 30 10 2 3 4 8 4 14v22H276z" className={body} {...ink} />
        <path d="M326 54h8c4 0 7 2 9 5l16 23h-33z" className={glass} {...ink} />
        <path d="M282 54h36v28h-36z" className={glass} {...ink} />
        <rect x="378" y="98" width="12" height="5" rx="2" className="fill-amber-300 dark:fill-amber-400/70" />
        <rect x="10" y="118" width="384" height="10" rx="2" className="fill-slate-200 dark:fill-slate-700" />
        <rect x="120" y="120" width="60" height="12" rx="4" className="fill-slate-300 dark:fill-slate-600" />
        <Wheel cx={56} /><Wheel cx={86} /><Wheel cx={346} />
      </g>
    );
  }
  return (
    <g>
      <path d="M318 50h34c8 0 14 4 18 10l14 22c6 2 10 6 10 12v34h-76z" className={body} {...ink} />
      <path d="M340 58h10c4 0 7 2 9 5l12 19h-31z" className={glass} {...ink} />
      <rect x="322" y="34" width="6" height="22" rx="2" className="fill-slate-400 dark:fill-slate-500" />
      <rect x="380" y="98" width="10" height="5" rx="2" className="fill-amber-300 dark:fill-amber-400/70" />
      <rect x="6" y="116" width="300" height="8" rx="2" className="fill-slate-200 dark:fill-slate-700" />
      <rect x="296" y="120" width="98" height="8" rx="2" className="fill-slate-200 dark:fill-slate-700" />
      <path d="M140 116v14M150 116v14" {...ink} fill="none" />
      <Wheel cx={42} r={12} /><Wheel cx={70} r={12} /><Wheel cx={332} r={12} /><Wheel cx={372} r={12} />
    </g>
  );
}

function onKeyActivate(fn: () => void) {
  return (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
}

/**
 * A vehicle with its cargo area split into load sections. Sections fill from the
 * cab backwards. If the shares add up to more than 100%, the sections are
 * squeezed to fit and the box is outlined in red.
 */
export function VehicleScene({ id, sections, selectedKey, onSelect, basisLabel, className }: {
  id: VehicleId;
  sections: LoadSection[];
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  /** e.g. "weight": used in labels for screen readers. */
  basisLabel?: string;
  className?: string;
}) {
  const [x, y, w, h] = CARGO[id];
  const total = sections.reduce((s, r) => s + Math.max(0, r.share), 0);
  const over = total > 1;
  const scale = over ? 1 / total : 1;
  const pad = 3;
  // Lay out right to left (cab end first).
  let cursor = x + w - pad;
  const laid = sections.map((s, i) => {
    const sw = Math.max(0, s.share) * scale * (w - pad * 2);
    cursor -= sw;
    return { ...s, i, sx: cursor, sw };
  });
  const freeW = Math.max(0, cursor - (x + pad));
  const anySelected = selectedKey != null && sections.some((s) => s.key === selectedKey);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full h-auto", className)} role="img"
      aria-label={`${sections.length ? `${Math.round(total * 100)}% full by ${basisLabel ?? "capacity"}` : "Empty"}${over ? ", over the limit" : ""}`}>
      <ellipse cx={W / 2} cy={GROUND + 4} rx={W / 2 - 12} ry="5" className="fill-slate-200/70 dark:fill-white/5" />
      <Chassis id={id} />
      <rect x={x} y={y} width={w} height={h} rx="6" className={cn("fill-slate-50 dark:fill-white/5", over ? "stroke-rose-600 dark:stroke-rose-400" : "stroke-slate-500 dark:stroke-slate-400")} strokeWidth={over ? 2.5 : 1.75} />
      {freeW > 34 && (
        <text x={x + pad + freeW / 2} y={y + h / 2 + 4} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[12px] font-semibold">
          {freeW > 70 ? `${Math.round((1 - total) * 100)}% free` : "Free"}
        </text>
      )}
      {laid.map((s) => {
        const active = !anySelected || s.key === selectedKey;
        const pct = Math.round(s.share * 100);
        const interactive = !!onSelect;
        return (
          <g key={s.key}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? s.key === selectedKey : undefined}
            aria-label={`${s.label}: ${pct}% of ${basisLabel ?? "capacity"}`}
            onClick={interactive ? () => onSelect!(s.key) : undefined}
            onKeyDown={interactive ? onKeyActivate(() => onSelect!(s.key)) : undefined}
            className={cn(interactive && "cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-slate-900 dark:[&:focus-visible>rect]:stroke-white")}>
            <motion.rect
              initial={{ opacity: 0, scaleY: 0.6 }}
              animate={{ opacity: active ? 1 : 0.28, scaleY: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT, delay: s.i * 0.04 }}
              style={{ transformOrigin: `${s.sx + s.sw / 2}px ${y + h}px` }}
              x={s.sx + 1} y={y + pad} width={Math.max(0, s.sw - 2)} height={h - pad * 2} rx="4"
              className={SECTION_COLORS[s.i % SECTION_COLORS.length]} strokeWidth="2" stroke="transparent" />
            {s.sw > 30 && <text x={s.sx + 8} y={y + 20} className="fill-white text-[12px] font-black pointer-events-none">{pct}%</text>}
            {s.sw > 70 && h > 70 && (
              <text x={s.sx + 8} y={y + h - 10} className="fill-white/90 text-[11px] font-semibold pointer-events-none">
                {s.label.length > Math.floor(s.sw / 7) ? `${s.label.slice(0, Math.max(3, Math.floor(s.sw / 7) - 1))}…` : s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Small vehicle for pickers and cards. `pct` (0–100) fills the cargo area. */
export function VehicleIcon({ id, pct = 0, tone = "teal", className }: { id: VehicleId; pct?: number; tone?: "teal" | "amber" | "rose" | "none"; className?: string }) {
  const [x, y, w, h] = CARGO[id];
  const fw = (Math.max(0, Math.min(100, pct)) / 100) * (w - 6);
  const fill = tone === "amber" ? "fill-amber-500" : tone === "rose" ? "fill-rose-600 dark:fill-rose-400" : "fill-teal-600 dark:fill-teal-400";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full h-auto", className)} aria-hidden>
      <Chassis id={id} />
      <rect x={x} y={y} width={w} height={h} rx="6" className="fill-slate-50 dark:fill-white/5 stroke-slate-500 dark:stroke-slate-400" strokeWidth="2.5" />
      {tone !== "none" && fw > 0 && <rect x={x + w - 3 - fw} y={y + 3} width={fw} height={h - 6} rx="4" className={cn(fill, "opacity-90")} />}
    </svg>
  );
}

/** Which vehicle a shipment of this weight would usually go on (sample data only). */
export function vehicleForWeight(lb: number): VehicleId {
  return lb <= 150 ? "cargo-van" : lb <= 2000 ? "box-truck" : "trailer-53";
}
