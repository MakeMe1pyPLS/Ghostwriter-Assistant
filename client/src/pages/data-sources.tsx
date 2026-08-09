import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { DatasetImportResolver, type ImportPayload } from "@/components/DatasetImportResolver";
import { DatasetManagementPanel } from "@/components/DatasetManagementPanel";
import {
  Upload,
  Database,
  FileSpreadsheet,
  Globe,
  AlertCircle,
  Loader2,
  Table2,
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
  { id: 'csv', label: 'CSV Upload', icon: Upload, desc: 'Upload a CSV file from your computer' },
  { id: 'sql', label: 'SQL Database', icon: Database, desc: 'Connect to PostgreSQL or MySQL' },
  { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, desc: 'Import from a public Google Sheet' },
  { id: 'api', label: 'API Endpoint', icon: Globe, desc: 'Fetch JSON data from an API' },
];

function CsvTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    setStatus('loading');
    setPayload(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.csv', ''));

    try {
      const res = await fetch('/api/data/upload-csv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const built = await buildImportPayload(data.dataset, data.preview);
        setPayload(built);
        setStatus('success');
        toast({ title: "CSV parsed", description: `${data.dataset.row_count} rows loaded from ${file.name}` });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (err: any) {
      setStatus('error');
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
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
        <p className="text-sm font-bold text-slate-700 mb-1">Drag and drop a CSV file here</p>
        <p className="text-xs text-slate-400 mb-4">or click to browse (max 10MB)</p>
        <label>
          <input
            type="file"
            accept=".csv"
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
          <span className="text-sm font-bold text-slate-600">Parsing CSV...</span>
        </div>
      )}

      {status === 'success' && payload && (
        <DatasetImportResolver payload={payload} onApplied={() => { setPayload(null); setStatus('idle'); }} />
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold text-red-700">Failed to parse CSV file. Check format and try again.</p>
        </div>
      )}
    </div>
  );
}

function SqlTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState({ host: '', port: 5432, database: '', username: '', password: '', dbType: 'postgresql' as const });
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [payload, setPayload] = useState<ImportPayload | null>(null);

  const handleTestConnection = async () => {
    setStatus('loading');
    setTables([]);
    try {
      const res = await fetch('/api/data/sql/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        setStatus('success');
        toast({ title: "Connected", description: data.message });
      } else {
        setStatus('error');
        toast({ title: "Connection failed", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      setStatus('error');
      toast({ title: "Connection error", description: err.message, variant: "destructive" });
    }
  };

  const handleImportTable = async () => {
    if (!selectedTable) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/data/sql/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, table: selectedTable })
      });
      const data = await res.json();
      if (data.success) {
        const built = await buildImportPayload(data.dataset, data.preview);
        setPayload(built);
        setStatus('success');
        toast({ title: "Table imported", description: `${data.dataset.row_count} rows from ${selectedTable}` });
      }
    } catch (err: any) {
      setStatus('error');
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Host</Label>
          <Input placeholder="localhost" value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-sm" data-testid="input-sql-host" />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Port</Label>
          <Input type="number" value={config.port} onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-sm" data-testid="input-sql-port" />
        </div>
        <div className="col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database</Label>
          <Input placeholder="supply_chain_db" value={config.database} onChange={(e) => setConfig({ ...config, database: e.target.value })} className="rounded-xl bg-slate-50 border-slate-200 font-mono text-sm" data-testid="input-sql-database" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</Label>
          <Input placeholder="admin" value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} className="rounded-xl bg-slate-50 border-slate-200 text-sm" data-testid="input-sql-username" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
          <Input type="password" placeholder="••••••••" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} className="rounded-xl bg-slate-50 border-slate-200 text-sm" data-testid="input-sql-password" />
        </div>
      </div>

      <Button onClick={handleTestConnection} disabled={status === 'loading' || !config.host || !config.database || !config.username} className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md w-full sm:w-auto" data-testid="button-sql-test">
        {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
        Test Connection
      </Button>

      {tables.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Available Tables</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tables.map(t => (
                <button key={t} onClick={() => setSelectedTable(t)} className={`text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all ${selectedTable === t ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`} data-testid={`button-table-${t}`}>
                  <Table2 className="w-3 h-3 inline mr-1.5" />{t}
                </button>
              ))}
            </div>
          </div>

          {selectedTable && (
            <Button onClick={handleImportTable} className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md" data-testid="button-sql-import">
              <ArrowRight className="w-4 h-4 mr-2" /> Import {selectedTable}
            </Button>
          )}
        </div>
      )}

      {payload && (
        <DatasetImportResolver payload={payload} onApplied={() => { setPayload(null); setStatus('idle'); }} />
      )}
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
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-8 py-8 shrink-0 shadow-sm relative z-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase" data-testid="text-datasources-title">Data Sources</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
              Import datasets from CSV files, SQL databases, Google Sheets, or external APIs.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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

            <DatasetManagementPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}