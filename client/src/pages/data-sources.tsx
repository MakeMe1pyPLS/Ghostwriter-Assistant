import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { DatasetImportResolver, type ImportPayload } from "@/components/DatasetImportResolver";
import { DatasetManagementPanel } from "@/components/DatasetManagementPanel";
import { KpiCoveragePanel } from "@/components/KpiCoveragePanel";
import { parseDataFile, ACCEPTED_DATA_FILES } from "@/lib/file-import";
import {
  Upload,
  Database,
  FileSpreadsheet,
  Globe,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

type TabId = 'csv' | 'sql' | 'sheets' | 'api';
type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface DatasetMeta {
  id: string;
  name: string;
  source_type: string;
  columns: { name: string; type: string; sample?: any }[];
  row_count: number;
  created_at: string;
}

async function buildImportPayload(dataset: DatasetMeta, fallbackPreview: any[] | null): Promise<ImportPayload> {
  let rows: any[] = Array.isArray(fallbackPreview) ? fallbackPreview : [];
  try {
    const res = await fetch(`/api/data/datasets/${dataset.id}/rows?limit=1000`);
    const data = await res.json();
    if (Array.isArray(data.rows) && data.rows.length > 0) rows = data.rows;
  } catch {
    /* fall back to preview rows */
  }
  return {
    defaultName: dataset.name,
    columns: dataset.columns,
    rows,
    rowCount: dataset.row_count ?? rows.length,
    sourceType: (dataset.source_type as ImportPayload['sourceType']) || 'csv',
  };
}

const TABS: { id: TabId; label: string; icon: any; desc: string }[] = [
  { id: 'csv', label: 'File Upload', icon: Upload, desc: 'CSV, Excel (.xlsx) or JSON from your computer' },
  { id: 'sql', label: 'SQL Database', icon: Database, desc: 'Coming soon' },
  { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, desc: 'Import from a public Google Sheet' },
  { id: 'api', label: 'API Endpoint', icon: Globe, desc: 'Fetch JSON data from an API' },
];

/** An earlier version of the SQL tab filled files with made-up rows. Say so, so nobody makes decisions on them. */
function GeneratedRowsNotice() {
  const names = useDashboardStore((st) => st.datasetLibrary.filter((d) => d.sourceType === 'sql').map((d) => d.name));
  if (!names.length) return null;
  return (
    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-1" data-testid="notice-generated-rows">
      <p className="font-bold">Some files here are not your real data</p>
      <p className="leading-relaxed">
        An earlier version of the SQL tab did not connect to a database. It filled these files with made-up example rows: {names.map((n) => `"${n}"`).join(', ')}.
        Please remove them below and upload a CSV export of your table instead.
      </p>
    </div>
  );
}

function CsvTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFile = async (file: File) => {
    setStatus('loading');
    setPayload(null);
    try {
      // Parsed in the browser: works without the server and keeps files on the device.
      const built = await parseDataFile(file);
      setPayload(built);
      setStatus('success');
      toast({ title: "File ready", description: `${built.rowCount.toLocaleString()} rows and ${built.columns.length} columns found in ${file.name}.` });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Import failed');
      toast({ title: "Import failed", description: err?.message || 'Import failed', variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-slate-300'}`} />
        <p className="text-sm font-bold text-slate-700 mb-1">Drag and drop a CSV, Excel or JSON file</p>
        <p className="text-xs text-slate-400 mb-4">or browse your computer · .csv, .xlsx, .json up to 25 MB</p>
        <label>
          <input
            type="file"
            accept={ACCEPTED_DATA_FILES}
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            data-testid="input-csv-upload"
          />
          <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-bold text-slate-600">Reading your file…</span>
        </div>
      )}

      {status === 'success' && payload && (
        <DatasetImportResolver payload={payload} onApplied={() => { setPayload(null); setStatus('idle'); }} />
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
          <p className="text-sm font-bold text-red-700">{errorMessage || "We couldn’t read that file. Check the format and try again."}</p>
        </div>
      )}
    </div>
  );
}

function SqlTab() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 space-y-2" data-testid="panel-sql-coming-soon">
      <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg">Coming soon</Badge>
      <p className="text-sm font-bold text-slate-800">Connecting straight to a database is not built yet.</p>
      <p className="text-sm text-slate-600 leading-relaxed">
        For now, export the table from your database as a CSV file and upload it on the File Upload tab. Your numbers will be calculated from your real rows.
      </p>
    </div>
  );
}

function SheetsTab() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    setPayload(null);
    try {
      const res = await fetch('/api/data/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        const built = await buildImportPayload(data.dataset, data.preview);
        setPayload(built);
        setStatus('success');
        toast({ title: "Sheet imported", description: `${data.dataset.row_count} rows loaded from Google Sheets` });
      } else {
        setErrorMsg(data.error || 'Import failed');
        setStatus('error');
        toast({ title: "Import failed", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Google Sheet URL</Label>
        <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-sm" data-testid="input-sheets-url" />
        <p className="text-[10px] text-slate-400 font-medium">Sheet must be publicly accessible ("Anyone with the link can view")</p>
      </div>

      <Button onClick={handleFetch} disabled={status === 'loading' || !url.includes('docs.google.com')} className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md" data-testid="button-sheets-fetch">
        {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
        Fetch Sheet
      </Button>

      {status === 'error' && errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-700">{errorMsg}</p>
        </div>
      )}

      {status === 'success' && payload && (
        <DatasetImportResolver payload={payload} onApplied={() => { setPayload(null); setStatus('idle'); }} />
      )}
    </div>
  );
}

function ApiTab() {
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFetch = async () => {
    if (!apiUrl.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    setPayload(null);

    let parsedHeaders: Record<string, string> = {};
    if (headers.trim()) {
      try {
        headers.trim().split('\n').forEach(line => {
          const [key, ...rest] = line.split(':');
          if (key && rest.length) parsedHeaders[key.trim()] = rest.join(':').trim();
        });
      } catch {}
    }

    try {
      const res = await fetch('/api/data/api-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apiUrl, method, headers: parsedHeaders })
      });
      const data = await res.json();
      if (data.success) {
        const built = await buildImportPayload(data.dataset, data.preview);
        setPayload(built);
        setStatus('success');
        toast({ title: "API data imported", description: `${data.dataset.row_count} rows loaded` });
      } else {
        setErrorMsg(data.error || 'Import failed');
        setStatus('error');
        toast({ title: "Import failed", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Endpoint URL</Label>
        <Input placeholder="https://api.example.com/data" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-sm" data-testid="input-api-url" />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">HTTP Method</Label>
        <div className="flex gap-2">
          {['GET', 'POST'].map(m => (
            <button key={m} onClick={() => setMethod(m)} className={`h-9 px-4 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${method === m ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-200'}`} data-testid={`button-api-method-${m.toLowerCase()}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Headers (Optional)</Label>
        <Textarea placeholder="Authorization: Bearer sk-xxx&#10;X-Custom-Header: value" value={headers} onChange={(e) => setHeaders(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-xs min-h-[60px]" data-testid="textarea-api-headers" />
        <p className="text-[10px] text-slate-400 font-medium">One header per line in Key: Value format</p>
      </div>

      <Button onClick={handleFetch} disabled={status === 'loading' || !apiUrl.startsWith('http')} className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md" data-testid="button-api-fetch">
        {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
        Fetch Data
      </Button>

      {status === 'error' && errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-700">{errorMsg}</p>
        </div>
      )}

      {status === 'success' && payload && (
        <DatasetImportResolver payload={payload} onApplied={() => { setPayload(null); setStatus('idle'); }} />
      )}
    </div>
  );
}

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('csv');

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-6 md:py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-datasources-title">Data Sources</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
              Import datasets from CSV files, SQL databases, Google Sheets, or external APIs.
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary/5 border-primary/30 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-primary' : 'text-slate-600'}`}>{tab.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">{tab.desc}</span>
                </button>
              ))}
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  {TABS.find(t => t.id === activeTab)?.icon && (() => {
                    const Icon = TABS.find(t => t.id === activeTab)!.icon;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  {TABS.find(t => t.id === activeTab)?.label}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  {TABS.find(t => t.id === activeTab)?.desc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'csv' && <CsvTab />}
                {activeTab === 'sql' && <SqlTab />}
                {activeTab === 'sheets' && <SheetsTab />}
                {activeTab === 'api' && <ApiTab />}
              </CardContent>
            </Card>

            <GeneratedRowsNotice />
            <KpiCoveragePanel />

            <DatasetManagementPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}