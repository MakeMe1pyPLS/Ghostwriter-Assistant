// Shared building blocks for the marketing pages.
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Counts up once when scrolled into view. */
export function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, reduce, to, duration]);
  return <span ref={ref}>{v.toLocaleString()}</span>;
}

export function SectionHeading({ eyebrow, title, sub, align = "center" }: { eyebrow?: string; title: string; sub?: string; align?: "center" | "left" }) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "")}>
      {eyebrow && <p className="text-[13px] font-semibold text-primary">{eyebrow}</p>}
      <h2 className="mt-2 text-[2.1rem] leading-[1.08] md:text-5xl font-black tracking-[-0.04em] text-slate-900 text-balance">{title}</h2>
      {sub && <p className="mt-4 text-lg text-slate-500 leading-relaxed text-pretty">{sub}</p>}
    </Reveal>
  );
}

/** Primary / ghost call-to-action with a light sweep on hover. */
export function CtaButton({ href, children, variant = "primary", tone = "default", testId }: {
  href: string; children: React.ReactNode; variant?: "primary" | "ghost"; tone?: "default" | "onDark"; testId?: string;
}) {
  const primary = variant === "primary";
  return (
    <Link href={href} data-testid={testId} className={cn(
      "group relative inline-flex items-center justify-center gap-2 h-12 sm:h-[52px] px-6 sm:px-7 rounded-2xl text-[15px] font-semibold w-full sm:w-auto overflow-hidden transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
      primary && tone === "default" && "bg-slate-900 text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.6)] hover:shadow-[0_14px_40px_-12px_rgba(13,148,136,0.7)] dark:bg-teal-400 dark:text-slate-950",
      primary && tone === "onDark" && "bg-white text-slate-950 hover:bg-teal-50 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-50",
      !primary && tone === "default" && "border border-slate-200 bg-white/70 dark:bg-slate-900/50 backdrop-blur text-slate-800 hover:border-slate-300",
      !primary && tone === "onDark" && "border border-white/20 text-white hover:bg-white/10",
    )}>
      {primary && <span aria-hidden className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-0 group-hover:translate-x-[320%] transition-transform duration-700 ease-out" />}
      <span className="relative">{children}</span>
      <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

/** Hero backdrop: a faint grid fading out from the centre, plus a soft aurora. */
export function GridBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_55%_at_50%_0%,#000_40%,transparent_100%)]" />
      <motion.div
        className="absolute left-1/2 top-[-12%] -translate-x-1/2 w-[1100px] max-w-[160vw] h-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.35),rgba(14,165,233,0.12)_55%,transparent)] blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
