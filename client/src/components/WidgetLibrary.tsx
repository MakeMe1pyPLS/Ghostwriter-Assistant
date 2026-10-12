import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, LayoutTemplate, LineChart as LineChartIcon, BarChart3, PieChart, Table as TableIcon, BrainCircuit, Bot, MessageSquareQuote, TrendingUp, Sparkles, AlertTriangle, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSectorData } from "@/hooks/use-sector-data";
import { ALL_INDUSTRY_KPIS, INDUSTRIES, INDUSTRY_GROUPS, formatKpiUnit, type IndustryKpi, type KpiCategory } from "@shared/kpi-industries";
import { vizForKpi, kpiKey } from "@shared/kpi-viz";

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

const VIZ_ICON = { kpi: LayoutTemplate, progress: Gauge, trend: LineChartIcon, bar: BarChart3 } as const;
const CATEGORIES: (KpiCategory | 'All')[] = ['All', 'Growth', 'Profit', 'Cash', 'Operations', 'Customer', 'Quality', 'People', 'Partners', 'AI'];
const PAGE = 60;

type Tab = 'kpis' | 'charts' | 'ai';

/** The Builder's card library: every KPI in the KPI library (with the right chart for each), plus charts and AI cards. */
export function WidgetLibraryContent({ onAdd }: { onAdd: (widget: any) => void }) {
  const [tab, setTab] = useState<Tab>('kpis');
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>('all');
  const [category, setCategory] = useState<KpiCategory | 'All'>('All');
  const [limit, setLimit] = useState(PAGE);
  const { allMetrics } = useSectorData();

  // KPIs that already have numbers in this workspace (sample data or your uploads).
  const withData = useMemo(() => new Map(allMetrics.map((m) => [kpiKey(m.label), m.label])), [allMetrics]);

  const q = search.trim().toLowerCase();
  const kpis = useMemo(() => {
    const list = ALL_INDUSTRY_KPIS.filter((k) =>
      (industry === 'all' || k.industryId === industry) &&
      (category === 'All' || k.category === category) &&
      (!q || k.name.toLowerCase().includes(q) || k.formula.toLowerCase().includes(q)));
    // KPIs with data first, then A–Z within each industry.
    return list.sort((a, b) => Number(withData.has(kpiKey(b.name))) - Number(withData.has(kpiKey(a.name))));
  }, [industry, category, q, withData]);

  const addKpi = (k: IndustryKpi) => {
    const viz = vizForKpi(k);
    const dataLabel = withData.get(kpiKey(k.name));
    onAdd({
      id: viz.type,
      name: k.name,
      w: viz.w,
      h: viz.h,
      desc: k.formula,
      defaultProps: { libraryKpiId: k.id, title: k.name, chartType: viz.chartType, ...(dataLabel ? { customMetricId: dataLabel } : {}) },
    });
  };

  const others = (tab === 'charts' ? widgetCategories[0] : widgetCategories[1]).items
    .filter((w) => !q || w.name.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q));
  const industryName = (id: string) => INDUSTRIES.find((i) => i.id === id)?.name ?? '';

  const tabBtn = (id: Tab, label: string, count?: number) => (
    <button
      role="tab"
      aria-selected={tab === id}
      onClick={() => { setTab(id); setLimit(PAGE); }}
      className={cn("flex-1 h-9 rounded-lg text-[12.5px] font-bold transition-colors inline-flex items-center justify-center gap-1.5", tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
      data-testid={`library-tab-${id}`}
    >
      {label}{count !== undefined && <span className={cn("text-[10.5px] tabular-nums", tab === id ? "text-primary" : "text-slate-400")}>{count}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0 w-full min-w-0 bg-white">
      <div className="p-4 border-b border-slate-100 shrink-0 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Card library</h3>
          <span className="hidden lg:inline text-[11px] font-semibold text-slate-400">Click to add</span>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100" role="tablist" aria-label="Card types">
          {tabBtn('kpis', 'KPIs', ALL_INDUSTRY_KPIS.length)}
          {tabBtn('charts', 'Charts')}
          {tabBtn('ai', 'AI')}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            placeholder={tab === 'kpis' ? `Search ${ALL_INDUSTRY_KPIS.length} KPIs…` : "Search cards…"}
            aria-label="Search the card library"
            className="pl-9 bg-white border-slate-200 h-10 text-[13px] shadow-sm rounded-xl"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
            data-testid="library-search"
          />
        </div>
        {tab === 'kpis' && (
          <>
            <select
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); setLimit(PAGE); }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Industry"
              data-testid="library-industry"
            >
              <option value="all">All industries ({INDUSTRIES.length})</option>
              {INDUSTRY_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {INDUSTRIES.filter((i) => i.group === g).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.kpis.length})</option>)}
                </optgroup>
              ))}
            </select>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar-on-mobile -mx-1 px-1 pb-0.5" role="group" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setLimit(PAGE); }}
                  aria-pressed={category === c}
                  className={cn("shrink-0 h-8 px-3 rounded-full text-[11.5px] font-bold border transition-colors", category === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar" data-testid="library-list">
        {tab === 'kpis' ? (
          kpis.length === 0 ? (
            <p className="text-center py-10 text-slate-500 text-[13px]">No KPIs match. Try another word or industry.</p>
          ) : (
            <>
              <p className="px-1 pb-2 text-[11.5px] font-semibold text-slate-500">{kpis.length} KPI{kpis.length === 1 ? '' : 's'} · the best chart is picked for each</p>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
                {kpis.slice(0, limit).map((k) => {
                  const viz = vizForKpi(k);
                  const Icon = VIZ_ICON[viz.type];
                  const hasData = withData.has(kpiKey(k.name));
                  return (
                    <button
                      key={k.id}
                      onClick={() => addKpi(k)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-primary/40 hover:bg-teal-50/40 transition-colors group text-left"
                      title={`${k.name}: ${k.formula}`}
                      data-testid={`library-kpi-${k.id}`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 flex items-center justify-center" aria-hidden>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-bold text-slate-800 truncate flex items-center gap-1.5">
                          <span className="truncate">{k.name}</span>
                          {hasData && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" aria-label="Has data" title="Has data in this workspace" />}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {viz.label} · {formatKpiUnit(k.unit)}{industry === 'all' ? ` · ${industryName(k.industryId)}` : ''}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0" aria-hidden />
                    </button>
                  );
                })}
              </div>
              {kpis.length > limit && (
                <button onClick={() => setLimit((l) => l + PAGE)} className="mt-3 w-full h-10 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50" data-testid="library-more">
                  Show more ({kpis.length - limit} left)
                </button>
              )}
              <p className="px-1 pt-3 text-[11px] leading-snug text-slate-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 align-middle" /> has numbers in this workspace. Others show their formula until you add data.
              </p>
            </>
          )
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {others.map((w: any) => (
              <button
                key={w.id + w.name}
                onClick={() => onAdd(w)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-primary/40 hover:bg-teal-50/40 transition-colors group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 flex items-center justify-center" aria-hidden>
                  <w.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-bold text-slate-800 truncate">{w.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{w.desc}</div>
                </div>
                <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WidgetLibraryMobile({ onAdd, className }: { onAdd: (widget: any) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={cn("fixed right-4 sm:right-6 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-[55] lg:hidden", className)} aria-label="Add a card" size="icon">
          <Plus className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col rounded-t-3xl">
        <WidgetLibraryContent onAdd={(w) => { onAdd(w); setOpen(false); }} />
      </SheetContent>
    </Sheet>
  );
}