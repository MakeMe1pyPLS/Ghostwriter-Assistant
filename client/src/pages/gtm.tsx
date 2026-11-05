// Go-to-market: what your ads and your sales pipeline are doing, worked out from
// the files you upload. An ad export shows which campaigns and channels earn
// their spend; a deals export shows which sources close and where deals stall.
// Everything is calculated from the file's own rows and compared with the file's
// own average, never with invented industry benchmarks.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Download, Info, ListPlus, Megaphone, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, EmptyState, FieldLabel, Tag, BreakdownBars } from "@/components/viz";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob } from "@/lib/client-export";
import { addDays } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { analyseGtm, detectGtmKind, templateCsv, type GtmFinding, type GtmKind, type GtmReport, type GtmRow } from "@shared/gtm-engine";
import { formatKpiValue } from "@shared/kpi-engine";

const KIND_LABEL: Record<GtmKind, string> = { ads: "Ad export", pipeline: "Deals export", unknown: "Not recognised" };

const KIND_STYLE = {
  wrong: { label: "Fix this", icon: AlertTriangle, cls: "text-danger border-danger-line bg-danger-soft" },
  right: { label: "Working well", icon: CheckCircle2, cls: "text-success border-success-line bg-success-soft" },
  note: { label: "Worth knowing", icon: Info, cls: "text-info border-info-line bg-info-soft" },
} as const;

const money = (n: number) => formatKpiValue(n, "$");
const pct = (n: number | undefined, d = 1) => (n === undefined ? "—" : `${(n * 100).toFixed(d)}%`);
const x2 = (n: number | undefined) => (n === undefined ? "—" : `${n.toFixed(2)}x`);

function FindingCard({ f }: { f: GtmFinding }) {
  const { addAction, actions } = useGrowthStore();
  const { toast } = useToast();
  const k = KIND_STYLE[f.kind];
  const tracked = actions.some((a) => a.sourceRef === `gtm:${f.id}`);
  const track = () => {
    addAction({ title: f.next, detail: `${f.title}. ${f.what}`, owner: "Marketing", source: "manual", sourceRef: `gtm:${f.id}`, dueDate: addDays(7) });
    toast({ title: "Action added", description: "It is on your Growth Plan board, due in a week." });
  };
  return (
    <Panel className="p-5 sm:p-6" data-testid={`gtm-finding-${f.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-bold", k.cls)}><k.icon className="w-3.5 h-3.5" aria-hidden /> {k.label}</span>
        <span className="inline-flex items-center gap-1 rounded-pill border border-success-line bg-success-soft px-2.5 py-1 text-xs font-bold text-success"><ShieldCheck className="w-3.5 h-3.5" aria-hidden /> Verified from your data</span>
        <span className="inline-flex items-center rounded-pill border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">Confidence: {f.confidence[0].toUpperCase() + f.confidence.slice(1)}</span>
      </div>
      <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900 text-balance">{f.title}</h3>
      <dl className="mt-3 grid sm:grid-cols-2 gap-4">
        <div><dt><FieldLabel>What we see</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{f.what}</dd></div>
        <div><dt><FieldLabel>Possible reason</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{f.why}</dd></div>
        <div><dt><FieldLabel>What it means</FieldLabel></dt><dd className="text-sm text-slate-700 leading-relaxed">{f.impact}</dd></div>
        <div className="rounded-control border border-teal-200 bg-teal-50 p-3 dark:border-teal-400/30 dark:bg-teal-400/10">
          <dt><FieldLabel className="text-teal-700 dark:text-teal-300">Do this next</FieldLabel></dt>
          <dd className="text-sm font-semibold text-slate-800 leading-relaxed">{f.next}</dd>
        </div>
      </dl>
      <details className="mt-4 group">
        <summary className="cursor-pointer min-h-10 inline-flex items-center text-xs font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1">How we know</summary>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <ul className="space-y-1">{f.evidence.map((e) => <li key={e.label}><span className="font-bold">{e.label}:</span> {e.value}{e.how ? <span className="text-xs text-slate-600"> ({e.how})</span> : null}</li>)}</ul>
          <p><span className="font-bold">Why this confidence: </span>{f.confidenceReason}</p>
          <p className="text-xs text-slate-600">The reason is a possible explanation. Your file shows what happened, not what caused it.</p>
        </div>
      </details>
      <div className="mt-4">
        <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={track} disabled={tracked} data-testid={`gtm-track-${f.id}`}>
          <ListPlus className="w-4 h-4 mr-1.5" aria-hidden /> {tracked ? "On your board" : "Track as action"}
        </Button>
      </div>
    </Panel>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white px-4 py-3 shadow-card">
      <p className="text-2xl font-black tabular-nums text-slate-900 leading-tight">{value}</p>
      <p className="text-xs font-bold text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function AdsSummary({ r }: { r: GtmReport }) {
  const t = r.totals as GtmRow;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="gtm-summary">
      <Stat label="Total spend" value={money(t.spend)} sub={`${r.rowsUsed.toLocaleString()} rows`} />
      {t.roas !== undefined ? <Stat label="Return on ad spend" value={x2(t.roas)} sub="Revenue per $1 of ads" /> : <Stat label="Cost per conversion" value={t.cpa === undefined ? "—" : money(t.cpa)} />}
      <Stat label="Conversions" value={t.conversions === undefined ? "—" : t.conversions.toLocaleString()} />
      <Stat label="Click rate" value={pct(t.ctr, 2)} sub="Clicks per view" />
    </div>
  );
}

function AdsTable({ r }: { r: GtmReport }) {
  const cols = [
    { k: "spend", h: "Spend", f: (x: GtmRow) => money(x.spend) },
    { k: "share", h: "Share", f: (x: GtmRow) => pct(x.share, 0) },
    { k: "clicks", h: "Clicks", f: (x: GtmRow) => x.clicks?.toLocaleString() ?? "—" },
    { k: "conversions", h: "Conversions", f: (x: GtmRow) => x.conversions?.toLocaleString() ?? "—" },
    { k: "cpa", h: "Cost per conversion", f: (x: GtmRow) => (x.cpa === undefined ? "—" : money(x.cpa)) },
    { k: "roas", h: "Return", f: (x: GtmRow) => x2(x.roas) },
    { k: "ctr", h: "Click rate", f: (x: GtmRow) => pct(x.ctr, 2) },
  ];
  const nameHeader = r.dimension === "channel" ? "Channel" : r.dimension === "campaign" ? "Campaign" : "Ads";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]" data-testid="gtm-table">
        <caption className="sr-only">Results by {nameHeader.toLowerCase()}, largest spend first</caption>
        <thead>
          <tr className="text-xs text-slate-600">
            <th scope="col" className="text-left p-2 font-bold">{nameHeader}</th>
            {cols.map((c) => <th key={c.k} scope="col" className="text-right p-2 font-bold">{c.h}</th>)}
          </tr>
        </thead>
        <tbody>
          {r.table.map((row) => (
            <tr key={row.name} className="border-t border-slate-100 dark:border-white/10">
              <th scope="row" className="text-left p-2 font-bold text-slate-900">{row.name}</th>
              {cols.map((c) => <td key={c.k} className="p-2 text-right tabular-nums text-slate-700">{c.f(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DealsSummary({ r }: { r: GtmReport }) {
  const d = r.deals!;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="gtm-summary">
      <Stat label="Win rate" value={pct(d.winRate, 0)} sub={`${d.won} won, ${d.lost} lost`} />
      <Stat label="Average won deal" value={d.avgWonAmount === undefined ? "—" : money(d.avgWonAmount)} />
      <Stat label="Time to win" value={d.avgCycleDays === undefined ? "—" : `${Math.round(d.avgCycleDays)} days`} sub="Created to closed" />
      <Stat label="Open deals" value={d.open.toLocaleString()} sub={`${d.total.toLocaleString()} deals in the file`} />
    </div>
  );
}

function DealsTable({ r }: { r: GtmReport }) {
  const groups = r.deals!.groups;
  if (!groups.length) return <p className="text-sm text-slate-600">No source or segment has enough closed deals to compare yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]" data-testid="gtm-table">
        <caption className="sr-only">Win rate by source and segment</caption>
        <thead><tr className="text-xs text-slate-600">
          <th scope="col" className="text-left p-2 font-bold">Group</th>
          <th scope="col" className="text-right p-2 font-bold">Closed deals</th>
          <th scope="col" className="text-right p-2 font-bold">Won</th>
          <th scope="col" className="text-right p-2 font-bold">Win rate</th>
          <th scope="col" className="text-right p-2 font-bold">Won value</th>
        </tr></thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.name} className="border-t border-slate-100 dark:border-white/10">
              <th scope="row" className="text-left p-2 font-bold text-slate-900">{g.name}</th>
              <td className="p-2 text-right tabular-nums">{g.closed}</td>
              <td className="p-2 text-right tabular-nums">{g.won}</td>
              <td className="p-2 text-right tabular-nums">{pct(g.winRate, 0)}</td>
              <td className="p-2 text-right tabular-nums">{money(g.wonAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function download(kind: "ads" | "pipeline") {
  downloadBlob(new Blob([templateCsv(kind)], { type: "text/csv" }), kind === "ads" ? "ad-export-template.csv" : "deals-export-template.csv");
}

function NeedsPanel() {
  const needs = analyseGtm([]).needs;
  return (
    <div className="grid md:grid-cols-2 gap-4 text-left" data-testid="gtm-needs">
      {([["ads", "An ad export", needs.ads], ["pipeline", "A deals export", needs.pipeline]] as const).map(([k, title, list]) => (
        <Panel key={k} className="p-5">
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">{list.map((n) => <li key={n}>{n}</li>)}</ul>
          <Button size="sm" variant="outline" className="mt-4 rounded-xl font-bold" onClick={() => download(k)}>
            <Download className="w-4 h-4 mr-1.5" aria-hidden /> Blank template (CSV)
          </Button>
        </Panel>
      ))}
    </div>
  );
}

export default function GtmPage() {
  const { datasetLibrary } = useDashboardStore();
  const files = useMemo(
    () => datasetLibrary.filter((d) => !d.archived && d.rows.length > 0).map((d) => ({ d, kind: detectGtmKind(d.columns.map((c) => c.name)) })),
    [datasetLibrary],
  );
  const recognised = files.filter((f) => f.kind !== "unknown");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const chosen = recognised.find((f) => f.d.id === pickedId) ?? recognised[0];
  const report = useMemo(() => (chosen ? analyseGtm(chosen.d.rows, chosen.d.columns.map((c) => c.name)) : null), [chosen]);
  const partial = !!chosen && chosen.d.rowCount > chosen.d.rows.length;

  const groups = report ? (["wrong", "right", "note"] as const).map((k) => ({ k, list: report.findings.filter((f) => f.kind === k) })).filter((g) => g.list.length) : [];

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
              icon={Megaphone}
              title="Go-to-market"
              subtitle="Upload an ad export or a deals export and see what is working, what is not, and what to do next."
              meta={<Tag>Calculated from your files</Tag>}
            />

            {!chosen && (
              <>
                <EmptyState
                  icon={Megaphone}
                  title={files.length ? "None of your files look like an ad or deals export" : "Upload an ad export or a deals export"}
                  body="Export a CSV from your ad platform or your CRM, then add it on Data Sources. Nothing is shown until there is real data."
                  action={<Button asChild className="rounded-xl font-bold"><Link href="/data">Go to Data Sources</Link></Button>}
                />
                <NeedsPanel />
              </>
            )}

            {chosen && report && (
              <>
                <Panel className="p-4 flex flex-wrap items-center gap-3">
                  <label htmlFor="gtm-file" className="text-sm font-bold text-slate-700">File</label>
                  <select id="gtm-file" value={chosen.d.id} onChange={(e) => setPickedId(e.target.value)}
                    className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium max-w-full" data-testid="gtm-file">
                    {recognised.map((f) => <option key={f.d.id} value={f.d.id}>{f.d.name} ({KIND_LABEL[f.kind]})</option>)}
                  </select>
                  <Tag>{KIND_LABEL[report.kind]}</Tag>
                  <Button asChild variant="ghost" size="sm" className="ml-auto rounded-xl font-bold"><Link href="/data">Add another file</Link></Button>
                </Panel>

                {partial && (
                  <p role="status" className="rounded-control border border-warning-line bg-warning-soft px-4 py-3 text-sm text-slate-800" data-testid="gtm-partial">
                    Only the first {chosen.d.rows.length.toLocaleString()} of {chosen.d.rowCount.toLocaleString()} rows in this file are used. Totals cover those rows only.
                  </p>
                )}

                {report.kind === "ads" ? <AdsSummary r={report} /> : <DealsSummary r={report} />}

                {groups.length === 0 && (
                  <Panel className="p-5 text-sm text-slate-700" data-testid="gtm-no-findings">
                    Nothing stands out against your own averages. That can also mean there is not enough data yet to judge fairly. See the notes below.
                  </Panel>
                )}
                {groups.map((g) => (
                  <section key={g.k} aria-labelledby={`gtm-${g.k}`} className="space-y-3">
                    <h2 id={`gtm-${g.k}`} className="text-lg font-black tracking-tight text-slate-900">{KIND_STYLE[g.k].label} ({g.list.length})</h2>
                    {g.list.map((f) => <FindingCard key={f.id} f={f} />)}
                  </section>
                ))}

                <Panel className="p-5 sm:p-6 space-y-4">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{report.kind === "ads" ? `Results by ${report.dimension === "channel" ? "channel" : report.dimension === "campaign" ? "campaign" : "total"}` : "Win rate by source and segment"}</h2>
                  {report.kind === "ads" && report.table.length > 1 && (
                    <div>
                      <FieldLabel>Where the money goes</FieldLabel>
                      <BreakdownBars rows={report.table.slice(0, 8).map((r) => ({ key: r.name, label: `${r.name} (${pct(r.share, 0)})`, value: r.spend }))} />
                    </div>
                  )}
                  {report.kind === "ads" ? <AdsTable r={report} /> : <DealsTable r={report} />}
                </Panel>

                <Panel className="p-5 sm:p-6" data-testid="gtm-notes">
                  <h2 className="text-base font-black text-slate-900">Notes on this analysis</h2>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">{report.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                  <p className="mt-3 text-sm text-slate-700"><span className="font-bold">Coming soon: </span>direct connections to Google Ads, Meta Ads, HubSpot and Salesforce. Until then, export a CSV and upload it.</p>
                </Panel>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
