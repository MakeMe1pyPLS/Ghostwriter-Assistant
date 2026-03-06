import { useState } from "react";
import { Plus, Search, LayoutTemplate, LineChart as LineChartIcon, BarChart3, PieChart, Table as TableIcon, BrainCircuit, Bot, MessageSquareQuote, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const widgetCategories = [
  {
    id: "kpi",
    name: "KPI & Metrics",
    items: [
      { id: 'kpi', name: 'KPI Card', icon: LayoutTemplate, w: 3, h: 2, desc: "Single metric with trend" },
      { id: 'table', name: 'Data Table', icon: TableIcon, w: 6, h: 4, desc: "Detailed tabular data" },
    ]
  },
  {
    id: "charts",
    name: "Charts & Visuals",
    items: [
      { id: 'trend', name: 'Line Chart', icon: LineChartIcon, w: 6, h: 3, defaultProps: { chartType: 'line' }, desc: "Time-series line" },
      { id: 'bar', name: 'Bar Chart', icon: BarChart3, w: 6, h: 3, defaultProps: { chartType: 'bar' }, desc: "Categorical comparison" },
      { id: 'donut', name: 'Donut Chart', icon: PieChart, w: 4, h: 3, defaultProps: { chartType: 'donut' }, desc: "Part-to-whole distribution" },
    ]
  },
  {
    id: "ai",
    name: "AI & Insights",
    items: [
      { id: 'insights', name: 'AI Insights', icon: BrainCircuit, w: 4, h: 4, desc: "Automated anomaly detection" },
      { id: 'chat', name: 'AI Chat', icon: Bot, w: 4, h: 4, desc: "Conversational assistant" },
      { id: 'forecast', name: 'Demand Forecast', icon: TrendingUp, w: 8, h: 4, desc: "Predictive modeling" },
    ]
  },
  {
    id: "summary",
    name: "Summaries",
    items: [
      { id: 'summary', name: 'Executive Summary', icon: MessageSquareQuote, w: 12, h: 2, desc: "Text-based overview" },
    ]
  }
];

export function WidgetLibraryContent({ onAdd }: { onAdd: (widget: any) => void }) {
  const [search, setSearch] = useState("");

  const filteredCategories = widgetCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.desc.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Widget Library</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search widgets..." 
            className="pl-9 bg-white border-slate-200 h-9 text-xs shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No widgets found.</div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.id} className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{cat.name}</h4>
              <div className="grid gap-2">
                {cat.items.map(w => (
                  <button
                    key={w.id}
                    onClick={() => onAdd(w)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/40 hover:bg-teal-50/30 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                        <w.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 truncate">{w.name}</div>
                        <div className="text-[10px] text-slate-400 group-hover:text-slate-500 truncate">{w.desc}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function WidgetLibraryMobile({ onAdd }: { onAdd: (widget: any) => void }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 lg:hidden" size="icon">
          <Plus className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col rounded-t-3xl">
        <WidgetLibraryContent onAdd={(w) => { onAdd(w); setOpen(false); }} />
      </SheetContent>
    </Sheet>
  );
}
