import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { 
  Database, 
  FileSpreadsheet, 
  BarChart, 
  CloudCog,
  CheckCircle2,
  Plug,
  ArrowRight,
  Search,
  MessageSquare,
  Mail,
  Box,
  ShoppingCart,
  CreditCard,
  Building,
  HardDrive
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONNECTOR_CATEGORIES = [
  { id: 'data', label: 'Data Sources' },
  { id: 'spreadsheet', label: 'Spreadsheets' },
  { id: 'bi', label: 'Business Intelligence' },
  { id: 'platform', label: 'Business Platforms' },
  { id: 'comm', label: 'Communication' }
];

const CONNECTORS = [
  // Spreadsheets
  { id: "excel", name: "Microsoft Excel", category: "spreadsheet", description: "Connect via OneDrive or upload static files directly.", icon: FileSpreadsheet, color: "text-green-600 bg-green-100", status: "connected", lastSync: "2 hours ago" },
  { id: "gsheets", name: "Google Sheets", category: "spreadsheet", description: "Live sync your Google Workspace spreadsheets.", icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-100", status: "available" },
  { id: "airtable", name: "Airtable", category: "spreadsheet", description: "Sync bases and grid views into datasets.", icon: Database, color: "text-yellow-500 bg-yellow-100", status: "available" },
  
  // Data Sources
  { id: "postgres", name: "PostgreSQL", category: "data", description: "Direct connection to your Postgres instance.", icon: Database, color: "text-blue-600 bg-blue-100", status: "available" },
  { id: "mysql", name: "MySQL", category: "data", description: "Connect to your MySQL databases.", icon: Database, color: "text-sky-600 bg-sky-100", status: "available" },
  { id: "snowflake", name: "Snowflake", category: "data", description: "Connect to your Snowflake data warehouse.", icon: CloudCog, color: "text-sky-500 bg-sky-100", status: "available" },
  { id: "bigquery", name: "BigQuery", category: "data", description: "Import datasets from Google BigQuery.", icon: HardDrive, color: "text-blue-500 bg-blue-100", status: "available" },
  { id: "redshift", name: "Amazon Redshift", category: "data", description: "Query your Redshift data clusters.", icon: Database, color: "text-orange-500 bg-orange-100", status: "available" },
  { id: "mongodb", name: "MongoDB", category: "data", description: "Connect your NoSQL document stores.", icon: Database, color: "text-green-500 bg-green-100", status: "available" },
  
  // BI
  { id: "powerbi", name: "Power BI", category: "bi", description: "Import datasets from your Power BI workspaces.", icon: BarChart, color: "text-yellow-600 bg-yellow-100", status: "available" },
  { id: "tableau", name: "Tableau", category: "bi", description: "Connect your Tableau Cloud data sources.", icon: CloudCog, color: "text-indigo-600 bg-indigo-100", status: "available" },
  { id: "looker", name: "Looker", category: "bi", description: "Import explores and views from Looker.", icon: BarChart, color: "text-purple-600 bg-purple-100", status: "available" },
  { id: "metabase", name: "Metabase", category: "bi", description: "Sync your Metabase questions and dashboards.", icon: BarChart, color: "text-blue-500 bg-blue-100", status: "available" },
  
  // Platforms
  { id: "shopify", name: "Shopify", category: "platform", description: "Sync orders, inventory, and fulfillment data.", icon: ShoppingCart, color: "text-emerald-500 bg-emerald-100", status: "connected", lastSync: "15 mins ago" },
  { id: "amazon", name: "Amazon Seller Central", category: "platform", description: "Import FBA inventory and sales data.", icon: ShoppingCart, color: "text-orange-500 bg-orange-100", status: "available" },
  { id: "stripe", name: "Stripe", category: "platform", description: "Import financial transaction and revenue metrics.", icon: CreditCard, color: "text-indigo-500 bg-indigo-100", status: "available" },
  { id: "salesforce", name: "Salesforce", category: "platform", description: "Connect CRM data and pipeline metrics.", icon: CloudCog, color: "text-sky-600 bg-sky-100", status: "available" },
  { id: "quickbooks", name: "QuickBooks", category: "platform", description: "Sync invoices, expenses, and accounting data.", icon: Building, color: "text-green-600 bg-green-100", status: "available" },
  { id: "hubspot", name: "HubSpot", category: "platform", description: "Import marketing and sales pipeline metrics.", icon: CloudCog, color: "text-orange-600 bg-orange-100", status: "available" },
  
  // Communication
  { id: "slack", name: "Slack", category: "comm", description: "Send alerts and scheduled reports to channels.", icon: MessageSquare, color: "text-purple-600 bg-purple-100", status: "available" },
  { id: "teams", name: "Microsoft Teams", category: "comm", description: "Post updates directly to Teams channels.", icon: MessageSquare, color: "text-indigo-600 bg-indigo-100", status: "available" },
  { id: "email", name: "Email Notifications", category: "comm", description: "Configure automated email report delivery.", icon: Mail, color: "text-slate-600 bg-slate-100", status: "connected", lastSync: "System Default" }
];

export default function ConnectorsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = (name: string) => {
    setIsConnecting(name);
    setTimeout(() => {
      setIsConnecting(null);
      toast({
        title: "Connection Successful",
        description: `${name} has been connected to your workspace.`,
      });
    }, 1500);
  };

  const filteredConnectors = useMemo(() => {
    return CONNECTORS.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || c.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Integration Hub</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                Connect external data sources to power your supply chain dashboards.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <Input 
                   placeholder="Search connectors..." 
                   className="pl-9 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-primary shadow-inner"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               <Button className="h-11 rounded-xl px-6 shadow-md shadow-primary/20 font-black text-[10px] uppercase tracking-widest">
                 <Plug className="w-4 h-4 mr-2" /> Custom API
               </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <div className="w-full lg:w-56 shrink-0 space-y-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-3">Categories</h3>
               <button
                 onClick={() => setActiveCategory('all')}
                 className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
               >
                 All Connectors
               </button>
               {CONNECTOR_CATEGORIES.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id)}
                   className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
                 >
                   {cat.label}
                 </button>
               ))}
            </div>

            {/* Grid */}
            <div className="flex-1">
              {filteredConnectors.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <Box className="w-16 h-16 mb-4 text-slate-300" />
                   <p className="font-bold text-sm uppercase tracking-widest">No connectors found.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredConnectors.map((connector) => (
                    <Card key={connector.id} className={`border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${connector.status === 'connected' ? 'border-primary/20 ring-1 ring-primary/5' : ''}`}>
                      {connector.status === 'connected' && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 border-b border-l border-emerald-100 text-emerald-600 flex justify-center items-center rounded-bl-3xl">
                          <CheckCircle2 className="w-5 h-5 -mt-2 -mr-2" />
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className={`w-14 h-14 rounded-2xl ${connector.color} flex items-center justify-center mb-4 shadow-sm border border-black/5`}>
                          <connector.icon className="w-7 h-7" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                          {connector.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 leading-relaxed mt-1">
                          {connector.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        {connector.status === 'connected' ? (
                          <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Connected</span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Sync: {connector.lastSync}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold shadow-sm">Configure</Button>
                          </div>
                        ) : (
                          <div className="mt-2 pt-4 border-t border-slate-50">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full bg-slate-50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 border border-slate-100 shadow-sm rounded-xl font-black text-[10px] uppercase tracking-widest h-10 group-hover:border-slate-300 transition-all">
                                  Connect <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${connector.color} flex items-center justify-center border border-black/5`}>
                                      <connector.icon className="w-5 h-5" />
                                    </div>
                                    Connect {connector.name}
                                  </DialogTitle>
                                  <DialogDescription className="font-medium text-slate-500">
                                    Configure your connection settings to import data.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  {connector.category === 'data' ? (
                                    <>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Host / Endpoint URL</label>
                                        <Input placeholder="e.g. db.example.com" className="rounded-lg bg-slate-50 border-slate-200" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</label>
                                          <Input placeholder="admin" className="rounded-lg bg-slate-50 border-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                                          <Input type="password" placeholder="••••••••" className="rounded-lg bg-slate-50 border-slate-200" />
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                      <p className="text-sm font-medium text-slate-600 mb-4">
                                        This requires secure OAuth authentication.
                                      </p>
                                      <Button variant="outline" className="rounded-xl shadow-sm font-bold border-slate-200 bg-white">
                                        Authenticate with {connector.name}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
                                  </DialogTrigger>
                                  <Button 
                                    onClick={() => handleConnect(connector.name)} 
                                    className="rounded-xl font-black text-xs uppercase tracking-widest shadow-md"
                                    disabled={isConnecting === connector.name}
                                  >
                                    {isConnecting === connector.name ? (
                                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    ) : <Plug className="w-4 h-4 mr-2" />}
                                    {isConnecting === connector.name ? 'Connecting...' : 'Test & Connect'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </AppLayout>
  );
}

function Clock({className}: {className?: string}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
