import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatasetImportResolver, type ImportPayload } from "@/components/DatasetImportResolver";
import Papa from "papaparse";

export function ImportDataModal() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payload, setPayload] = useState<ImportPayload | null>(null);

  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const columns = (results.meta.fields || Object.keys(rows[0] || {})).map((name) => ({ name }));
        setPayload({
          defaultName: file.name.replace(/\.(csv|json)$/i, ''),
          columns,
          rows,
          rowCount: rows.length,
          sourceType: 'csv',
        });
        setIsProcessing(false);
        toast({
          title: "Data Parsed Successfully",
          description: `Found ${rows.length} rows in ${file.name}.`
        });
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

  const handleApplied = () => {
    setOpen(false);
    setTimeout(() => setPayload(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 transition-colors hidden sm:flex rounded-xl shadow-sm px-4">
          <Upload className="w-4 h-4" />
          <span className="uppercase tracking-widest text-[10px]">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 pb-6">
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Import Dataset</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
            Upload a CSV or JSON file to bring your own supply chain data.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 md:p-8">
          {!payload ? (
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
            <DatasetImportResolver payload={payload} onApplied={handleApplied} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
