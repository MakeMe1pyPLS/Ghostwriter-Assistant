// Overview: the flow with the bottleneck highlighted, one health card per zone,
// the AI insight, and a drawer with each zone's numbers.
//
// The zone cards sit behind `ZoneViewProps`. To add the isometric warehouse
// illustration later, build a component that takes the same props (zones,
// selectedId, onSelect) and pass it as `ZoneView` to <Overview/>. Nothing else
// changes: the flow, the drawer and the insight all read the same data.
import { useState } from "react";
import { ArrowRight, ChevronRight, Lightbulb, Target, HelpCircle, Wrench, Clock, Box, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  APPAREL_RETURNS, SUPPLEMENT_LOTS, type FulfillmentData, type FulfillmentInsight, type ZoneId, type ZoneStat,
} from "@shared/fulfillment";
import { Card, HealthBadge, Sparkline, TONE, hrs, SectionTitle } from "./parts";
import { WarehouseIso } from "./WarehouseIso";

export interface ZoneViewProps {
  zones: ZoneStat[];
  selectedId: ZoneId | null;
  onSelect: (id: ZoneId) => void;
}
export type ZoneViewComponent = React.ComponentType<ZoneViewProps>;

// ---- KPI strip --------------------------------------------------------------

export function KpiStrip({ data }: { data: FulfillmentData }) {
  const open = data.orders.filter((o) => o.status !== "shipped" && o.status !== "returns").length;
  const late = data.orders.filter((o) => o.late).length;
  const shipped = data.orders.filter((o) => o.status === "shipped").length;
  const kpis =
    data.niche === "apparel"
      ? (() => {
          const total = APPAREL_RETURNS.reduce((s, r) => s + r.count, 0);
          const size = APPAREL_RETURNS.filter((r) => r.reason.startsWith("Too ")).reduce((s, r) => s + r.count, 0);
          return { label: "Returns caused by size", value: `${Math.round((size / total) * 100)}%`, sub: `${size} of ${total} this month` };
        })()
      : (() => {
          const soon = SUPPLEMENT_LOTS.filter((l) => l.expiryDays <= 60 && !l.hold).length;
          return { label: "Lots expiring within 60 days", value: String(soon), sub: "Ship these first" };
        })();
  const items = [
    { label: "Open orders", value: String(open), sub: "Not yet shipped" },
    { label: "Past their time limit", value: String(late), sub: "Waiting longer than they should", warn: late > 0 },
    { label: "Shipped today", value: String(shipped), sub: "Handed to the carrier" },
    kpis,
  ];
  return (
    <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {items.map((k) => (
        <StaggerItem key={k.label}>
          <div className="h-full rounded-2xl border border-slate-200 bg-white px-4 py-3" data-testid={`ff-kpi-${k.label.split(" ")[0].toLowerCase()}`}>
            <p className={cn("text-2xl font-black tabular-nums leading-tight", (k as any).warn ? "text-warning" : "text-slate-900")}>{k.value}</p>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">{k.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

// ---- Flow strip -------------------------------------------------------------

export function FlowStrip({ zones, selectedId, onSelect }: ZoneViewProps) {
  return (
    <Card className="p-3 sm:p-4" data-testid="ff-flow">
      <ol className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0" aria-label="Fulfillment flow">
        {zones.map((z, i) => {
          const t = TONE[z.health];
          const Icon = t.icon;
          const selected = selectedId === z.id;
          return (
            <li key={z.id} className="flex sm:flex-1 items-stretch min-w-0">
              <button
                onClick={() => onSelect(z.id)}
                aria-pressed={selected}
                aria-label={`${z.name}: ${z.queue} ${z.queueLabel}. ${t.label}.`}
                className={cn(
                  "flex-1 min-w-0 rounded-xl border px-3 py-2.5 min-h-[56px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  z.health === "bottleneck" ? cn(t.box, "ring-1 ring-rose-500/30") : "border-slate-200 bg-white hover:bg-slate-50",
                  selected && "outline outline-2 outline-primary",
                )}
                data-testid={`ff-flow-${z.id}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">{i + 1}. {z.name}</span>
                  <Icon className={cn("w-4 h-4 shrink-0", t.text)} aria-hidden />
                </span>
                <span className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black tabular-nums text-slate-900">{z.queue}</span>
                  <span className="text-xs text-slate-500 truncate">waiting</span>
                </span>
                {z.health !== "ok" && <span className={cn("text-xs font-black", t.text)}>{t.label}</span>}
              </button>
              {i < zones.length - 1 && (
                <span className="hidden sm:flex items-center px-1 text-slate-400" aria-hidden><ChevronRight className="w-4 h-4" /></span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ---- Zone health cards (swap this for the isometric view later) -------------

export function ZoneCards({ zones, selectedId, onSelect }: ZoneViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="ff-zones">
      {zones.map((z) => {
        const t = TONE[z.health];
        const pace = Math.min(100, Math.round((z.throughput / z.target) * 100));
        return (
          <button
            key={z.id}
            onClick={() => onSelect(z.id)}
            aria-label={`Open ${z.name} details`}
            className={cn(
              "text-left rounded-card border bg-white shadow-card p-4 sm:p-5 transition-shadow hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              z.health === "bottleneck" ? "border-danger-line ring-1 ring-rose-500/25" : "border-slate-200",
              selectedId === z.id && "outline outline-2 outline-primary",
            )}
            data-testid={`ff-zone-${z.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-black text-slate-900">{z.name}</h3>
              <HealthBadge health={z.health} />
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">{z.what}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums text-slate-900">{z.queue}</span>
              <span className="text-[13px] font-bold text-slate-600">{z.queueLabel}</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Pace: {z.throughput}/hr</span>
                <span>Target: {z.target}/hr</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={pace} aria-valuemin={0} aria-valuemax={100} aria-label={`${z.name} pace as a share of target`}>
                <div className={cn("h-full rounded-full", t.bar)} style={{ width: `${pace}%` }} />
              </div>
            </div>
            <div className="mt-3">
              <Sparkline values={z.trend} tone={z.health} label={`${z.name} pace over the last 7 days`} />
              <p className="text-xs text-slate-500 mt-0.5">Pace over the last 7 days</p>
            </div>
            <p className={cn("text-[12px] font-semibold mt-3", z.health === "ok" ? "text-slate-600" : t.text)}>{z.reason}</p>
          </button>
        );
      })}
    </div>
  );
}

// ---- Zone drawer ------------------------------------------------------------

export function ZoneDrawer({ zone, insight, onClose }: { zone: ZoneStat | null; insight: FulfillmentInsight; onClose: () => void }) {
  const isPick = zone && insight.zoneId === zone.id;
  return (
    <Sheet open={!!zone} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" data-testid="ff-zone-drawer">
        {zone && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-xl font-black">{zone.name}</SheetTitle>
                <HealthBadge health={zone.health} />
              </div>
              <SheetDescription>{zone.what}.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "Pace now", v: `${zone.throughput}/hr`, s: `Target ${zone.target}/hr` },
                  { l: "Waiting", v: String(zone.queue), s: zone.queueLabel },
                  { l: "Work waiting", v: hrs(zone.backlogHrs), s: "At the current pace" },
                  { l: "Average wait", v: hrs(zone.dwellHrs), s: `Goal ${hrs(zone.dwellTargetHrs)} or less` },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">{k.l}</p>
                    <p className="text-xl font-black tabular-nums text-slate-900">{k.v}</p>
                    <p className="text-xs text-slate-500">{k.s}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">Pace, last 7 days</p>
                <Sparkline values={zone.trend} tone={zone.health} label={`${zone.name} pace over the last 7 days`} className="h-16" />
              </div>
              <div className={cn("rounded-xl border p-3", TONE[zone.health].box)}>
                <p className={cn("text-xs font-bold mb-1", TONE[zone.health].text)}>What the numbers say</p>
                <p className="text-sm font-semibold text-slate-800">{zone.reason}</p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-400/30 dark:bg-teal-400/10">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-1 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" aria-hidden /> Recommendation</p>
                {isPick ? (
                  <ol className="list-decimal pl-5 space-y-1 text-sm font-semibold text-slate-800">
                    {insight.how.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                ) : zone.health === "ok" ? (
                  <p className="text-sm font-semibold text-slate-800">Nothing to change here. Keep an eye on it at the start of each shift.</p>
                ) : (
                  <p className="text-sm font-semibold text-slate-800">This stage is slipping but isn't the main problem. Fix {insight.zoneId ? "the bottleneck first" : "it next"}, then come back to this one.</p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---- AI insight -------------------------------------------------------------

export function InsightCard({ insight, audience = "team" }: { insight: FulfillmentInsight; audience?: "team" | "client" }) {
  const t = TONE[insight.health];
  const blocks = [
    { icon: Target, label: "What", text: insight.what },
    { icon: HelpCircle, label: "Why", text: insight.why },
  ];
  return (
    <Card className={cn("space-y-4", insight.health === "bottleneck" && "border-danger-line")} data-testid="ff-insight">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary">AI insight</p>
          <h2 className="text-xl font-black tracking-tight text-slate-900 text-balance">{insight.headline}</h2>
        </div>
        <HealthBadge health={insight.health} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {blocks.map((b) => (
          <div key={b.label} className="rounded-xl border border-slate-100 bg-[#F4F7FA] p-3.5 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1"><b.icon className="w-3.5 h-3.5" aria-hidden /> {b.label}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-[#F4F7FA] p-3.5 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1"><Wrench className="w-3.5 h-3.5" aria-hidden /> How to fix it</p>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700 leading-relaxed">
          {insight.how.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="text-[12px] font-bold text-slate-600 mt-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" aria-hidden /> When: {insight.when}</p>
      </div>
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 dark:border-teal-400/30 dark:bg-teal-400/10 flex items-start gap-3" data-testid="ff-next-step">
        <ArrowRight className="w-4 h-4 text-teal-700 dark:text-teal-300 mt-1 shrink-0" aria-hidden />
        <div>
          <p className="text-xs font-bold text-teal-700 dark:text-teal-300">{audience === "client" ? "Your next step" : "Do this next"}</p>
          <p className="text-sm font-bold text-slate-900">{insight.nextStep}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">{insight.basis}</p>
    </Card>
  );
}

// ---- The tab ------------------------------------------------------------------

export function Overview({
  data, insight, selectedId, onSelect, ZoneView,
}: {
  data: FulfillmentData;
  insight: FulfillmentInsight;
  selectedId: ZoneId | null;
  onSelect: (id: ZoneId | null) => void;
  /** Force one zone view. Without it the person can switch between the floor and the cards. */
  ZoneView?: ZoneViewComponent;
}) {
  const selected = data.zones.find((z) => z.id === selectedId) ?? null;
  const [view, setView] = useState<"floor" | "cards">(() => {
    try { return localStorage.getItem("ciq_zone_view") === "cards" ? "cards" : "floor"; } catch { return "floor"; }
  });
  const pickView = (v: "floor" | "cards") => { setView(v); try { localStorage.setItem("ciq_zone_view", v); } catch { /* ignore */ } };
  const View = ZoneView ?? (view === "floor" ? WarehouseIso : ZoneCards);
  return (
    <div className="space-y-6">
      <KpiStrip data={data} />
      <InsightCard insight={insight} />
      <section className="space-y-3">
        <SectionTitle eyebrow="Where work piles up" title="Fulfillment flow" />
        <FlowStrip zones={data.zones} selectedId={selectedId} onSelect={(id) => onSelect(id)} />
      </section>
      <section className="space-y-3">
        <SectionTitle eyebrow="Warehouse" title="Zone health">
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-sm text-slate-500">Tap a zone for its numbers and what to do.</p>
            {!ZoneView && (
              <div role="radiogroup" aria-label="Zone view" className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 dark:bg-white/5 dark:border-white/10">
                {([["floor", "Floor", Box], ["cards", "Cards", LayoutGrid]] as const).map(([v, l, I]) => (
                  <button key={v} role="radio" aria-checked={view === v} onClick={() => pickView(v)}
                    className={cn("h-8 px-3 rounded-lg text-sm font-bold inline-flex items-center gap-1.5", view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")}>
                    <I className="w-4 h-4" aria-hidden /> {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SectionTitle>
        <View zones={data.zones} selectedId={selectedId} onSelect={(id) => onSelect(id)} />
      </section>
      <ZoneDrawer zone={selected} insight={insight} onClose={() => onSelect(null)} />
    </div>
  );
}
