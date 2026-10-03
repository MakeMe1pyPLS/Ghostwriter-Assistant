// ChainInsideIQ logo: two interlocking chain links — you and your partner —
// on an ink tile. The teal link is "the fix"; the weave shows they're joined.
// One source for every placement (sidebar, headers, intro, favicon).
import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = `ciq-g-${uid}`, t = `ciq-t-${uid}`, c = `ciq-c-${uid}`, s = `ciq-s-${uid}`, m = `ciq-m-${uid}`;
  const draw = animated
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 } }
    : {};
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)} role="img" aria-label="ChainInsideIQ">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#13213A" />
          <stop offset="1" stopColor="#070C16" />
        </linearGradient>
        <linearGradient id={t} x1="12" y1="8" x2="28" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#99F6E4" />
          <stop offset="0.55" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
        <radialGradient id={s} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#2DD4BF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2DD4BF" stopOpacity="0" />
        </radialGradient>
        <clipPath id={c}>
          <rect x="13.4" y="7.4" width="5.2" height="7.2" />
        </clipPath>
        {/* Cuts a gap in the teal link where the white one passes over it */}
        <mask id={m} maskUnits="userSpaceOnUse" x="-8" y="-8" width="48" height="48">
          <rect x="-8" y="-8" width="48" height="48" fill="#fff" />
          <rect x="4.6" y="11" width="14.2" height="10" rx="5" fill="none" stroke="#000" strokeWidth="6" clipPath={`url(#${c})`} />
        </mask>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${g})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${s})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="white" strokeOpacity="0.08" />
      <g transform="rotate(-38 16 16)" fill="none" strokeWidth="3.1" strokeLinecap="round">
        {/* Left link (you) */}
        <motion.rect x="4.6" y="11" width="14.2" height="10" rx="5" stroke="#F8FAFC" {...draw} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
        {/* Right link (your partner / the fix) */}
        <motion.rect x="13.2" y="11" width="14.2" height="10" rx="5" stroke={`url(#${t})`} mask={`url(#${m})`} {...draw} transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} />
        {/* Weave: the left link passes back over the right one at the top crossing */}
        <motion.rect x="4.6" y="11" width="14.2" height="10" rx="5" stroke="#F8FAFC" clipPath={`url(#${c})`} {...(animated ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : {})} transition={{ delay: 0.6, duration: 0.2 }} />
      </g>
    </svg>
  );
}

/** Mark + wordmark. `tone="light"` for use on dark backgrounds in light mode (e.g. footer). */
export function Logo({ size = 36, className, tone = "auto", compact = false }: { size?: number; className?: string; tone?: "auto" | "light"; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 min-w-0", className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className={cn("font-black tracking-[-0.04em] leading-none truncate", tone === "light" ? "text-white" : "text-slate-900")} style={{ fontSize: Math.round(size * 0.5) }}>
          ChainInside<span className="text-primary">IQ</span>
        </span>
      )}
    </span>
  );
}
