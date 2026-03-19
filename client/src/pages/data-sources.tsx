import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useEffect } from "react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import {
  Upload,
  Database,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table2,
  Trash2,
  Eye,
  FileText,
  ArrowRight,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Plug
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const TABS: { id: TabId; label: string; icon: any; desc: string }[] = [
  { id: 'csv', label: 'CSV Upload', icon: Upload, desc: 'Upload a CSV file from your computer' },
  { id: 'sql', label: 'SQL Database', icon: Database, desc: 'Connect to PostgreSQL or MySQL' },
  { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, desc: 'Import from a public Google Sheet' },
  { id: 'api', label: 'API Endpoint', icon: Globe, desc: 'Fetch JSON data from an API' },
];

function DatasetPreview({ preview, columns }: { preview: any[]; columns: any[] }) {
  if (!preview || preview.length === 0) return null;
  const keys = columns?.map(c => c.name) || Object.keys(preview[0]);

  return (
    <div className="overflow-auto max-h-[300px] rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {keys.map(k => (
              <th key={k} className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 whitespace-nowrap">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
              {keys.map(k => (
                <td key={k} className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap max-w-[200px] truncate">
                  {String(row[k] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CsvTab() {
  const { toast } = useToast();
  const { setImportedData, setSector } = useDashboardStore();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [datasetName, setDatasetName] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    setStatus('loading');
    setDatasetName(file.name.replace('.csv', ''));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.csv', ''));

    try {
      const res = await fetch('/api/data/upload-csv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setColumns(data.dataset.columns);
        setDatasetMeta(data.dataset);
        setStatus('success');
        setImportedData(data.preview);
        setSector('custom');
        toast({ title: "CSV imported", description: `${data.dataset.row_count} rows loaded from ${file.name}` });
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

      {status === 'success' && datasetMeta && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">{datasetMeta.name}</p>
              <p className="text-xs text-emerald-600">{datasetMeta.row_count} rows · {datasetMeta.columns.length} columns · Ready for dashboard widgets</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Table2 className="w-4 h-4 text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Column Schema</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {columns.map((col: any) => (
                <Badge key={col.name} variant="secondary" className="bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg px-2.5 py-1">
                  {col.name} <span className="text-slate-400 ml-1">({col.type})</span>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Data Preview</h4>
            <DatasetPreview preview={preview} columns={columns} />
          </div>
        </div>
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
  const { setImportedData, setSector } = useDashboardStore();
  const [config, setConfig] = useState({ host: '', port: 5432, database: '', username: '', password: '', dbType: 'postgresql' as const });
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<DatasetMeta | null>(null);

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
        setPreview(data.preview);
        setColumns(data.dataset.columns);
        setImportResult(data.dataset);
        setImportedData(data.preview);
        setSector('custom');
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

      {importResult && preview && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">{importResult.name}</p>
              <p className="text-xs text-emerald-600">{importResult.row_count} rows · {importResult.columns.length} columns</p>
            </div>
          </div>
          <DatasetPreview preview={preview} columns={columns} />
        </div>
      )}
    </div>
  );
}

function SheetsTab() {
  const { toast } = useToast();
  const { setImportedData, setSector } = useDashboardStore();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [result, setResult] = useState<DatasetMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/data/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setColumns(data.dataset.columns);
        setResult(data.dataset);
        setImportedData(data.preview);
        setSector('custom');
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

      {status === 'success' && result && preview && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">{result.name}</p>
              <p className="text-xs text-emerald-600">{result.row_count} rows · {result.columns.length} columns</p>
            </div>
          </div>
          <DatasetPreview preview={preview} columns={columns} />
        </div>
      )}
    </div>
  );
}

function ApiTab() {
  const { toast } = useToast();
  const { setImportedData, setSector } = useDashboardStore();
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [result, setResult] = useState<DatasetMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFetch = async () => {
    if (!apiUrl.trim()) return;
    setStatus('loading');
    setErrorMsg('');

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
        setPreview(data.preview);
        setColumns(data.dataset.columns);
        setResult(data.dataset);
        setImportedData(data.preview);
        setSector('custom');
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

      {status === 'success' && result && preview && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">{result.name}</p>
              <p className="text-xs text-emerald-600">{result.row_count} rows · {result.columns.length} columns</p>
            </div>
          </div>
          <DatasetPreview preview={preview} columns={columns} />
        </div>
      )}
    </div>
  );
}

function DatasetList() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<any[] | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/datasets');
      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/data/datasets/${id}`, { method: 'DELETE' });
    toast({ title: "Dataset deleted" });
    refresh();
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    try {
      const res = await fetch(`/api/data/datasets/${id}`);
      const data = await res.json();
      setExpandedPreview(data.preview);
      setExpandedId(id);
    } catch {}
  };

  const sourceIcons: Record<string, any> = {
    csv: FileText,
    sql: Database,
    'google-sheets': FileSpreadsheet,
    api: Globe
  };

  if (datasets.length === 0 && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Database className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-700 mb-1">No datasets imported yet</p>
      <p className="text-xs text-slate-400">Upload a CSV or connect a data source above to get started.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Imported Datasets</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} className="h-8 rounded-lg" data-testid="button-refresh-datasets">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {datasets.map(ds => {
          const Icon = sourceIcons[ds.source_type] || Database;
          return (
            <div key={ds.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleExpand(ds.id)}>
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{ds.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{ds.row_count} rows · {ds.columns.length} cols · {ds.source_type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider rounded-lg">{ds.source_type}</Badge>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(ds.id); }} className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" data-testid={`button-delete-${ds.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedId === ds.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === ds.id && expandedPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 overflow-hidden"
                  >
                    <div className="p-4">
                      <DatasetPreview preview={expandedPreview} columns={ds.columns} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
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

            <DatasetList />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}