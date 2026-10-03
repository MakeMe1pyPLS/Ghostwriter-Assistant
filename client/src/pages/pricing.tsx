import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useSearch } from "wouter";
import { Check, ArrowRight, Sparkles, Loader2, Mail, Clock, Minus, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, animate } from "framer-motion";
import { PRICING_TIERS, type PricingTier } from "@/lib/pricing";
import { GridBackdrop, SectionHeading } from "@/components/marketing/primitives";
import { Reveal, EASE_OUT } from "@/components/motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";

function AnimatedPrice({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.5, ease: EASE_OUT, onUpdate: (x) => setV(Math.round(x)) });
    prev.current = value;
    return () => c.stop();
  }, [value]);
  return <span className="tabular-nums">${v}</span>;
}

function PricingCard({ tier, billing, onCheckout, checkoutLoading, recommended }: {
  tier: PricingTier; billing: Billing; onCheckout: () => void; checkoutLoading: boolean; recommended?: boolean;
}) {
  const isEnterprise = tier.id === "enterprise";
  const price = billing === "yearly" ? tier.priceAnnual : tier.price;
  const featured = recommended || tier.highlighted;
  const maxAi = 3000;

  return (
    <motion.div
      layout
      className={cn(
        "relative flex flex-col rounded-[28px] p-6 md:p-7 border transition-colors duration-300 h-full",
        recommended
          ? "border-amber-400 bg-white dark:bg-slate-900/60 shadow-[0_30px_80px_-30px_rgba(245,158,11,0.45)] ring-1 ring-amber-300/60"
          : tier.highlighted
            ? "border-primary/60 bg-white dark:bg-slate-900/60 shadow-[0_30px_80px_-30px_rgba(13,148,136,0.45)]"
            : "border-slate-200 bg-white/80 dark:bg-slate-900/30 hover:border-slate-300",
      )}
      data-testid={`pricing-card-${tier.id}`}
    >
      {(recommended || tier.badge) && (
        <div className={cn("absolute -top-3 left-6 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm",
          recommended ? "bg-amber-500 text-white" : "bg-primary text-white")}>
          <Sparkles className="w-3 h-3" /> {recommended ? "Recommended for you" : tier.badge}
        </div>
      )}

      <div>
        <h3 className="text-[17px] font-bold text-slate-900">{tier.name}</h3>
        <p className="text-[13.5px] text-slate-500 mt-1 leading-relaxed min-h-[40px]">{tier.description}</p>
      </div>

      <div className="mt-5 flex items-end gap-1.5 min-h-[56px]">
        {price != null ? (
          <>
            <span className="text-5xl font-black text-slate-900 tracking-[-0.04em] leading-none"><AnimatedPrice value={price} /></span>
            <span className="text-slate-400 font-medium mb-1 text-[14px]">/month</span>
          </>
        ) : (
          <span className="text-4xl font-black text-slate-900 tracking-[-0.04em] leading-none">Custom</span>
        )}
      </div>
      <p className="mt-1.5 text-[12.5px] text-slate-400 min-h-[18px]">
        {price != null ? (billing === "yearly" ? `$${(price * 12).toLocaleString()} billed yearly · or $${tier.price}/mo monthly` : `or $${tier.priceAnnual}/mo billed yearly`) : "Volume pricing for locations and business units"}
      </p>

      {/* AI allowance */}
      <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-3">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="font-semibold text-slate-700">AI answers</span>
          <span className="font-bold text-slate-900 tabular-nums">{tier.aiAnswers ? `${tier.aiAnswers.toLocaleString()} / mo` : "Custom"}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
            initial={{ width: 0 }} whileInView={{ width: `${tier.aiAnswers ? Math.max(8, (tier.aiAnswers / maxAi) * 100) : 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE_OUT }} />
        </div>
      </div>

      <div className="mt-5">
        {isEnterprise ? (
          <Link href="/contact">
            <Button variant="outline" className="w-full h-12 rounded-xl font-semibold text-[14px]" data-testid={`button-cta-${tier.id}`}>
              <Mail className="w-4 h-4" /> {tier.cta}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onCheckout}
            disabled={checkoutLoading}
            variant={featured ? "default" : "outline"}
            className={cn("w-full h-12 rounded-xl font-semibold text-[14px]",
              featured && "bg-slate-900 text-white hover:bg-slate-800 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.6)]")}
            data-testid={`button-cta-${tier.id}`}
          >
            {checkoutLoading ? <>Starting <Loader2 className="w-4 h-4 animate-spin" /></> : <>Start free trial <ArrowRight className="w-4 h-4" /></>}
          </Button>
        )}
        {tier.trial && <p className="mt-2 text-center text-[12px] text-slate-400">{tier.trial} · no credit card</p>}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 flex-1">
        <div className="space-y-2.5">
          {tier.features.map((feature, i) => {
            const isHeader = feature.endsWith(":");
            return isHeader ? (
              <p key={i} className="text-[12.5px] font-semibold text-primary pt-1">{feature}</p>
            ) : (
              <div key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-[13.5px] leading-snug text-slate-600">{feature}</span>
              </div>
            );
          })}
        </div>
        {tier.comingSoon && tier.comingSoon.length > 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-slate-200" data-testid={`coming-soon-${tier.id}`}>
            <p className="text-[12px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Coming soon</p>
            <div className="space-y-2">
              {tier.comingSoon.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full border border-dashed border-slate-300 shrink-0 mt-0.5" aria-hidden />
                  <span className="text-[13px] leading-snug text-slate-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Plan finder: three taps → the plan that fits.
const TEAM = [{ v: 0, l: "Just me" }, { v: 1, l: "2–10" }, { v: 2, l: "11–50" }, { v: 3, l: "50+" }];
const PARTNERS = [{ v: 0, l: "None yet" }, { v: 1, l: "1–2" }, { v: 2, l: "3 or more" }];
const USAGE = [{ v: 0, l: "A few times a week" }, { v: 1, l: "Every day" }, { v: 2, l: "All day, across teams" }];

function recommend(team: number, partners: number, usage: number): string {
  const score = team + partners + usage;
  if (team === 3) return "enterprise";
  if (score >= 5 || partners === 2 && usage >= 1) return "business";
  if (score >= 2 || partners >= 1) return "professional";
  return "starter";
}

function PlanFinder({ onPick }: { onPick: (id: string) => void }) {
  const [team, setTeam] = useState<number | null>(null);
  const [partners, setPartners] = useState<number | null>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const ready = team !== null && partners !== null && usage !== null;
  const pick = ready ? recommend(team!, partners!, usage!) : null;
  const tier = PRICING_TIERS.find((t) => t.id === pick);

  useEffect(() => { if (pick) onPick(pick); }, [pick, onPick]);

  const Row = ({ label, opts, value, set }: { label: string; opts: { v: number; l: string }[]; value: number | null; set: (v: number) => void }) => (
    <div>
      <p className="text-[13px] font-semibold text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button key={o.v} onClick={() => set(o.v)} aria-pressed={value === o.v}
            className={cn("h-10 px-4 rounded-xl border text-[14px] font-semibold transition-all active:scale-[0.97]",
              value === o.v ? "bg-slate-900 text-white border-slate-900 dark:bg-teal-400 dark:text-slate-950 dark:border-teal-400" : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white dark:bg-slate-900/40")}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/80 dark:bg-slate-900/40 backdrop-blur p-6 md:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Wand2 className="w-4 h-4" /></span>
          <p className="text-[16px] font-bold text-slate-900">Find my plan in three taps</p>
        </div>
        <Row label="How big is your team?" opts={TEAM} value={team} set={setTeam} />
        <Row label="How many partners do you share numbers with?" opts={PARTNERS} value={partners} set={setPartners} />
        <Row label="How often will you ask the AI analyst?" opts={USAGE} value={usage} set={setUsage} />
      </div>
      <div className="relative min-h-[180px] rounded-3xl bg-slate-950 text-white p-6 overflow-hidden flex flex-col justify-center">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgba(45,212,191,0.35),transparent_70%)]" />
        <AnimatePresence mode="wait">
          {tier ? (
            <motion.div key={tier.id} className="relative" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
              <p className="text-[13px] text-teal-300 font-semibold">Your best fit</p>
              <p className="mt-1 text-3xl font-black tracking-tight">{tier.name}</p>
              <p className="mt-1 text-[14px] text-white/70">{tier.bestFor}{tier.aiAnswers ? ` · ${tier.aiAnswers.toLocaleString()} AI answers/mo` : ""}</p>
              <a href={`#plan-${tier.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white hover:gap-2.5 transition-all">See the plan <ArrowRight className="w-4 h-4" /></a>
            </motion.div>
          ) : (
            <motion.div key="empty" className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[13px] text-teal-300 font-semibold">Your best fit</p>
              <p className="mt-1 text-xl font-bold text-white/85">Answer the three questions</p>
              <div className="mt-4 flex gap-1.5">{[team, partners, usage].map((x, i) => <span key={i} className={cn("h-1.5 w-8 rounded-full transition-colors", x !== null ? "bg-teal-400" : "bg-white/15")} />)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
const COMPARE: { label: string; plans: (boolean | string)[] }[] = [
  { label: "AI growth plan & action board", plans: [true, true, true, true] },
  { label: "AI Analyst chat", plans: [true, true, true, true] },
  { label: "AI answers per month", plans: ["200", "1,000", "3,000", "Custom"] },
  { label: "KPI Library (314 metrics)", plans: [true, true, true, true] },
  { label: "Import & export (CSV, Excel, JSON)", plans: [true, true, true, true] },
  { label: "Data collabs with partners", plans: ["1", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Bottleneck detection & recommendations", plans: [false, true, true, true] },
  { label: "Choose Claude, ChatGPT or Gemini", plans: [false, true, true, true] },
  { label: "Hub + Teams, Google Chat & Slack updates", plans: [false, true, true, true] },
  { label: "Operations Pipeline & unified supply chain", plans: [false, false, true, true] },
  { label: "Demand forecasts", plans: [false, false, true, true] },
  { label: "Guided onboarding & custom KPIs", plans: [false, false, false, true] },
];

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const urlPlan = new URLSearchParams(search).get("plan");
  const [finderPlan, setFinderPlan] = useState<string | null>(null);
  const recommendedPlan = finderPlan ?? urlPlan;
  const [billing, setBilling] = useState<Billing>("yearly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const savePct = useMemo(() => {
    const t = PRICING_TIERS.find((x) => x.price && x.priceAnnual)!;
    return Math.round((1 - t.priceAnnual! / t.price!) * 100);
  }, []);

  const handleCheckout = async (tierId: string) => {
    setLoadingTier(tierId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLocation(`/checkout/stripe-mock?plan=${tierId}&billing=${billing}`);
  };

  return (
    <MarketingLayout>
      <section className="relative isolate overflow-hidden px-4 md:px-6 pt-14 md:pt-24 pb-10">
        <GridBackdrop />
        <div className="max-w-3xl mx-auto text-center">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-semibold text-primary">Pricing</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: EASE_OUT }}
            className="mt-2 text-[2.6rem] leading-[1.04] md:text-6xl font-black tracking-[-0.045em] text-slate-900 text-balance" data-testid="text-pricing-title">
            Priced for the business you run.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">
            Start small and grow into it. Every plan begins with a 14-day free trial and includes the AI capacity a team your size needs.
          </motion.p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/70" role="radiogroup" aria-label="Billing period">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button key={b} role="radio" aria-checked={billing === b} onClick={() => setBilling(b)}
                className={cn("relative h-10 px-5 rounded-xl text-[14px] font-semibold transition-colors", billing === b ? "text-slate-900" : "text-slate-500 hover:text-slate-800")}
                data-testid={`billing-${b}`}>
                {billing === b && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <span className="relative">{b === "monthly" ? "Monthly" : "Yearly"}</span>
                {b === "yearly" && <span className="relative ml-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">Save {savePct}%</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal><PlanFinder onPick={setFinderPlan} /></Reveal>
        </div>
      </section>

      <section className="px-4 md:px-6 pt-14 pb-10">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.05} className="h-full">
              <div id={`plan-${tier.id}`} className="h-full scroll-mt-28">
                <PricingCard
                  tier={tier}
                  billing={billing}
                  onCheckout={() => handleCheckout(tier.id)}
                  checkoutLoading={loadingTier === tier.id}
                  recommended={recommendedPlan === tier.id}
                />
              </div>
            </Reveal>
          ))}
        </div>
        <p className="max-w-3xl mx-auto mt-8 text-center text-[13px] text-slate-400 leading-relaxed" data-testid="text-coming-soon-note">
          Items under “Coming soon” are on our roadmap and aren’t available yet. An AI answer is one reply from the analyst, one plan rebuild or one analysis.
        </p>
      </section>

      {/* Compare */}
      <section className="px-4 md:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading title="Compare plans" />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 dark:bg-slate-900/30 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-4 text-[13px] font-semibold text-slate-500 w-[40%]">Feature</th>
                  {PRICING_TIERS.map((t) => (
                    <th key={t.id} className={cn("p-4 text-[14px] font-bold text-slate-900 text-center", recommendedPlan === t.id && "text-amber-600")}>{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <td className="p-4 text-[14px] text-slate-700">{row.label}</td>
                    {row.plans.map((v, i) => (
                      <td key={i} className={cn("p-4 text-center", recommendedPlan === PRICING_TIERS[i].id && "bg-amber-50/50")}>
                        {v === true ? <Check className="w-4 h-4 text-primary mx-auto" /> : v === false ? <Minus className="w-4 h-4 text-slate-300 mx-auto" /> : <span className="text-[13.5px] font-semibold text-slate-800">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Services & add-ons */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl p-7 border border-slate-200 bg-white/80 dark:bg-slate-900/30">
            <h3 className="text-lg font-bold text-slate-900">Expert services</h3>
            <p className="text-[14px] text-slate-500 mt-1">Want it done for you? Our team sets it up with you.</p>
            <div className="mt-6 space-y-4">
              {[
                { name: "Custom dashboard build", desc: "We design and build your dashboards and growth plan with you.", price: "From $999" },
                { name: "Data import setup", desc: "We get your sales, inventory and operations data in.", price: "From $1,499" },
                { name: "KPI engineering", desc: "Custom metrics designed for your business.", price: "Custom" },
              ].map((service) => (
                <div key={service.name} className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900 text-[14.5px]">{service.name}</p>
                    <p className="text-[13.5px] text-slate-500">{service.desc}</p>
                  </div>
                  <p className="text-[14px] font-bold text-slate-900 shrink-0">{service.price}</p>
                </div>
              ))}
            </div>
            <Link href="/contact"><Button variant="outline" className="w-full mt-6 h-11 rounded-xl font-semibold">Book setup</Button></Link>
          </div>
          <div className="rounded-3xl p-7 border border-slate-200 bg-white/80 dark:bg-slate-900/30">
            <h3 className="text-lg font-bold text-slate-900">Native add-ons</h3>
            <p className="text-[14px] text-slate-500 mt-1">In development. Join the waitlist to hear first.</p>
            <div className="mt-6 space-y-3.5">
              {["Excel AI add-on", "Power BI AI add-on", "Tableau AI add-on", "Google Sheets add-on"].map((addon) => (
                <div key={addon} className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[14.5px]">{addon}</span>
                  <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Coming soon</span>
                </div>
              ))}
            </div>
            <Link href="/contact"><Button variant="outline" className="w-full mt-6 h-11 rounded-xl font-semibold" data-testid="button-addon-waitlist">Join the waitlist</Button></Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <SectionHeading title="Pricing questions" />
          <Accordion type="single" collapsible className="mt-8">
            {[
              { q: "What counts as an AI answer?", a: "One reply from the AI Analyst, one plan rebuild or one analysis (like ranking bottlenecks). Browsing dashboards, the KPI Library, the Hub and exports don't use AI answers." },
              { q: "What if I need more AI answers?", a: "Move up a plan any time, or talk to us about Enterprise volume pricing." },
              { q: "Why are the plans priced this way?", a: "Prices follow what it costs to run the AI for each plan and what similar tools cost. Starter is priced for owner-operators; higher plans add collaboration, engine choice and capacity for bigger teams." },
              { q: "Can I switch between monthly and yearly?", a: "Yes. Yearly billing saves about 20%. You can change plans or billing when your trial ends." },
              { q: "Do you offer discounts for consultants?", a: "Talk to us. Consultants running several client engagements usually fit Business or Enterprise, and we can price by number of clients." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`p${i}`} className="border-slate-200">
                <AccordionTrigger className="text-left text-[16px] font-semibold text-slate-900 hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-slate-500 leading-relaxed pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-10 text-center text-[14px] text-slate-500">Questions? <a href="mailto:support@chaininsideiq.com" className="font-semibold text-primary hover:underline">Talk to sales</a></p>
        </div>
      </section>
    </MarketingLayout>
  );
}
