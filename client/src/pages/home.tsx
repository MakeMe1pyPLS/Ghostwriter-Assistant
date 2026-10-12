import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Link } from "wouter";
import { lazy, Suspense, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/components/motion";
import { IntroSplash } from "@/components/IntroSplash";
import { consumeShell, useIntroReady } from "@/lib/intro-gate";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { HeroProduct } from "@/components/marketing/HeroProduct";
import { CtaButton, GridBackdrop } from "@/components/marketing/primitives";
import { PRICING_TIERS } from "@/lib/pricing";

const HEADLINE = ["Find", "the", "bottleneck."];
const HomeBelowFold = lazy(() => import("@/components/marketing/HomeBelowFold"));

export default function HomePage() {
  const currentUser = useDashboardStore((s) => s.currentUser);
  const isAuthed = !!currentUser;
  // The hero plays its entrance as the intro opens (straight away when there's no intro).
  const go = useIntroReady();
  const play = <T,>(v: T) => (go ? v : undefined);
  // The static hero from index.html is already on screen: keep it still, don't re-animate it.
  const [fromShell] = useState(consumeShell);
  const ini = <T,>(v: T) => (fromShell ? false : v);
  const lowest = Math.min(...PRICING_TIERS.filter((t) => t.priceAnnual).map((t) => t.priceAnnual!));

  return (
    <MarketingLayout>
      <IntroSplash />

      {/* ───────────── HERO ───────────── */}
      <section className="relative isolate overflow-hidden px-4 md:px-6 pt-14 sm:pt-20 md:pt-28 pb-20 md:pb-28">
        <GridBackdrop />
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={ini({ opacity: 0, y: 8 })} animate={play({ opacity: 1, y: 0 })} transition={{ duration: 0.5, ease: EASE_OUT }}>
            <Link href="/pricing" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 dark:bg-slate-900/60 backdrop-blur px-1.5 py-1 pr-3.5 text-[13px] text-slate-600 hover:border-primary/40 transition-colors">
              <span className="rounded-full bg-primary text-white text-[11px] font-bold px-2 py-0.5">New</span>
              Plans from ${lowest}/month · AI on Claude, ChatGPT &amp; Gemini
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-primary transition" />
            </Link>
          </motion.div>

          <h1 className="mt-7 font-black tracking-[-0.045em] text-slate-900 text-[2.75rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[5.4rem] text-balance">
            <span className="block">
              {HEADLINE.map((w, i) => (
                <motion.span key={w} className="inline-block mr-[0.22em]"
                  initial={ini({ opacity: 0, y: 24, filter: "blur(10px)" })} animate={play({ opacity: 1, y: 0, filter: "blur(0px)" })}
                  transition={{ duration: 0.7, delay: 0.08 + i * 0.08, ease: EASE_OUT }}>{w}</motion.span>
              ))}
            </span>
            <motion.span className="block bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-300 dark:via-teal-400 dark:to-cyan-300 bg-clip-text text-transparent pb-1"
              initial={ini({ opacity: 0, y: 24, filter: "blur(10px)" })} animate={play({ opacity: 1, y: 0, filter: "blur(0px)" })}
              transition={{ duration: 0.8, delay: 0.36, ease: EASE_OUT }}>
              Fix it together.
            </motion.span>
          </h1>

          <motion.p initial={ini({ opacity: 0, y: 10 })} animate={play({ opacity: 1, y: 0 })} transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT }}
            className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed text-pretty">
            Your AI business analyst. Tell it your goal and get a step-by-step plan, see exactly what’s slowing you down, and fix it with the suppliers, carriers and partners you work with.
          </motion.p>

          <motion.div initial={ini({ opacity: 0, y: 10 })} animate={play({ opacity: 1, y: 0 })} transition={{ duration: 0.6, delay: 0.6, ease: EASE_OUT }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthed ? (
              <>
                <CtaButton href="/plan" testId="button-open-dashboard">Open my Growth Plan</CtaButton>
                <CtaButton href="/insights" variant="ghost" testId="button-open-ai-analyst">Open AI Analyst</CtaButton>
              </>
            ) : (
              <>
                <CtaButton href="/sign-up" testId="button-start-free-trial">Start free — build my plan</CtaButton>
                <CtaButton href="/demo" variant="ghost" testId="button-book-demo">Explore the live demo</CtaButton>
              </>
            )}
          </motion.div>
          <motion.ul initial={ini({ opacity: 0 })} animate={play({ opacity: 1 })} transition={{ delay: 0.8 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-slate-500">
            {(isAuthed ? ["Welcome back", "Your plan and actions are waiting"] : ["Your plan in 2 minutes", "14-day free trial", "No credit card"]).map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" />{t}</li>
            ))}
          </motion.ul>
        </div>

        <motion.div className="mt-14 md:mt-20" initial={ini({ opacity: 0, y: 40, scale: 0.98 })} animate={play({ opacity: 1, y: 0, scale: 1 })} transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT }}>
          <HeroProduct />
        </motion.div>
      </section>

      <Suspense fallback={<div className="min-h-[120vh]" aria-hidden />}>
        <HomeBelowFold isAuthed={isAuthed} lowest={lowest} />
      </Suspense>
    </MarketingLayout>
  );
}
