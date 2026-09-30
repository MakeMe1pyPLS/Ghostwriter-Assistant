// Onboarding interview: after sign-up or purchase, the AI Analyst asks a short
// set of questions, then builds a step-by-step growth plan. Deterministic
// questions keep it fast and reliable; the plan itself comes from the AI router
// (Claude / ChatGPT / Gemini) with the built-in analyst as a fallback.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, ChevronLeft, Loader2, Search, Sparkles, X, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardStore, type Sector } from "@/hooks/use-dashboard-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { fetchGrowthPlan, ENGINE_LABELS } from "@/lib/intel-client";
import {
  GOALS, COMPANY_SIZES, STAGES, CHALLENGES, pickKpisForGoal,
  type GoalId, type CompanySize, type BusinessStage, type ChallengeId, type Timeframe, type GrowthProfile, type GrowthPlan,
} from "@shared/growth";
import { INDUSTRIES, INDUSTRY_GROUPS, getIndustry } from "@shared/kpi-industries";
import { EASE_OUT } from "@/components/motion";

type StepId = 'goal' | 'name' | 'industry' | 'size' | 'stage' | 'challenges' | 'kpi' | 'partners';
const STEPS: StepId[] = ['goal', 'name', 'industry', 'size', 'stage', 'challenges', 'kpi', 'partners'];

interface Draft {
  goal?: GoalId;
  goalDetail: string;
  businessName: string;
  industryId?: string;
  size?: CompanySize;
  stage?: BusinessStage;
  challenges: ChallengeId[];
  targetKpi?: string;
  targetValue: string;
  timeframeDays: Timeframe;
  hasPartners?: boolean;
  partners: string[];
}

const SECTOR_BY_INDUSTRY: Record<string, Sector> = {
  ecommerce: 'ecommerce', 'retail-store': 'ecommerce', grocery: 'ecommerce', wholesale: 'ecommerce',
  '3pl': 'logistics', trucking: 'logistics', 'last-mile': 'logistics', 'freight-forwarding': 'logistics',
  manufacturing: 'manufacturing', 'food-production': 'manufacturing', construction: 'manufacturing', agriculture: 'manufacturing', energy: 'manufacturing',
};

function AnalystAvatar({ size = 36 }: { size?: number }) {
  return (
    <div className="shrink-0 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center shadow-md" style={{ width: size, height: size }} aria-hidden>
      <Sparkles className="w-1/2 h-1/2" />
    </div>
  );
}

function Bubble({ role, children }: { role: 'ai' | 'user'; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {role === 'ai' && <AnalystAvatar />}
      <div className={role === 'ai'
        ? 'max-w-[85%] sm:max-w-[75%] bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 text-[15px] text-slate-700 leading-relaxed shadow-sm'
        : 'max-w-[85%] sm:max-w-[75%] bg-slate-900 text-white rounded-2xl rounded-tr-md px-4 py-3 text-[15px] leading-relaxed shadow-sm'}>
        {children}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex gap-3" aria-label="The analyst is typing">
      <AnalystAvatar />
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3.5 shadow-sm flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="w-2 h-2 rounded-full bg-slate-300"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}

function Chip({ selected, onClick, children, hint }: { selected?: boolean; onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`text-left rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${selected
        ? 'border-primary bg-primary/5 ring-1 ring-primary text-slate-900'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'}`}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
        {children}
      </span>
      {hint && <span className="block text-xs text-slate-500 mt-0.5 font-medium">{hint}</span>}
    </motion.button>
  );
}

const QUESTIONS: Record<StepId, (d: Draft, firstName: string) => string> = {
  goal: (_d, n) => `Hi${n ? ' ' + n : ''}! I'm your AI Business Analyst. I'll ask a few quick questions, then build a step-by-step plan for your business. First: what's your main goal right now?`,
  name: () => 'Great. What’s the name of your business?',
  industry: (d) => `What kind of business is ${d.businessName.trim() || 'it'}?`,
  size: () => 'How many people work in the business, including you?',
  stage: () => 'Which of these sounds most like where you are?',
  challenges: () => 'What’s getting in the way? Pick up to four.',
  kpi: (d) => `Which number would tell you "${GOALS.find((g) => g.id === d.goal)?.label.toLowerCase()}" is working? I’ve suggested the most useful ones for ${getIndustry(d.industryId)?.name.toLowerCase() ?? 'your industry'}.`,
  partners: () => 'Last one. Do you work closely with other businesses, like suppliers, carriers, distributors or an agency? ChainInsideIQ can connect you so you fix problems together.',
};

function answerText(step: StepId, d: Draft): string {
  switch (step) {
    case 'goal': return GOALS.find((g) => g.id === d.goal)?.label + (d.goalDetail.trim() ? ` · “${d.goalDetail.trim()}”` : '');
    case 'name': return d.businessName.trim() || 'I’d rather not say';
    case 'industry': return getIndustry(d.industryId)?.name ?? '';
    case 'size': return COMPANY_SIZES.find((s) => s.id === d.size)?.label ?? '';
    case 'stage': return STAGES.find((s) => s.id === d.stage)?.label ?? '';
    case 'challenges': return d.challenges.length ? d.challenges.map((c) => CHALLENGES.find((x) => x.id === c)?.label).join(', ') : 'Nothing major right now';
    case 'kpi': return `${d.targetKpi}${d.targetValue ? ` → ${d.targetValue}` : ''} in ${d.timeframeDays} days`;
    case 'partners': return d.hasPartners ? (d.partners.length ? d.partners.join(', ') : 'Yes') : 'Not yet';
  }
}

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const currentUser = useDashboardStore((s) => s.currentUser);
  const { completeSetup, setBusinessStructure, setSector, setSectorMode, setConnectedSectors, setDataSharingEnabled } = useDashboardStore();
  const { profile: savedProfile, setProfile, setPlan, completeOnboarding, restartTour, aiEngine } = useGrowthStore();
  const firstName = currentUser?.fullName?.split(' ')[0] ?? '';

  const [draft, setDraft] = useState<Draft>(() => ({
    goal: savedProfile?.goal,
    goalDetail: savedProfile?.goalDetail ?? '',
    businessName: savedProfile?.businessName ?? '',
    industryId: savedProfile?.industryId,
    size: savedProfile?.size,
    stage: savedProfile?.stage,
    challenges: savedProfile?.challenges ?? [],
    targetKpi: savedProfile?.targetKpi,
    targetValue: savedProfile?.targetValue ?? '',
    timeframeDays: savedProfile?.timeframeDays ?? 90,
    hasPartners: savedProfile ? savedProfile.partners.length > 0 : undefined,
    partners: savedProfile?.partners ?? [],
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [typing, setTyping] = useState(true);
  const [phase, setPhase] = useState<'interview' | 'building' | 'done'>('interview');
  const [buildStage, setBuildStage] = useState(0);
  const [plan, setPlanLocal] = useState<GrowthPlan | null>(null);
  const [industryQuery, setIndustryQuery] = useState('');
  const [partnerInput, setPartnerInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Short typing pause before each question for a conversational feel.
  useEffect(() => {
    if (phase !== 'interview') return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), stepIndex === 0 ? 700 : 450);
    return () => clearTimeout(t);
  }, [stepIndex, phase]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [stepIndex, typing, phase, buildStage, plan]);

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const suggestedKpis = useMemo(
    () => (draft.industryId && draft.goal ? pickKpisForGoal(draft.industryId, draft.goal, 6) : []),
    [draft.industryId, draft.goal]
  );

  const filteredIndustries = useMemo(() => {
    const q = industryQuery.trim().toLowerCase();
    const list = INDUSTRIES.filter((i) => i.id !== 'universal');
    if (!q) return list;
    // Match industry names and groups anywhere; KPI names only at word starts
    // (so "rest" finds restaurants, not "interest").
    const wordStart = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.startsWith(q));
    return list.filter((i) => i.name.toLowerCase().includes(q) || i.group.toLowerCase().includes(q) || (q.length >= 4 && i.kpis.some((k) => wordStart(k.name))));
  }, [industryQuery]);

  const canContinue: Record<StepId, boolean> = {
    goal: !!draft.goal,
    name: true,
    industry: !!draft.industryId,
    size: !!draft.size,
    stage: !!draft.stage,
    challenges: true,
    kpi: !!draft.targetKpi,
    partners: draft.hasPartners !== undefined,
  };

  const finish = async () => {
    const profile: GrowthProfile = {
      businessName: draft.businessName.trim() || undefined,
      goal: draft.goal!,
      goalDetail: draft.goalDetail.trim() || undefined,
      industryId: draft.industryId!,
      size: draft.size!,
      stage: draft.stage!,
      challenges: draft.challenges,
      targetKpi: draft.targetKpi!,
      targetValue: draft.targetValue.trim() || undefined,
      timeframeDays: draft.timeframeDays,
      partners: draft.hasPartners ? draft.partners : [],
    };
    setPhase('building');
    setBuildStage(0);
    const stages = setInterval(() => setBuildStage((s) => Math.min(s + 1, 3)), 900);
    const result = await fetchGrowthPlan(profile);
    clearInterval(stages);
    setBuildStage(4);

    // Carry the answers into the rest of the workspace.
    setProfile(profile);
    setPlan(result);
    const sector = SECTOR_BY_INDUSTRY[profile.industryId] ?? 'custom';
    if (profile.partners.length) {
      setBusinessStructure('partnered');
      setDataSharingEnabled(true);
    } else {
      setBusinessStructure('single');
    }
    setSectorMode('single');
    setSector(sector);
    // The sector switcher models supply-chain sectors; businesses outside them
    // start partnered as a seller + carrier pair, which they can change in Settings.
    const partneredPair: Sector[] = sector === 'custom' ? ['ecommerce', 'logistics'] : [sector, sector === 'logistics' ? 'ecommerce' : 'logistics'];
    setConnectedSectors(profile.partners.length ? partneredPair : [sector]);
    completeSetup();
    completeOnboarding();
    restartTour();

    setPlanLocal(result);
    setPhase('done');
  };

  const progress = phase === 'interview' ? (stepIndex + (canContinue[step] ? 0.5 : 0)) / STEPS.length : 1;

  // ---------------------------------------------------------------- inputs
  const renderInput = () => {
    switch (step) {
      case 'goal':
        return (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <Chip key={g.id} selected={draft.goal === g.id} hint={g.hint} onClick={() => update({ goal: g.id })}>{g.label}</Chip>
              ))}
            </div>
            <Input
              value={draft.goalDetail}
              onChange={(e) => update({ goalDetail: e.target.value })}
              placeholder="Optional: say it in your own words (e.g. “double online orders by summer”)"
              className="h-11 rounded-xl bg-white"
              maxLength={300}
            />
          </div>
        );
      case 'name':
        return (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); next(); }}>
            <Input autoFocus value={draft.businessName} onChange={(e) => update({ businessName: e.target.value })} placeholder="Business name" className="h-12 rounded-xl bg-white text-base" maxLength={120} />
            {!draft.businessName && <Button type="button" variant="ghost" className="h-12 rounded-xl text-slate-500" onClick={next}>Skip</Button>}
          </form>
        );
      case 'industry':
        return (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input autoFocus value={industryQuery} onChange={(e) => setIndustryQuery(e.target.value)} placeholder="Search: restaurant, trucking, dental, SaaS…" className="h-12 pl-10 rounded-xl bg-white text-base" />
            </div>
            <div className="max-h-[30dvh] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {INDUSTRY_GROUPS.filter((g) => g !== 'Every business').map((group) => {
                const items = filteredIndustries.filter((i) => i.group === group);
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((i) => (
                        <button key={i.id} type="button" onClick={() => update({ industryId: i.id, targetKpi: undefined })}
                          aria-pressed={draft.industryId === i.id}
                          className={`px-3.5 py-2 rounded-xl border text-sm font-bold transition-colors ${draft.industryId === i.id ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                          {i.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!filteredIndustries.length && <p className="text-sm text-slate-500">No match. Try a broader word, or pick the closest option.</p>}
            </div>
          </div>
        );
      case 'size':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMPANY_SIZES.map((s) => <Chip key={s.id} selected={draft.size === s.id} onClick={() => update({ size: s.id })}>{s.label}</Chip>)}
          </div>
        );
      case 'stage':
        return (
          <div className="grid sm:grid-cols-2 gap-2">
            {STAGES.map((s) => <Chip key={s.id} selected={draft.stage === s.id} hint={s.hint} onClick={() => update({ stage: s.id })}>{s.label}</Chip>)}
          </div>
        );
      case 'challenges':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHALLENGES.map((c) => {
              const on = draft.challenges.includes(c.id);
              return (
                <Chip key={c.id} selected={on} onClick={() => update({
                  challenges: on ? draft.challenges.filter((x) => x !== c.id) : draft.challenges.length >= 4 ? draft.challenges : [...draft.challenges, c.id],
                })}>{c.label}</Chip>
              );
            })}
          </div>
        );
      case 'kpi':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {suggestedKpis.map((k) => (
                <button key={k.id} type="button" onClick={() => update({ targetKpi: k.name })} aria-pressed={draft.targetKpi === k.name}
                  title={k.formula}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-bold transition-colors ${draft.targetKpi === k.name ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                  {k.name}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <Input value={draft.targetValue} onChange={(e) => update({ targetValue: e.target.value })} placeholder="Target (optional): +20%, $50k/month, under 2 days…" className="h-11 rounded-xl bg-white" maxLength={60} />
              <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Timeframe">
                {([30, 90, 180, 365] as Timeframe[]).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={draft.timeframeDays === t} onClick={() => update({ timeframeDays: t })}
                    className={`px-3 h-9 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${draft.timeframeDays === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                    {t === 365 ? '1 yr' : `${t}d`}
                  </button>
                ))}
              </div>
            </div>
            <Input value={suggestedKpis.some((k) => k.name === draft.targetKpi) ? '' : draft.targetKpi ?? ''} onChange={(e) => update({ targetKpi: e.target.value || undefined })}
              placeholder="Or type a different metric" className="h-11 rounded-xl bg-white" maxLength={120} />
          </div>
        );
      case 'partners':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Chip selected={draft.hasPartners === true} onClick={() => update({ hasPartners: true })}>Yes, we do</Chip>
              <Chip selected={draft.hasPartners === false} onClick={() => update({ hasPartners: false, partners: [] })}>Not yet</Chip>
            </div>
            {draft.hasPartners && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <form className="flex gap-2" onSubmit={(e) => {
                  e.preventDefault();
                  const v = partnerInput.trim();
                  if (v && !draft.partners.includes(v) && draft.partners.length < 10) update({ partners: [...draft.partners, v] });
                  setPartnerInput('');
                }}>
                  <Input autoFocus value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Partner name or type, e.g. “FastFreight” or “our main supplier”" className="h-11 rounded-xl bg-white" maxLength={120} />
                  <Button type="submit" variant="outline" className="h-11 rounded-xl font-bold">Add</Button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {draft.partners.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-sm font-bold">
                      {p}
                      <button type="button" aria-label={`Remove ${p}`} onClick={() => update({ partners: draft.partners.filter((x) => x !== p) })} className="p-0.5 rounded-md hover:bg-teal-100"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );
    }
  };

  const buildStages = [
    'Reading your answers',
    `Choosing KPIs for ${getIndustry(draft.industryId)?.name.toLowerCase() ?? 'your industry'}`,
    'Sequencing steps by impact',
    'Writing your plan',
  ];

  return (
    <div className="h-[100dvh] bg-[#F4F7FA] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AnalystAvatar size={30} />
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 leading-tight truncate">AI Business Analyst</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                {phase === 'interview' ? `Question ${stepIndex + 1} of ${STEPS.length}` : phase === 'building' ? 'Building your plan' : 'Plan ready'}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Engine: {ENGINE_LABELS[aiEngine]}
            </span>
            {phase === 'interview' && (
              <Button variant="ghost" size="sm" className="text-slate-500 font-bold" onClick={() => navigate(savedProfile ? '/plan' : '/dashboard')}>
                {savedProfile ? 'Cancel' : 'Skip for now'}
              </Button>
            )}
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <motion.div className="h-full bg-primary origin-left" animate={{ scaleX: progress }} transition={{ duration: 0.35, ease: EASE_OUT }} style={{ transformOrigin: '0 50%' }} />
        </div>
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {STEPS.slice(0, stepIndex).map((s) => (
            <div key={s} className="space-y-3">
              <Bubble role="ai">{QUESTIONS[s](draft, firstName)}</Bubble>
              <Bubble role="user">{answerText(s, draft)}</Bubble>
            </div>
          ))}

          {phase === 'interview' && (typing ? <Typing /> : <Bubble role="ai">{QUESTIONS[step](draft, firstName)}</Bubble>)}

          {phase !== 'interview' && (
            <>
              <Bubble role="ai">{QUESTIONS.partners(draft, firstName)}</Bubble>
              <Bubble role="user">{answerText('partners', draft)}</Bubble>
              <Bubble role="ai">
                <p className="font-bold text-slate-900 mb-2">Thanks! Building your plan now.</p>
                <ul className="space-y-1.5">
                  {buildStages.map((label, i) => (
                    <li key={label} className="flex items-center gap-2 text-sm">
                      {buildStage > i ? <Check className="w-4 h-4 text-emerald-600" /> : buildStage === i ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                      <span className={buildStage >= i ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                    </li>
                  ))}
                </ul>
              </Bubble>
            </>
          )}

          {phase === 'done' && plan && (
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE_OUT }}
              className="ml-12 bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] overflow-hidden">
              <div className="bg-slate-900 text-white p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-300 mb-2">Your growth plan · by {ENGINE_LABELS[plan.generatedBy]}</p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{plan.headline}</h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{plan.summary}</p>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-start gap-3 rounded-2xl bg-teal-50 border border-teal-100 p-4">
                  <Target className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">North Star</p>
                    <p className="font-black text-slate-900">{plan.northStar.name}: {plan.northStar.target}</p>
                  </div>
                </div>
                <ol className="grid sm:grid-cols-3 gap-3">
                  {plan.phases.map((ph, i) => (
                    <li key={ph.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ph.window}</p>
                      <p className="font-black text-slate-900 mt-1">{i + 1}. {ph.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{ph.steps.length} steps</p>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="h-12 rounded-xl font-black uppercase tracking-widest text-xs flex-1" onClick={() => navigate('/plan')} data-testid="button-open-plan">
                    Open my Growth Plan <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl font-bold" onClick={() => { setPhase('interview'); setStepIndex(0); setPlanLocal(null); }}>
                    Change my answers
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Answer panel */}
      <AnimatePresence mode="wait">
        {phase === 'interview' && !typing && (
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25, ease: EASE_OUT }}
            className="shrink-0 z-10 max-h-[62dvh] overflow-y-auto bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.25)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
              {renderInput()}
              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" onClick={back} disabled={stepIndex === 0} className="font-bold text-slate-500">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                {step === 'partners' ? (
                  <Button onClick={finish} disabled={!canContinue.partners} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="button-build-plan">
                    <Sparkles className="w-4 h-4 mr-2" /> Build my plan
                  </Button>
                ) : (
                  <Button onClick={next} disabled={!canContinue[step]} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="button-next-question">
                    {step === 'challenges' && !draft.challenges.length ? 'None right now' : 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
