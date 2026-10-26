// Everything below the homepage hero. Loaded as its own chunk and rendered after
// the hero, so the first paint (and the work right after it) stays small.
import { Link } from "wouter";
import { useRef, useState } from "react";
import {
  ArrowRight, Check, Target, Search, Handshake, MessagesSquare, Sparkles, Wand2, Wrench,
  Store, Users, Building2, Briefcase,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Reveal, EASE_OUT } from "@/components/motion";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { PlanVisual, AnalystVisual, BottleneckVisual, CollabVisual, KpiVisual, ExportVisual } from "@/components/marketing/FeatureVisuals";
import { CountUp, SectionHeading, CtaButton, GridBackdrop } from "@/components/marketing/primitives";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PRICING_TIERS } from "@/lib/pricing";
import { KPI_COUNTS } from "@shared/kpi-stats";
import { cn } from "@/lib/utils";


export default function HomeBelowFold({ isAuthed, lowest }: { isAuthed: boolean; lowest: number }) {
  return (
    <>
      {/* ───────────── PROOF BAND (real product numbers only) ───────────── */}
      <section className="px-4 md:px-6 py-12 border-y border-slate-200/70 bg-white/60 dark:bg-transparent">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: KPI_COUNTS.kpis, suffix: "", label: "KPIs with formulas" },
            { n: KPI_COUNTS.industries, suffix: "", label: "industries covered" },
            { n: 3, suffix: "", label: "AI engines, your choice" },
            { n: 2, suffix: " min", label: "from goal to plan" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 tabular-nums"><CountUp to={s.n} />{s.suffix}</p>
              <p className="mt-1 text-[13px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-[13px] text-slate-400">Built for retail &amp; e-commerce, restaurants, logistics, manufacturing, health, services and SaaS</p>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <HowItWorks />

      {/* ───────────── FEATURE BENTO ───────────── */}
      <section className="px-4 md:px-6 py-24 md:py-32" id="features">
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="What you get" title="An analyst, a plan and your partners — in one place" sub="Every feature serves one loop: set the goal, spot the bottleneck, fix it together, watch the numbers move." />
          <div className="mt-14 grid md:grid-cols-6 gap-4 [&>*]:min-w-0">
            <Bento className="md:col-span-4" title="A growth plan that writes itself" desc="Answer 8 quick questions. Get phases, owners, due dates and one North Star metric — rebuilt whenever your goal changes." visual={<PlanVisual />} />
            <Bento className="md:col-span-2" title="Bottlenecks, ranked" desc="See what slows you down, ordered by impact, with the root cause." visual={<BottleneckVisual />} />
            <Bento className="md:col-span-3" title="Ask your numbers anything" desc="The analyst knows your goal and your data. Pick Claude, ChatGPT or Gemini." visual={<AnalystVisual />} />
            <Bento className="md:col-span-3" title="Fix it with your partners" desc="Share just the numbers you both depend on, discuss in the Hub, track every fix to done." visual={<CollabVisual />} />
            <Bento className="md:col-span-3" title="The right KPIs for your industry" desc={`${KPI_COUNTS.kpis} metrics across ${KPI_COUNTS.industries} industries, including ${KPI_COUNTS.aiKpis} for tracking AI and automation. Each has its formula and which way is better.`} visual={<KpiVisual />} />
            <Bento className="md:col-span-3" title="Bring your data. Take it anywhere." desc="Import CSV, Excel and JSON. Export your dashboard to Excel or Google Sheets, or as a Power BI starter pack." visual={<ExportVisual />} />
          </div>
        </div>
      </section>

      {/* ───────────── WHO IT'S FOR ───────────── */}
      <Audiences />

      {/* ───────────── DASHBOARDS: three ways in ───────────── */}
      <section className="px-4 md:px-6 py-24 md:py-28">
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="Dashboards" title="Bring your dashboards, or start fresh" sub="Already tracking numbers in Excel or Power BI? Enhance them. Starting out? Let the AI build one for your industry." />
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: "Generate for me", href: "/generate", desc: "Answer a few questions about your business and tools. The AI builds a dashboard for you." },
              { icon: Wand2, title: "Enhance my dashboard", href: "/enhance", desc: "Upload what you use today. Get clearer KPIs and charts, then export it back." },
              { icon: Wrench, title: "Build it myself", href: "/builder", desc: "Drag, drop and size widgets. Full control over every card." },
            ].map((m, i) => (
              <Reveal key={m.title} delay={i * 0.06} className="h-full">
                <Link href={m.href} className="group relative block h-full rounded-3xl border border-slate-200 bg-white dark:bg-slate-900/40 p-7 overflow-hidden transition-colors hover:border-primary/40" data-testid={`card-mode-${i}`}>
                  <span aria-hidden className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative w-11 h-11 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center mb-5 group-hover:-rotate-6 group-hover:scale-105 transition-transform duration-300"><m.icon className="w-5 h-5" /></span>
                  <h3 className="relative text-lg font-bold text-slate-900">{m.title}</h3>
                  <p className="relative mt-2 text-[14.5px] text-slate-500 leading-relaxed">{m.desc}</p>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary">Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── WORKS WITH ───────────── */}
      <section className="relative isolate overflow-hidden px-4 md:px-6 py-24 md:py-28 bg-slate-950 text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_80%_0%,rgba(45,212,191,0.22),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(14,165,233,0.14),transparent_70%)]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="text-[13px] font-semibold text-teal-300">Works with your tools</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-[-0.04em] text-balance">Keep the tools you already use.</h2>
            <p className="mt-5 text-lg text-white/70 leading-relaxed">Export to Excel and CSV, get a Power BI starter pack, send updates to Microsoft Teams, Google Chat and Slack, and put due dates in Outlook or Google Calendar.</p>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["Microsoft Excel", "Microsoft Teams", "Outlook", "Google Sheets", "Google Chat", "Google Calendar", "Power BI", "Slack", "CSV / JSON"].map((t, i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, ease: EASE_OUT }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-[14px] font-semibold text-white/90 hover:bg-white/[0.08] hover:border-teal-300/30 transition-colors">
                {t}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PRICING TEASER ───────────── */}
      <section className="px-4 md:px-6 py-24 md:py-28">
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="Pricing" title="Priced for the business you run" sub={`From $${lowest}/month billed yearly. Every plan starts with a 14-day free trial.`} />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING_TIERS.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.05} className="h-full">
                <Link href="/pricing" className={cn("group block h-full rounded-3xl border p-6 transition-colors",
                  t.highlighted ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent" : "border-slate-200 bg-white dark:bg-slate-900/40 hover:border-slate-300")}>
                  <p className="text-[14px] font-bold text-slate-900">{t.name}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t.priceAnnual ? `$${t.priceAnnual}` : "Custom"}<span className="text-[13px] font-medium text-slate-400">{t.priceAnnual ? "/mo" : ""}</span></p>
                  <p className="mt-1 text-[13px] text-slate-500">{t.bestFor}</p>
                  <p className="mt-4 text-[13px] text-slate-600">{t.aiAnswers ? `${t.aiAnswers.toLocaleString()} AI answers / month` : "Volume AI and setup help"}</p>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary hover:gap-2.5 transition-all">Compare plans <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="px-4 md:px-6 pb-24 md:pb-28">
        <div className="max-w-3xl mx-auto">
          <SectionHeading title="Questions owners ask" />
          <Accordion type="single" collapsible className="mt-10">
            {[
              { q: "Do I need clean data to start?", a: "No. The AI interview builds your plan from your goal alone. Add a CSV or Excel file whenever you're ready and the analyst starts using your real numbers." },
              { q: "Which AI does it use?", a: "Claude, ChatGPT or Gemini — your choice on Professional and above. If one is unavailable, it switches automatically, and a built-in analyst answers even with no engines connected." },
              { q: "Can my partners see my data?", a: "Only what you choose to share in a collab. Each collab lists exactly which datasets and KPIs are shared. Today partners are invited by email; shared live workspaces are coming soon." },
              { q: "Does it replace Excel or Power BI?", a: "No — it works alongside them. Enhance dashboards you already have and export results to Excel, CSV and JSON for your own systems." },
              { q: "What happens after the free trial?", a: "Pick the plan that fits. Yearly billing saves about 20%. No credit card is needed to start." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="border-slate-200">
                <AccordionTrigger className="text-left text-[16px] font-semibold text-slate-900 hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-slate-500 leading-relaxed pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="px-4 md:px-6 pb-24">
        <div className="relative isolate overflow-hidden max-w-6xl mx-auto rounded-[32px] bg-slate-950 ring-1 ring-white/10 px-6 py-16 md:py-24 text-center text-white">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(45,212,191,0.45),transparent_70%)]" />
          <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]" />
          <h2 className="text-4xl md:text-6xl font-black tracking-[-0.045em] text-balance">Your growth plan is two minutes away.</h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">{isAuthed ? "Jump back into your plan, your partners and your AI analyst." : "The AI Analyst asks about your goal and builds the plan. Free for 14 days."}</p>
          <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
            {isAuthed ? (
              <>
                <CtaButton href="/plan" tone="onDark" testId="button-cta-open-dashboard">Open my Growth Plan</CtaButton>
                <CtaButton href="/insights" variant="ghost" tone="onDark" testId="button-cta-open-ai-analyst">Open AI Analyst</CtaButton>
              </>
            ) : (
              <>
                <CtaButton href="/sign-up" tone="onDark" testId="button-cta-start-free-trial">Start free trial</CtaButton>
                <CtaButton href="/contact" variant="ghost" tone="onDark" testId="button-cta-book-demo">Book a demo</CtaButton>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}


function Bento({ title, desc, visual, className }: { title: string; desc: string; visual: React.ReactNode; className?: string }) {
  return (
    <Reveal className={cn("h-full", className)}>
      <div className="group relative h-full rounded-3xl border border-slate-200 bg-white dark:bg-slate-900/40 p-6 sm:p-7 overflow-hidden flex flex-col transition-colors hover:border-slate-300">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(45,212,191,0.16),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative min-h-[150px] mb-6">{visual}</div>
        <h3 className="relative text-[17px] font-bold text-slate-900">{title}</h3>
        <p className="relative mt-1.5 text-[14.5px] text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const steps = [
    { title: "Set your goal", desc: "Answer 8 quick questions. The analyst writes a step-by-step plan with targets for your industry.", icon: Target },
    { title: "Spot the bottleneck", desc: "Import your data. See what’s slowing you down, ranked by impact, with the root cause.", icon: Search },
    { title: "Fix it together", desc: "Share data with suppliers, carriers or your agency and turn every fix into tracked actions.", icon: Handshake },
    { title: "Watch it move", desc: "Discuss in the Hub or Teams and Google Chat. Track your North Star as the numbers improve.", icon: MessagesSquare },
  ];
  return (
    <section className="px-4 md:px-6 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="How it works" title="From goal to fixed in four steps" />
        <div ref={ref} className="relative mt-16 grid md:grid-cols-4 gap-8 md:gap-6">
          {/* Progress rail that fills as you scroll */}
          <div aria-hidden className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-slate-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400" style={{ width: fill }} />
          </div>
          <div aria-hidden className="md:hidden absolute top-6 bottom-6 left-6 w-[2px] bg-slate-200 rounded-full overflow-hidden">
            <motion.div className="w-full bg-gradient-to-b from-teal-500 to-cyan-400" style={{ height: fill }} />
          </div>
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08} className="relative pl-16 md:pl-0">
              <span className="absolute md:relative left-0 top-0 w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 shadow-sm flex items-center justify-center text-primary">
                <s.icon className="w-5 h-5" />
              </span>
              <p className="md:mt-6 text-[12px] font-semibold text-slate-400">Step {i + 1}</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-[15px] text-slate-500 leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audiences() {
  const tabs = [
    { id: "owners", label: "Owners", icon: Store, title: "Local & small businesses", goal: "“Cut food cost to 32% by summer.”",
      steps: ["Track food cost weekly from your supplier invoices", "Fix the top 3 waste items first", "Review prices with your distributor rep"],
      desc: "A plain-language plan, the five numbers that matter and one next step every week. No analyst needed." },
    { id: "teams", label: "Growing teams", icon: Users, title: "Teams with key partners", goal: "“Ship 95% of orders on time.”",
      steps: ["Share orders and stock with your 3PL", "Agree a 20-minute weekly scorecard review", "Give every fix one owner and a date"],
      desc: "Owners for every action, shared KPIs with partners and one place to talk through fixes." },
    { id: "enterprise", label: "Enterprises", icon: Building2, title: "Multi-site operations", goal: "“Reduce cash-to-cash cycle by 8 days.”",
      steps: ["Rank cross-company bottlenecks by impact", "Reuse collab presets for each supplier", "Export results to Power BI and Excel"],
      desc: "Cross-company bottleneck detection, collab presets per partner and exports into the systems you already run." },
    { id: "consultants", label: "Consultants", icon: Briefcase, title: "Consultants & agencies", goal: "“Show this client results in 30 days.”",
      steps: ["Onboard the client with the 2-minute interview", "Share their numbers safely in a collab", "Track every recommendation to done"],
      desc: "Run client engagements with a real plan, shared data and trackable recommendations." },
  ];
  const [active, setActive] = useState(tabs[0].id);
  const t = tabs.find((x) => x.id === active)!;
  return (
    <section className="px-4 md:px-6 py-24 md:py-28 bg-white/60 dark:bg-transparent border-y border-slate-200/70">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="Who it’s for" title="A consultant and analyst for every size of business" />
        <div className="mt-10 flex justify-center">
          <div className="toolbar rounded-2xl bg-slate-100 p-1 max-w-full" role="tablist" aria-label="Who it's for">
            {tabs.map((x) => (
              <button key={x.id} role="tab" aria-selected={active === x.id} onClick={() => setActive(x.id)}
                className={cn("relative inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[14px] font-semibold transition-colors", active === x.id ? "text-slate-900" : "text-slate-500 hover:text-slate-800")}>
                {active === x.id && <motion.span layoutId="aud-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <x.icon className="relative w-4 h-4" /><span className="relative">{x.label}</span>
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}
            className="mt-10 grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h3>
              <p className="mt-4 text-lg text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900/40 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
              <p className="text-[12px] font-semibold text-slate-400">Goal</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{t.goal}</p>
              <p className="mt-5 text-[12px] font-semibold text-slate-400">First steps in the plan</p>
              <ol className="mt-2 space-y-2.5">
                {t.steps.map((s, i) => (
                  <motion.li key={s} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08, ease: EASE_OUT }}
                    className="flex items-start gap-3 text-[15px] text-slate-700">
                    <span className="mt-0.5 w-6 h-6 rounded-lg bg-primary/10 text-primary text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{s}
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
