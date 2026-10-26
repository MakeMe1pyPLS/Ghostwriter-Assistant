// KPI Library: pick your industry from an illustrated menu, then see the
// metrics that fit it, grouped by what they measure. Search, category filters
// and "Tracked" still work across everything.
import { useMemo, useState, useDeferredValue } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, ArrowUpRight, ArrowDownRight, Target, Copy, BookOpen, X, Check, ArrowLeft, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { EASE_OUT } from "@/components/motion";
import { PageHeader, Panel, IndustryArt, BreakdownBars, EmptyState, type ArtKey } from "@/components/viz";
import { cn } from "@/lib/utils";
import {
  INDUSTRIES, INDUSTRY_GROUPS, ALL_INDUSTRY_KPIS, KPI_STATS, formatKpiUnit,
  type IndustryKpi, type KpiCategory, type IndustryGroup,
} from "@shared/kpi-industries";

const CATEGORIES: KpiCategory[] = ['Growth', 'Profit', 'Cash', 'Customer', 'Operations', 'Quality', 'People', 'Partners', 'AI'];
const CATEGORY_DOT: Record<KpiCategory, string> = {
  Growth: 'bg-teal-600', Profit: 'bg-emerald-600', Cash: 'bg-lime-600', Customer: 'bg-sky-600', Operations: 'bg-slate-500',
  Quality: 'bg-violet-600', People: 'bg-amber-600', Partners: 'bg-rose-600', AI: 'bg-indigo-600',
};
const CATEGORY_HINT: Record<KpiCategory, string> = {
  Growth: 'Are you getting bigger?', Profit: 'Are you keeping enough of it?', Cash: 'Can you pay the bills?',
  Customer: 'Are customers happy and coming back?', Operations: 'Is the work flowing?', Quality: 'Is it done right the first time?',
  People: 'Is the team set up to win?', Partners: 'Are suppliers and partners delivering?', AI: 'Is your AI and automation paying off?',
};

const GROUP_ART: Record<IndustryGroup, ArtKey> = {
  'Every business': 'every', 'Retail & commerce': 'retail', 'Food & hospitality': 'food', 'Logistics & transport': 'logistics',
  'Manufacturing & industrial': 'manufacturing', 'Professional services': 'services', 'Technology': 'tech', 'Health & wellness': 'health',
  'Home & local services': 'home', 'Real estate & finance': 'finance', 'Education & community': 'education', 'Media & entertainment': 'media',
};

const PAGE = 24;

function KpiCard({ kpi, industryName }: { kpi: IndustryKpi; industryName?: string }) {
  const { toast } = useToast();
  const { kpiWatchlist, toggleKpiWatch, plan, setPlan } = useGrowthStore();
  const watched = kpiWatchlist.includes(kpi.id);
  const [copied, setCopied] = useState(false);
  const up = kpi.direction === 'up';
  const Dir = up ? ArrowUpRight : ArrowDownRight;

  const makeNorthStar = () => {
    if (!plan) return;
    setPlan({ ...plan, northStar: { name: kpi.name, target: plan.northStar.name === kpi.name ? plan.northStar.target : (up ? '+10%' : '−10%'), why: kpi.formula } }, { replaceActions: false });
    toast({ title: 'North Star updated', description: `${kpi.name} is now the number your plan aims at.` });
  };

  return (
    <motion.article layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}
      className="group rounded-card bg-white border border-slate-200 p-4 sm:p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-card transition-shadow">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className={cn('w-2 h-2 rounded-full', CATEGORY_DOT[kpi.category])} aria-hidden />{kpi.category}
            {industryName && <span className="truncate">· {industryName}</span>}
          </p>
          <h3 className="mt-1 text-base font-black text-slate-900 leading-snug">{kpi.name}</h3>
        </div>
        <button onClick={() => toggleKpiWatch(kpi.id)} aria-pressed={watched} aria-label={watched ? `Stop tracking ${kpi.name}` : `Track ${kpi.name}`}
          className={cn('w-10 h-10 -mr-2 -mt-1 shrink-0 rounded-control flex items-center justify-center transition-colors', watched ? 'text-amber-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50')}>
          <Star className="w-5 h-5" fill={watched ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{kpi.formula}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className={cn('inline-flex items-center gap-1 font-semibold', up ? 'text-emerald-700 dark:text-emerald-300' : 'text-sky-700 dark:text-sky-300')}>
          <Dir className="w-3.5 h-3.5" aria-hidden /> {up ? 'Higher is better' : 'Lower is better'}
        </span>
        <span>Measured in {formatKpiUnit(kpi.unit)}</span>
      </div>
      <div className="flex gap-1 pt-2 border-t border-slate-100">
        {plan && (
          <Button size="sm" variant="ghost" className="h-9 rounded-control font-bold text-xs" onClick={makeNorthStar}>
            <Target className="w-3.5 h-3.5 mr-1" aria-hidden /> Make North Star
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-9 rounded-control font-bold text-xs ml-auto" onClick={async () => {
          try { await navigator.clipboard.writeText(`${kpi.name} = ${kpi.formula}`); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* ignore */ }
        }}>
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-700" aria-hidden /> : <Copy className="w-3.5 h-3.5 mr-1" aria-hidden />} Copy formula
        </Button>
      </div>
    </motion.article>
  );
}

/** Step 1: illustrated industry groups. Step 2: the industries inside one. */
function IndustryPicker({ onPick }: { onPick: (industryId: string) => void }) {
  const [group, setGroup] = useState<IndustryGroup | null>(null);
  const groups = INDUSTRY_GROUPS.filter((g) => g !== 'Every business');
  const inGroup = group ? INDUSTRIES.filter((i) => i.group === group) : [];

  return (
    <section aria-labelledby="pick-industry" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="pick-industry" className="text-lg font-black tracking-tight text-slate-900">{group ? group : 'Pick your industry'}</h2>
          <p className="text-sm text-slate-500">{group ? 'Choose the one closest to your business.' : 'We’ll show the metrics that matter for businesses like yours.'}</p>
        </div>
        {group ? (
          <Button variant="ghost" size="sm" className="rounded-control font-bold" onClick={() => setGroup(null)}><ArrowLeft className="w-4 h-4 mr-1" aria-hidden /> All industries</Button>
        ) : (
          <Button variant="ghost" size="sm" className="rounded-control font-bold" onClick={() => onPick('universal')}>Metrics for every business <ChevronRight className="w-4 h-4 ml-0.5" aria-hidden /></Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!group ? (
          <motion.ul key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {groups.map((g) => {
              const list = INDUSTRIES.filter((i) => i.group === g);
              const kpis = list.reduce((a, i) => a + i.kpis.length, 0);
              return (
                <li key={g}>
                  <button onClick={() => setGroup(g)}
                    className="group w-full h-full text-left rounded-card border border-slate-200 bg-white p-4 sm:p-5 hover:border-teal-300 hover:shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <div className="rounded-control bg-slate-50 group-hover:bg-teal-50 transition-colors p-3 flex justify-center dark:group-hover:bg-teal-400/10">
                      <IndustryArt art={GROUP_ART[g]} className="w-16 h-12" />
                    </div>
                    <p className="mt-3 text-sm sm:text-base font-black text-slate-900 leading-snug">{g}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{list.length} industries · {kpis} KPIs</p>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : (
          <motion.ul key={group} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {inGroup.map((ind) => (
              <li key={ind.id}>
                <button onClick={() => onPick(ind.id)}
                  className="w-full flex items-center gap-4 text-left rounded-card border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="rounded-control bg-slate-50 p-2 shrink-0"><IndustryArt art={GROUP_ART[ind.group]} className="w-12 h-9" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-bold text-slate-900">{ind.name}</span>
                    <span className="block text-sm text-slate-500">{ind.kpis.length} KPIs</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400" aria-hidden />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
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
  const [limit, setLimit] = useState(PAGE);

  const industryName = useMemo(() => Object.fromEntries(INDUSTRIES.map((i) => [i.id, i.name])), []);
  const industry = INDUSTRIES.find((i) => i.id === industryId);

  // Everything matching the current industry, search and "tracked" filter, before the category filter.
  const base = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return ALL_INDUSTRY_KPIS.filter((k) =>
      // An industry view also shows the universal KPIs, and the AI set when the AI category is picked.
      (industryId === 'all' || k.industryId === industryId || (k.industryId === 'universal' && !q) || (k.industryId === 'ai-automation' && category === 'AI')) &&
      (!onlyWatched || kpiWatchlist.includes(k.id)) &&
      (!q || k.name.toLowerCase().includes(q) || k.formula.toLowerCase().includes(q) || industryName[k.industryId].toLowerCase().includes(q))
    ).sort((a, b) => Number(a.industryId === 'universal') - Number(b.industryId === 'universal'));
  }, [deferredQuery, industryId, category, onlyWatched, kpiWatchlist, industryName]);

  const results = useMemo(() => base.filter((k) => category === 'all' || k.category === category), [base, category]);
  const byCategory = useMemo(() => CATEGORIES.map((c) => ({ key: c, label: c, value: base.filter((k) => k.category === c).length })).filter((r) => r.value > 0), [base]);
  const visible = results.slice(0, limit);

  const browsing = industryId === 'all' && !deferredQuery.trim() && category === 'all' && !onlyWatched;
  const pick = (id: string) => { setIndustryId(id); setCategory('all'); setLimit(PAGE); };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        <PageHeader
          icon={BookOpen}
          title="KPI Library"
          subtitle={`${KPI_STATS.kpis} metrics across ${KPI_STATS.industries} industries, from corner shops to enterprises. Each one says how it’s measured and which way is better.`}
          actions={
            <Button variant="outline" size="sm" onClick={() => { setOnlyWatched((v) => !v); setLimit(PAGE); }} aria-pressed={onlyWatched}
              className={cn('rounded-control font-bold', onlyWatched && 'border-amber-300 bg-amber-50 text-amber-800')}>
              <Star className="w-4 h-4 mr-1.5" fill={onlyWatched ? 'currentColor' : 'none'} aria-hidden /> Tracked ({kpiWatchlist.length})
            </Button>
          }
        />

        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Search a metric, formula or industry" className="h-12 pl-10 pr-10 rounded-control bg-white" aria-label="Search KPIs" />
          {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100" aria-label="Clear search"><X className="w-4 h-4" /></button>}
        </div>

        {browsing ? (
          <IndustryPicker onPick={pick} />
        ) : (
          <>
            <Panel className="p-4 sm:p-5 flex flex-wrap items-center gap-4">
              <span className="rounded-control bg-slate-50 p-2.5"><IndustryArt art={industry ? GROUP_ART[industry.group] : 'every'} className="w-14 h-10" /></span>
              <div className="flex-1 min-w-[12rem]">
                <p className="text-xs font-semibold text-slate-500">{industry ? industry.group : deferredQuery ? 'Search results' : 'All industries'}</p>
                <p className="text-lg font-black tracking-tight text-slate-900">{industry ? industry.name : deferredQuery ? `“${deferredQuery}”` : 'Every industry'}</p>
                <p className="text-sm text-slate-500">{results.length} KPI{results.length === 1 ? '' : 's'}{category !== 'all' ? ` in ${category}` : ''}{industry && industry.id !== 'universal' ? ', plus the ones every business should watch' : ''}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-control font-bold" onClick={() => { pick('all'); setQuery(''); setOnlyWatched(false); }}>
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden /> Change industry
              </Button>
            </Panel>

            <div className="grid lg:grid-cols-[16rem_1fr] gap-6 items-start">
              <aside className="lg:sticky lg:top-4 space-y-3">
                <Panel className="p-4">
                  <h2 className="text-sm font-black text-slate-900 px-2">What they measure</h2>
                  <div className="mt-2">
                    <button onClick={() => { setCategory('all'); setLimit(PAGE); }} aria-pressed={category === 'all'}
                      className={cn('w-full text-left rounded-lg px-2 py-1.5 text-sm', category === 'all' ? 'bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-50')}>
                      Everything ({base.length})
                    </button>
                    <BreakdownBars rows={byCategory} selected={category === 'all' ? undefined : category}
                      onSelect={(k) => { setCategory((c) => (c === k ? 'all' : (k as KpiCategory))); setLimit(PAGE); }} />
                  </div>
                </Panel>
                {category !== 'all' && (
                  <p className="text-sm text-slate-600 px-1"><span className="font-bold text-slate-800">{category}:</span> {CATEGORY_HINT[category]}</p>
                )}
              </aside>

              <section aria-label="KPIs" className="min-w-0 space-y-4">
                {visible.length ? (
                  <>
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                      <AnimatePresence mode="popLayout">
                        {visible.map((k) => <KpiCard key={k.id} kpi={k} industryName={industryId === 'all' || k.industryId !== industryId ? industryName[k.industryId] : undefined} />)}
                      </AnimatePresence>
                    </motion.div>
                    {results.length > visible.length && (
                      <div className="flex flex-col items-center gap-1 pt-2">
                        <Button variant="outline" className="rounded-control font-bold" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, results.length - visible.length)} more</Button>
                        <p className="text-xs text-slate-500">Showing {visible.length} of {results.length}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState icon={BookOpen} title="No KPIs match" body="Try another word, or ask the analyst which metric fits your situation."
                    action={<Button variant="outline" className="rounded-control font-bold" asChild><Link href={`/insights?ask=${encodeURIComponent(`Which KPI should I track for: ${query || 'my business'}?`)}`}>Ask the analyst</Link></Button>} />
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
