import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Database, LineChart, BarChart2, LayoutTemplate } from "lucide-react";

export const templates = [
  { id: 'excel', name: 'Excel Executive', icon: FileSpreadsheet, desc: 'A row of KPI cards, a trend and a detail table. Exports cleanly to an Excel dashboard.', tool: 'Excel' },
  { id: 'sheets', name: 'Google Sheets Report', icon: FileSpreadsheet, desc: 'KPIs over a full-width table: simple, and imports neatly into Google Sheets.', tool: 'Google Sheets' },
  { id: 'powerbi', name: 'Power BI Dashboard', icon: BarChart2, desc: 'KPI band, a big trend, a breakdown donut and a bar chart, in the classic Power BI layout.', tool: 'Power BI' },
  { id: 'tableau', name: 'Tableau Visual', icon: LineChart, desc: 'Chart-heavy layout for exploring patterns, with KPIs down the side.', tool: 'Tableau' },
  { id: 'sql', name: 'SQL Ops Center', icon: Database, desc: 'Operational view built around a large data table and live KPIs.', tool: 'SQL Ops' },
];

type W = { type: string; chartType?: string; title?: string; metricIndex?: number };
const T: Record<string, [W, number, number, number, number][]> = {
  // widget, x, y, w, h  (12-column grid)
  excel: [
    [{ type: 'kpi', metricIndex: 0 }, 0, 0, 3, 2], [{ type: 'kpi', metricIndex: 1 }, 3, 0, 3, 2], [{ type: 'kpi', metricIndex: 2 }, 6, 0, 3, 2], [{ type: 'kpi', metricIndex: 3 }, 9, 0, 3, 2],
    [{ type: 'trend', chartType: 'line', title: 'Trend' }, 0, 2, 7, 4], [{ type: 'table', title: 'Detail' }, 7, 2, 5, 4],
  ],
  sheets: [
    [{ type: 'kpi', metricIndex: 0 }, 0, 0, 4, 2], [{ type: 'kpi', metricIndex: 1 }, 4, 0, 4, 2], [{ type: 'kpi', metricIndex: 2 }, 8, 0, 4, 2],
    [{ type: 'table', title: 'All metrics' }, 0, 2, 12, 5],
  ],
  powerbi: [
    [{ type: 'kpi', metricIndex: 0 }, 0, 0, 3, 2], [{ type: 'kpi', metricIndex: 1 }, 3, 0, 3, 2], [{ type: 'kpi', metricIndex: 2 }, 6, 0, 3, 2], [{ type: 'kpi', metricIndex: 3 }, 9, 0, 3, 2],
    [{ type: 'trend', chartType: 'area', title: 'Performance over time' }, 0, 2, 8, 4], [{ type: 'donut', chartType: 'donut', title: 'Breakdown' }, 8, 2, 4, 4],
    [{ type: 'bar', chartType: 'bar', title: 'Comparison' }, 0, 6, 12, 4],
  ],
  tableau: [
    [{ type: 'trend', chartType: 'line', title: 'Trend' }, 0, 0, 9, 4], [{ type: 'kpi', metricIndex: 0 }, 9, 0, 3, 2], [{ type: 'kpi', metricIndex: 1 }, 9, 2, 3, 2],
    [{ type: 'bar', chartType: 'bar', title: 'Comparison' }, 0, 4, 6, 4], [{ type: 'donut', chartType: 'donut', title: 'Mix' }, 6, 4, 6, 4],
  ],
  sql: [
    [{ type: 'kpi', metricIndex: 0 }, 0, 0, 4, 2], [{ type: 'kpi', metricIndex: 1 }, 4, 0, 4, 2], [{ type: 'kpi', metricIndex: 2 }, 8, 0, 4, 2],
    [{ type: 'table', title: 'Operations log' }, 0, 2, 8, 6], [{ type: 'trend', chartType: 'line', title: 'Throughput' }, 8, 2, 4, 6],
  ],
};

/** Widgets and 12-column layout for a template. */
export function buildTemplate(id: string): { widgets: any[]; layout: any[] } {
  const rows = T[id] ?? T.excel;
  const stamp = Date.now().toString(36);
  const widgets: any[] = [], layout: any[] = [];
  rows.forEach(([w, x, y, wd, h], i) => {
    const wid = `${w.type}-${stamp}-${i}`;
    widgets.push({ id: wid, ...w });
    layout.push({ i: wid, x, y, w: wd, h });
  });
  return { widgets, layout };
}

export function TemplateGallery({ onSelect, open: openProp, onOpenChange, hideTrigger }: { onSelect: (id: string) => void; open?: boolean; onOpenChange?: (o: boolean) => void; hideTrigger?: boolean }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { setOpenState(o); onOpenChange?.(o); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm bg-white font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 w-auto px-3 md:px-4 hover:bg-slate-50 transition-colors">
          <LayoutTemplate className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Templates
        </Button>
      </DialogTrigger>}
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 pb-6">
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Template Gallery</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
            Start from a layout styled after the tool you report in. It replaces the current layout; you can rearrange everything after.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div 
                key={t.id} 
                className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-primary/40 hover:bg-teal-50/10 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col items-start"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
              >
                <div className="absolute top-0 right-0 p-4">
                   <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-slate-100 text-slate-500">{t.tool}</Badge>
                </div>
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100 group-hover:border-primary/20">
                  <t.icon className="w-7 h-7 text-slate-400 group-hover:text-primary" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">{t.name}</h3>
                <p className="text-xs font-medium text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
