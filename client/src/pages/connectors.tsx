import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
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
  HardDrive,
  X,
  Send,
  Save,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
  Loader2,
  Shield,
  Code2,
  FileJson,
  ChevronDown,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const CONNECTOR_CATEGORIES = [
  { id: 'data', label: 'Data Sources' },
  { id: 'spreadsheet', label: 'Spreadsheets' },
  { id: 'bi', label: 'Business Intelligence' },
  { id: 'platform', label: 'Business Platforms' },
  { id: 'comm', label: 'Communication' }
];

const CONNECTORS = [
  { id: "excel", name: "Microsoft Excel", category: "spreadsheet", description: "Connect via OneDrive or upload static files directly.", icon: FileSpreadsheet, color: "text-green-600 bg-green-100", status: "connected", lastSync: "2 hours ago" },
  { id: "gsheets", name: "Google Sheets", category: "spreadsheet", description: "Live sync your Google Workspace spreadsheets.", icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-100", status: "available" },
  { id: "airtable", name: "Airtable", category: "spreadsheet", description: "Sync bases and grid views into datasets.", icon: Database, color: "text-yellow-500 bg-yellow-100", status: "available" },
  { id: "postgres", name: "PostgreSQL", category: "data", description: "Direct connection to your Postgres instance.", icon: Database, color: "text-blue-600 bg-blue-100", status: "available" },
  { id: "mysql", name: "MySQL", category: "data", description: "Connect to your MySQL databases.", icon: Database, color: "text-sky-600 bg-sky-100", status: "available" },
  { id: "snowflake", name: "Snowflake", category: "data", description: "Connect to your Snowflake data warehouse.", icon: CloudCog, color: "text-sky-500 bg-sky-100", status: "available" },
  { id: "bigquery", name: "BigQuery", category: "data", description: "Import datasets from Google BigQuery.", icon: HardDrive, color: "text-blue-500 bg-blue-100", status: "available" },
  { id: "redshift", name: "Amazon Redshift", category: "data", description: "Query your Redshift data clusters.", icon: Database, color: "text-orange-500 bg-orange-100", status: "available" },
  { id: "mongodb", name: "MongoDB", category: "data", description: "Connect your NoSQL document stores.", icon: Database, color: "text-green-500 bg-green-100", status: "available" },
  { id: "powerbi", name: "Power BI", category: "bi", description: "Import datasets from your Power BI workspaces.", icon: BarChart, color: "text-yellow-600 bg-yellow-100", status: "available" },
  { id: "tableau", name: "Tableau", category: "bi", description: "Connect your Tableau Cloud data sources.", icon: CloudCog, color: "text-indigo-600 bg-indigo-100", status: "available" },
  { id: "looker", name: "Looker", category: "bi", description: "Import explores and views from Looker.", icon: BarChart, color: "text-purple-600 bg-purple-100", status: "available" },
  { id: "metabase", name: "Metabase", category: "bi", description: "Sync your Metabase questions and dashboards.", icon: BarChart, color: "text-blue-500 bg-blue-100", status: "available" },
  { id: "shopify", name: "Shopify", category: "platform", description: "Sync orders, inventory, and fulfillment data.", icon: ShoppingCart, color: "text-emerald-500 bg-emerald-100", status: "connected", lastSync: "15 mins ago" },
  { id: "amazon", name: "Amazon Seller Central", category: "platform", description: "Import FBA inventory and sales data.", icon: ShoppingCart, color: "text-orange-500 bg-orange-100", status: "available" },
  { id: "stripe", name: "Stripe", category: "platform", description: "Import financial transaction and revenue metrics.", icon: CreditCard, color: "text-indigo-500 bg-indigo-100", status: "available" },
  { id: "salesforce", name: "Salesforce", category: "platform", description: "Connect CRM data and pipeline metrics.", icon: CloudCog, color: "text-sky-600 bg-sky-100", status: "available" },
  { id: "quickbooks", name: "QuickBooks", category: "platform", description: "Sync invoices, expenses, and accounting data.", icon: Building, color: "text-green-600 bg-green-100", status: "available" },
  { id: "hubspot", name: "HubSpot", category: "platform", description: "Import marketing and sales pipeline metrics.", icon: CloudCog, color: "text-orange-600 bg-orange-100", status: "available" },
  { id: "slack", name: "Slack", category: "comm", description: "Send alerts and scheduled reports to channels.", icon: MessageSquare, color: "text-purple-600 bg-purple-100", status: "available" },
  { id: "teams", name: "Microsoft Teams", category: "comm", description: "Post updates directly to Teams channels.", icon: MessageSquare, color: "text-indigo-600 bg-indigo-100", status: "available" },
  { id: "email", name: "Email Notifications", category: "comm", description: "Configure automated email report delivery.", icon: Mail, color: "text-slate-600 bg-slate-100", status: "connected", lastSync: "System Default" }
];

const PAYLOAD_TYPES = [
  { id: 'dashboard-spec', label: 'Dashboard Spec JSON', desc: 'Full dashboard configuration including widgets, layout, and theme' },
  { id: 'dataset', label: 'Dataset JSON', desc: 'Raw KPI data and time-series values' },
  { id: 'metrics-summary', label: 'Metrics Summary', desc: 'Condensed metrics with trend data' },
  { id: 'custom', label: 'Custom JSON', desc: 'Write your own payload body' }
];

function generatePayload(type: string): object {
  if (type === 'dashboard-spec') {
    return {
      meta: { title: "Supply Chain Dashboard", platform: "ChainInsideIQ", version: "1.0", generated_at: new Date().toISOString() },
      widgets: [
        { id: "kpi-revenue", type: "kpi", label: "Revenue", value: "$124,500", trend: "+12.5%" },
        { id: "kpi-orders", type: "kpi", label: "Orders", value: "1,450", trend: "+8.2%" },
        { id: "trend-chart", type: "trend", title: "Revenue Trend", data_points: 10 },
        { id: "donut-channels", type: "donut", title: "Channel Distribution", segments: 3 }
      ],
      layout: { columns: 12, breakpoint: "lg" },
      theme: { primary: "#0F766E", mode: "light" }
    };
  }
  if (type === 'dataset') {
    return {
      sector: "ecommerce",
      period: { start: "2026-02-13", end: "2026-03-13", range: "30d" },
      metrics: [
        { label: "Revenue", value: 124500, unit: "USD", trend_pct: 12.5, direction: "up" },
        { label: "Orders", value: 1450, unit: "count", trend_pct: 8.2, direction: "up" },
        { label: "AOV", value: 84.20, unit: "USD", trend_pct: -2.1, direction: "down" },
        { label: "Conversion Rate", value: 3.2, unit: "percent", trend_pct: 0.4, direction: "up" }
      ],
      timeseries: [
        { date: "2026-03-07", revenue: 18200, orders: 215 },
        { date: "2026-03-08", revenue: 19400, orders: 228 },
        { date: "2026-03-09", revenue: 17100, orders: 198 },
        { date: "2026-03-10", revenue: 21300, orders: 252 }
      ]
    };
  }
  if (type === 'metrics-summary') {
    return {
      summary: { sector: "ecommerce", generated_at: new Date().toISOString(), total_kpis: 6 },
      highlights: [
        { kpi: "Revenue", status: "strong", value: "$124,500", change: "+12.5%" },
        { kpi: "Orders", status: "strong", value: "1,450", change: "+8.2%" },
        { kpi: "AOV", status: "watch", value: "$84.20", change: "-2.1%" },
        { kpi: "Conversion Rate", status: "stable", value: "3.2%", change: "+0.4%" }
      ],
      risk_flags: ["AOV trending down — review pricing strategy"]
    };
  }
  return { message: "Custom payload — edit to match your API schema", data: {} };
}

interface SavedIntegration {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  payloadType: string;
  savedAt: string;
}

function CustomApiDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("POST");
  const [apiKey, setApiKey] = useState("");
  const [useBearerToken, setUseBearerToken] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [customHeaders, setCustomHeaders] = useState("");
  const [payloadType, setPayloadType] = useState("dashboard-spec");
  const [customPayload, setCustomPayload] = useState("{\n  \n}");
  const [showPreview, setShowPreview] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const payload = payloadType === 'custom' ? customPayload : JSON.stringify(generatePayload(payloadType), null, 2);

  const handleTestConnection = async () => {
    if (!endpoint.trim()) {
      toast({ title: "Endpoint required", description: "Enter an API endpoint URL to test.", variant: "destructive" });
      return;
    }
    setTestingConnection(true);
    setConnectionResult(null);
    await new Promise(r => setTimeout(r, 1500));
    const success = endpoint.startsWith("http");
    setConnectionResult(success ? 'success' : 'error');
    setTestingConnection(false);
    toast({
      title: success ? "Connection test successful" : "Connection failed",
      description: success ? `Endpoint ${endpoint} is reachable.` : "Could not reach endpoint. Check the URL and try again.",
      variant: success ? "default" : "destructive"
    });
  };

  const handleSendTestRequest = async () => {
    if (!endpoint.trim()) {
      toast({ title: "Endpoint required", description: "Enter an API endpoint URL.", variant: "destructive" });
      return;
    }
    setSendingRequest(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/export/custom-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          method,
          apiKey: apiKey || undefined,
          payload: JSON.parse(payload)
        })
      });
      const data = await res.json();
      setSendResult(data);
      toast({ title: "Payload sent successfully", description: data.message });
    } catch {
      setSendResult({ success: false, message: "Request failed." });
      toast({ title: "Request failed", description: "Could not complete the test request.", variant: "destructive" });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your integration a name.", variant: "destructive" });
      return;
    }
    if (!endpoint.trim()) {
      toast({ title: "Endpoint required", description: "Enter an API endpoint URL.", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const integration: SavedIntegration = {
        id: `api-${Date.now()}`,
        name,
        endpoint,
        method,
        payloadType,
        savedAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('chainiq_custom_apis') || '[]');
      existing.push(integration);
      localStorage.setItem('chainiq_custom_apis', JSON.stringify(existing));
      setSaving(false);
      toast({ title: "Custom API integration saved", description: `"${name}" has been saved and can be used for future exports.` });
      onClose();
    }, 800);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payload);
    toast({ title: "Copied", description: "Payload JSON copied to clipboard." });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-slate-900 text-white px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                    <Plug className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight">Custom API Integration</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Connect to your external systems</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors" data-testid="button-close-api-drawer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connection Details</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Integration Name</Label>
                  <Input placeholder="e.g. Warehouse ERP Sync" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 h-10" data-testid="input-integration-name" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">API Endpoint URL</Label>
                  <Input placeholder="https://api.yourcompany.com/v1/ingest" value={endpoint} onChange={(e) => { setEndpoint(e.target.value); setConnectionResult(null); }} className="rounded-xl bg-slate-50 border-slate-200 h-10 font-mono text-sm" data-testid="input-api-endpoint" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Request Method</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['GET', 'POST', 'PUT', 'PATCH'].map(m => (
                      <button key={m} onClick={() => setMethod(m)} className={`h-9 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${method === m ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`} data-testid={`button-method-${m.toLowerCase()}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-100" />

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authentication</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">API Key</Label>
                  <div className="relative">
                    <Input type={showApiKey ? "text" : "password"} placeholder="sk-xxxx-xxxx-xxxx" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 h-10 pr-10 font-mono text-sm" data-testid="input-api-key" />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 cursor-pointer">Send as Bearer Token</Label>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sends API key in Authorization header</p>
                  </div>
                  <Switch checked={useBearerToken} onCheckedChange={setUseBearerToken} data-testid="switch-bearer" />
                </div>

                <div>
                  <button onClick={() => setShowHeaders(!showHeaders)} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline" data-testid="button-toggle-headers">
                    <Plus className="w-3 h-3" /> {showHeaders ? 'Hide' : 'Add'} Custom Headers
                  </button>
                  {showHeaders && (
                    <div className="mt-3 space-y-2">
                      <Textarea placeholder={'X-Custom-Header: value\nX-Org-Id: org_123'} value={customHeaders} onChange={(e) => setCustomHeaders(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-xs min-h-[80px]" data-testid="textarea-headers" />
                      <p className="text-[10px] text-slate-400">One header per line in Key: Value format</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t border-slate-100" />

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payload Configuration</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Payload Type</Label>
                  <div className="space-y-2">
                    {PAYLOAD_TYPES.map(pt => (
                      <button key={pt.id} onClick={() => setPayloadType(pt.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${payloadType === pt.id ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/10' : 'bg-white border-slate-200 hover:border-slate-300'}`} data-testid={`button-payload-${pt.id}`}>
                        <div className="text-xs font-bold text-slate-900">{pt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{pt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {payloadType === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Custom Payload</Label>
                    <Textarea value={customPayload} onChange={(e) => setCustomPayload(e.target.value)} className="rounded-xl bg-slate-900 text-slate-300 border-slate-700 font-mono text-xs min-h-[140px]" data-testid="textarea-custom-payload" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-xs font-bold text-slate-600" data-testid="button-toggle-preview">
                      {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    <button onClick={handleCopyPayload} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors" data-testid="button-copy-payload">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  {showPreview && payloadType !== 'custom' && (
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-300 text-[11px] p-4 rounded-xl overflow-auto max-h-[200px] font-mono leading-relaxed border border-slate-800">
                        {payload}
                      </pre>
                    </div>
                  )}
                </div>
              </section>

              {(connectionResult || sendResult) && (
                <>
                  <div className="border-t border-slate-100" />
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Results</h3>
                    {connectionResult && (
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${connectionResult === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        {connectionResult === 'success' ? <Wifi className="w-4 h-4 text-emerald-600 shrink-0" /> : <WifiOff className="w-4 h-4 text-red-600 shrink-0" />}
                        <div>
                          <p className="text-xs font-bold text-slate-900">{connectionResult === 'success' ? 'Connection successful' : 'Connection failed'}</p>
                          <p className="text-[10px] text-slate-500">{connectionResult === 'success' ? 'Endpoint is reachable and responding.' : 'Check URL format and try again.'}</p>
                        </div>
                      </div>
                    )}
                    {sendResult && (
                      <div className={`p-3 rounded-xl border ${sendResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {sendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                          <p className="text-xs font-bold text-slate-900">{sendResult.success ? 'Payload sent successfully' : 'Send failed'}</p>
                        </div>
                        <p className="text-[10px] text-slate-500">{sendResult.message}</p>
                        {sendResult.payload_size && <p className="text-[10px] text-slate-400 mt-1">Payload size: {sendResult.payload_size} bytes</p>}
                        {sendResult.note && <p className="text-[10px] text-slate-400 mt-1 italic">{sendResult.note}</p>}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4 shrink-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection} className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border-slate-200 shadow-sm" data-testid="button-test-connection">
                  {testingConnection ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Wifi className="w-3.5 h-3.5 mr-2" />}
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button variant="outline" onClick={handleSendTestRequest} disabled={sendingRequest} className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border-slate-200 shadow-sm" data-testid="button-send-test">
                  {sendingRequest ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                  {sendingRequest ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-xs h-10" data-testid="button-cancel-api">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 shadow-md shadow-primary/20" data-testid="button-save-integration">
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                  {saving ? 'Saving...' : 'Save Integration'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ConnectorsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [customApiOpen, setCustomApiOpen] = useState(false);

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
        <div className="bg-white border-b border-slate-200 px-8 py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-hub-title">Integration Hub</h1>
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
                  data-testid="input-search-connectors"
                />
              </div>
              <Button
                onClick={() => setCustomApiOpen(true)}
                className="h-11 rounded-xl px-6 shadow-md shadow-primary/20 font-black text-[10px] uppercase tracking-widest"
                data-testid="button-custom-api"
              >
                <Plug className="w-4 h-4 mr-2" /> Custom API
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
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
                                <ClockIcon className="w-3 h-3" /> Sync: {connector.lastSync}
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
      <CustomApiDrawer open={customApiOpen} onClose={() => setCustomApiOpen(false)} />
    </AppLayout>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}