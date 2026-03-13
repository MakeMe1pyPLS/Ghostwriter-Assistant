import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Download, FileJson, FileSpreadsheet, FileText, Image as ImageIcon, Monitor, Loader2, Table2, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { downloadFromResponse, buildExcelPayload, buildDashboardPayload, exportFilename } from "@/lib/export-helpers";

interface ExportDrawerProps {
  layout: any;
  widgets: any;
  sector: string;
  dateRange?: string;
  metrics?: any[];
  chartData?: any[];
  donutData?: any[];
  allMetrics?: any[];
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export function ExportDrawer({ layout, widgets, sector, dateRange = '30d', metrics, chartData, donutData, allMetrics }: ExportDrawerProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<Record<string, ExportStatus>>({});

  const setExportStatus = (key: string, s: ExportStatus) => setStatus(prev => ({ ...prev, [key]: s }));

  const handleExcelExport = async () => {
    setExportStatus('excel', 'loading');
    try {
      const payload = buildExcelPayload({
        sector, dateRange, metrics: metrics || [], chartData: chartData || [],
        donutData: donutData || [], widgets, layouts: { lg: layout }, allMetrics
      });

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      await downloadFromResponse(response, exportFilename('dashboard_excel', sector, 'xlsx'));
      setExportStatus('excel', 'success');
      toast({ title: "Excel Exported", description: "Your dashboard workbook has been downloaded." });
    } catch (err: any) {
      console.error('Excel export error:', err);
      setExportStatus('excel', 'error');
      toast({ title: "Export Failed", description: err.message || "Could not generate Excel file.", variant: "destructive" });
    }
  };

  const handleCsvExport = async () => {
    setExportStatus('csv', 'loading');
    try {
      const response = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, chartData, sector, dateRange })
      });

      if (!response.ok) throw new Error('CSV export failed');

      await downloadFromResponse(response, exportFilename('dashboard', sector, 'csv'));
      setExportStatus('csv', 'success');
      toast({ title: "CSV Exported", description: "Dashboard data downloaded as CSV." });
    } catch (err: any) {
      setExportStatus('csv', 'error');
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleJsonExport = async () => {
    setExportStatus('json', 'loading');
    try {
      const payload = buildDashboardPayload({
        sector, dateRange, metrics: metrics || [], chartData: chartData || [],
        donutData: donutData || [], widgets, layouts: { lg: layout }
      });

      const response = await fetch('/api/export/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('JSON export failed');

      await downloadFromResponse(response, exportFilename('dashboard_spec', sector, 'json'));
      setExportStatus('json', 'success');
      toast({ title: "JSON Exported", description: "Dashboard specification downloaded." });
    } catch (err: any) {
      setExportStatus('json', 'error');
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDatasetExport = async () => {
    setExportStatus('dataset', 'loading');
    try {
      const response = await fetch('/api/export/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics, chartData, donutData, sector, dateRange, format: 'json'
        })
      });

      if (!response.ok) throw new Error('Dataset export failed');

      await downloadFromResponse(response, exportFilename('dataset', sector, 'json'));
      setExportStatus('dataset', 'success');
      toast({ title: "Dataset Exported", description: "Underlying dataset downloaded as JSON." });
    } catch (err: any) {
      setExportStatus('dataset', 'error');
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleStubExport = (tool: string) => {
    toast({ title: "Coming Soon", description: `Direct ${tool} export requires additional integration.` });
  };

  const renderButton = (key: string, label: string, icon: React.ReactNode, onClick: () => void, className: string) => {
    const s = status[key] || 'idle';
    return (
      <Button
        data-testid={`button-export-${key}`}
        onClick={onClick}
        disabled={s === 'loading'}
        variant="secondary"
        className={`h-24 flex flex-col gap-3 rounded-xl border border-transparent transition-all relative overflow-hidden ${className}`}
      >
        {s === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : s === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : icon}
        <span className="text-[11px] uppercase font-black tracking-widest">{s === 'loading' ? 'Exporting...' : label}</span>
      </Button>
    );
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button data-testid="button-export" variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 w-full md:w-auto px-3 md:px-4 hover:bg-slate-50 transition-colors">
          <Download className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-black text-slate-900">Export Dashboard</DrawerTitle>
            <DrawerDescription className="text-sm font-medium text-slate-500">Export your current {sector} dashboard data and specifications.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-5">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dashboard Files</h4>
              <div className="grid grid-cols-3 gap-3">
                {renderButton('json', 'JSON', <FileJson className="w-6 h-6 text-primary" />, handleJsonExport, 'bg-slate-50 hover:bg-primary/5 hover:border-primary/20 text-slate-700')}
                {renderButton('csv', 'CSV', <Table2 className="w-6 h-6 text-emerald-600" />, handleCsvExport, 'bg-emerald-50 hover:bg-emerald-100/50 hover:border-emerald-200 text-emerald-800')}
                {renderButton('excel', 'Excel', <FileSpreadsheet className="w-6 h-6 text-green-600" />, handleExcelExport, 'bg-green-50 hover:bg-green-100/50 hover:border-green-200 text-green-800')}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data Export</h4>
              <div className="grid grid-cols-1 gap-3">
                {renderButton('dataset', 'Export Dataset (JSON)', <Database className="w-6 h-6 text-blue-600" />, handleDatasetExport, 'bg-blue-50 hover:bg-blue-100/50 hover:border-blue-200 text-blue-800 !h-14 !flex-row !gap-2')}
              </div>
            </div>
             
            <div className="pt-5 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">BI Connectors</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => handleStubExport('Power BI')} variant="outline" className="justify-start rounded-xl h-10 border-slate-200 font-bold shadow-sm">
                  <Monitor className="w-4 h-4 mr-2 text-yellow-600" /> Power BI
                </Button>
                <Button onClick={() => handleStubExport('Tableau')} variant="outline" className="justify-start rounded-xl h-10 border-slate-200 font-bold shadow-sm">
                  <Monitor className="w-4 h-4 mr-2 text-blue-600" /> Tableau
                </Button>
                <Button onClick={() => handleStubExport('PDF')} variant="outline" className="justify-start rounded-xl h-10 border-slate-200 font-bold shadow-sm">
                  <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF Report
                </Button>
                <Button onClick={() => handleStubExport('Image')} variant="outline" className="justify-start rounded-xl h-10 border-slate-200 font-bold shadow-sm">
                  <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" /> Screenshot
                </Button>
              </div>
            </div>
          </div>
          <DrawerFooter className="pt-6">
            <DrawerClose asChild>
              <Button variant="ghost" className="rounded-xl font-bold">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}