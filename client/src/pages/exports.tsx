import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSectorData } from "@/hooks/use-sector-data";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { downloadFromResponse, buildExcelPayload, buildDashboardPayload, exportFilename, sectorLabel, dateRangeLabel } from "@/lib/export-helpers";
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
  Eye,
  Loader2,
  ArrowDownToLine,
  Table2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

function CustomApiModal({ open, onOpenChange, sector, dateRange, metrics, chartData, donutData }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sector: string;
  dateRange: string;
  metrics: any[];
  chartData: any[];
  donutData: any[];
}) {
  const { toast } = useToast();
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("POST");
  const [apiKey, setApiKey] = useState("");
  const [payloadType, setPayloadType] = useState("dashboard-spec");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const buildPayload = () => {
    if (payloadType === 'dashboard-spec') {
      return buildDashboardPayload({ sector, dateRange, metrics, chartData, donutData });
    }
    if (payloadType === 'dataset') {
      return { sector, dateRange, metrics, chartData, donutData };
    }
    return {
      sector,
      dateRange,
      generated_at: new Date().toISOString(),
      highlights: metrics.slice(0, 6).map(m => ({
        kpi: m.label, value: m.value, change: m.trend,
        status: m.isPositive ? 'strong' : 'watch'
      }))
    };
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
          endpoint, method,
          apiKey: apiKey || undefined,
          payload: buildPayload()
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
            Send your current {sectorLabel(sector)} dashboard data to an external API.
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
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payload Type</Label>
              <select value={payloadType} onChange={(e) => setPayloadType(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" data-testid="select-payload-type">
                <option value="dashboard-spec">Dashboard Spec JSON</option>
                <option value="dataset">Dataset JSON</option>
                <option value="metrics-summary">Metrics Summary</option>
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
                  {JSON.stringify(buildPayload(), null, 2)}
                </pre>
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(buildPayload(), null, 2)); toast({ title: "Copied", description: "Payload copied to clipboard." }); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors" data-testid="button-copy-payload">
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

const EXPORT_ITEMS = {
  dashboardFiles: [
    { id: "excel", title: "Export Excel", desc: "Fully formatted Excel workbook with KPI cards, charts, and data tables reflecting your current dashboard.", icon: FileSpreadsheet, ext: ".xlsx", color: "text-green-600 bg-green-50 border-green-100", available: true },
    { id: "csv", title: "Export CSV", desc: "Clean CSV with your current KPIs, trend data, and timeseries values for the selected sector and date range.", icon: Table2, ext: ".csv", color: "text-emerald-600 bg-emerald-50 border-emerald-100", available: true },
    { id: "json", title: "Export Dashboard JSON", desc: "Portable dashboard blueprint — widgets, layout, theme, and data snapshot in a single JSON file.", icon: FileJson, ext: ".json", color: "text-yellow-600 bg-yellow-50 border-yellow-100", available: true },
  ],
  dataExports: [
    { id: "dataset-json", title: "Export Dataset (JSON)", desc: "Underlying metrics, timeseries, and channel data as structured JSON.", icon: Database, ext: ".json", color: "text-blue-600 bg-blue-50 border-blue-100", available: true },
    { id: "dataset-csv", title: "Export Dataset (CSV)", desc: "Flat CSV export of all metrics, timeseries, and channel data.", icon: ArrowDownToLine, ext: ".csv", color: "text-sky-600 bg-sky-50 border-sky-100", available: true },
  ],
  integrations: [
    { id: "custom-api", title: "Custom API", desc: "Send dashboard data and specs to your own API endpoint for integration with internal tools.", icon: Plug, ext: "API", color: "text-violet-600 bg-violet-50 border-violet-100", available: true },
  ],
  biTools: [
    { id: "pbix", title: "Export Power BI", desc: "Export as a Power BI template with connected data models.", icon: BarChart, ext: ".pbix", color: "text-amber-600 bg-amber-50 border-amber-100", available: false },
    { id: "twbx", title: "Export Tableau", desc: "Export as a packaged Tableau workbook.", icon: CloudCog, ext: ".twbx", color: "text-indigo-600 bg-indigo-50 border-indigo-100", available: false },
  ],
  reports: [
    { id: "pdf", title: "Export PDF", desc: "Executive summary report with layout snapshots and insights.", icon: FileText, ext: ".pdf", color: "text-red-600 bg-red-50 border-red-100", available: false },
  ],
  embed: [
    { id: "link", title: "Share Link", desc: "Generate a secure, read-only link to this dashboard.", icon: LinkIcon, ext: "Copy", color: "text-slate-600 bg-slate-50 border-slate-200", available: false },
    { id: "iframe", title: "Generate Iframe", desc: "Get HTML code to embed this dashboard in your portal.", icon: Code, ext: "Code", color: "text-slate-600 bg-slate-50 border-slate-200", available: false },
  ]
};

const CATEGORIES = [
  { key: 'dashboardFiles', title: 'Dashboard Files', subtitle: 'Export your dashboard' },
  { key: 'dataExports', title: 'Data Exports', subtitle: 'Export underlying data' },
  { key: 'integrations', title: 'Integrations', subtitle: 'Connect external systems' },
  { key: 'biTools', title: 'Business Intelligence', subtitle: 'BI platform exports' },
  { key: 'reports', title: 'Reports', subtitle: 'Document exports' },
  { key: 'embed', title: 'Embed & Share', subtitle: 'Distribution options' },
];

export default function ExportsPage() {
  const { toast } = useToast();
  const { metrics, chartData, donutData, allMetrics, sector, dateRange } = useSectorData();
  const { setSector, setRange } = useDashboardStore();
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({});
  const [customApiOpen, setCustomApiOpen] = useState(false);
  const [settings, setSettings] = useState({
    insights: true,
    forecasts: true,
    alerts: true,
    hubNotes: false
  });

  const setStatus = (key: string, s: ExportStatus) => {
    setExportStatus(prev => ({ ...prev, [key]: s }));
    if (s === 'success') setTimeout(() => setExportStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
  };

  const getWidgetsAndLayout = () => {
    try {
      const widgets = JSON.parse(localStorage.getItem(`widgets_${sector}`) || '[]');
      const layout = JSON.parse(localStorage.getItem(`layout_${sector}`) || '[]');
      return { widgets, layout };
    } catch {
      return { widgets: [], layout: [] };
    }
  };

  const handleExport = useCallback(async (itemId: string) => {
    const { widgets, layout } = getWidgetsAndLayout();

    if (itemId === 'custom-api') {
      setCustomApiOpen(true);
      return;
    }

    setStatus(itemId, 'loading');

    try {
      if (itemId === 'excel') {
        const payload = buildExcelPayload({
          sector, dateRange, metrics, chartData, donutData, widgets, layouts: { lg: layout }, allMetrics
        });
        const response = await fetch('/api/export/excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Excel export failed');
        await downloadFromResponse(response, exportFilename('dashboard_excel', sector, 'xlsx'));
        setStatus(itemId, 'success');
        toast({ title: "Excel Exported", description: `${sectorLabel(sector)} dashboard workbook downloaded.` });

      } else if (itemId === 'csv') {
        const response = await fetch('/api/export/csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics, chartData, sector, dateRange })
        });
        if (!response.ok) throw new Error('CSV export failed');
        await downloadFromResponse(response, exportFilename('dashboard', sector, 'csv'));
        setStatus(itemId, 'success');
        toast({ title: "CSV Exported", description: `${sectorLabel(sector)} dashboard data downloaded.` });

      } else if (itemId === 'json') {
        const payload = buildDashboardPayload({
          sector, dateRange, metrics, chartData, donutData, widgets, layouts: { lg: layout }
        });
        const response = await fetch('/api/export/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('JSON export failed');
        await downloadFromResponse(response, exportFilename('dashboard_spec', sector, 'json'));
        setStatus(itemId, 'success');
        toast({ title: "JSON Exported", description: "Dashboard specification downloaded." });

      } else if (itemId === 'dataset-json') {
        const response = await fetch('/api/export/dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics, chartData, donutData, sector, dateRange, format: 'json' })
        });
        if (!response.ok) throw new Error('Dataset export failed');
        await downloadFromResponse(response, exportFilename('dataset', sector, 'json'));
        setStatus(itemId, 'success');
        toast({ title: "Dataset Exported", description: "Underlying dataset downloaded as JSON." });

      } else if (itemId === 'dataset-csv') {
        const response = await fetch('/api/export/dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics, chartData, donutData, sector, dateRange, format: 'csv' })
        });
        if (!response.ok) throw new Error('Dataset export failed');
        await downloadFromResponse(response, exportFilename('dataset', sector, 'csv'));
        setStatus(itemId, 'success');
        toast({ title: "Dataset Exported", description: "Underlying dataset downloaded as CSV." });

      } else {
        setStatus(itemId, 'idle');
        toast({ title: "Coming Soon", description: "This export format is not yet available." });
      }
    } catch (err: any) {
      console.error(`Export ${itemId} error:`, err);
      setStatus(itemId, 'error');
      toast({ title: "Export Failed", description: err.message || "Something went wrong.", variant: "destructive" });
    }
  }, [sector, dateRange, metrics, chartData, donutData, allMetrics, toast]);

  const handleSchedule = () => {
    toast({ title: "Schedule Created", description: "Your automated report has been scheduled successfully." });
  };

  const renderExportCard = (item: any) => {
    const status = exportStatus[item.id] || 'idle';
    return (
      <Card key={item.id} className={`border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full bg-white relative overflow-hidden ${!item.available ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              {!item.available && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-wider rounded-lg">
                  Coming Soon
                </Badge>
              )}
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                {item.ext}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-base font-black text-slate-900">{item.title}</CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{item.desc}</CardDescription>
        </CardHeader>
        <div className="flex-1" />
        <CardFooter className="pt-2 pb-4">
          <Button
            className={`w-full rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all ${
              status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              item.id === 'custom-api' ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:border-violet-300' :
              'bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary border border-slate-200 hover:border-primary/30'
            }`}
            disabled={!item.available || status === 'loading'}
            onClick={() => handleExport(item.id)}
            data-testid={`button-export-${item.id}`}
          >
            {status === 'loading' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Exporting...</>
            ) : status === 'success' ? (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Downloaded</>
            ) : status === 'error' ? (
              <><AlertCircle className="w-3.5 h-3.5 mr-2" /> Failed — Retry</>
            ) : item.id === 'custom-api' ? (
              <><Plug className="w-3.5 h-3.5 mr-2" /> Configure API</>
            ) : !item.available ? (
              <>Coming Soon</>
            ) : (
              <><Download className="w-3.5 h-3.5 mr-2" /> Export</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-8 py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-export-title">Export Center</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                Exporting {sectorLabel(sector)} · {dateRangeLabel(dateRange)} · {metrics.length} KPIs loaded
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
                      <option>Excel Dashboard Data</option>
                      <option>CSV Export</option>
                      <option>Dashboard JSON Spec</option>
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
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      data-testid="select-export-sector"
                    >
                      <option value="unified">Unified (All Sectors)</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="logistics">Logistics</option>
                      <option value="manufacturing">Manufacturing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Range</Label>
                    <select
                      value={dateRange}
                      onChange={(e) => setRange(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      data-testid="select-export-range"
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Data Summary</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">KPIs</span>
                        <span className="font-bold text-slate-700" data-testid="text-kpi-count">{metrics.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Timeseries Points</span>
                        <span className="font-bold text-slate-700">{chartData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Channels</span>
                        <span className="font-bold text-slate-700">{donutData.length}</span>
                      </div>
                    </div>
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
              {CATEGORIES.map((cat) => {
                const items = (EXPORT_ITEMS as any)[cat.key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={cat.key} className="space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">{cat.title}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{cat.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((item: any) => renderExportCard(item))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <CustomApiModal
        open={customApiOpen}
        onOpenChange={setCustomApiOpen}
        sector={sector}
        dateRange={dateRange}
        metrics={metrics}
        chartData={chartData}
        donutData={donutData}
      />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </AppLayout>
  );
}