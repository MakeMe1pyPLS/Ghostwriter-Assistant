// Light / dark switch. The icon morphs (sun rays retract into a moon) and the
// new theme spreads from the button in a circle where the browser supports it.
import { useId } from "react";
import { motion } from "framer-motion";
import { toggleTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, size = 40 }: { className?: string; size?: number }) {
  const theme = useTheme();
  const dark = theme === "dark";
  const maskId = `ciq-moon-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      data-testid="button-theme-toggle"
    >
      <motion.svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: dark ? -40 : 90 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        aria-hidden
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle r="9" fill="black" initial={false} animate={{ cx: dark ? 17 : 30, cy: dark ? 7 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} />
        </mask>
        <motion.circle cx="12" cy="12" fill="currentColor" stroke="none" mask={`url(#${maskId})`} initial={false} animate={{ r: dark ? 9 : 5 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} />
        <motion.g initial={false} animate={{ opacity: dark ? 0 : 1, scale: dark ? 0.5 : 1 }} transition={{ duration: 0.2 }} style={{ transformOrigin: "12px 12px" }}>
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
          <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
          <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
        </motion.g>
      </motion.svg>
    </button>
  );
}
