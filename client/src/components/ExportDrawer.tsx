import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Download, FileJson, FileSpreadsheet, FileText, Image as ImageIcon, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ExportDrawer({ layout, widgets, sector, dateRange = '30d' }: { layout: any, widgets: any, sector: string, dateRange?: string }) {
  const { toast } = useToast();

  const handleRealExport = (type: 'csv' | 'json') => {
    if (type === 'json') {
      const spec = {
        sector,
        dateRange,
        timestamp: new Date().toISOString(),
        widgets,
        layouts: {
          lg: layout // In real app, we'd pull all layouts
        },
        styling: { theme: 'light', primary: 'teal' }
      };
      
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-spec-${sector}.json`;
      a.click();
      toast({ title: "Exported", description: "JSON specification downloaded." });
    } else {
      // Mock CSV
      const csv = "id,type,metric\n" + widgets.map((w: any) => `${w.id},${w.type},${w.metricIndex || ''}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `widgets-${sector}.csv`;
      a.click();
      toast({ title: "Exported", description: "CSV data downloaded." });
    }
  };

  const handleStubExport = (tool: string) => {
    toast({ title: "Connecting...", description: `Exporting directly to ${tool} requires backend integration.` });
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 w-full md:w-auto px-3 md:px-4 hover:bg-slate-50 transition-colors">
          <Download className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-black text-slate-900">Export Dashboard</DrawerTitle>
            <DrawerDescription className="text-sm font-medium text-slate-500">Download specifications or send directly to BI tools.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-5">
             <div className="grid grid-cols-2 gap-3">
               <Button onClick={() => handleRealExport('json')} variant="secondary" className="h-24 flex flex-col gap-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all">
                 <FileJson className="w-6 h-6 text-primary" />
                 <span className="text-[11px] uppercase font-black tracking-widest text-slate-700">JSON Spec</span>
               </Button>
               <Button onClick={() => handleRealExport('csv')} variant="secondary" className="h-24 flex flex-col gap-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/50 hover:border-emerald-200 border border-transparent transition-all text-emerald-800">
                 <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                 <span className="text-[11px] uppercase font-black tracking-widest">Raw CSV</span>
               </Button>
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
