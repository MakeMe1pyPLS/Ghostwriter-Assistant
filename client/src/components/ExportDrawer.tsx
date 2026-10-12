import { exportExcel, exportCsv, exportJsonSpec, exportDataset } from "@/lib/client-export";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Download, FileJson, FileSpreadsheet, Loader2, Table2, Database, CheckCircle2, Sheet, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { downloadFromResponse, buildExcelPayload, buildDashboardPayload, exportFilename } from "@/lib/export-helpers";
import { exportExcelDashboard, exportPowerBiPack } from "@/lib/bi-export";

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

      await exportExcel(payload, { metrics: metrics || [], chartData: chartData || [], donutData: donutData || [] }, exportFilename('dashboard_excel', sector, 'xlsx'));
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
      await exportCsv({ metrics: metrics || [], chartData, sector, dateRange }, exportFilename('dashboard', sector, 'csv'));
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

      await exportJsonSpec(payload, exportFilename('dashboard_spec', sector, 'json'));
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
      await exportDataset({ metrics: metrics || [], chartData, donutData, sector, dateRange }, 'json', exportFilename('dataset', sector, 'json'));
      setExportStatus('dataset', 'success');
      toast({ title: "Dataset Exported", description: "Underlying dataset downloaded as JSON." });
    } catch (err: any) {
      setExportStatus('dataset', 'error');
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  const base = exportFilename('dashboard', sector, 'x').replace(/\.x$/, '');
  const excelPayload = () => buildExcelPayload({
    sector, dateRange, metrics: metrics || [], chartData: chartData || [],
    donutData: donutData || [], widgets, layouts: { lg: layout }, allMetrics,
  });

  const handleSheetsExport = async () => {
    setExportStatus('sheets', 'loading');
    try {
      await exportExcelDashboard(excelPayload(), `${base}_google_sheets.xlsx`);
      setExportStatus('sheets', 'success');
      toast({ title: "Ready for Google Sheets", description: "Upload the file to Google Drive, then open it with Google Sheets. Your layout and formulas come with it." });
    } catch (err: any) {
      setExportStatus('sheets', 'error');
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const handlePowerBiExport = async () => {
    setExportStatus('powerbi', 'loading');
    try {
      await exportPowerBiPack({ sector, widgets, layout, metrics: metrics || [], chartData, donutData }, base);
      setExportStatus('powerbi', 'success');
      toast({ title: "Power BI pack downloaded", description: "A data workbook (with a How to use sheet) and a colour theme. Open the workbook in Power BI Desktop." });
    } catch (err: any) {
      setExportStatus('powerbi', 'error');
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const renderButton = (key: string, label: string, icon: React.ReactNode, onClick: () => void, className: string, sub?: string) => {
    const s = status[key] || 'idle';
    return (
      <Button
        data-testid={`button-export-${key}`}
        onClick={onClick}
        disabled={s === 'loading'}
        variant="secondary"
        className={`h-auto min-h-24 py-3 flex flex-col gap-2 rounded-xl border border-transparent transition-all relative overflow-hidden whitespace-normal ${className}`}
      >
        {s === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : s === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-700" /> : icon}
        <span className="text-[11px] uppercase font-black tracking-widest">{s === 'loading' ? 'Exporting…' : label}</span>
        {sub && <span className="text-[10.5px] font-medium normal-case tracking-normal opacity-75 leading-snug">{sub}</span>}
      </Button>
    );
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button data-testid="button-export" variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-semibold text-[13px] h-10 px-3.5 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-black text-slate-900">Export Dashboard</DrawerTitle>
            <DrawerDescription className="text-sm font-medium text-slate-500">Download your {sector} dashboard for Excel, Google Sheets or Power BI, or just the data.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-5 max-h-[60dvh] overflow-y-auto overscroll-contain">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dashboard for your tool</h4>
              <p className="text-xs text-slate-500 mb-3">Cards land where you placed them in the Builder.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderButton('excel', 'Excel', <FileSpreadsheet className="w-6 h-6 text-green-700" />, handleExcelExport, 'bg-green-50 hover:bg-green-100/50 hover:border-green-200 text-green-800', 'Dashboard sheet + data; KPI numbers update from the Data tab')}
                {renderButton('sheets', 'Google Sheets', <Sheet className="w-6 h-6 text-emerald-700" />, handleSheetsExport, 'bg-emerald-50 hover:bg-emerald-100/50 hover:border-emerald-200 text-emerald-800', 'Same workbook; open it from Google Drive')}
                {renderButton('powerbi', 'Power BI', <BarChart3 className="w-6 h-6 text-amber-700" />, handlePowerBiExport, 'bg-amber-50 hover:bg-amber-100/50 hover:border-amber-200 text-amber-900', 'Data tables, layout guide and colour theme')}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data & spec</h4>
              <div className="grid grid-cols-3 gap-3">
                {renderButton('csv', 'CSV', <Table2 className="w-6 h-6 text-emerald-700" />, handleCsvExport, 'bg-slate-50 hover:bg-emerald-50 text-slate-700')}
                {renderButton('json', 'Spec', <FileJson className="w-6 h-6 text-primary" />, handleJsonExport, 'bg-slate-50 hover:bg-primary/5 text-slate-700')}
                {renderButton('dataset', 'Dataset', <Database className="w-6 h-6 text-blue-700" />, handleDatasetExport, 'bg-slate-50 hover:bg-blue-50 text-slate-700')}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              Coming soon: Tableau, PDF report and image export. Power BI files (.pbix) aren't generated; the pack above gives you everything to build the report quickly.
            </p>
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