// Bottlenecks: the #1 thing slowing the business down, then everything else in
// order. Each one says what's happening, why, what it costs and how to fix it.
import { IssueActions } from "@/components/analyst/IssueActions";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import {
  useOperationsIntel,
  GeneratedByBadge,
  sectorLabel,
  fixStageIndex,
  FIX_STAGES,
  type OperationsIntelItem,
} from "@/components/analyst/operations-shared";
import {
  PageHeader, Panel, LevelPill, LevelMeter, Tag, FieldLabel, EmptyState, LoadingCards, StageTrack, BreakdownBars, LEVEL,
} from "@/components/viz";
import { AlertOctagon, ChevronDown, Search, GitBranch, Target, TrendingDown, RefreshCw, Workflow, ListChecks, Activity } from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";
import { EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";

function TopBottleneck({ item, sector, stage }: { item: OperationsIntelItem; sector: string; stage: number }) {
  const l = LEVEL[item.severity];
  return (
    <Panel className={cn("overflow-hidden border-2", item.severity === "high" ? "border-danger-line" : "border-slate-200")} data-testid={`bottleneck-card-${item.id}`}>
      <div className="grid lg:grid-cols-[1fr_22rem]">
        <div className="p-5 sm:p-7">
          <p className={cn("flex items-center gap-1.5 text-sm font-bold", l.text)}>
            <l.icon className="w-4 h-4" aria-hidden /> Your #1 bottleneck
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900 text-balance">{item.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <LevelPill level={item.severity} />
            <Tag icon={Workflow}>{item.affectedWorkflow}</Tag>
          </div>

          <dl className="mt-6 grid sm:grid-cols-2 gap-5">
            <div>
              <dt><FieldLabel icon={Search}>What’s happening</FieldLabel></dt>
              <dd className="text-[15px] text-slate-700 leading-relaxed">{item.issueDetected}</dd>
            </div>
            <div>
              <dt><FieldLabel icon={GitBranch}>Why</FieldLabel></dt>
              <dd className="text-[15px] text-slate-700 leading-relaxed">{item.rootCause}</dd>
            </div>
          </dl>

          <div className={cn("mt-5 rounded-control border p-4", l.box)}>
            <FieldLabel icon={TrendingDown} className={l.text}>What it’s costing you</FieldLabel>
            <p className="text-base font-bold text-slate-900 leading-relaxed">{item.estimatedImpact}</p>
          </div>

          <StageTrack className="mt-6 max-w-md" stages={[...FIX_STAGES]} current={stage} />
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-5 sm:p-7 flex flex-col">
          <FieldLabel icon={Target} className="text-teal-700 dark:text-teal-300">How to fix it</FieldLabel>
          <p className="text-base font-bold text-slate-900 leading-relaxed">{item.recommendedAction}</p>
          {item.actionPlanSteps.length > 0 && (
            <ol className="mt-4 space-y-2.5">
              {item.actionPlanSteps.slice(0, 4).map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white border border-slate-200 text-xs font-black text-teal-700 flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-auto pt-5"><IssueActions item={item} sector={sector} /></div>
        </div>
      </div>
    </Panel>
  );
}

function BottleneckRow({ item, rank, sector, stage }: { item: OperationsIntelItem; rank: number; sector: string; stage: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="overflow-hidden" data-testid={`bottleneck-card-${item.id}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        data-testid={`bottleneck-toggle-${item.id}`}
      >
        <span className="w-9 h-9 rounded-control bg-slate-100 text-slate-700 flex items-center justify-center font-black tabular-nums">{rank}</span>
        <span className="min-w-0">
          <span className="block text-base font-bold text-slate-900 truncate">{item.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><LevelMeter level={item.severity} /> {LEVEL[item.severity].word}</span>
            <span className="inline-flex items-center gap-1 truncate"><Workflow className="w-3.5 h-3.5" aria-hidden />{item.affectedWorkflow}</span>
            <span className="hidden sm:inline">· {FIX_STAGES[stage]}</span>
          </span>
        </span>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-slate-100 space-y-5">
              <dl className="grid sm:grid-cols-3 gap-4">
                <div><dt><FieldLabel icon={Activity}>Right now</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{item.currentState}</dd></div>
                <div><dt><FieldLabel icon={Search}>What’s happening</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{item.issueDetected}</dd></div>
                <div><dt><FieldLabel icon={GitBranch}>Why</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{item.rootCause}</dd></div>
              </dl>
              <div className={cn("rounded-control border p-4", LEVEL[item.severity].box)}>
                <FieldLabel icon={TrendingDown} className={LEVEL[item.severity].text}>What it’s costing you</FieldLabel>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{item.estimatedImpact}</p>
              </div>
              <div className="rounded-control border border-teal-200 bg-teal-50 p-4 dark:border-teal-400/30 dark:bg-teal-400/10">
                <FieldLabel icon={Target} className="text-teal-700 dark:text-teal-300">How to fix it</FieldLabel>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{item.recommendedAction}</p>
              </div>
              <IssueActions item={item} sector={sector} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

export default function BottlenecksPage() {
  const { metrics, sector } = useSectorData();
  const { businessStructure } = useDashboardStore();
  const actions = useGrowthStore((s) => s.actions);
  const { data, loading, error, reload } = useOperationsIntel(sector, metrics, businessStructure);

  const bottlenecks = useMemo(
    () => (data?.items || []).filter((i) => i.type === "bottleneck").sort((a, b) => a.priorityRank - b.priorityRank),
    [data]
  );
  const [top, ...rest] = bottlenecks;

  const byWorkflow = useMemo(() => {
    const m = new Map<string, number>();
    bottlenecks.forEach((b) => m.set(b.affectedWorkflow, (m.get(b.affectedWorkflow) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ key: label, label, value }));
  }, [bottlenecks]);
  const counts = useMemo(() => ({
    high: bottlenecks.filter((b) => b.severity === "high").length,
    medium: bottlenecks.filter((b) => b.severity === "medium").length,
    low: bottlenecks.filter((b) => b.severity === "low").length,
  }), [bottlenecks]);

  const summary = bottlenecks.length
    ? `${bottlenecks.length} slowing ${sectorLabel(sector).toLowerCase()} down right now${counts.high ? `, ${counts.high} with high impact` : ""}. Start at the top.`
    : `What’s slowing ${sectorLabel(sector).toLowerCase()} down, worst first.`;

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
              icon={AlertOctagon}
              title="Bottlenecks"
              subtitle={summary}
              meta={data ? <GeneratedByBadge generatedBy={data.generatedBy} /> : undefined}
              actions={data && (
                <Button variant="outline" size="sm" className="rounded-control font-bold" onClick={reload} data-testid="button-refresh-bottlenecks">
                  <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden /> Refresh
                </Button>
              )}
            />

            <UpgradeBanner feature="bottlenecks" />

            {loading && <LoadingCards count={3} height={140} />}

            {error && !loading && (
              <EmptyState icon={AlertOctagon} title="Couldn’t load your bottlenecks" body="The analysis didn’t come back. Your data is safe. Try again in a moment."
                action={<Button variant="outline" className="rounded-control font-bold" onClick={reload} data-testid="button-retry-bottlenecks">Try again</Button>} />
            )}

            {!loading && !error && bottlenecks.length === 0 && (
              <EmptyState title="No bottlenecks right now" body="Your numbers are inside normal ranges for this kind of business. Check back after your next data update." />
            )}

            {!loading && !error && top && (
              <>
                <TopBottleneck item={top} sector={sector} stage={fixStageIndex(top, actions)} />

                {rest.length > 0 && (
                  <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
                    <section aria-labelledby="ranked" className="space-y-3 min-w-0">
                      <h2 id="ranked" className="text-lg font-black tracking-tight text-slate-900">Next in line</h2>
                      {rest.map((item, i) => (
                        <BottleneckRow key={item.id} item={item} rank={i + 2} sector={sector} stage={fixStageIndex(item, actions)} />
                      ))}
                    </section>

                    <aside className="space-y-4 lg:sticky lg:top-4">
                      <Panel className="p-5">
                        <h2 className="text-base font-black text-slate-900">At a glance</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(["high", "medium", "low"] as const).filter((k) => counts[k]).map((k) => (
                            <LevelPill key={k} level={k} label={`${counts[k]} ${LEVEL[k].word.toLowerCase()}`} />
                          ))}
                        </div>
                        <h3 className="mt-5 mb-1 text-sm font-bold text-slate-700">Where they are</h3>
                        <BreakdownBars rows={byWorkflow} />
                      </Panel>
                      <Panel className="p-5">
                        <h2 className="flex items-center gap-1.5 text-base font-black text-slate-900"><ListChecks className="w-4 h-4 text-primary" aria-hidden /> How to use this</h2>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">Fix the top one first. “Track as actions” puts its steps on your Growth Plan board with due dates, and its progress shows on the Pipeline.</p>
                      </Panel>
                    </aside>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
