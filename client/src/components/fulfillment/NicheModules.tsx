// Niche modules. Apparel: size and color stock, returns by reason.
// Supplements: lots by expiry (first-expiry, first-out) and subscriptions.
// Each takes an optional clientId so a client only ever sees its own share.
import { AlertTriangle, CalendarClock, OctagonAlert, Repeat, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APPAREL_SIZES, LOW_STOCK, apparelReturnsFor, apparelStockFor, expiryStatus, lotsFor, subscriptionsFor, CLIENTS,
} from "@shared/fulfillment";
import { Card, Chip, SectionTitle } from "./parts";

export function ApparelStock({ clientId }: { clientId?: string }) {
  const rows = apparelStockFor(clientId);
  return (
    <Card className="space-y-3" data-testid="ff-apparel-stock">
      <SectionTitle eyebrow="Apparel" title="Stock by size and color" />
      <p className="text-[13px] text-slate-600">Units on the shelf. Anything under {LOW_STOCK} is flagged so you can restock before it sells out.</p>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[360px]">
          <caption className="sr-only">Units on hand by color and size</caption>
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              <th scope="col" className="text-left p-2 font-black">Color</th>
              {APPAREL_SIZES.map((s) => <th key={s} scope="col" className="p-2 text-center font-black">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.color} className="border-t border-slate-100 dark:border-white/10">
                <th scope="row" className="text-left p-2 font-bold text-slate-800">{r.color}</th>
                {APPAREL_SIZES.map((s) => {
                  const n = r.sizes[s];
                  const out = n === 0;
                  const low = !out && n < LOW_STOCK;
                  return (
                    <td key={s} className="p-1 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center gap-1 min-w-[48px] h-9 rounded-lg px-1.5 font-black tabular-nums text-[13px]",
                          out ? "bg-danger-soft text-danger border border-danger-line" : low ? "bg-warning-soft text-warning border border-warning-line" : "text-slate-800",
                        )}
                        data-testid={out ? "ff-stock-out" : low ? "ff-stock-low" : undefined}
                      >
                        {out ? <><OctagonAlert className="w-3 h-3" aria-hidden /> Out</> : low ? <><AlertTriangle className="w-3 h-3" aria-hidden /> {n}</> : n}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 flex-wrap text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden /> Low (under {LOW_STOCK})</span>
        <span className="inline-flex items-center gap-1"><OctagonAlert className="w-3.5 h-3.5 text-danger" aria-hidden /> Out of stock</span>
      </div>
    </Card>
  );
}

export function ApparelReturns({ clientId }: { clientId?: string }) {
  const rows = apparelReturnsFor(clientId);
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(...rows.map((r) => r.count), 1);
  const size = rows.filter((r) => r.reason.startsWith("Too ")).reduce((s, r) => s + r.count, 0);
  const pct = total ? Math.round((size / total) * 100) : 0;
  return (
    <Card className="space-y-3" data-testid="ff-apparel-returns">
      <SectionTitle eyebrow="Apparel" title="Returns by reason" />
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.reason}>
            <div className="flex justify-between text-[13px] font-bold text-slate-700 mb-1">
              <span>{r.reason}</span>
              <span className="tabular-nums">{r.count} · {total ? Math.round((r.count / total) * 100) : 0}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className={cn("h-full rounded-full", r.reason.startsWith("Too ") ? "bg-teal-700 dark:bg-teal-400" : "bg-slate-400 dark:bg-slate-500")} style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-400/30 dark:bg-teal-400/10 p-3 flex items-start gap-2">
        <Ruler className="w-4 h-4 text-teal-700 dark:text-teal-300 mt-0.5 shrink-0" aria-hidden />
        <p className="text-sm text-slate-800"><span className="font-black">{pct}% of returns are about size.</span> Adding a size chart and fit notes to the product page is the cheapest way to bring that down.</p>
      </div>
    </Card>
  );
}

export function SupplementLots({ clientId }: { clientId?: string }) {
  const lots = lotsFor(clientId);
  return (
    <Card className="space-y-3" data-testid="ff-lots">
      <SectionTitle eyebrow="Supplements" title="Lots, oldest expiry first" />
      <p className="text-[13px] text-slate-600">Ship the lot that expires first. Lots under 30 days say “Ship first”.</p>
      {lots.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No lots on the shelf for this client yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/10 rounded-xl border border-slate-200 bg-white">
          {lots.map((l) => {
            const s = expiryStatus(l.expiryDays, l.hold);
            const tone = s.tone === "danger" ? "bottleneck" : s.tone === "warning" ? "watch" : s.tone === "info" ? "info" : "ok";
            return (
              <li key={l.lot} className="p-3 flex items-start justify-between gap-3" data-testid={`ff-lot-${l.lot}`}>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{l.product}</p>
                  <p className="text-[12px] text-slate-500">Lot {l.lot} · {l.units.toLocaleString()} units · shelf {l.location}{!clientId && ` · ${CLIENTS.find((c) => c.id === l.clientId)?.name}`}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black tabular-nums text-slate-900">{l.expiryDays} days</p>
                  <Chip tone={tone} className="mt-0.5">{s.label}</Chip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function Subscriptions({ clientId }: { clientId?: string }) {
  const s = subscriptionsFor(clientId);
  const max = Math.max(...s.perDay, 1);
  const labels = ["Today", "+1", "+2", "+3", "+4", "+5", "+6"];
  return (
    <Card className="space-y-3" data-testid="ff-subs">
      <SectionTitle eyebrow="Supplements" title="Subscription boxes" />
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Active subscribers", v: s.active.toLocaleString() },
          { l: "Boxes, next 7 days", v: s.next7Days.toLocaleString() },
          { l: "Skip rate", v: `${s.skipRatePct}%` },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xl font-black tabular-nums text-slate-900">{k.v}</p>
            <p className="text-[11px] font-bold text-slate-500 leading-tight">{k.l}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" aria-hidden /> Boxes to ship each day</p>
        <div className="flex items-end gap-1.5 h-24" role="img" aria-label={`Boxes per day for the next 7 days: ${s.perDay.join(", ")}`}>
          {s.perDay.map((n, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[11px] font-bold tabular-nums text-slate-600">{n}</span>
              <div className="w-full rounded-t-md bg-teal-700 dark:bg-teal-400" style={{ height: `${(n / max) * 70}%`, minHeight: 4 }} />
              <span className="text-[10px] text-slate-500">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-slate-500 flex items-start gap-1.5"><Repeat className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden /> Plan labor for the busiest day, not the average.</p>
    </Card>
  );
}

export function NicheModules({ niche, clientId }: { niche: "apparel" | "supplements"; clientId?: string }) {
  return niche === "apparel" ? (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <ApparelStock clientId={clientId} />
      <ApparelReturns clientId={clientId} />
    </div>
  ) : (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <SupplementLots clientId={clientId} />
      <Subscriptions clientId={clientId} />
    </div>
  );
}
