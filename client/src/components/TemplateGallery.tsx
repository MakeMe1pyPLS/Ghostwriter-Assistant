import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Database, LineChart, BarChart2, LayoutTemplate } from "lucide-react";

export const templates = [
  { id: 'excel', name: 'Excel Executive', icon: FileSpreadsheet, desc: 'Classic grid view for Excel users', tool: 'Excel' },
  { id: 'sheets', name: 'Google Sheets Live', icon: FileSpreadsheet, desc: 'Collaborative real-time view', tool: 'Google Sheets' },
  { id: 'powerbi', name: 'Power BI Dashboard', icon: BarChart2, desc: 'Deep analytics & sliceable charts', tool: 'Power BI' },
  { id: 'tableau', name: 'Tableau Visual', icon: LineChart, desc: 'High-density visual exploration', tool: 'Tableau' },
  { id: 'sql', name: 'SQL Ops Center', icon: Database, desc: 'Direct-from-db operational view', tool: 'SQL Ops' },
];

export function TemplateGallery({ onSelect }: { onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-bold text-xs uppercase tracking-wider h-10 w-full md:w-auto">
          <LayoutTemplate className="w-4 h-4 mr-2" />
          Template Gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-bold">Template Gallery</DialogTitle>
          <DialogDescription>
            Start with a pre-configured layout based on your favorite BI tool.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div 
                key={t.id} 
                className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:bg-teal-50/10 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
              >
                <div className="absolute top-0 right-0 p-3">
                   <Badge variant="secondary" className="text-[10px] uppercase font-bold">{t.tool}</Badge>
                </div>
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <t.icon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
