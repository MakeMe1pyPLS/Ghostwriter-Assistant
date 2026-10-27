// Fulfillment (prototype): for 3PLs and the e-commerce brands they serve.
// Overview (flow, zone health, AI insight), Orders board, Load check and the
// shared Clients view, with Apparel and Supplements as the two niches.
// All data is sample data and the analyst is the built-in rule-based one.
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { LayoutGrid, ListChecks, Truck, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/motion";
import { cn } from "@/lib/utils";
import { useFulfillmentStore } from "@/hooks/use-fulfillment-store";
import { NICHES, analyzeFulfillment, getFulfillmentData, type ZoneId } from "@shared/fulfillment";
import { Overview } from "@/components/fulfillment/Overview";
import { OrdersBoard } from "@/components/fulfillment/OrdersBoard";
import { LoadCheck } from "@/components/fulfillment/LoadCheck";
import { ClientsTab } from "@/components/fulfillment/ClientView";
import { NicheModules } from "@/components/fulfillment/NicheModules";
import { SampleBadge } from "@/components/fulfillment/parts";

const TAB_DEFS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: ListChecks },
  { id: "load", label: "Load check", icon: Truck },
  { id: "clients", label: "Clients", icon: Users },
] as const;

export default function FulfillmentPage() {
  const niche = useFulfillmentStore((s) => s.niche);
  const setNiche = useFulfillmentStore((s) => s.setNiche);
  const [tab, setTab] = useState<(typeof TAB_DEFS)[number]["id"]>("overview");
  const [zone, setZone] = useState<ZoneId | null>(null);
  const data = useMemo(() => getFulfillmentData(niche), [niche]);
  const insight = useMemo(() => analyzeFulfillment(data), [data]);

  return (
    <AppLayout>
      <PageTransition className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <p className="text-xs font-bold text-primary">Operate</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3 flex-wrap">Fulfillment <SampleBadge /></h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              See where orders get stuck, what to do about it, and share the right numbers with each client. This is a prototype running on sample data.
            </p>
          </div>
          <div role="radiogroup" aria-label="Business type" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 self-start sm:self-auto shrink-0" data-testid="ff-niche">
            {NICHES.map((n) => (
              <button
                key={n.id}
                role="radio"
                aria-checked={niche === n.id}
                onClick={() => { setNiche(n.id); setZone(null); }}
                title={n.blurb}
                className={cn(
                  "h-10 px-4 rounded-lg text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  niche === n.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5",
                )}
                data-testid={`ff-niche-${n.id}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap" aria-label="Fulfillment sections">
            {TAB_DEFS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={cn(
                  "h-14 sm:h-10 px-1 sm:px-4 rounded-2xl sm:rounded-full border text-[12px] sm:text-[13px] font-bold whitespace-nowrap inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-white dark:bg-white/5 dark:border-white/10 dark:text-slate-200",
                )}
                data-testid={`ff-tab-main-${t.id}`}
              >
                <t.icon className="w-4 h-4" aria-hidden /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-6 focus-visible:outline-none">
            <Overview data={data} insight={insight} selectedId={zone} onSelect={setZone} />
            <NicheModules niche={niche} />
          </TabsContent>
          <TabsContent value="orders" className="mt-5 focus-visible:outline-none">
            <OrdersBoard orders={data.orders} />
          </TabsContent>
          <TabsContent value="load" className="mt-5 focus-visible:outline-none">
            <LoadCheck />
          </TabsContent>
          <TabsContent value="clients" className="mt-5 focus-visible:outline-none">
            <ClientsTab data={data} />
          </TabsContent>
        </Tabs>
      </PageTransition>
    </AppLayout>
  );
}
