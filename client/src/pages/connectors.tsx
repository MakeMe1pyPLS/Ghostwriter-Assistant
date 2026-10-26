import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Database,
  FileSpreadsheet,
  BarChart,
  CloudCog,
  CheckCircle2,
  Clock,
  Plug,
  ArrowRight,
  Search,
  MessageSquare,
  Mail,
  Box,
  ShoppingCart,
  CreditCard,
  Building,
  HardDrive,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

// Honesty rule: a tile says "Works now" only when the feature really runs.
// Everything else says "Coming soon" and has no Connect button.
//   file : runs in the browser (file import)
//   chat : posts through the API server, so it only works when a server is reachable
//   soon : not built yet
type Kind = "file" | "chat" | "soon";

const SERVER_READY = Boolean((import.meta as any).env?.DEV) || API_BASE !== "";

const CONNECTOR_CATEGORIES = [
  { id: "data", label: "Data Sources" },
  { id: "spreadsheet", label: "Spreadsheets" },
  { id: "bi", label: "Business Intelligence" },
  { id: "platform", label: "Business Platforms" },
  { id: "comm", label: "Communication" },
];

type Connector = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  kind: Kind;
};

const CONNECTORS: Connector[] = [
  { id: "files", name: "Excel, CSV & JSON files", category: "spreadsheet", description: "Upload a .xlsx, .csv or .json file from your computer. Live OneDrive sync is coming soon.", icon: FileSpreadsheet, color: "text-green-700 bg-green-100", kind: "file" },
  { id: "slack", name: "Slack", category: "comm", description: "Send updates to a channel with a webhook you add in Settings.", icon: MessageSquare, color: "text-purple-600 bg-purple-100", kind: "chat" },
  { id: "teams", name: "Microsoft Teams", category: "comm", description: "Send updates to a channel with a webhook you add in Settings.", icon: MessageSquare, color: "text-indigo-600 bg-indigo-100", kind: "chat" },
  { id: "gchat", name: "Google Chat", category: "comm", description: "Send updates to a space with a webhook you add in Settings.", icon: MessageSquare, color: "text-emerald-700 bg-emerald-100", kind: "chat" },
  { id: "gsheets", name: "Google Sheets", category: "spreadsheet", description: "Live sync your Google Workspace spreadsheets.", icon: FileSpreadsheet, color: "text-emerald-700 bg-emerald-100", kind: "soon" },
  { id: "airtable", name: "Airtable", category: "spreadsheet", description: "Sync bases and grid views into datasets.", icon: Database, color: "text-yellow-700 bg-yellow-100", kind: "soon" },
  { id: "postgres", name: "PostgreSQL", category: "data", description: "Direct connection to your Postgres instance.", icon: Database, color: "text-blue-700 bg-blue-100", kind: "soon" },
  { id: "mysql", name: "MySQL", category: "data", description: "Connect to your MySQL databases.", icon: Database, color: "text-sky-700 bg-sky-100", kind: "soon" },
  { id: "snowflake", name: "Snowflake", category: "data", description: "Connect to your Snowflake data warehouse.", icon: CloudCog, color: "text-sky-700 bg-sky-100", kind: "soon" },
  { id: "bigquery", name: "BigQuery", category: "data", description: "Import datasets from Google BigQuery.", icon: HardDrive, color: "text-blue-700 bg-blue-100", kind: "soon" },
  { id: "redshift", name: "Amazon Redshift", category: "data", description: "Query your Redshift data clusters.", icon: Database, color: "text-orange-700 bg-orange-100", kind: "soon" },
  { id: "mongodb", name: "MongoDB", category: "data", description: "Connect your NoSQL document stores.", icon: Database, color: "text-green-700 bg-green-100", kind: "soon" },
  { id: "customapi", name: "Custom API", category: "data", description: "Send dashboard data to your own endpoint.", icon: Plug, color: "text-violet-700 bg-violet-100", kind: "soon" },
  { id: "powerbi", name: "Power BI", category: "bi", description: "Import datasets from your Power BI workspaces.", icon: BarChart, color: "text-yellow-700 bg-yellow-100", kind: "soon" },
  { id: "tableau", name: "Tableau", category: "bi", description: "Connect your Tableau Cloud data sources.", icon: CloudCog, color: "text-indigo-700 bg-indigo-100", kind: "soon" },
  { id: "looker", name: "Looker", category: "bi", description: "Import explores and views from Looker.", icon: BarChart, color: "text-purple-700 bg-purple-100", kind: "soon" },
  { id: "metabase", name: "Metabase", category: "bi", description: "Sync your Metabase questions and dashboards.", icon: BarChart, color: "text-blue-700 bg-blue-100", kind: "soon" },
  { id: "shopify", name: "Shopify", category: "platform", description: "Sync orders, inventory, and fulfillment data.", icon: ShoppingCart, color: "text-emerald-700 bg-emerald-100", kind: "soon" },
  { id: "amazon", name: "Amazon Seller Central", category: "platform", description: "Import FBA inventory and sales data.", icon: ShoppingCart, color: "text-orange-700 bg-orange-100", kind: "soon" },
  { id: "stripe", name: "Stripe", category: "platform", description: "Import financial transaction and revenue metrics.", icon: CreditCard, color: "text-indigo-700 bg-indigo-100", kind: "soon" },
  { id: "salesforce", name: "Salesforce", category: "platform", description: "Connect CRM data and pipeline metrics.", icon: CloudCog, color: "text-sky-700 bg-sky-100", kind: "soon" },
  { id: "quickbooks", name: "QuickBooks", category: "platform", description: "Sync invoices, expenses, and accounting data.", icon: Building, color: "text-green-700 bg-green-100", kind: "soon" },
  { id: "hubspot", name: "HubSpot", category: "platform", description: "Import marketing and sales pipeline metrics.", icon: CloudCog, color: "text-orange-700 bg-orange-100", kind: "soon" },
  { id: "email", name: "Email Notifications", category: "comm", description: "Automated email report delivery.", icon: Mail, color: "text-slate-700 bg-slate-100", kind: "soon" },
];

/** What a tile really does right now. Chat tiles need the API server. */
function effectiveKind(c: Connector): Kind {
  if (c.kind === "chat" && !SERVER_READY) return "soon";
  return c.kind;
}

function StatusChip({ works }: { works: boolean }) {
  return works ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Works now
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <Clock className="w-3.5 h-3.5" aria-hidden /> Coming soon
    </span>
  );
}

export default function ConnectorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredConnectors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return CONNECTORS.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "all" || c.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
      // Things that work go first. Array.sort is stable, so the rest keep their order.
      .sort((a, b) => Number(effectiveKind(b) !== "soon") - Number(effectiveKind(a) !== "soon"));
  }, [searchQuery, activeCategory]);

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-6 md:py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-hub-title">Integration Hub</h1>
              <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-2">
                File import works today. Anything marked Coming soon isn't built yet.
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                placeholder="Search connectors..."
                aria-label="Search connectors"
                className="pl-9 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-primary shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-connectors"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-56 shrink-0 space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-3">Categories</h3>
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full text-left px-4 py-2.5 min-h-10 rounded-xl text-sm font-bold transition-all ${activeCategory === "all" ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}
              >
                All Connectors
              </button>
              {CONNECTOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-4 py-2.5 min-h-10 rounded-xl text-sm font-bold transition-all ${activeCategory === cat.id ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex-1">
              {filteredConnectors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Box className="w-16 h-16 mb-4 text-slate-300" aria-hidden />
                  <p className="font-bold text-sm uppercase tracking-widest">No connectors found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredConnectors.map((connector) => {
                    const kind = effectiveKind(connector);
                    const works = kind !== "soon";
                    return (
                      <Card key={connector.id} className={`border-slate-200 shadow-sm transition-all flex flex-col ${works ? "hover:shadow-md border-primary/20 ring-1 ring-primary/5" : ""}`} data-testid={`connector-${connector.id}`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className={`w-14 h-14 rounded-2xl ${connector.color} flex items-center justify-center shadow-sm border border-black/5`}>
                              <connector.icon className="w-7 h-7" aria-hidden />
                            </div>
                            <StatusChip works={works} />
                          </div>
                          <CardTitle className="text-lg font-black tracking-tight text-slate-900">{connector.name}</CardTitle>
                          <CardDescription className="text-xs font-medium text-slate-600 leading-relaxed mt-1">
                            {connector.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                          <div className="pt-4 border-t border-slate-100">
                            {kind === "file" && (
                              <Button asChild className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-10 shadow-md">
                                <Link href="/data">Import a file <ArrowRight className="w-3.5 h-3.5 ml-2" aria-hidden /></Link>
                              </Button>
                            )}
                            {kind === "chat" && (
                              <Button asChild variant="secondary" className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border border-slate-200 shadow-sm">
                                <Link href="/settings">Set up in Settings <ArrowRight className="w-3.5 h-3.5 ml-2" aria-hidden /></Link>
                              </Button>
                            )}
                            {kind === "soon" && (
                              <Button disabled variant="secondary" className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border border-slate-100">
                                Coming soon
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
