// Growth Plan: the owner's goal, North Star, phased steps and an action board
// that also collects actions created from bottlenecks and Hub discussions.
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Target, Sparkles, RefreshCw, Pencil, Download, CalendarPlus, CheckCircle2, Circle, CircleDot, Plus,
  MessageSquare, AlertTriangle, Zap, Handshake, ChevronDown, Trash2, Loader2, ArrowRight, User, ListChecks, Map as MapIcon,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore, type ActionItem, type ActionStatus } from "@/hooks/use-growth-store";
import { fetchGrowthPlan, ENGINE_LABELS } from "@/lib/intel-client";
import { googleCalendarUrl, outlookCalendarUrl, icsFile, addDays } from "@/lib/calendar";
import { buildBasicWorkbook, downloadBlob } from "@/lib/client-export";
import { appLink } from "@/lib/share";
import { ShareMenu } from "@/components/ShareMenu";
import { Stagger, StaggerItem, EASE_OUT } from "@/components/motion";
import { GOALS, type StepOwner } from "@shared/growth";
import { getIndustry } from "@shared/kpi-industries";
import type { AIEnginePreference } from "@shared/ai-types";

const STATUS_META: Record<ActionStatus, { label: string; icon: any; tone: string }> = {
  todo: { label: 'To do', icon: Circle, tone: 'text-slate-400' },
  doing: { label: 'In progress', icon: CircleDot, tone: 'text-amber-500' },
  done: { label: 'Done', icon: CheckCircle2, tone: 'text-emerald-600' },
};
const NEXT_STATUS: Record<ActionStatus, ActionStatus> = { todo: 'doing', doing: 'done', done: 'todo' };
const SOURCE_LABEL: Record<ActionItem['source'], string> = { plan: 'Plan', bottleneck: 'Bottleneck', hub: 'Hub', manual: 'Added', consult: 'Consult' };
const OWNERS: StepOwner[] = ['Owner', 'Operations', 'Sales & marketing', 'Finance', 'Partner', 'Team lead'];

function ProgressRing({ value, size = 88 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`${Math.round(value * 100)}% of actions done`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#5EEAD4" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ duration: 0.8, ease: EASE_OUT }} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-white font-black" fontSize={size / 4.4}>
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

function CalendarButtons({ action }: { action: ActionItem }) {
  const { toast } = useToast();
  if (!action.dueDate) return null;
  const ev = { title: action.title, details: `${action.detail}\n\nFrom your ChainInsideIQ growth plan: ${appLink('/plan')}`, date: action.dueDate };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-slate-500" aria-label="Add to calendar">
          <CalendarPlus className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add to calendar</DropdownMenuLabel>
        <DropdownMenuItem asChild><a href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer">Google Calendar</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href={outlookCalendarUrl(ev)} target="_blank" rel="noreferrer">Outlook / Microsoft 365</a></DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { downloadBlob(icsFile([ev]), 'chaininsideiq-action.ics'); toast({ title: 'Calendar file downloaded', description: 'Open it to add the event to Apple Calendar or any other app.' }); }}>
          Apple Calendar / other (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionRow({ action, compact = false }: { action: ActionItem; compact?: boolean }) {
  const { setActionStatus, updateAction, removeAction } = useGrowthStore();
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[action.status];
  const Icon = meta.icon;
  const overdue = action.dueDate && action.status !== 'done' && action.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <motion.div layout transition={{ duration: 0.25, ease: EASE_OUT }}
      className={`group rounded-2xl border bg-white transition-shadow hover:shadow-sm ${action.status === 'done' ? 'border-slate-100' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setActionStatus(action.id, NEXT_STATUS[action.status])}
          className={`mt-0.5 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${meta.tone}`}
          aria-label={`Status: ${meta.label}. Click to change.`} title={`${meta.label} · click to change`}>
          <Icon className="w-5 h-5" />
        </motion.button>
        <button className="flex-1 min-w-0 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <p className={`font-bold text-[15px] leading-snug ${action.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{action.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {action.owner}</span>
            {action.kpi && <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">{action.kpi}</span>}
            {!compact && action.source !== 'plan' && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{SOURCE_LABEL[action.source]}</span>}
            {action.dueDate && <span className={overdue ? 'text-rose-600' : ''}>Due {new Date(action.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <CalendarButtons action={action} />
          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-slate-400" onClick={() => setOpen((o) => !o)} aria-label="Details">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="overflow-hidden">
            <div className="px-3 sm:px-4 pb-4 pt-0 sm:pl-12 space-y-3">
              {action.detail && <p className="text-sm text-slate-600 leading-relaxed">{action.detail}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Owner</span>
                  <select value={action.owner} onChange={(e) => updateAction(action.id, { owner: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium">
                    {Array.from(new Set([...OWNERS, action.owner])).map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due date</span>
                  <Input type="date" value={action.dueDate ?? ''} onChange={(e) => updateAction(action.id, { dueDate: e.target.value || undefined })} className="h-9 rounded-lg" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                  <select value={action.status} onChange={(e) => setActionStatus(action.id, e.target.value as ActionStatus)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium">
                    {(Object.keys(STATUS_META) as ActionStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/insights?ask=${encodeURIComponent(`How should I approach this step: "${action.title}"? ${action.detail}`)}`}>
                  <Button variant="outline" size="sm" className="rounded-lg font-bold"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" /> Ask the analyst</Button>
                </Link>
                {action.threadId && (
                  <Link href={`/hub?thread=${action.threadId}`}>
                    <Button variant="outline" size="sm" className="rounded-lg font-bold"><MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open discussion</Button>
                  </Link>
                )}
                {action.source !== 'plan' && (
                  <Button variant="ghost" size="sm" className="rounded-lg font-bold text-rose-600 hover:bg-rose-50" onClick={() => removeAction(action.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddActionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addAction } = useGrowthStore();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [owner, setOwner] = useState('Owner');
  const [due, setDue] = useState(addDays(7));
  const submit = () => {
    if (!title.trim()) return;
    addAction({ title: title.trim(), detail: detail.trim(), owner, dueDate: due || undefined, source: 'manual' });
    toast({ title: 'Action added' });
    setTitle(''); setDetail(''); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Add an action</DialogTitle>
          <DialogDescription>Anything you want to track alongside your plan.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Input autoFocus placeholder="What needs to happen?" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl" maxLength={140} />
          <Textarea placeholder="Details (optional)" value={detail} onChange={(e) => setDetail(e.target.value)} className="rounded-xl min-h-[80px]" maxLength={600} />
          <div className="grid grid-cols-2 gap-2">
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium" aria-label="Owner">
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-11 rounded-xl" aria-label="Due date" />
          </div>
          <DialogFooter><Button type="submit" className="rounded-xl font-black uppercase tracking-widest text-xs h-11" disabled={!title.trim()}>Add action</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyPlan() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}
        className="max-w-lg w-full text-center bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center mx-auto mb-5"><Sparkles className="w-7 h-7" /></div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Get your growth plan</h1>
        <p className="text-slate-500 mt-3 leading-relaxed">Answer eight quick questions about your goal, business and partners. The AI Analyst turns them into a step-by-step plan with targets and an action board.</p>
        <Link href="/onboarding">
          <Button className="mt-6 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs">Start the interview <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function PlanPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { plan, profile, actions, setPlan, aiEngine } = useGrowthStore();
  const [tab, setTab] = useState<'plan' | 'board'>('plan');
  const [addOpen, setAddOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenEngine, setRegenEngine] = useState<AIEnginePreference>(aiEngine);
  const [regenerating, setRegenerating] = useState(false);

  const planActions = useMemo(() => actions.filter((a) => a.source === 'plan'), [actions]);
  const doneCount = actions.filter((a) => a.status === 'done').length;
  const progress = actions.length ? doneCount / actions.length : 0;
  const nextUp = actions.find((a) => a.status === 'doing') ?? planActions.find((a) => a.status === 'todo');

  if (!plan || !profile) {
    return <AppLayout><EmptyPlan /></AppLayout>;
  }

  const goalLabel = GOALS.find((g) => g.id === profile.goal)?.label;
  const industry = getIndustry(profile.industryId)?.name;

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const next = await fetchGrowthPlan(profile, regenEngine);
      setPlan(next);
      toast({ title: 'New plan ready', description: `Written by ${ENGINE_LABELS[next.generatedBy]}. Plan steps on your board were refreshed; your other actions were kept.` });
      setRegenOpen(false);
    } finally {
      setRegenerating(false);
    }
  };

  const exportPlan = async (kind: 'xlsx' | 'csv' | 'ics') => {
    const rows = plan.phases.flatMap((ph) => ph.steps.map((st) => {
      const a = actions.find((x) => x.sourceRef === st.id);
      return { Phase: ph.title, Window: ph.window, Step: st.title, Detail: st.detail, Owner: a?.owner ?? st.owner, KPI: st.kpi ?? '', Effort: st.effort, Status: a ? STATUS_META[a.status].label : 'To do', Due: a?.dueDate ?? '' };
    }));
    const slug = (profile.businessName || 'growth-plan').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (kind === 'xlsx') {
      const blob = await buildBasicWorkbook([
        { name: 'Plan', rows },
        { name: 'KPIs', rows: [plan.northStar, ...plan.kpis].map((k, i) => ({ Type: i === 0 ? 'North Star' : 'Supporting', KPI: k.name, Target: k.target, Why: k.why })) },
        { name: 'All actions', rows: actions.map((a) => ({ Action: a.title, Owner: a.owner, Status: STATUS_META[a.status].label, Due: a.dueDate ?? '', Source: SOURCE_LABEL[a.source], KPI: a.kpi ?? '' })) },
      ]);
      downloadBlob(blob, `${slug}.xlsx`);
    } else if (kind === 'csv') {
      const cols = Object.keys(rows[0] ?? {});
      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      downloadBlob(new Blob(['﻿' + [cols.join(','), ...rows.map((r: any) => cols.map((c) => esc(r[c])).join(','))].join('\n')], { type: 'text/csv' }), `${slug}.csv`);
    } else {
      const dated = actions.filter((a) => a.dueDate && a.status !== 'done');
      if (!dated.length) { toast({ title: 'No due dates yet', description: 'Set due dates on actions first, then export them to your calendar.' }); return; }
      downloadBlob(icsFile(dated.map((a) => ({ title: a.title, details: a.detail, date: a.dueDate! }))), `${slug}-actions.ics`);
    }
    toast({ title: 'Export downloaded' });
  };

  const shareMessage = () => ({
    title: `${profile.businessName ? profile.businessName + ': ' : ''}${plan.headline}`,
    text: plan.summary,
    link: appLink('/plan'),
    facts: [
      { name: 'North Star', value: `${plan.northStar.name} → ${plan.northStar.target}` },
      { name: 'Progress', value: `${doneCount} of ${actions.length} actions done` },
      ...(nextUp ? [{ name: 'Next up', value: nextUp.title }] : []),
    ],
  });

  const columns: ActionStatus[] = ['todo', 'doing', 'done'];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* Hero */}
        <section className="rounded-3xl bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" aria-hidden />
          <div className="relative p-5 sm:p-7 lg:p-8 flex flex-col lg:flex-row gap-6 lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-300">Growth Plan</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">· {goalLabel} · {industry} · {profile.timeframeDays} days</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-balance">
                {profile.businessName ? <span className="text-slate-400">{profile.businessName}: </span> : null}{plan.headline}
              </h1>
              <p className="text-slate-300 mt-3 max-w-3xl leading-relaxed text-sm sm:text-base">{plan.summary}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Link href="/insights">
                  <Button className="rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold"><Sparkles className="w-4 h-4 mr-2 text-primary" /> Ask the analyst</Button>
                </Link>
                <ShareMenu message={shareMessage} className="bg-white/10 border-white/15 text-white hover:bg-white/15 hover:text-white" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-xl font-bold bg-white/10 border-white/15 text-white hover:bg-white/15 hover:text-white"><Download className="w-4 h-4 mr-2" /> Export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl">
                    <DropdownMenuItem onSelect={() => exportPlan('xlsx')}>Excel workbook (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => exportPlan('csv')}>CSV (Google Sheets, Numbers)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => exportPlan('ics')}>Due dates to calendar (.ics)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-xl font-bold text-slate-300 hover:bg-white/10 hover:text-white">More <ChevronDown className="w-4 h-4 ml-1" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl">
                    <DropdownMenuItem onSelect={() => setRegenOpen(true)}><RefreshCw className="w-4 h-4 mr-2" /> Rebuild plan with AI</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/onboarding')}><Pencil className="w-4 h-4 mr-2" /> Change my goal and answers</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-5 lg:pl-6 lg:border-l lg:border-white/10">
              <ProgressRing value={progress} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">North Star</p>
                <p className="text-lg font-black leading-tight">{plan.northStar.name}</p>
                <p className="text-teal-300 font-black text-xl">{plan.northStar.target}</p>
                <p className="text-xs text-slate-400 mt-1">{doneCount} of {actions.length} actions done</p>
              </div>
            </div>
          </div>
        </section>

        {/* Next up + KPI targets */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <StaggerItem className="md:col-span-2 xl:col-span-1 rounded-2xl bg-white border border-teal-200 p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Next up</p>
            {nextUp ? (
              <>
                <p className="font-black text-slate-900 mt-2 leading-snug">{nextUp.title}</p>
                <p className="text-xs text-slate-500 mt-1">{nextUp.owner}{nextUp.dueDate ? ` · due ${nextUp.dueDate}` : ''}</p>
              </>
            ) : <p className="font-bold text-slate-900 mt-2">Everything’s done. Rebuild the plan for your next goal.</p>}
          </StaggerItem>
          {plan.kpis.slice(0, 3).map((k) => (
            <StaggerItem key={k.name} className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">KPI target</p>
              <p className="font-black text-slate-900 mt-2 leading-snug">{k.name}</p>
              <p className="text-primary font-black">{k.target}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{k.why}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <div className={`grid grid-cols-1 gap-6 items-start ${tab === 'plan' ? 'xl:grid-cols-[1fr_340px]' : ''}`}>
          <div className="space-y-4 min-w-0">
            {/* Tabs */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex p-1 rounded-2xl bg-white border border-slate-200 relative" role="tablist">
                {([['plan', 'Plan', MapIcon], ['board', 'Action board', ListChecks]] as const).map(([id, label, Icon]) => (
                  <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`relative px-4 h-10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${tab === id ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                    {tab === id && <motion.span layoutId="planTab" className="absolute inset-0 rounded-xl bg-slate-900" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                    <Icon className="relative w-4 h-4" /><span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Add action</Button>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'plan' ? (
                <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="space-y-5">
                  {plan.phases.map((ph, i) => {
                    const phActions = planActions.filter((a) => a.phaseId === ph.id);
                    const phDone = phActions.filter((a) => a.status === 'done').length;
                    return (
                      <section key={ph.id} className="relative pl-8 sm:pl-10">
                        <div className="absolute left-3 sm:left-4 top-2 bottom-0 w-px bg-slate-200" aria-hidden />
                        <div className={`absolute left-0 sm:left-1 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${phActions.length && phDone === phActions.length ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{i + 1}</div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                          <h2 className="text-lg font-black text-slate-900">{ph.title}</h2>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ph.window}</span>
                          <span className="text-[10px] font-bold text-slate-400">{phDone}/{phActions.length} done</span>
                        </div>
                        {ph.objective && <p className="text-sm text-slate-500 mb-3">{ph.objective}</p>}
                        <div className="space-y-2">
                          {phActions.map((a) => <ActionRow key={a.id} action={a} compact />)}
                        </div>
                      </section>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div key="board" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {columns.map((col) => {
                    const items = actions.filter((a) => a.status === col);
                    const M = STATUS_META[col];
                    return (
                      <div key={col} className="rounded-3xl bg-slate-100/70 border border-slate-200 p-3 min-h-[120px]">
                        <div className="flex items-center gap-2 px-1 pb-2">
                          <M.icon className={`w-4 h-4 ${M.tone}`} />
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">{M.label}</h3>
                          <span className="ml-auto text-[11px] font-black text-slate-400">{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((a) => <ActionRow key={a.id} action={a} />)}
                          {!items.length && <p className="text-xs text-slate-400 px-1 py-4 text-center">Nothing here yet.</p>}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side panel */}
          <aside className={tab === 'plan' ? 'space-y-4' : 'grid md:grid-cols-3 gap-4 [&>p]:md:col-span-3'}>
            <div className="rounded-3xl bg-white border border-slate-200 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Quick wins this week</h3>
              <ul className="mt-3 space-y-2">
                {plan.quickWins.map((w) => <li key={w} className="text-sm text-slate-600 leading-relaxed flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{w}</li>)}
              </ul>
            </div>
            <div className="rounded-3xl bg-white border border-slate-200 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Handshake className="w-4 h-4 text-primary" /> With your partners</h3>
              <ul className="mt-3 space-y-2">
                {plan.partnerPlays.map((w) => <li key={w} className="text-sm text-slate-600 leading-relaxed">{w}</li>)}
              </ul>
              <Link href="/collabs"><Button variant="outline" size="sm" className="mt-3 rounded-lg font-bold w-full">Set up a data collab</Button></Link>
            </div>
            <div className="rounded-3xl bg-white border border-slate-200 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Watch out for</h3>
              <ul className="mt-3 space-y-2">
                {plan.risks.map((w) => <li key={w} className="text-sm text-slate-600 leading-relaxed">{w}</li>)}
              </ul>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Plan written by {ENGINE_LABELS[plan.generatedBy]} · {new Date(plan.createdAt).toLocaleDateString()}
            </p>
          </aside>
        </div>
      </div>

      <AddActionDialog open={addOpen} onOpenChange={setAddOpen} />

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Rebuild your plan</DialogTitle>
            <DialogDescription>Same answers, fresh plan. Choose which AI engine writes it. Actions you added yourself or from bottlenecks are kept.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(['auto', 'claude', 'openai', 'gemini'] as AIEnginePreference[]).map((e) => (
              <button key={e} onClick={() => setRegenEngine(e)} aria-pressed={regenEngine === e}
                className={`h-12 rounded-xl border text-sm font-bold transition-colors ${regenEngine === e ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                {ENGINE_LABELS[e]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">If an engine isn’t connected, the next available one is used, then the built-in analyst.</p>
          <DialogFooter>
            <Button onClick={regenerate} disabled={regenerating} className="rounded-xl font-black uppercase tracking-widest text-xs h-11 w-full sm:w-auto">
              {regenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing…</> : <><RefreshCw className="w-4 h-4 mr-2" /> Rebuild plan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
