import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useDashboardStore, Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Papa from "papaparse";

export function ImportDataModal() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<Sector | "">("");
  
  const { setImportedData, setSector } = useDashboardStore();
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setTimeout(() => {
          setPreviewData(results.data.slice(0, 5)); // show first 5 rows
          setImportedData(results.data);
          setIsProcessing(false);
          toast({
            title: "Data Parsed Successfully",
            description: `Found ${results.data.length} rows in ${file.name}.`
          });
        }, 800);
      },
      error: (error) => {
        setIsProcessing(false);
        toast({
          title: "Error Parsing File",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (selectedMapping) {
      setSector(selectedMapping as Sector);
    } else {
      setSector("custom");
    }
    toast({
      title: "Data Imported",
      description: "Dashboard updated with your dataset."
    });
    setOpen(false);
    // Reset state for next time
    setTimeout(() => {
      setPreviewData(null);
      setSelectedMapping("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 transition-colors hidden sm:flex rounded-xl shadow-sm px-4">
          <Upload className="w-4 h-4" />
          <span className="uppercase tracking-widest text-[10px]">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 pb-6">
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Import Dataset</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
            Upload a CSV or JSON file to bring your own supply chain data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 md:p-8">
          {!previewData ? (
            <div 
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-105 transition-transform">
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Drag and drop your file here</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 max-w-xs">Supports .csv and .json files up to 10MB.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept=".csv,.json"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  disabled={isProcessing}
                />
                <Button disabled={isProcessing} size="lg" className="rounded-xl font-bold shadow-md px-8">
                  {isProcessing ? 'Processing...' : 'Browse Files'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-700 bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-black text-[15px]">Upload Successful</h4>
                  <p className="text-xs font-medium text-emerald-700/80 mt-1">Data is ready to be mapped to your dashboard.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Assign to Sector (Optional)</label>
                <Select value={selectedMapping} onValueChange={(v) => setSelectedMapping(v as any)}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-white font-medium shadow-sm">
                    <SelectValue placeholder="Select a sector mapping..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="unified">Unified Bridge</SelectItem>
                    <SelectItem value="custom">Custom (No specific mapping)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] font-medium text-slate-500">This helps us auto-configure the default widget metrics.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Data Preview</h4>
                <div className="border border-slate-200 rounded-xl overflow-auto max-h-[200px] custom-scrollbar shadow-inner bg-white">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((k) => (
                          <th key={k} className="p-3 font-black text-slate-600 border-b border-slate-200 uppercase tracking-wider">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          {Object.values(row).map((v: any, j) => (
                            <td key={j} className="p-3 text-slate-700 truncate max-w-[150px] font-medium">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setPreviewData(null)} className="rounded-xl h-12 px-6 font-bold shadow-sm">Cancel</Button>
                <Button onClick={handleConfirm} className="rounded-xl h-12 px-8 font-bold shadow-md hover:shadow-lg transition-all">Import to Dashboard</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
