import { useState } from "react";
import { Plus, Search, LayoutTemplate, LineChart as LineChartIcon, BarChart3, PieChart, Table as TableIcon, BrainCircuit, Bot, MessageSquareQuote, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSectorData } from "@/hooks/use-sector-data";
import { getRecommendedVisualization } from "@/lib/visualization-map";

export const widgetCategories = [
  {
    id: "generic",
    name: "Generic Visuals",
    items: [
      { id: 'table', name: 'Data Table', icon: TableIcon, w: 6, h: 4, desc: "Detailed tabular data" },
      { id: 'trend', name: 'Line Chart', icon: LineChartIcon, w: 6, h: 3, defaultProps: { chartType: 'line' }, desc: "Time-series line" },
      { id: 'bar', name: 'Bar Chart', icon: BarChart3, w: 6, h: 3, defaultProps: { chartType: 'bar' }, desc: "Categorical comparison" },
      { id: 'donut', name: 'Donut Chart', icon: PieChart, w: 4, h: 3, defaultProps: { chartType: 'donut' }, desc: "Part-to-whole distribution" },
    ]
  },
  {
    id: "ai",
    name: "AI & Insights",
    items: [
      { id: 'insights', name: 'AI Insights', icon: BrainCircuit, w: 4, h: 4, desc: "Automated anomaly detection", alwaysAvailable: true },
      { id: 'chat', name: 'AI Chat', icon: Bot, w: 4, h: 4, desc: "Conversational assistant", alwaysAvailable: true },
      { id: 'forecast', name: 'Demand Forecast', icon: TrendingUp, w: 8, h: 4, desc: "Predictive modeling", alwaysAvailable: true },
      { id: 'summary', name: 'Executive Summary', icon: MessageSquareQuote, w: 12, h: 2, desc: "Text-based overview", alwaysAvailable: true },
      { id: 'opportunity-risk', name: 'Opportunity & Risk', icon: AlertTriangle, w: 6, h: 4, desc: "Real-time risk/opportunity highlights", alwaysAvailable: true },
    ]
  }
];

export function WidgetLibraryContent({ onAdd }: { onAdd: (widget: any) => void }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { allMetrics } = useSectorData();

  const dynamicCategories = [
    {
      id: "kpis",
      name: "Key Performance Indicators",
      items: (activeTab === 'all' || activeTab === 'custom' ? allMetrics : allMetrics.filter(m => m.category === activeTab)).map((m) => {
        const rec = getRecommendedVisualization(m.label);
        return {
          id: rec.type,
          name: m.label,
          icon: rec.type === 'trend' ? LineChartIcon : rec.type === 'bar' ? BarChart3 : LayoutTemplate,
          w: rec.type === 'kpi' ? 3 : 6,
          h: rec.type === 'kpi' ? 2 : 3,
          desc: m.helpText,
          isRecommended: rec.type !== 'kpi',
          defaultProps: {
            customMetricId: m.label,
            chartType: rec.chartType,
            title: m.label
          }
        };
      })
    },
    ...widgetCategories
  ];

  const filteredCategories = dynamicCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.desc.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Widget Library</h3>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto p-1.5 mb-2 bg-slate-100 rounded-xl">
            <TabsTrigger value="all" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="ecommerce" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">E-com</TabsTrigger>
            <TabsTrigger value="manufacturing" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Mfg</TabsTrigger>
            <TabsTrigger value="logistics" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Log</TabsTrigger>
            <TabsTrigger value="unified" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Unified</TabsTrigger>
            <TabsTrigger value="custom" className="text-[11px] py-1.5 font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search widgets..." 
            className="pl-9 bg-white border-slate-200 h-10 text-xs shadow-sm rounded-xl font-medium"
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
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {cat.name} {cat.id === 'ai' && <span className="text-primary ml-1">(Always Active)</span>}
              </h4>
              <div className="grid gap-2">
                {cat.items.map((w: any) => {
                  const isRecommended = w.isRecommended || (activeTab !== 'all' && cat.id !== 'ai' && Math.random() > 0.7);

                  return (
                    <button
                      key={w.id}
                      onClick={() => onAdd({ ...w, defaultCategory: activeTab !== 'all' ? activeTab : 'unified' })}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/40 hover:bg-teal-50/30 transition-all group text-left relative overflow-hidden"
                    >
                      {isRecommended && (
                        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          <w.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 truncate flex items-center gap-2">
                            {w.name}
                            {isRecommended && <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Rec</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 group-hover:text-slate-500 truncate">{w.desc}</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1" />
                    </button>
                  );
                })}
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