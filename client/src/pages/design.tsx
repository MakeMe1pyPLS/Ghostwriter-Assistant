// Design system preview. Unlinked (not in the nav or sitemap, noindex). Shows every
// shared part in light and dark with clearly labelled sample data. Not a product screen.
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ActionCard, BottleneckCard, ChartFrame, DsCard, EmptyState, Eyebrow, HeatStrip, Illo, ImpactEffort, IndustryCard, KpiCard,
  PipelineFlow, SampleBadge, SeverityRow, Sparkline, StatusChip, TargetGauge, TrendChart,
  type IlloKey, type Stage, type Status,
} from "@/components/ds";

const days = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
const wait = [42, 40, 43, 41, 44, 46, 45, 47, 49, 52, 55, 58, 60, 63];
const onTime = [93, 94, 93, 95, 94, 95, 96, 95, 96, 97, 96, 97, 97, 98];
const trendData = (vals: number[]) => vals.map((y, i) => ({ x: days[i], y }));
const STAGES: Stage[] = [
  { id: "recv", name: "Order received", volume: 480, waitHours: 1, status: "good", note: "Orders arrive and are confirmed quickly." },
  { id: "pick", name: "Picking", volume: 470, waitHours: 6, status: "good", note: "Pickers keep up with the queue." },
  { id: "pack", name: "Packing", volume: 440, waitHours: 31, status: "problem", note: "Orders wait a day and a half for a packing station.", next: "Add one packing station on the evening shift for two weeks, then re-check the wait." },
  { id: "ship", name: "Shipping", volume: 300, waitHours: 9, status: "watch", note: "Pickups are bunched late in the day." },
];
const SEV: { name: string; detail: string; status: Status; share: number }[] = [
  { name: "Packing wait is 31 hours", detail: "Target is 12 hours", status: "problem", share: 1 },
  { name: "Late carrier pickups", detail: "Pickups bunch after 4 pm", status: "watch", share: 0.55 },
  { name: "Returns processing", detail: "Within target", status: "good", share: 0.18 },
];
const ART: [IlloKey, string][] = [["logistics", "Logistics"], ["warehouse", "Warehouse"], ["ecommerce", "E-commerce"], ["manufacturing", "Manufacturing"], ["retail", "Retail"], ["generic", "Anything else"]];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <Eyebrow>{title}</Eyebrow>
      <h2 id={id} className="sr-only">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div>
            <p className="text-sm font-black tracking-tight">ChainInsideIQ design system</p>
            <p className="text-[12px] text-slate-600">Preview only. Every number here is made up.</p>
          </div>
          <div className="flex items-center gap-2"><SampleBadge /><ThemeToggle /></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <Section id="kpi" title="KPI cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="On-time delivery" value={98} unit="%" delta={{ change: 1.2, deltaUnit: " pts", vs: "last week" }} series={onTime}
              help={{ means: "The share of orders that arrive by the promised date.", why: "Late orders cost repeat customers." }} />
            <KpiCard label="Packing wait" value={31} unit=" h" delta={{ change: 8, deltaUnit: " h", upIsGood: false, vs: "last week" }} series={wait}
              help={{ means: "How long an order sits before it is packed.", why: "It is the slowest stage right now." }} />
            <KpiCard label="Orders this week" value={2480} delta={{ change: 0, vs: "last week" }} series={[20, 22, 21, 22, 21, 22, 22]} />
            <KpiCard label="Cost per order" value={4.62} prefix="$" decimals={2} delta={{ change: -0.18, deltaUnit: "", upIsGood: false, vs: "last week" }} series={[5.1, 5, 4.9, 4.9, 4.8, 4.7, 4.62]} />
          </div>
        </Section>

        <Section id="status" title="Status, never by colour alone">
          <DsCard className="flex flex-wrap gap-2">
            {(["good", "watch", "problem", "info", "neutral", "soon", "sample"] as Status[]).map((s) => <StatusChip key={s} status={s} />)}
          </DsCard>
        </Section>

        <Section id="charts" title="Charts">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartFrame sample title="Packing wait, last 14 days" question="Is the wait getting better or worse?"
              table={{ columns: ["Day", "Hours"], rows: wait.map((v, i) => [days[i], v]) }}>
              <TrendChart data={trendData(wait)} kind="line" unit=" h" name="Packing wait" target={12} />
            </ChartFrame>
            <ChartFrame sample title="On-time delivery, last 14 days" question="Are we keeping our promise?"
              table={{ columns: ["Day", "On time %"], rows: onTime.map((v, i) => [days[i], v]) }}>
              <TrendChart data={trendData(onTime)} kind="area" unit="%" name="On time" yMin={90} yMax={100} />
            </ChartFrame>
            <ChartFrame sample title="Orders per stage" question="Where does the work go?"
              table={{ columns: ["Stage", "Orders"], rows: STAGES.map((s) => [s.name, s.volume]) }}>
              <TrendChart data={STAGES.map((s) => ({ x: s.name.split(" ")[0], y: s.volume }))} kind="bar" name="Orders" />
            </ChartFrame>
            <DsCard className="space-y-5">
              <div><h3 className="text-base font-black tracking-tight">Against your target</h3><p className="text-[13px] text-slate-600">The marker is the target you set, not an industry average.</p></div>
              <TargetGauge label="On-time delivery" value={98} target={97} unit="%" max={100} />
              <TargetGauge label="Packing wait" value={31} target={12} unit=" h" higherIsBetter={false} max={40} />
              <TargetGauge label="Cost per order" value={4.62} target={4.5} unit="" higherIsBetter={false} max={6} />
            </DsCard>
          </div>
          <ChartFrame sample title="Wait by stage and day" question="When and where does work stall?"
            table={{ columns: ["Stage", ...days], rows: [["Receiving", ...wait.map((v) => Math.round(v / 10))], ["Packing", ...wait.map((v) => Math.round(v * 0.5))]] }}>
            <HeatStrip columns={days} unit="h"
              rows={[{ label: "Receiving", values: wait.map((v) => Math.round(v / 10)) }, { label: "Picking", values: wait.map((v) => Math.round(v / 6)) }, { label: "Packing", values: wait.map((v) => Math.round(v * 0.5)) }, { label: "Shipping", values: wait.map((v) => Math.round(v / 5)) }]} />
          </ChartFrame>
        </Section>

        <Section id="flow" title="Pipeline flow">
          <DsCard className="pt-7"><PipelineFlow stages={STAGES} unitLabel="orders" /></DsCard>
        </Section>

        <Section id="bottleneck" title="Bottleneck and ranked problems">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BottleneckCard title="Orders wait 31 hours to be packed"
              because="Packing is the slowest of four stages, and the wait has grown for two weeks."
              cost="About 1 in 5 orders ships a day late." next="Add one packing station on the evening shift." />
            <DsCard className="space-y-3"><h3 className="text-base font-black">All problems, worst first</h3>
              <ul className="space-y-2">{SEV.map((s, i) => <SeverityRow key={s.name} rank={i + 1} {...s} />)}</ul></DsCard>
          </div>
        </Section>

        <Section id="actions" title="Recommendations">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ActionCard what="Add an evening packing station" why="Packing is the slowest stage and it is getting slower."
              how={["Pick a station and a person for 4 to 8 pm", "Move the label printer to it", "Re-check the wait in two weeks"]} when="This week" owner="Ops lead" impact={5} effort={2} />
            <DsCard className="space-y-3"><h3 className="text-base font-black">Impact and effort</h3>
              <ImpactEffort points={[{ id: "a", label: "Evening packing station", impact: 5, effort: 2 }, { id: "b", label: "Carrier pickup schedule", impact: 3, effort: 1 }, { id: "c", label: "New packing software", impact: 4, effort: 5 }, { id: "d", label: "Relabel shelves", impact: 2, effort: 2 }]} /></DsCard>
          </div>
        </Section>

        <Section id="industries" title="Industry cards and illustration style">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ART.map(([k, n]) => <IndustryCard key={k} art={k} name={n} kpiCount={0} blurb="Illustration style preview. Real counts come from the KPI library." />)}
          </div>
        </Section>

        <Section id="empty" title="Empty state">
          <EmptyState illustration={<Illo.generic />} title="Nothing to show yet" body="Add your first data source and this screen fills in." />
        </Section>

        <Section id="spark" title="Sparkline">
          <DsCard className="max-w-xs"><Sparkline label="Packing wait, last 14 days" values={wait} tone="problem" /></DsCard>
        </Section>
      </main>
    </div>
  );
}
