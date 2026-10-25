// Clients tab: the 3PL chooses what each client may see, then previews exactly
// that. A client only ever gets its own orders, stock and returns. Other
// clients' data is never included, and anything not shared shows as locked.
import { useState } from "react";
import { ArrowLeft, Eye, Lock, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFulfillmentStore, permsFor } from "@/hooks/use-fulfillment-store";
import { analyzeFulfillment, clientsFor, ordersForClient, type Client, type FulfillmentData, type SharePerms } from "@shared/fulfillment";
import { Card, Chip, SectionTitle } from "./parts";
import { InsightCard } from "./Overview";
import { OrdersBoard } from "./OrdersBoard";
import { ApparelReturns, ApparelStock, SupplementLots, Subscriptions } from "./NicheModules";

const PERM_LABELS: { key: keyof SharePerms; label: string; hint: string }[] = [
  { key: "orders", label: "Their orders", hint: "Status, timing and package details" },
  { key: "inventory", label: "Their stock", hint: "Stock, lots and subscriptions" },
  { key: "returns", label: "Their returns", hint: "Return orders and reasons" },
  { key: "insight", label: "Bottleneck insight", hint: "What's slowing their orders" },
];

function Locked({ what, clientName }: { what: string; clientName?: string }) {
  return (
    <Card className="text-center py-8" data-testid="ff-locked">
      <Lock className="w-6 h-6 mx-auto text-slate-400" aria-hidden />
      <p className="font-black text-slate-900 mt-2">{what} isn't shared with you</p>
      <p className="text-[13px] text-slate-500 mt-1">{clientName ? `Ask ${clientName} ` : "Ask "}your 3PL to turn this on if you'd like to see it.</p>
    </Card>
  );
}

export function ClientPreview({ client, data, perms, onExit }: { client: Client; data: FulfillmentData; perms: SharePerms; onExit: () => void }) {
  // Everything below is built from this client's own rows.
  const mine = ordersForClient(data, client.id).filter((o) => perms.returns || o.status !== "returns");
  const insight = analyzeFulfillment(data, client.id);
  const open = mine.filter((o) => o.status !== "shipped" && o.status !== "returns").length;
  const late = mine.filter((o) => o.late).length;
  const shipped = mine.filter((o) => o.status === "shipped").length;
  return (
    <div className="space-y-5" data-testid="ff-client-preview">
      <div className="rounded-2xl border border-info-line bg-info-soft p-3 sm:p-4 flex items-center gap-3 flex-wrap" role="status">
        <Eye className="w-5 h-5 text-info shrink-0" aria-hidden />
        <p className="text-sm text-slate-800 flex-1 min-w-[200px]"><span className="font-black">Previewing as {client.name}.</span> This is exactly what they would see. Nothing from other clients is included.</p>
        <Button variant="outline" size="sm" onClick={onExit} data-testid="ff-exit-preview"><ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden /> Back to my view</Button>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your 3PL's view for you</p>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{client.name}</h2>
      </div>

      {perms.orders && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[{ l: "Open orders", v: open }, { l: "Past their time limit", v: late, warn: late > 0 }, { l: "Shipped today", v: shipped }].map((k) => (
            <div key={k.l} className="rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-3">
              <p className={`text-2xl font-black tabular-nums ${k.warn ? "text-warning" : "text-slate-900"}`}>{k.v}</p>
              <p className="text-[12px] font-bold text-slate-600 leading-tight">{k.l}</p>
            </div>
          ))}
        </div>
      )}

      {perms.insight ? <InsightCard insight={insight} audience="client" /> : <Locked what="Bottleneck insight" />}

      <section className="space-y-3">
        <SectionTitle eyebrow="Orders" title="Your orders" />
        {perms.orders ? <OrdersBoard orders={mine} showClient={false} /> : <Locked what="Your orders" />}
      </section>

      <section className="space-y-3">
        <SectionTitle eyebrow={client.niche === "apparel" ? "Apparel" : "Supplements"} title="Stock and returns" />
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {perms.inventory
            ? client.niche === "apparel" ? <ApparelStock clientId={client.id} /> : <SupplementLots clientId={client.id} />
            : <Locked what="Your stock" />}
          {client.niche === "apparel"
            ? perms.returns ? <ApparelReturns clientId={client.id} /> : <Locked what="Your returns" />
            : perms.inventory ? <Subscriptions clientId={client.id} /> : <Locked what="Subscriptions" />}
        </div>
      </section>
    </div>
  );
}

export function ClientsTab({ data }: { data: FulfillmentData }) {
  const { perms, setPerm } = useFulfillmentStore();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const clients = clientsFor(data.niche);
  const preview = clients.find((c) => c.id === previewId);

  if (preview) return <ClientPreview client={preview} data={data} perms={permsFor(perms, preview.id)} onExit={() => setPreviewId(null)} />;

  return (
    <div className="space-y-5" data-testid="ff-clients">
      <Card className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden />
        <div>
          <h2 className="text-lg font-black text-slate-900">Share with your clients</h2>
          <p className="text-[13px] text-slate-600 mt-0.5 max-w-2xl">
            Choose what each client can see. They only ever see their own orders and stock, never another client's. Use “Preview” to see exactly what they would see.
          </p>
          <Badge variant="outline" className="mt-2">Preview only: sending real invitations is coming soon</Badge>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c) => {
          const p = permsFor(perms, c.id);
          const orders = ordersForClient(data, c.id);
          const late = orders.filter((o) => o.late).length;
          return (
            <Card key={c.id} className="space-y-4" data-testid={`ff-client-${c.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 truncate">{c.name}</h3>
                  <p className="text-[13px] text-slate-500">{c.blurb} · {orders.length} orders</p>
                </div>
                {late > 0 && <Chip tone="watch">{late} late</Chip>}
              </div>
              <ul className="space-y-1">
                {PERM_LABELS.map((pl) => (
                  <li key={pl.key}>
                    <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-800">{pl.label}</span>
                        <span className="block text-[11px] text-slate-500">{pl.hint}</span>
                      </span>
                      <Switch checked={p[pl.key]} onCheckedChange={(v) => setPerm(c.id, pl.key, v)} aria-label={`${pl.label} for ${c.name}`} data-testid={`ff-perm-${c.id}-${pl.key}`} />
                    </label>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setPreviewId(c.id)} data-testid={`ff-preview-${c.id}`}>
                <Eye className="w-4 h-4 mr-2" aria-hidden /> Preview as {c.name.split(" ")[0]}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
