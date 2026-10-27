// Pipeline: every issue's road from "spotted" to "fixed". The flow at the top
// counts how many issues sit at each stage; tracking an issue as actions (and
// ticking those actions off) is what moves it along.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
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
import { PageHeader, Panel, LevelPill, Tag, EmptyState, LoadingCards, StageFlow, StageTrack, FieldLabel } from "@/components/viz";
import { IssueActions } from "@/components/analyst/IssueActions";
import { Workflow, Activity, Search, GitBranch, Target, CheckCircle2, ChevronDown, RefreshCw, Eye, Wrench, PlayCircle, Sparkles } from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";
import { EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";

const STAGE_ICONS = [Eye, GitBranch, Wrench, PlayCircle, CheckCircle2];
const STAGE_HINTS = [
  "Flagged by the analyst",
  "We know why it happens",
  "A fix is ready to start",
  "Steps are being worked on",
  "Every step is done",
];

const STORY = [
  { key: "currentState", label: "Right now", icon: Activity },
  { key: "issueDetected", label: "What we spotted", icon: Search },
  { key: "rootCause", label: "Why it happens", icon: GitBranch },
  { key: "recommendedAction", label: "The fix", icon: Target },
  { key: "expectedOutcome", label: "When it’s fixed", icon: CheckCircle2 },
] as const;

function PipelineRow({ item, rank, stage, sector }: { item: OperationsIntelItem; rank: number; stage: number; sector: string }) {
  const [open, setOpen] = useState(rank === 1);
  return (
    <Panel className="overflow-hidden" data-testid={`pipeline-row-${item.id}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <div className="grid grid-cols-[2.25rem_1fr_auto] items-start gap-3 sm:gap-4">
          <span className="w-9 h-9 rounded-control bg-slate-100 text-slate-700 flex items-center justify-center font-black tabular-nums">{rank}</span>
          <span className="min-w-0">
            <span className="block text-base font-bold text-slate-900">{item.title}</span>
            <span className="mt-2 flex flex-wrap gap-2">
              <Tag className={item.type === "bottleneck" ? "" : "border-success-line bg-success-soft text-success"}>
                {item.type === "bottleneck" ? "Bottleneck" : "Opportunity"}
              </Tag>
              <LevelPill level={item.severity} />
              <Tag icon={Workflow} className="hidden sm:inline-flex">{item.affectedWorkflow}</Tag>
            </span>
          </span>
          <ChevronDown className={cn("w-5 h-5 mt-2 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
        </div>
        <StageTrack className="mt-4 sm:pl-[3.25rem] max-w-2xl" stages={[...FIX_STAGES]} current={stage} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-slate-100">
              <ol className="relative grid gap-4 lg:grid-cols-5 lg:gap-3">
                {STORY.map((s, i) => (
                  <li key={s.key} className="relative pl-8 lg:pl-0 lg:pt-8">
                    <span className="absolute left-0 top-0 lg:left-0 w-6 h-6 rounded-full bg-white border-2 border-teal-600 dark:border-teal-400 flex items-center justify-center">
                      <s.icon className="w-3 h-3 text-teal-700 dark:text-teal-300" aria-hidden />
                    </span>
                    {i < STORY.length - 1 && (
                      <span aria-hidden className="absolute bg-slate-200 left-[11px] top-7 bottom-[-12px] w-0.5 lg:left-7 lg:right-[-12px] lg:top-[11px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
                    )}
                    <FieldLabel>{s.label}</FieldLabel>
                    <p className="text-sm text-slate-700 leading-relaxed">{item[s.key]}</p>
                  </li>
                ))}
              </ol>
              {item.actionPlanSteps.length > 0 && (
                <div className="mt-5 rounded-control bg-slate-50 border border-slate-200 p-4">
                  <FieldLabel icon={Sparkles}>Steps to get there</FieldLabel>
                  <ol className="mt-2 grid sm:grid-cols-2 gap-2">
                    {item.actionPlanSteps.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-white border border-slate-200 text-xs font-black text-teal-700 flex items-center justify-center">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="mt-4"><IssueActions item={item} sector={sector} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

export default function PipelinePage() {
  const { metrics, sector } = useSectorData();
  const { businessStructure } = useDashboardStore();
  const actions = useGrowthStore((s) => s.actions);
  const { data, loading, error, reload } = useOperationsIntel(sector, metrics, businessStructure);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const items = useMemo(
    () => (data?.items || []).slice().sort((a, b) => a.priorityRank - b.priorityRank).map((item) => ({ item, stage: fixStageIndex(item, actions) })),
    [data, actions]
  );

  const stages = useMemo(() => FIX_STAGES.map((label, i) => ({
    key: String(i), label, hint: STAGE_HINTS[i], icon: STAGE_ICONS[i], count: items.filter((x) => x.stage === i).length,
  })), [items]);

  // The open stage (not "Fixed") holding the most issues.
  const busiest = useMemo(() => {
    const open = stages.slice(0, 4);
    const top = open.reduce((a, b) => (b.count > a.count ? b : a), open[0]);
    return top.count > 0 ? top.key : undefined;
  }, [stages]);

  const shown = stageFilter == null ? items : items.filter((x) => String(x.stage) === stageFilter);
  const fixed = stages[4].count;

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
              icon={Workflow}
              title="Pipeline"
              subtitle={items.length
                ? `${items.length} issues in ${sectorLabel(sector).toLowerCase()}, ${fixed} fixed so far. Each one moves along as you work through its steps.`
                : `Every issue’s road from spotted to fixed, for ${sectorLabel(sector).toLowerCase()}.`}
              meta={data ? <GeneratedByBadge generatedBy={data.generatedBy} /> : undefined}
              actions={data && (
                <Button variant="outline" size="sm" className="rounded-control font-bold" onClick={reload} data-testid="button-refresh-pipeline">
                  <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden /> Refresh
                </Button>
              )}
            />

            <UpgradeBanner feature="pipeline" />

            {loading && <LoadingCards count={3} height={150} />}

            {error && !loading && (
              <EmptyState icon={Workflow} title="Couldn’t load the pipeline" body="The analysis didn’t come back. Your data is safe. Try again in a moment."
                action={<Button variant="outline" className="rounded-control font-bold" onClick={reload} data-testid="button-retry-pipeline">Try again</Button>} />
            )}

            {!loading && !error && items.length > 0 && (
              <>
                <Panel className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-900">Where your issues are</h2>
                      <p className="text-sm text-slate-500">Tap a stage to see only those issues.</p>
                    </div>
                    {stageFilter != null && (
                      <Button variant="ghost" size="sm" className="rounded-control font-bold" onClick={() => setStageFilter(null)}>Show all</Button>
                    )}
                  </div>
                  <StageFlow
                    stages={stages}
                    highlightKey={busiest}
                    highlightLabel="Most issues waiting here"
                    selectedKey={stageFilter ?? undefined}
                    onSelect={(k) => setStageFilter((cur) => (cur === k ? null : k))}
                  />
                  {busiest === "2" && (
                    <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                      Most fixes are planned but not started. Pick the top one and choose <span className="font-bold text-slate-800">Track as actions</span> to put its steps on your board.
                    </p>
                  )}
                </Panel>

                <section aria-labelledby="issues" className="space-y-3">
                  <h2 id="issues" className="text-lg font-black tracking-tight text-slate-900">
                    {stageFilter == null ? "All issues, most important first" : `${FIX_STAGES[Number(stageFilter)]} (${shown.length})`}
                  </h2>
                  {shown.length ? shown.map(({ item, stage }) => (
                    <PipelineRow key={item.id} item={item} stage={stage} rank={items.findIndex((x) => x.item.id === item.id) + 1} sector={sector} />
                  )) : (
                    <EmptyState title="Nothing at this stage" body="No issues sit here right now. Pick another stage or show all." />
                  )}
                </section>
              </>
            )}

            {!loading && !error && items.length === 0 && (
              <EmptyState icon={Workflow} title="Your pipeline is clear" body="No open issues right now. When the analyst spots one, it shows up here and you can follow it all the way to fixed."
                action={<Button asChild variant="outline" className="rounded-control font-bold"><Link href="/insights">Ask the analyst</Link></Button>} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
