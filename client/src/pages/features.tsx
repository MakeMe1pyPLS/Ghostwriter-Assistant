import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { PlanVisual, AnalystVisual, ConsultVisual, BottleneckVisual, CollabVisual, KpiVisual, ExportVisual } from "@/components/marketing/FeatureVisuals";
import { CtaButton, GridBackdrop } from "@/components/marketing/primitives";
import { Reveal, EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";
import { KPI_COUNTS } from "@shared/kpi-stats";

// Only what ships today. Planned items live on the pricing page under "Coming soon".
const FEATURES = [
  {
    id: "plan", nav: "Growth plans", eyebrow: "Grow", title: "A growth plan, written for your business",
    desc: "The AI Analyst interviews you in about two minutes — goal, industry, team, challenges, partners — and writes a three-phase plan with a North Star metric.",
    points: ["Owners, due dates and status for every step", "Add steps to Google Calendar, Outlook or Apple Calendar", "Rebuild the plan any time; your own actions are kept"],
    href: "/plan", cta: "Open the Growth Plan", visual: <PlanVisual />,
  },
  {
    id: "analyst", nav: "AI Analyst", eyebrow: "Grow", title: "An analyst that knows your goal",
    desc: "Ask why a number moved or what to do next. Answers use your plan and your data, and end with a step you can take this week.",
    points: ["Runs on Claude, ChatGPT or Gemini — switches automatically if one is down", "A built-in analyst answers even with no engines connected", "Follows one shared method, so every engine gives consistent advice"],
    href: "/insights", cta: "Ask the analyst", visual: <AnalystVisual />,
  },
  {
    id: "consult", nav: "AI Consultant", eyebrow: "Decide", title: "A consultant for the big decisions",
    desc: "Run short sessions on your health, pricing, cash flow, growth, bottlenecks, partners, hiring or strategy. Each one gives findings, two or three options with honest trade-offs and a recommendation.",
    points: ["Turn the option you pick into actions with owners and due dates", "Real calculations on your numbers, even with no AI engine connected", "Consultants and agencies get a separate workspace and printable report for every client"],
    href: "/consult", cta: "Start a session", visual: <ConsultVisual />,
  },
  {
    id: "bottlenecks", nav: "Bottlenecks", eyebrow: "Spot & fix", title: "See what’s slowing you down",
    desc: "Bottlenecks are ranked by business impact, each with what happened, why it matters, the root cause and a recommended action.",
    points: ["Turn any fix into tracked actions in one click", "Discuss an issue with a partner in a linked Hub thread", "Step-by-step recommendations with expected outcomes"],
    href: "/bottlenecks", cta: "See bottlenecks", visual: <BottleneckVisual />,
  },
  {
    id: "collabs", nav: "Partner collabs", eyebrow: "Collaborate", title: "Fix it together with your partners",
    desc: "Set up a data collab with a supplier, carrier, distributor or agency: choose exactly which datasets and KPIs to share and how often you review them.",
    points: ["8 ready-made collab templates", "Save any collab as a preset for your next partner", "Send updates to Microsoft Teams, Google Chat and Slack"],
    href: "/collabs", cta: "Start a collab", visual: <CollabVisual />,
  },
  {
    id: "kpis", nav: "KPI Library", eyebrow: "Measure", title: "The right KPIs for every industry",
    desc: `${KPI_COUNTS.kpis} metrics across ${KPI_COUNTS.industries} industries, from corner shops to enterprises. Each one says how it’s measured and which direction is better.`,
    points: [`${KPI_COUNTS.aiKpis} AI & automation metrics: accuracy, downtime avoided, adoption and ROI`, "Search by name, formula or industry", "Track the KPIs you care about and set any one as your plan’s North Star"],
    href: "/kpis?category=AI", cta: "See the AI & automation KPIs", visual: <KpiVisual />,
  },
  {
    id: "data", nav: "Import & export", eyebrow: "Data", title: "Bring your data. Take it anywhere.",
    desc: "Import CSV, Excel and JSON in the browser — the Excel importer finds the right sheet and header row for you. Export dashboards and data whenever you need them.",
    points: ["Export the dashboard you arranged to Excel or Google Sheets, with KPI numbers that update from the data", "Power BI starter pack: data tables, card positions and a matching theme", "Import from public Google Sheets and JSON APIs"],
    href: "/data", cta: "Import data", visual: <ExportVisual />,
  },
];

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="relative isolate overflow-hidden px-4 md:px-6 pt-14 md:pt-24 pb-10 md:pb-16">
        <GridBackdrop />
        <div className="max-w-3xl mx-auto text-center">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-semibold text-primary">Features</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: EASE_OUT }}
            className="mt-2 text-[2.6rem] leading-[1.04] md:text-6xl font-black tracking-[-0.045em] text-slate-900 text-balance">
            Everything between your goal and the fix.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">
            Plan, spot bottlenecks, fix them with your partners and watch the numbers move — in one workspace.
          </motion.p>
          {/* Jump links */}
          <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Jump to feature">
            {FEATURES.map((f) => (
              <a key={f.id} href={`#${f.id}`} className="h-9 px-3.5 inline-flex items-center rounded-xl border border-slate-200 bg-white/70 dark:bg-slate-900/50 text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors">
                {f.nav}
              </a>
            ))}
          </motion.nav>
        </div>
      </section>

      <div className="px-4 md:px-6 pb-24 space-y-20 md:space-y-32 mt-10">
        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-14 items-center scroll-mt-28 [&>*]:min-w-0">
            <Reveal className={cn(i % 2 === 1 && "md:order-2")}>
              <p className="text-[13px] font-semibold text-primary">{f.eyebrow}</p>
              <h2 className="mt-2 text-3xl md:text-[2.6rem] leading-[1.08] font-black tracking-[-0.04em] text-slate-900 text-balance">{f.title}</h2>
              <p className="mt-4 text-lg text-slate-500 leading-relaxed">{f.desc}</p>
              <ul className="mt-6 space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" strokeWidth={3} /></span>{p}
                  </li>
                ))}
              </ul>
              <Link href={f.href} className="group mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary">
                {f.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
            <Reveal delay={0.1} className={cn(i % 2 === 1 && "md:order-1")}>
              <div className="relative rounded-[28px] border border-slate-200 bg-white/80 dark:bg-slate-900/40 p-6 sm:p-10 overflow-hidden shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
                <div aria-hidden className="absolute inset-0 [background-image:radial-gradient(rgba(100,116,139,0.18)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]" />
                <div aria-hidden className={cn("absolute w-72 h-72 rounded-full blur-3xl opacity-60", i % 2 ? "-left-20 -bottom-24 bg-cyan-400/20" : "-right-20 -top-24 bg-teal-400/25")} />
                <div className="relative min-h-[200px] sm:min-h-[240px] flex flex-col justify-center">{f.visual}</div>
              </div>
            </Reveal>
          </section>
        ))}
      </div>

      <section className="px-4 md:px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-[-0.045em] text-slate-900 text-balance">See it with your own business.</h2>
          <p className="mt-4 text-lg text-slate-500">Answer eight questions and get your plan in about two minutes.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <CtaButton href="/sign-up">Start free trial</CtaButton>
            <CtaButton href="/demo" variant="ghost">Explore the live demo</CtaButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
