// KPI Library: metrics for every kind of business, searchable and filterable,
// with one-tap actions to track a KPI or make it the plan's North Star.
import { useMemo, useState, useDeferredValue } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, ArrowUpRight, ArrowDownRight, Target, Copy, BookOpen, X, Check } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { EASE_OUT } from "@/components/motion";
import {
  INDUSTRIES, INDUSTRY_GROUPS, ALL_INDUSTRY_KPIS, KPI_STATS, formatKpiUnit,
  type IndustryKpi, type KpiCategory,
} from "@shared/kpi-industries";

const CATEGORIES: KpiCategory[] = ['Growth', 'Profit', 'Cash', 'Customer', 'Operations', 'Quality', 'People', 'Partners', 'AI'];
const CATEGORY_TONE: Record<KpiCategory, string> = {
  Growth: 'bg-teal-50 text-teal-700', Profit: 'bg-emerald-50 text-emerald-700', Cash: 'bg-lime-50 text-lime-700',
  Customer: 'bg-sky-50 text-sky-700', Operations: 'bg-slate-100 text-slate-700', Quality: 'bg-violet-50 text-violet-700',
  People: 'bg-amber-50 text-amber-700', Partners: 'bg-rose-50 text-rose-700', AI: 'bg-indigo-50 text-indigo-700',
};

function KpiCard({ kpi, industryName }: { kpi: IndustryKpi; industryName: string }) {
  const { toast } = useToast();
  const { kpiWatchlist, toggleKpiWatch, plan, setPlan } = useGrowthStore();
  const watched = kpiWatchlist.includes(kpi.id);
  const [copied, setCopied] = useState(false);
  const Dir = kpi.direction === 'up' ? ArrowUpRight : ArrowDownRight;

  const makeNorthStar = () => {
    if (!plan) return;
    setPlan({ ...plan, northStar: { name: kpi.name, target: plan.northStar.name === kpi.name ? plan.northStar.target : (kpi.direction === 'up' ? '+10%' : '−10%'), why: kpi.formula } }, { replaceActions: false });
    toast({ title: 'North Star updated', description: `${kpi.name} is now the number your plan aims at.` });
  };

  return (
    <motion.article layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}
      className="group rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-shadow">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 leading-snug">{kpi.name}</h3>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{industryName}</p>
        </div>
        <button onClick={() => toggleKpiWatch(kpi.id)} aria-pressed={watched} aria-label={watched ? 'Stop tracking' : 'Track this KPI'}
          className={`p-1.5 rounded-lg transition-colors ${watched ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}>
          <Star className="w-5 h-5" fill={watched ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{kpi.formula}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${CATEGORY_TONE[kpi.category]}`}>{kpi.category}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-50 text-slate-500">{formatKpiUnit(kpi.unit)}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-50 text-slate-500 inline-flex items-center gap-0.5">
          <Dir className="w-3 h-3" /> {kpi.direction === 'up' ? 'Higher is better' : 'Lower is better'}
        </span>
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-slate-100 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity">
        {plan && (
          <Button size="sm" variant="ghost" className="h-8 rounded-lg font-bold text-xs" onClick={makeNorthStar}>
            <Target className="w-3.5 h-3.5 mr-1" /> Make North Star
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 rounded-lg font-bold text-xs ml-auto" onClick={async () => {
          try { await navigator.clipboard.writeText(`${kpi.name} = ${kpi.formula}`); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* ignore */ }
        }}>
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Formula
        </Button>
      </div>
    </motion.article>
  );
}

export default function KpiLibraryPage() {
  const profile = useGrowthStore((s) => s.profile);
  const kpiWatchlist = useGrowthStore((s) => s.kpiWatchlist);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [industryId, setIndustryId] = useState<string>(() => (new URLSearchParams(window.location.search).get('category') ? 'all' : profile?.industryId ?? 'all'));
  // /kpis?category=AI opens straight on a category (used by marketing links).
  const [category, setCategory] = useState<KpiCategory | 'all'>(() => {
    const c = new URLSearchParams(window.location.search).get('category');
    return c && CATEGORIES.includes(c as KpiCategory) ? (c as KpiCategory) : 'all';
  });
  const [onlyWatched, setOnlyWatched] = useState(false);

  const industryName = useMemo(() => Object.fromEntries(INDUSTRIES.map((i) => [i.id, i.name])), []);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return ALL_INDUSTRY_KPIS.filter((k) =>
      // An industry view also shows the universal KPIs, and the AI set when the AI category is picked.
      (industryId === 'all' || k.industryId === industryId || (k.industryId === 'universal' && !q) || (k.industryId === 'ai-automation' && category === 'AI')) &&
      (category === 'all' || k.category === category) &&
      (!onlyWatched || kpiWatchlist.includes(k.id)) &&
      (!q || k.name.toLowerCase().includes(q) || k.formula.toLowerCase().includes(q) || industryName[k.industryId].toLowerCase().includes(q))
    ).sort((a, b) => Number(a.industryId === 'universal') - Number(b.industryId === 'universal'));
  }, [deferredQuery, industryId, category, onlyWatched, kpiWatchlist, industryName]);

  const visible = results.slice(0, 120);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-5">
        <header className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Grow</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">KPI Library</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">{KPI_STATS.kpis} metrics across {KPI_STATS.industries} industries, from corner shops to enterprises, including {KPI_STATS.aiKpis} for tracking AI and automation. Each one says how it’s measured and which way is better.</p>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search KPIs, formulas or industries" className="h-12 pl-10 pr-10 rounded-2xl bg-white" aria-label="Search KPIs" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:bg-slate-100" aria-label="Clear search"><X className="w-4 h-4" /></button>}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <select value={industryId} onChange={(e) => setIndustryId(e.target.value)} aria-label="Industry"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 max-w-full">
            <option value="all">All industries</option>
            {INDUSTRY_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {INDUSTRIES.filter((i) => i.group === g).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 -mb-1">
            {(['all', ...CATEGORIES] as const).map((c) => (
              <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`relative h-10 px-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${category === c ? 'text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                {category === c && <motion.span layoutId="kpiCat" className="absolute inset-0 rounded-xl bg-slate-900" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                <span className="relative">{c === 'all' ? 'All' : c}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setOnlyWatched((v) => !v)} aria-pressed={onlyWatched}
            className={`h-10 px-3.5 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 border transition-colors ${onlyWatched ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}>
            <Star className="w-3.5 h-3.5" fill={onlyWatched ? 'currentColor' : 'none'} /> Tracked ({kpiWatchlist.length})
          </button>
        </div>

        <p className="text-xs font-bold text-slate-400">{results.length} KPI{results.length === 1 ? '' : 's'}{results.length > visible.length ? ` · showing the first ${visible.length}, refine your search to see more` : ''}</p>

        {visible.length ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {visible.map((k) => <KpiCard key={k.id} kpi={k} industryName={industryName[k.industryId]} />)}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-black text-slate-900 mt-3">No KPIs match</p>
            <p className="text-sm text-slate-500 mt-1">Try another word, or ask the analyst which metric fits your situation.</p>
            <Link href={`/insights?ask=${encodeURIComponent(`Which KPI should I track for: ${query || 'my business'}?`)}`}><Button variant="outline" className="mt-4 rounded-xl font-bold">Ask the analyst</Button></Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
