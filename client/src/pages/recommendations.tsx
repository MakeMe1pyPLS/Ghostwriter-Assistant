// Recommendations: each fix as an action card (what, why, how, when), plus an
// impact vs effort map so the quick wins stand out.
import { IssueActions } from "@/components/analyst/IssueActions";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import {
  useOperationsIntel,
  GeneratedByBadge,
  sectorLabel,
  trackedStatus,
  effortOf,
  IMPACT_SCORE,
  TIMING,
  type OperationsIntelItem,
} from "@/components/analyst/operations-shared";
import { PageHeader, Panel, LevelPill, Tag, FieldLabel, EmptyState, LoadingCards, ImpactEffortChart, LEVEL } from "@/components/viz";
import { Lightbulb, Search, Info, CheckCircle2, RefreshCw, ListChecks, Clock, Gauge, Circle, CircleDot, CheckCircle, Workflow } from "lucide-react";
import { UpgradeBanner } from "@/components/UpgradeBadge";
import { cn } from "@/lib/utils";

const STATUS = {
  untracked: { label: "Not started", icon: Circle, cls: "text-slate-500 border-slate-200 bg-white" },
  todo: { label: "To do", icon: Circle, cls: "text-slate-700 border-slate-300 bg-white" },
  doing: { label: "In progress", icon: CircleDot, cls: "text-info border-info-line bg-info-soft" },
  done: { label: "Done", icon: CheckCircle, cls: "text-success border-success-line bg-success-soft" },
} as const;

type When = "Now" | "This week" | "Later";
const WHEN_FILTERS: (When | "All")[] = ["All", "Now", "This week", "Later"];

function RecommendationCard({ item, rank, sector, status }: { item: OperationsIntelItem; rank: number; sector: string; status: keyof typeof STATUS }) {
  const st = STATUS[status];
  const effort = effortOf(item);
  return (
    <Panel id={`rec-${item.id}`} className="overflow-hidden scroll-mt-24" data-testid={`recommendation-card-${item.id}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="w-9 h-9 shrink-0 rounded-control bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black tabular-nums dark:bg-teal-400/10 dark:border-teal-400/30 dark:text-teal-300">{rank}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-500">What to do</p>
            <h3 className="text-lg font-black tracking-tight text-slate-900 leading-snug">{item.recommendedAction}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag icon={Clock} className={item.severity === "high" ? "border-danger-line bg-danger-soft text-danger" : ""}>{TIMING[item.severity]}</Tag>
              <LevelPill level={item.severity} />
              <Tag icon={Gauge}>{effort.label}</Tag>
              <span className={cn("inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-bold", st.cls)}>
                <st.icon className="w-3.5 h-3.5" aria-hidden /> {st.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <div className="rounded-control bg-slate-50 border border-slate-200 p-4">
            <FieldLabel icon={Info}>Why</FieldLabel>
            <p className="text-sm text-slate-700 leading-relaxed">{item.reasoning}</p>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed"><span className="font-bold text-slate-700">Spotted: </span>{item.issueDetected}</p>
          </div>
          <div className="rounded-control border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-400/30 dark:bg-teal-400/10">
            <FieldLabel icon={ListChecks} className="text-teal-700 dark:text-teal-300">How</FieldLabel>
            {item.actionPlanSteps.length ? (
              <ol className="space-y-2">
                {item.actionPlanSteps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-white border border-teal-200 text-xs font-black text-teal-700 flex items-center justify-center">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-slate-700">{item.recommendedAction}</p>}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-control border border-success-line bg-success-soft p-4">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" aria-hidden />
          <p className="text-sm text-slate-800 leading-relaxed">
            <span className="font-bold">Expected result: </span>{item.expectedOutcome}
            <span className="block mt-1 text-slate-600">{item.estimatedImpact}</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <IssueActions item={item} sector={sector} />
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Workflow className="w-3.5 h-3.5" aria-hidden />{item.affectedWorkflow}</span>
        </div>
      </div>
    </Panel>
  );
}

export default function RecommendationsPage() {
  const { metrics, sector } = useSectorData();
  const { businessStructure } = useDashboardStore();
  const actions = useGrowthStore((s) => s.actions);
  const { data, loading, error, reload } = useOperationsIntel(sector, metrics, businessStructure);
  const [when, setWhen] = useState<When | "All">("All");

  const items = useMemo(
    () => (data?.items || []).slice().sort((a, b) => a.priorityRank - b.priorityRank),
    [data]
  );
  const shown = when === "All" ? items : items.filter((i) => TIMING[i.severity] === when);

  const points = items.map((it, i) => ({
    id: it.id, label: it.recommendedAction, rank: i + 1, impact: IMPACT_SCORE[it.severity], effort: effortOf(it).score, tone: it.severity,
  }));
  const quickWins = items.filter((it) => IMPACT_SCORE[it.severity] >= 0.5 && effortOf(it).score < 0.5).length;
  const done = items.filter((it) => trackedStatus(it, actions) === "done").length;

  const jump = (id: string) => document.getElementById(`rec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
              icon={Lightbulb}
              title="Recommendations"
              subtitle={items.length
                ? `${items.length} fixes for ${sectorLabel(sector).toLowerCase()}, most important first${quickWins ? `. ${quickWins} ${quickWins === 1 ? "is a quick win" : "are quick wins"}` : ""}.`
                : `Step-by-step fixes for ${sectorLabel(sector).toLowerCase()}, most important first.`}
              meta={data ? <GeneratedByBadge generatedBy={data.generatedBy} /> : undefined}
              actions={data && (
                <Button variant="outline" size="sm" className="rounded-control font-bold" onClick={reload} data-testid="button-refresh-recommendations">
                  <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden /> Refresh
                </Button>
              )}
            />

            <UpgradeBanner feature="recommendations" />

            {loading && <LoadingCards count={3} height={220} />}

            {error && !loading && (
              <EmptyState icon={Lightbulb} title="Couldn’t load recommendations" body="The analysis didn’t come back. Your data is safe. Try again in a moment."
                action={<Button variant="outline" className="rounded-control font-bold" onClick={reload} data-testid="button-retry-recommendations">Try again</Button>} />
            )}

            {!loading && !error && items.length > 0 && (
              <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
                <section aria-labelledby="fixes" className="space-y-4 min-w-0 order-2 lg:order-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="fixes" className="text-lg font-black tracking-tight text-slate-900">Your fixes</h2>
                    <div role="group" aria-label="Filter by timing" className="inline-flex rounded-control border border-slate-200 bg-white p-1">
                      {WHEN_FILTERS.map((w) => (
                        <button key={w} onClick={() => setWhen(w)} aria-pressed={when === w}
                          className={cn("h-9 px-3 rounded-lg text-sm font-bold transition-colors", when === w ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  {shown.length ? shown.map((item) => (
                    <RecommendationCard key={item.id} item={item} rank={items.indexOf(item) + 1} sector={sector} status={trackedStatus(item, actions)} />
                  )) : (
                    <EmptyState title={`Nothing for “${when}”`} body="No fixes have that timing right now. Pick another filter or show all." />
                  )}
                </section>

                <aside className="space-y-4 order-1 lg:order-2 lg:sticky lg:top-4">
                  <Panel className="p-5">
                    <h2 className="text-base font-black text-slate-900">Impact vs effort</h2>
                    <p className="mt-1 text-sm text-slate-500">Top left is where to start. Tap a number to jump to it.</p>
                    <div className="mt-3">
                      <ImpactEffortChart points={points} onSelect={jump}
                        impactNote="Impact comes from each issue’s severity."
                        effortNote="Effort comes from how many steps its plan has." />
                    </div>
                  </Panel>
                  <Panel className="p-5">
                    <h2 className="text-base font-black text-slate-900">Progress</h2>
                    <p className="mt-1 text-sm text-slate-500">{done} of {items.length} fixes done</p>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} aria-label="Fixes done">
                      <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400" style={{ width: `${(done / Math.max(1, items.length)) * 100}%` }} />
                    </div>
                    <ul className="mt-4 space-y-2">
                      {(["high", "medium", "low"] as const).map((lvl) => {
                        const n = items.filter((i) => i.severity === lvl).length;
                        if (!n) return null;
                        const L = LEVEL[lvl];
                        return (
                          <li key={lvl} className="flex items-center justify-between text-sm">
                            <span className={cn("inline-flex items-center gap-1.5 font-semibold", L.text)}><L.icon className="w-4 h-4" aria-hidden /> {TIMING[lvl]}</span>
                            <span className="font-bold tabular-nums text-slate-700">{n}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed">Timing comes from severity: high = now, medium = this week, low = later.</p>
                  </Panel>
                </aside>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <EmptyState icon={Search} title="No recommendations yet" body="Import some data or pick your industry, and the analyst will suggest fixes here."
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
