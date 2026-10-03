import { enhanceDashboard } from "@/lib/intel-client";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Upload, LayoutDashboard, ArrowRight, Loader2, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";
import { EnhanceWizard, EnhanceAnswers } from "@/components/EnhanceWizard";
import { useDashboardStore, type Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { parseDataFile, ACCEPTED_DATA_FILES } from "@/lib/file-import";
import { buildStateFromSpec } from "@/lib/dashboard-spec";
import { classifySector } from "@/lib/dataset-library";
import { EASE_OUT } from "@/components/motion";

interface ImportedDashboard {
  fileName: string;
  widgets: any[];
  summary: string;
}

/** Turns a spreadsheet's numeric columns into starter KPI widgets for Enhance. */
function widgetsFromColumns(columns: { name: string; type?: string }[]): any[] {
  const numeric = columns.filter((c) => c.type === 'number').slice(0, 8);
  const hasDate = columns.some((c) => c.type === 'date' || /date|month|week|day|period/i.test(c.name));
  const ts = Date.now();
  const kpis = numeric.map((c, i) => ({ id: `imp-${i}-${ts}`, type: 'kpi', title: c.name, customMetricId: c.name, metricIndex: i }));
  if (hasDate && numeric[0]) kpis.push({ id: `imp-trend-${ts}`, type: 'trend', title: `${numeric[0].name} over time`, chartType: 'area', metricIndex: 0 } as any);
  return kpis;
}

export default function EnhancePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selectedSector, saveDashboard, addDataset, setSector } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [reading, setReading] = useState(false);
  const [imported, setImported] = useState<ImportedDashboard | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setReading(true);
    try {
      // A ChainInsideIQ dashboard spec (JSON export) is restored exactly.
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const spec = JSON.parse(await file.text());
          if (spec && Array.isArray(spec.widgets) && spec.widgets[0]?.layout) {
            const { widgets } = buildStateFromSpec(spec);
            setImported({ fileName: file.name, widgets, summary: `${widgets.length} widgets from your dashboard spec` });
            return;
          }
        } catch { /* fall through to data import */ }
      }
      // Any other spreadsheet: keep the data and turn its numeric columns into KPIs.
      const payload = await parseDataFile(file);
      const detection = classifySector(payload.columns.map((c) => c.name));
      const sector: Sector = detection.sector ?? selectedSector;
      addDataset({ name: payload.defaultName, sector, columns: payload.columns, rows: payload.rows, rowCount: payload.rowCount, sourceType: payload.sourceType });
      if (sector !== selectedSector) setSector(sector);
      const widgets = widgetsFromColumns(payload.columns);
      if (!widgets.length) throw new Error('We couldn’t find number columns to turn into KPIs. Check that the first row holds column names.');
      setImported({ fileName: file.name, widgets, summary: `${widgets.length} KPIs found in ${payload.rowCount.toLocaleString()} rows. The data is saved under Data Sources too.` });
    } catch (err: any) {
      toast({ title: 'Couldn’t read that dashboard', description: err?.message || 'Try exporting it as .xlsx or .csv first.', variant: 'destructive' });
    } finally {
      setReading(false);
    }
  };

  const handleComplete = async (answers: EnhanceAnswers) => {
    setLoading(true);
    try {
      const existingWidgets = imported?.widgets ?? JSON.parse(localStorage.getItem(`widgets_${selectedSector}`) || '[]');
      const existingLayout = imported ? [] : JSON.parse(localStorage.getItem(`layout_${selectedSector}`) || '[]');

      const targetTool = answers.targetTool === 'same' ? answers.currentTool : answers.targetTool;

      const result = await enhanceDashboard({
        sector: selectedSector,
        currentTool: answers.currentTool,
        targetTool,
        improvements: answers.improvements,
        keepKpis: answers.keepKpis,
        designStyle: answers.designStyle,
        existingWidgets,
        existingLayout,
      });

      saveDashboard(selectedSector, result.layout, result.widgets);
      localStorage.setItem('generated_dashboard_meta', JSON.stringify({
        title: result.title,
        subtitle: result.subtitle,
        toolTarget: result.toolTarget,
        cardPreset: result.cardPreset,
        style: result.style,
        aiSummary: result.aiSummary,
      }));

      toast({
        title: "Dashboard Enhanced",
        description: result.aiSummary || "Your dashboard has been improved.",
      });

      navigate('/builder');
    } catch (err) {
      toast({ title: "Enhancement Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (started) {
    return <EnhanceWizard onComplete={handleComplete} onCancel={() => navigate('/builder')} loading={loading} sector={selectedSector} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F4F7FA] flex flex-col">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md px-4 md:px-8 h-16 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Enhance my dashboard</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Step 0 · choose what to improve</p>
        </div>
        <Button variant="ghost" className="font-bold text-slate-500" onClick={() => navigate('/builder')}>Cancel</Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="w-full max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 text-balance">Which dashboard should we improve?</h1>
          <p className="text-slate-500 mt-2 text-lg">Upload the one you use today, or improve the dashboard you already have here.</p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className={`rounded-3xl border-2 ${imported ? 'border-primary bg-primary/5' : 'border-dashed border-slate-300 bg-white'} p-6 flex flex-col`}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center"><Upload className="w-6 h-6" /></div>
              <h2 className="font-black text-slate-900 text-lg mt-4">Upload your dashboard</h2>
              <p className="text-sm text-slate-500 mt-1 flex-1">Excel (.xlsx), CSV or a ChainInsideIQ JSON spec. From Power BI or Tableau, export the data behind your report as Excel or CSV first.</p>
              {imported ? (
                <div className="mt-4 rounded-2xl bg-white border border-primary/20 p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{imported.fileName}</p>
                    <p className="text-xs text-slate-500">{imported.summary}</p>
                  </div>
                  <button onClick={() => setImported(null)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100" aria-label="Remove file"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <input ref={fileRef} type="file" accept={ACCEPTED_DATA_FILES} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                  <Button variant="outline" className="mt-4 rounded-xl font-bold h-11" onClick={() => fileRef.current?.click()} disabled={reading}>
                    {reading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading…</> : <><FileSpreadsheet className="w-4 h-4 mr-2" /> Choose a file</>}
                  </Button>
                </>
              )}
            </div>
            <button onClick={() => { setImported(null); setStarted(true); }}
              className="text-left rounded-3xl border border-slate-200 bg-white p-6 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><LayoutDashboard className="w-6 h-6" /></div>
              <h2 className="font-black text-slate-900 text-lg mt-4">Use my current dashboard</h2>
              <p className="text-sm text-slate-500 mt-1 flex-1">Improve the dashboard you’ve built or generated in ChainInsideIQ.</p>
              <span className="mt-4 text-primary font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5">Continue <ArrowRight className="w-4 h-4" /></span>
            </button>
          </div>

          {imported && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
              <Button onClick={() => setStarted(true)} className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-700">
                Enhance this dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
