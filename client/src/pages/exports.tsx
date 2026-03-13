import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSpreadsheet,
  FileText,
  Download,
  FileJson,
  BarChart,
  CloudCog,
  Database,
  Code,
  Link as LinkIcon,
  CalendarDays,
  Settings2,
  Mail,
  MessageSquare,
  Plug,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EXPORT_CATEGORIES = [
  {
    title: "Dashboard Files",
    items: [
      { id: "excel", title: "Export Excel", desc: "Download a fully formatted Excel dashboard with charts and KPI tables.", icon: FileSpreadsheet, ext: ".xlsx", color: "text-green-600 bg-green-50 border-green-100" },
      { id: "csv", title: "Export CSV", desc: "Raw data dump of all current KPIs and timeseries data.", icon: FileText, ext: ".csv", color: "text-slate-600 bg-slate-50 border-slate-200" },
      { id: "gsheets", title: "Export Google Sheets", desc: "Push data directly to a new Google Sheet.", icon: FileSpreadsheet, ext: "Drive", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { id: "json", title: "Export JSON", desc: "Complete dashboard specification and data payload.", icon: FileJson, ext: ".json", color: "text-yellow-600 bg-yellow-50 border-yellow-100" }
    ]
  },
  {
    title: "Business Intelligence",
    items: [
      { id: "pbix", title: "Export Power BI", desc: "Export as a Power BI template with connected data models.", icon: BarChart, ext: ".pbix", color: "text-amber-600 bg-amber-50 border-amber-100" },
      { id: "twbx", title: "Export Tableau", desc: "Export as a packaged Tableau workbook.", icon: CloudCog, ext: ".twbx", color: "text-indigo-600 bg-indigo-50 border-indigo-100" }
    ]
  },
  {
    title: "Integrations",
    items: [
      { id: "custom-api", title: "Custom API", desc: "Send dashboard data and specs to your own API endpoint for integration with internal tools.", icon: Plug, ext: "API", color: "text-violet-600 bg-violet-50 border-violet-100" }
    ]
  },
  {
    title: "Reports",
    items: [
      { id: "pdf", title: "Export PDF", desc: "Executive summary report with layout snapshots and insights.", icon: FileText, ext: ".pdf", color: "text-red-600 bg-red-50 border-red-100" },
      { id: "ppt", title: "Export PowerPoint", desc: "Presentation deck with editable charts and notes.", icon: FileText, ext: ".pptx", color: "text-orange-600 bg-orange-50 border-orange-100" }
    ]
  },
  {
    title: "Data",
    items: [
      { id: "sql", title: "Export SQL", desc: "Generate SQL insert statements for your datasets.", icon: Database, ext: ".sql", color: "text-blue-600 bg-blue-50 border-blue-100" }
    ]
  },
  {
    title: "Embed",
    items: [
      { id: "link", title: "Share Link", desc: "Generate a secure, read-only link to this dashboard.", icon: LinkIcon, ext: "Copy", color: "text-slate-600 bg-slate-50 border-slate-200" },
      { id: "iframe", title: "Generate Iframe", desc: "Get HTML code to embed this dashboard in your portal.", icon: Code, ext: "Code", color: "text-slate-600 bg-slate-50 border-slate-200" }
    ]
  }
];

function CustomApiModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("POST");
  const [apiKey, setApiKey] = useState("");
  const [payloadType, setPayloadType] = useState("full");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const samplePayload = {
    dashboard: {
      title: "Supply Chain Dashboard",
      sector: "ecommerce",
      generated_at: new Date().toISOString()
    },
    metrics: [
      { label: "Revenue", value: "$124,500", trend: "+12.5%" },
      { label: "Orders", value: "1,450", trend: "+8.2%" },
      { label: "On-Time Delivery", value: "94.2%", trend: "-1.3%" }
    ],
    chart_data: { points: 10, type: "timeseries" }
  };

  const handleSendTest = async () => {
    if (!endpoint.trim()) {
      toast({ title: "Endpoint required", description: "Please enter an API endpoint URL.", variant: "destructive" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/export/custom-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          method,
          apiKey: apiKey || undefined,
          payload: payloadType === 'full' ? samplePayload : { metrics: samplePayload.metrics }
        })
      });
      const data = await res.json();
      setResult(data);
      toast({ title: "Test Complete", description: data.message || "Request simulated successfully." });
    } catch {
      setResult({ success: false, message: "Request failed. Check endpoint and try again." });
      toast({ title: "Request Failed", description: "Could not reach the backend.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Plug className="w-5 h-5 text-violet-600" /> Custom API Export
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Send your dashboard data and specifications to an external API endpoint. Connect ChainInsideIQ to your internal systems.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Endpoint URL</Label>
            <Input placeholder="https://api.yourcompany.com/ingest" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="rounded-xl" data-testid="input-api-endpoint" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method</Label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" data-testid="select-api-method">
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payload</Label>
              <select value={payloadType} onChange={(e) => setPayloadType(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" data-testid="select-payload-type">
                <option value="full">Full Dashboard Spec</option>
                <option value="metrics">Metrics Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Key (Optional)</Label>
            <Input type="password" placeholder="Bearer token or API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="rounded-xl" data-testid="input-api-key" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Preview</Label>
              <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1" data-testid="button-toggle-preview">
                <Eye className="w-3 h-3" /> {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>
            {showPreview && (
              <div className="relative">
                <pre className="bg-slate-900 text-slate-300 text-xs p-4 rounded-xl overflow-auto max-h-48 font-mono leading-relaxed">
                  {JSON.stringify(payloadType === 'full' ? samplePayload : { metrics: samplePayload.metrics }, null, 2)}
                </pre>
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2)); toast({ title: "Copied", description: "Payload JSON copied to clipboard." }); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors" data-testid="button-copy-payload">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {result && (
            <div className={`p-4 rounded-xl border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className={`text-xs font-black uppercase tracking-widest ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <p className="text-xs text-slate-600">{result.message}</p>
              {result.payload_size && <p className="text-[10px] text-slate-400 mt-1">Payload size: {result.payload_size} bytes</p>}
              {result.note && <p className="text-[10px] text-slate-400 mt-1 italic">{result.note}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" className="rounded-xl font-bold" onClick={() => onOpenChange(false)} data-testid="button-cancel-api">Cancel</Button>
          <Button onClick={handleSendTest} disabled={sending} className="rounded-xl font-black text-xs uppercase tracking-widest shadow-md gap-2" data-testid="button-send-test">
            {sending ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Send Test Request</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExportsPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [customApiOpen, setCustomApiOpen] = useState(false);
  const [settings, setSettings] = useState({
    insights: true,
    forecasts: true,
    alerts: true,
    hubNotes: false
  });

  const handleExportCSV = () => {
    setIsExporting("csv");
    setTimeout(() => {
      const headers = ["Date", "Sector", "Perfect Order Rate", "Inventory Level", "Delay Risk"];
      const rows = [
        ["2023-10-01", "E-commerce", "98.5%", "12400", "Low"],
        ["2023-10-01", "Logistics", "92.1%", "N/A", "Medium"],
        ["2023-10-01", "Manufacturing", "99.2%", "54000", "Low"],
        ["2023-10-02", "E-commerce", "98.2%", "11800", "Medium"],
        ["2023-10-02", "Logistics", "88.4%", "N/A", "High"],
      ];
      let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "chain_inside_iq_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(null);
      toast({ title: "Export Successful", description: "CSV file has been downloaded." });
    }, 1500);
  };

  const handleStubExport = (type: string, format: string) => {
    setIsExporting(type);
    toast({ title: `Preparing ${type} export...`, description: "Compiling data and formatting document." });
    setTimeout(() => {
      setIsExporting(null);
      if (format === 'Copy' || format === 'Code') {
        toast({ title: "Copied to Clipboard", description: `The ${type} has been copied to your clipboard.` });
      } else {
        toast({ title: "Export Ready", description: `Your ${type} (${format}) is ready for download. (Mocked)` });
      }
    }, 2000);
  };

  const handleExportClick = (item: any) => {
    if (item.id === 'custom-api') {
      setCustomApiOpen(true);
    } else if (item.id === 'csv') {
      handleExportCSV();
    } else {
      handleStubExport(item.title, item.ext);
    }
  };

  const handleSchedule = () => {
    toast({ title: "Schedule Created", description: "Your automated report has been scheduled successfully." });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-8 py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-export-title">Export Center</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                Distribute your insights across formats, platforms, and teams.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl px-6 shadow-md shadow-primary/20 font-black text-[10px] uppercase tracking-widest gap-2 bg-slate-900 hover:bg-slate-800 text-white" data-testid="button-automate">
                  <CalendarDays className="w-4 h-4" /> Automate Reports
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tight">Schedule Automated Export</DialogTitle>
                  <DialogDescription className="font-medium text-slate-500">Set up recurring delivery of your dashboard reports.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="rounded-lg font-bold border-primary bg-primary/5 text-primary">Daily</Button>
                      <Button variant="outline" className="rounded-lg font-bold text-slate-600">Weekly</Button>
                      <Button variant="outline" className="rounded-lg font-bold text-slate-600">Monthly</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl h-12 font-bold justify-start px-4 border-slate-200 text-slate-700">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" /> Email
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12 font-bold justify-start px-4 border-slate-200 text-slate-700">
                        <MessageSquare className="w-4 h-4 mr-2 text-slate-400" /> Slack
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Format</label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20">
                      <option>PDF Executive Summary</option>
                      <option>Excel Dashboard Data</option>
                      <option>PowerPoint Deck</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button onClick={handleSchedule} className="rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Create Schedule</Button>
                  </DialogTrigger>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-0">
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Export Settings</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector Focus</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20">
                      <option>All Sectors (Unified)</option>
                      <option>E-commerce</option>
                      <option>Logistics</option>
                      <option>Manufacturing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Range</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Last 30 Days</option>
                      <option>Last 7 Days</option>
                      <option>This Quarter</option>
                      <option>Year to Date</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Include in Export</Label>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inc-insights" className="text-sm font-medium cursor-pointer">AI Insights</Label>
                      <Switch id="inc-insights" checked={settings.insights} onCheckedChange={(c) => setSettings({ ...settings, insights: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inc-forecasts" className="text-sm font-medium cursor-pointer">Forecast Data</Label>
                      <Switch id="inc-forecasts" checked={settings.forecasts} onCheckedChange={(c) => setSettings({ ...settings, forecasts: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inc-alerts" className="text-sm font-medium cursor-pointer">Active Alerts</Label>
                      <Switch id="inc-alerts" checked={settings.alerts} onCheckedChange={(c) => setSettings({ ...settings, alerts: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inc-hub" className="text-sm font-medium cursor-pointer">Hub Notes</Label>
                      <Switch id="inc-hub" checked={settings.hubNotes} onCheckedChange={(c) => setSettings({ ...settings, hubNotes: c })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-10">
              {EXPORT_CATEGORIES.map((category) => (
                <div key={category.title} className="space-y-4">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-200 pb-2">
                    {category.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map((item) => (
                      <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full bg-white relative overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                              <item.icon className="w-6 h-6" />
                            </div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                              {item.ext}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-black text-slate-900">{item.title}</CardTitle>
                          <CardDescription className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{item.desc}</CardDescription>
                        </CardHeader>
                        <div className="flex-1"></div>
                        <CardFooter className="pt-2 pb-4">
                          <Button
                            className={`w-full rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all ${item.id === 'custom-api' ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:border-violet-300' : 'bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary border border-slate-200 hover:border-primary/30'}`}
                            disabled={isExporting !== null}
                            onClick={() => handleExportClick(item)}
                            data-testid={`button-export-${item.id}`}
                          >
                            {isExporting === item.id ? (
                              <><div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" /> Processing...</>
                            ) : item.id === 'custom-api' ? (
                              <><Plug className="w-3.5 h-3.5 mr-2" /> Configure API</>
                            ) : (
                              <><Download className="w-3.5 h-3.5 mr-2" /> {['Copy', 'Code', 'Drive'].includes(item.ext) ? item.ext : `Download ${item.ext}`}</>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CustomApiModal open={customApiOpen} onOpenChange={setCustomApiOpen} />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </AppLayout>
  );
}