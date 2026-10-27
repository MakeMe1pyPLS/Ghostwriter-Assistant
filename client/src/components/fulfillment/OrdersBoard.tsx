// Orders board: status tabs with counts, a list of orders and a detail panel
// with a progress stepper, timing, package details and the items in the box.
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Package, PackageOpen, Truck, AlertTriangle, Undo2, Boxes, Scale, Inbox } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CLIENTS, expiryStatus, type Order, type OrderStatus } from "@shared/fulfillment";
import { Card, Chip, hrs } from "./parts";
import { VehicleIcon } from "./VehicleScene";

const TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "picking", label: "Picking" },
  { id: "packing", label: "Packing" },
  { id: "ready", label: "Ready to ship" },
  { id: "shipped", label: "Shipped" },
  { id: "returns", label: "Returns" },
];
const STAGE_LABEL: Record<OrderStatus, string> = { new: "New", picking: "Picking", packing: "Packing", ready: "Ready to ship", shipped: "Shipped", returns: "Return" };
const STEPS = ["New", "Picking", "Packing", "Ready to ship", "Shipped"];
const RETURN_STEPS = ["Return started", "Arrived", "Inspecting", "Restocked or refunded"];
const STEP_INDEX: Record<Exclude<OrderStatus, "returns">, number> = { new: 0, picking: 1, packing: 2, ready: 3, shipped: 4 };
const STAGE_ICON: Record<OrderStatus, any> = { new: Inbox, picking: Boxes, packing: Package, ready: PackageOpen, shipped: Truck, returns: Undo2 };
const STAGE_WORDS: Record<OrderStatus, string> = {
  new: "Waiting to be picked", picking: "Being picked from the shelves", packing: "On the packing bench",
  ready: "Boxed and waiting for the carrier", shipped: "With the carrier", returns: "On its way back",
};
const clientName = (id: string) => CLIENTS.find((c) => c.id === id)?.name ?? id;

function useDesktop() {
  const [yes, setYes] = useState(() => (typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches));
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const f = () => setYes(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return yes;
}

/** A small drawing of where the order is: shelf, bench, box, van or coming back. */
export function OrderArt({ status, late, className }: { status: OrderStatus; late?: boolean; className?: string }) {
  const ink = "stroke-slate-500 dark:stroke-slate-400";
  const box = "fill-amber-200 dark:fill-amber-300/70";
  const sw = { strokeWidth: 1.75, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (status === "shipped") return <VehicleIcon id="cargo-van" pct={70} tone="teal" className={className} />;
  return (
    <svg viewBox="0 0 120 64" className={cn("w-full h-auto", className)} aria-hidden>
      <ellipse cx="60" cy="58" rx="50" ry="3" className="fill-slate-200/70 dark:fill-white/5" />
      {status === "new" && (<>
        <path d="M30 22h60l6 30H24z" className={cn("fill-white dark:fill-slate-800", ink)} {...sw} />
        <path d="M24 40h22l4 6h20l4-6h22" className={cn("fill-none", ink)} {...sw} />
        <rect x="44" y="10" width="32" height="24" rx="2" className={cn("fill-white dark:fill-slate-700", ink)} {...sw} />
        <path d="M50 18h20M50 24h14" className={ink} {...sw} />
      </>)}
      {status === "picking" && (<>
        <path d="M22 8v48M98 8v48M22 22h76M22 38h76" className={ink} {...sw} fill="none" />
        <rect x="30" y="12" width="16" height="10" className={cn(box, ink)} {...sw} />
        <rect x="50" y="12" width="14" height="10" className={cn(box, ink)} {...sw} />
        <rect x="70" y="28" width="18" height="10" className={cn(box, ink)} {...sw} />
        <rect x="34" y="44" width="20" height="12" className={cn("fill-teal-500/30 stroke-teal-600 dark:stroke-teal-300")} {...sw} />
      </>)}
      {status === "packing" && (<>
        <path d="M14 40h92v6H14zM22 46v10M98 46v10" className={cn("fill-slate-100 dark:fill-slate-700", ink)} {...sw} />
        <path d="M40 22h36v18H40z" className={cn(box, ink)} {...sw} />
        <path d="M40 22l-8-8M76 22l8-8" className={ink} {...sw} />
        <path d="M84 30h10v10H84z" className="fill-teal-500/30 stroke-teal-600 dark:stroke-teal-300" {...sw} />
      </>)}
      {status === "ready" && (<>
        <path d="M28 46h64v6H28z" className={cn("fill-slate-200 dark:fill-slate-600", ink)} {...sw} />
        <path d="M34 22h30v24H34zM64 30h22v16H64z" className={cn(box, ink)} {...sw} />
        <path d="M44 22v8M74 30v6" className={ink} {...sw} />
        <rect x="66" y="35" width="14" height="6" rx="1" className="fill-white dark:fill-slate-200" />
      </>)}
      {status === "returns" && (<>
        <path d="M40 24h36v26H40z" className={cn(box, ink)} {...sw} />
        <path d="M40 24l6-8h36l-6 8" className={cn("fill-amber-100 dark:fill-amber-200/60", ink)} {...sw} />
        <path d="M96 30a14 14 0 1 0-4 18" className="fill-none stroke-sky-600 dark:stroke-sky-300" {...sw} />
        <path d="M96 22v8h-8" className="fill-none stroke-sky-600 dark:stroke-sky-300" {...sw} />
      </>)}
      {late && <circle cx="104" cy="12" r="7" className="fill-amber-500" />}
      {late && <path d="M104 8v5M104 16v.5" className="stroke-white" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

export function Stepper({ steps, current, late }: { steps: string[]; current: number; late?: boolean }) {
  return (
    <ol className="flex items-start" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="flex-1 min-w-0 flex flex-col items-center text-center relative" aria-current={now ? "step" : undefined}>
            {i > 0 && <span className={cn("absolute top-3.5 right-1/2 w-full h-0.5 -z-0", i <= current ? "bg-primary" : "bg-slate-200 dark:bg-white/15")} aria-hidden />}
            <span
              className={cn(
                "relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2",
                done && "bg-primary border-primary text-white",
                now && !late && "bg-white border-primary text-primary dark:bg-slate-900",
                now && late && "bg-warning-soft border-warning-line text-warning",
                !done && !now && "bg-white border-slate-300 text-slate-500 dark:bg-slate-900 dark:border-white/20",
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : now && late ? <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("mt-1 text-xs leading-tight px-0.5", now ? "font-black text-slate-900" : "font-semibold text-slate-500")}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderRow({ o, selected, onSelect, showClient }: { o: Order; selected: boolean; onSelect: () => void; showClient: boolean }) {
  const Icon = STAGE_ICON[o.status];
  const units = o.lines.reduce((s, l) => s + l.qty, 0);
  const pct = o.stageTargetHrs ? Math.min(100, Math.round((o.hrsInStage / o.stageTargetHrs) * 100)) : 0;
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-2xl border bg-white p-3.5 min-h-[72px] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/5",
        selected ? "border-primary ring-1 ring-primary/30" : "border-slate-200",
      )}
      data-testid={`ff-order-${o.id.slice(1)}`}
    >
      <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-black text-slate-900">Order {o.id}</span>
        <Chip tone="neutral"><Icon className="w-3 h-3" aria-hidden /> {STAGE_LABEL[o.status]}</Chip>
        {o.late && o.status !== "returns" && <Chip tone="watch"><AlertTriangle className="w-3 h-3" aria-hidden /> Late</Chip>}
        {o.late && o.status === "returns" && <Chip tone="watch"><AlertTriangle className="w-3 h-3" aria-hidden /> Slow</Chip>}
      </div>
      <p className="text-[13px] text-slate-600 mt-1 truncate">
        {showClient && <span className="font-bold text-slate-800">{clientName(o.clientId)} · </span>}
        {units} item{units === 1 ? "" : "s"}: {o.lines[0].label}{o.lines.length > 1 ? ` +${o.lines.length - 1} more` : ""}
      </p>
      {o.status !== "shipped" && (
        <div className="mt-2 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden />
          <span className="text-[12px] font-bold text-slate-600 whitespace-nowrap">{hrs(o.hrsInStage)} here</span>
          {o.stageTargetHrs > 0 && (
            <>
              <span className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden" aria-hidden>
                <span className={cn("block h-full rounded-full", o.late ? "bg-amber-600 dark:bg-amber-400" : "bg-emerald-600 dark:bg-emerald-400")} style={{ width: `${pct}%` }} />
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">limit {hrs(o.stageTargetHrs)}</span>
            </>
          )}
        </div>
      )}
      </div>
      <div className="w-20 sm:w-24 shrink-0 rounded-xl bg-slate-50 dark:bg-white/5 p-1.5 self-center"><OrderArt status={o.status} late={o.late} /></div>
      </div>
    </button>
  );
}

export function OrderDetail({ o, showClient }: { o: Order; showClient: boolean }) {
  const isReturn = o.status === "returns";
  const steps = isReturn ? RETURN_STEPS : STEPS;
  const current = isReturn ? (o.returnStep ?? 1) : STEP_INDEX[o.status as Exclude<OrderStatus, "returns">];
  const units = o.lines.reduce((s, l) => s + l.qty, 0);
  const [L, W, H] = o.boxIn;
  return (
    <div className="space-y-5" data-testid="ff-order-detail">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xl font-black text-slate-900">Order {o.id}</h3>
          <Chip tone="neutral">{STAGE_LABEL[o.status]}</Chip>
        </div>
        <p className="text-[13px] text-slate-500">{showClient ? `${clientName(o.clientId)} · ` : ""}{units} item{units === 1 ? "" : "s"} · {o.carrier} {o.service}</p>
      </div>

      <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-6 py-3">
        <OrderArt status={o.status} late={o.late} className="max-h-28 mx-auto" />
        <p className="text-center text-sm font-semibold text-slate-600 -mt-1">{STAGE_WORDS[o.status]}</p>
      </div>

      <Stepper steps={steps} current={current} late={o.late} />

      {o.late && (
        <div className="rounded-xl border border-warning-line bg-warning-soft p-3 flex items-start gap-2" data-testid="ff-order-late">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm text-slate-800"><span className="font-black text-warning">{isReturn ? "Slower than it should be." : "Past its time limit."}</span> {o.waitingOn}. It has been here {hrs(o.hrsInStage)}; the limit is {hrs(o.stageTargetHrs)}.</p>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">Timing</p>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Time in this stage" value={hrs(o.hrsInStage)} sub={o.stageTargetHrs ? `Limit ${hrs(o.stageTargetHrs)}` : "Done"} />
          <Metric label="Carrier" value={o.carrier} sub={o.service} />
          {o.trackingRef && <Metric label="Tracking" value={o.trackingRef} sub="Sample reference, not a real parcel" wide />}
          {isReturn && o.returnReason && <Metric label="Return reason" value={o.returnReason} sub="Chosen by the customer" wide />}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" aria-hidden /> Package</p>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Box size" value={`${L} × ${W} × ${H} in`} sub="Length × width × height" />
          <Metric label="Actual weight" value={`${o.weightLb} lb`} sub="What it weighs" />
          <Metric label="Size-based weight" value={`${o.dimWeightLb} lb`} sub="Box volume ÷ 139" />
          <Metric label="Carrier bills for" value={`${o.billableLb} lb`} sub="The higher of the two, rounded up" />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">In the box</p>
        <ul className="divide-y divide-slate-100 dark:divide-white/10 rounded-xl border border-slate-200 bg-white" data-testid="ff-order-lines">
          {o.lines.map((l, i) => {
            const ex = l.expiryDays !== undefined ? expiryStatus(l.expiryDays) : null;
            return (
              <li key={i} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{l.label}</p>
                  {l.lot && <p className="text-[12px] text-slate-500">Lot {l.lot} · expires in {l.expiryDays} days</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black tabular-nums">× {l.qty}</p>
                  {ex && ex.tone !== "success" && <Chip tone={ex.tone === "danger" ? "bottleneck" : "watch"} className="mt-1">{ex.label}</Chip>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const Metric = ({ label, value, sub, wide }: { label: string; value: string; sub?: string; wide?: boolean }) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white p-3 min-w-0", wide && "col-span-2")}>
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className="text-[15px] font-black text-slate-900 tabular-nums truncate">{value}</p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);

const PAGE = 12;

export function OrdersBoard({ orders, showClient = true, emptyHint }: { orders: Order[]; showClient?: boolean; emptyHint?: string }) {
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [riskOnly, setRiskOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [selId, setSelId] = useState<string | null>(null);
  const desktop = useDesktop();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const list = useMemo(() => {
    return orders
      .filter((o) => (tab === "all" || o.status === tab) && (!riskOnly || o.late))
      .sort((a, b) => Number(b.late) - Number(a.late) || b.hrsInStage - a.hrsInStage);
  }, [orders, tab, riskOnly]);

  useEffect(() => { setLimit(PAGE); }, [tab, riskOnly]);
  // On desktop keep the first order open so the panel is never empty.
  const selected = list.find((o) => o.id === selId) ?? (desktop ? list[0] : undefined);

  return (
    <div className="space-y-4" data-testid="ff-orders">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div role="tablist" aria-label="Order status" className="flex gap-1.5 overflow-x-auto no-scrollbar-on-mobile w-full sm:w-auto max-w-full p-0.5 -m-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-10 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:border-white/10",
              )}
              data-testid={`ff-tab-${t.id}`}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-700 min-h-10">
          <Switch checked={riskOnly} onCheckedChange={setRiskOnly} aria-label="Show only late orders" data-testid="ff-risk-only" />
          Late orders only
        </label>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-4 items-start">
        <div className="grid gap-2 xl:grid-cols-2 content-start">
          {list.length === 0 ? (
            <Card className="text-center py-10 xl:col-span-2" data-testid="ff-orders-empty">
              <Inbox className="w-8 h-8 mx-auto text-slate-400" aria-hidden />
              <p className="font-black text-slate-900 mt-2">No orders here</p>
              <p className="text-[13px] text-slate-500 mt-1">{emptyHint ?? (riskOnly ? "Nothing is late in this view. Turn off “Late orders only” to see everything." : "Orders appear here as they move through the warehouse.")}</p>
              {riskOnly && <Button variant="outline" className="mt-3" onClick={() => setRiskOnly(false)}>Show all orders</Button>}
            </Card>
          ) : (
            <>
              {list.slice(0, limit).map((o) => (
                <OrderRow key={o.id} o={o} showClient={showClient} selected={selected?.id === o.id} onSelect={() => setSelId(o.id)} />
              ))}
              {list.length > limit && (
                <Button variant="outline" className="w-full xl:col-span-2" onClick={() => setLimit((l) => l + PAGE)} data-testid="ff-orders-more">
                  Show {Math.min(PAGE, list.length - limit)} more ({list.length - limit} left)
                </Button>
              )}
            </>
          )}
        </div>

        {desktop && selected && (
          <Card className="lg:sticky lg:top-4" data-testid="ff-detail-panel">
            <OrderDetail o={selected} showClient={showClient} />
          </Card>
        )}
      </div>

      {!desktop && (
        <Sheet open={!!selId && !!list.find((o) => o.id === selId)} onOpenChange={(o) => !o && setSelId(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto" data-testid="ff-detail-sheet">
            <SheetHeader className="text-left sr-only">
              <SheetTitle>Order details</SheetTitle>
              <SheetDescription>Progress, timing and package details for the selected order.</SheetDescription>
            </SheetHeader>
            <div className="p-4 pt-10">{selected && <OrderDetail o={selected} showClient={showClient} />}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
