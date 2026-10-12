// AI Consultant: short structured sessions (health check, pricing, cash flow…).
// Each one asks for a few numbers, returns findings, 2–3 options and a
// recommendation, and turns the chosen option into tracked actions.
// Works with no AI engine connected: the built-in consultant does the maths.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Stethoscope, Tag, Wallet, TrendingUp, Gauge, Handshake, UserPlus, Grid2x2, ArrowLeft, ArrowRight, Clock,
  Sparkles, Check, CheckCircle2, AlertTriangle, XCircle, Minus, Copy, Trash2, MessageSquareText, Briefcase,
  ListChecks, RotateCcw, History, Star, Cpu,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore, type ConsultSession } from "@/hooks/use-growth-store";
import { useClientsStore } from "@/hooks/use-clients-store";
import { fetchConsult, ENGINE_LABELS } from "@/lib/intel-client";
import { addDays } from "@/lib/calendar";
import { Stagger, StaggerItem, EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  SESSION_TEMPLATES, getTemplate, recommendSessions, consultSummaryText,
  type SessionKind, type SessionTemplate, type ConsultAnswers, type ConsultResult, type ConsultOption, type Tone, type Level,
} from "@shared/consult";

const ICONS: Record<string, any> = { Stethoscope, Tag, Wallet, TrendingUp, Gauge, Handshake, UserPlus, Grid2x2, Cpu };
const isKind = (k?: string): k is SessionKind => !!k && SESSION_TEMPLATES.some((t) => t.id === k);

const TONE: Record<Tone, { icon: any; card: string; chip: string }> = {
  good: { icon: CheckCircle2, card: "border-emerald-200 bg-emerald-50/60", chip: "text-emerald-700" },
  warn: { icon: AlertTriangle, card: "border-amber-200 bg-amber-50/60", chip: "text-amber-700" },
  bad: { icon: XCircle, card: "border-rose-200 bg-rose-50/60", chip: "text-rose-700" },
  neutral: { icon: Minus, card: "border-slate-200 bg-white", chip: "text-slate-500" },
};
const LEVEL_LABEL: Record<Level, string> = { low: "Low", medium: "Medium", high: "High" };

function timeAgo(ts: number): string {
  const d = Math.round((Date.now() - ts) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ------------------------------------------------------------------ page

export default function ConsultPage() {
  const [match, params] = useRoute<{ kind: string }>("/consult/:kind");
  const kind = match && isKind(params?.kind) ? params!.kind : undefined;
  return <AppLayout>{kind ? <SessionView key={kind} kind={kind} /> : <Library />}</AppLayout>;
}

function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const client = useClientsStore((s) => s.activeClient());
  return (
    <header>
      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
        {eyebrow}
        {client && <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 px-2 py-0.5 normal-case tracking-normal font-bold"><Briefcase className="w-3 h-3" />{client.name}</span>}
      </p>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{title}</h1>
      {children}
    </header>
  );
}

// ------------------------------------------------------------------ library

function Library() {
  const profile = useGrowthStore((s) => s.profile);
  const sessions = useGrowthStore((s) => s.consultSessions);
  const removeConsultSession = useGrowthStore((s) => s.removeConsultSession);
  const done = useMemo(() => [...new Set(sessions.map((s) => s.kind))], [sessions]);
  const recommended = useMemo(() => recommendSessions(profile, done), [profile, done]);
  const decided = sessions.filter((s) => s.chosenOptionId).length;
  const actionsAdded = sessions.reduce((n, s) => n + s.actionIds.length, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-8">
      <PageHeader eyebrow="Consult" title="AI Consultant">
        <p className="text-slate-500 mt-1 max-w-2xl">
          Short, focused sessions like you would have with a business consultant. Answer a few questions, get findings and options with honest trade-offs, then turn your decision into actions on your plan.
        </p>
      </PageHeader>

      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
          {[
            { label: "Sessions", value: sessions.length },
            { label: "Decisions", value: decided },
            { label: "Actions added", value: actionsAdded },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-3">
              <p className="text-2xl font-black text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-[11px] font-bold text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <section aria-labelledby="rec-h">
        <h2 id="rec-h" className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Recommended for you</h2>
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommended.map((r, i) => {
            const t = getTemplate(r.kind);
            const Icon = ICONS[t.icon] ?? Sparkles;
            return (
              <StaggerItem key={r.kind}>
                <Link href={`/consult/${t.id}`}
                  className={cn(
                    "group relative h-full flex flex-col rounded-3xl p-5 border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    i === 0 ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200",
                  )}
                  data-testid={`consult-rec-${t.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", i === 0 ? "bg-white/10 text-teal-300" : "bg-teal-50 text-teal-700")}><Icon className="w-5 h-5" /></span>
                    <div className="min-w-0">
                      <p className={cn("font-black leading-tight", i === 0 ? "text-white" : "text-slate-900")}>{t.title}</p>
                      <p className={cn("text-[11px] font-bold flex items-center gap-1", i === 0 ? "text-white/60" : "text-slate-400")}><Clock className="w-3 h-3" /> About {t.minutes} min</p>
                    </div>
                  </div>
                  <p className={cn("text-sm mt-3 flex-1", i === 0 ? "text-white/75" : "text-slate-500")}>{r.why}</p>
                  <span className={cn("mt-4 inline-flex items-center gap-1.5 text-sm font-bold", i === 0 ? "text-teal-300" : "text-primary")}>
                    Start session <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section aria-labelledby="all-h">
        <h2 id="all-h" className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">All sessions</h2>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SESSION_TEMPLATES.map((t) => <StaggerItem key={t.id}><TemplateCard t={t} last={sessions.find((s) => s.kind === t.id)} /></StaggerItem>)}
        </Stagger>
      </section>

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Past sessions</h2>
        {sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Your sessions and decisions will appear here, so you can come back to them and see what you decided.
          </div>
        ) : (
          <ul className="rounded-3xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {sessions.map((s) => {
              const chosen = s.result.options.find((o) => o.id === s.chosenOptionId);
              const Icon = ICONS[getTemplate(s.kind).icon] ?? Sparkles;
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                  <Link href={`/consult/${s.kind}?session=${s.id}`} className="flex-1 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.title} <span className="font-medium text-slate-400">· {timeAgo(s.createdAt)}</span></p>
                    <p className="text-[13px] text-slate-500 truncate">{chosen ? <>Decided: <span className="font-semibold text-slate-700">{chosen.title}</span>{s.actionIds.length ? ` · ${s.actionIds.length} actions` : ""}</> : s.result.headline}</p>
                  </Link>
                  <button onClick={() => removeConsultSession(s.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0" aria-label={`Delete ${s.title} session`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-400 max-w-2xl">
        Sessions are guidance based on the numbers you enter, not professional financial, legal or tax advice. For big commitments, check the numbers with your accountant.
      </p>
    </div>
  );
}

function TemplateCard({ t, last }: { t: SessionTemplate; last?: ConsultSession }) {
  const Icon = ICONS[t.icon] ?? Sparkles;
  return (
    <Link href={`/consult/${t.id}`}
      className="group h-full flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      data-testid={`consult-template-${t.id}`}
    >
      <div className="flex items-center justify-between">
        <span className="w-10 h-10 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"><Icon className="w-5 h-5" /></span>
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.minutes} min</span>
      </div>
      <p className="font-black text-slate-900 mt-3">{t.title}</p>
      <p className="text-[13px] text-slate-500 mt-1 flex-1">{t.blurb}</p>
      <p className="text-[11px] font-bold mt-3 text-slate-400">{last ? `Last run ${timeAgo(last.createdAt).toLowerCase()}` : "Not run yet"}</p>
    </Link>
  );
}

// ------------------------------------------------------------------ session

type Stage = "questions" | "thinking" | "results" | "decide" | "done";

function SessionView({ kind }: { kind: SessionKind }) {
  const tpl = getTemplate(kind);
  const Icon = ICONS[tpl.icon] ?? Sparkles;
  const search = useSearch();
  const sessions = useGrowthStore((s) => s.consultSessions);
  const { saveConsultSession, updateConsultSession, addAction, plan } = useGrowthStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const reopened = useMemo(() => {
    const id = new URLSearchParams(search).get("session");
    return id ? sessions.find((s) => s.id === id && s.kind === kind) : undefined;
    // Only on first render: later updates to the same session must not reset the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const previous = reopened ?? sessions.find((s) => s.kind === kind);

  const [answers, setAnswers] = useState<ConsultAnswers>(() => ({ ...(previous?.answers ?? {}) }));
  const [stage, setStage] = useState<Stage>(reopened ? (reopened.chosenOptionId ? "done" : "results") : "questions");
  const [result, setResult] = useState<ConsultResult | null>(reopened?.result ?? null);
  const [sessionId, setSessionId] = useState<string | null>(reopened?.id ?? null);
  const [chosenId, setChosenId] = useState<string | null>(reopened?.chosenOptionId ?? null);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [addedCount, setAddedCount] = useState(reopened?.actionIds.length ?? 0);

  // Keep the active step in view, which matters most on phones.
  useEffect(() => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stage === "decide" || stage === "done") {
      requestAnimationFrame(() => document.getElementById("consult-focus")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
    } else {
      document.querySelector("main")?.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
  }, [stage]);

  const missing = tpl.fields.filter((f) => !f.optional && (answers[f.id] === undefined || String(answers[f.id]).trim() === ""));
  const chosen = result?.options.find((o) => o.id === chosenId);

  const run = async () => {
    setStage("thinking");
    const clean: ConsultAnswers = {};
    for (const f of tpl.fields) {
      const v = answers[f.id];
      if (v === undefined || String(v).trim() === "") continue;
      clean[f.id] = f.type === "text" || f.type === "choice" ? String(v).trim().slice(0, 600) : Number(String(v).replace(/[$,%\s]/g, ""));
    }
    const r = await fetchConsult({ kind, answers: clean });
    const saved = saveConsultSession({ kind, title: tpl.title, answers: clean, result: r });
    setSessionId(saved.id);
    setResult(r);
    setChosenId(null);
    setAddedCount(0);
    setStage("results");
  };

  const choose = (o: ConsultOption) => {
    setChosenId(o.id);
    setPicked(Object.fromEntries(o.steps.map((_, i) => [i, true])));
    setStage("decide");
  };

  const commit = () => {
    if (!chosen || !sessionId) return;
    const ids: string[] = [];
    chosen.steps.forEach((st, i) => {
      if (!picked[i]) return;
      const a = addAction({
        title: st.title,
        detail: st.detail,
        owner: st.owner,
        dueDate: addDays(st.weeks * 7),
        kpi: plan?.northStar.name,
        source: "consult",
        sourceRef: sessionId,
      });
      ids.push(a.id);
    });
    updateConsultSession(sessionId, { chosenOptionId: chosen.id, actionIds: ids, decidedAt: Date.now() });
    setAddedCount(ids.length);
    setStage("done");
    toast({ title: ids.length ? `${ids.length} action${ids.length === 1 ? "" : "s"} added to your plan` : "Decision saved", description: chosen.title });
  };

  const copySummary = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(consultSummaryText(tpl.title, result, chosen));
      toast({ title: "Summary copied", description: "Paste it into an email, Teams or your notes." });
    } catch {
      toast({ title: "Couldn’t copy", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const STEPS: { id: Stage[]; label: string }[] = [
    { id: ["questions", "thinking"], label: "Your numbers" },
    { id: ["results"], label: "Findings & options" },
    { id: ["decide", "done"], label: "Decide" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.id.includes(stage));

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[960px] mx-auto w-full space-y-6">
      <Link href="/consult" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 h-10 -my-2">
        <ArrowLeft className="w-4 h-4" /> All sessions
      </Link>

      <div className="flex items-start gap-4">
        <span className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center shrink-0"><Icon className="w-6 h-6" /></span>
        <div className="min-w-0">
          <PageHeader eyebrow="Consult session" title={tpl.title}>
            <p className="text-slate-500 mt-1">{tpl.blurb}</p>
          </PageHeader>
        </div>
      </div>

      {/* Progress */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Session progress">
        {STEPS.map((s, i) => (
          <li key={s.label} className="min-w-0" aria-current={i === stepIndex ? "step" : undefined}>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" initial={false} animate={{ width: i <= stepIndex ? "100%" : "0%" }} transition={{ duration: 0.35, ease: EASE_OUT }} />
            </div>
            <p className={cn("mt-1.5 text-[11px] font-bold truncate", i <= stepIndex ? "text-slate-900" : "text-slate-400")}>{s.label}</p>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        {stage === "questions" && (
          <motion.section key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: EASE_OUT }}
            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">A few questions first</h2>
              <p className="text-sm text-slate-500">Rough numbers are fine. {previous ? "I’ve filled in your answers from last time." : "Optional questions sharpen the advice."}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {tpl.fields.map((f) => <FieldInput key={f.id} field={f} value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} />)}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between pt-1">
              <p className="text-xs text-slate-400">{missing.length ? `${missing.length} required answer${missing.length === 1 ? "" : "s"} left` : "Ready when you are."}</p>
              <Button onClick={run} disabled={missing.length > 0} className="h-11 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="consult-run">
                <Sparkles className="w-4 h-4 mr-2" /> Run session
              </Button>
            </div>
          </motion.section>
        )}

        {stage === "thinking" && (
          <motion.section key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="relative w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
                <span className="absolute inset-0 rounded-2xl ring-2 ring-teal-400/50 motion-safe:animate-ping" />
              </span>
              <div>
                <p className="font-black text-slate-900">Reviewing your numbers…</p>
                <p className="text-sm text-slate-500">Working out findings, options and trade-offs.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3" aria-hidden>
              {[80, 64, 72].map((w, i) => <div key={i} className="h-3 rounded-full bg-slate-100 motion-safe:animate-pulse" style={{ width: `${w}%` }} />)}
            </div>
          </motion.section>
        )}

        {(stage === "results" || stage === "decide" || stage === "done") && result && (
          <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="space-y-6">
            {/* Headline */}
            <section className="rounded-3xl bg-slate-900 text-white p-5 sm:p-7 relative overflow-hidden">
              <div aria-hidden className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-teal-400/20 blur-3xl" />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-teal-300">The short answer</p>
              <p className="relative mt-1 text-xl sm:text-2xl font-black leading-snug text-balance">{result.headline}</p>
              <p className="relative mt-3 text-xs text-white/60">Prepared by {ENGINE_LABELS[result.generatedBy] ?? result.generatedBy}</p>
            </section>

            {/* Findings */}
            {result.findings.length > 0 && (
              <section aria-labelledby="f-h">
                <h2 id="f-h" className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">What I found</h2>
                <Stagger className="grid sm:grid-cols-2 gap-3">
                  {result.findings.map((f, i) => {
                    const tone = TONE[f.tone] ?? TONE.neutral;
                    return (
                      <StaggerItem key={i}>
                        <div className={cn("h-full rounded-2xl border p-4", tone.card)}>
                          <div className="flex items-start gap-2.5">
                            <tone.icon className={cn("w-4 h-4 mt-0.5 shrink-0", tone.chip)} aria-hidden />
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900">{f.label}{f.value && <span className={cn("ml-2 font-black", tone.chip)}>{f.value}</span>}</p>
                              <p className="text-[13px] text-slate-600 mt-0.5">{f.detail}</p>
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </section>
            )}

            {/* Options */}
            {stage === "results" && (
              <section aria-labelledby="o-h">
                <h2 id="o-h" className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Your options</h2>
                <Stagger className="grid lg:grid-cols-3 gap-3">
                  {result.options.map((o) => (
                    <StaggerItem key={o.id}><OptionCard option={o} recommended={o.id === result.recommendedOptionId} onChoose={() => choose(o)} /></StaggerItem>
                  ))}
                </Stagger>
              </section>
            )}

            {/* Decide */}
            {stage === "decide" && chosen && (
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }}
                id="consult-focus" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-4 scroll-mt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your decision</p>
                  <h2 className="text-lg font-black text-slate-900">{chosen.title}</h2>
                  <p className="text-sm text-slate-500">Pick the steps to add to your action board. Due dates count from today.</p>
                </div>
                <ul className="space-y-2">
                  {chosen.steps.map((st, i) => (
                    <li key={i}>
                      <label className={cn("flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-colors", picked[i] ? "border-primary/40 bg-primary/5" : "border-slate-200 hover:bg-slate-50")}>
                        <input type="checkbox" className="mt-1 w-4 h-4 accent-teal-600 shrink-0" checked={!!picked[i]} onChange={(e) => setPicked((p) => ({ ...p, [i]: e.target.checked }))} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900">{st.title}</span>
                          <span className="block text-[13px] text-slate-500">{st.detail}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                            <span className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5">{st.owner}</span>
                            <span className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5">Due {new Date(addDays(st.weeks * 7) + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
                  <Button variant="ghost" className="h-11 rounded-xl font-bold" onClick={() => setStage("results")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to options</Button>
                  <Button className="h-11 rounded-xl font-black uppercase tracking-widest text-xs" onClick={commit} data-testid="consult-commit">
                    <ListChecks className="w-4 h-4 mr-2" /> {Object.values(picked).some(Boolean) ? `Add ${Object.values(picked).filter(Boolean).length} to my plan` : "Save decision only"}
                  </Button>
                </div>
              </motion.section>
            )}

            {/* Done */}
            {stage === "done" && (
              <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, ease: EASE_OUT }}
                id="consult-focus" className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-7 space-y-4 scroll-mt-4" data-testid="consult-done">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><Check className="w-5 h-5" strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900">{chosen ? `Decision: ${chosen.title}` : "Session saved"}</p>
                    <p className="text-sm text-slate-600">{addedCount ? `${addedCount} action${addedCount === 1 ? " is" : "s are"} on your board with owners and due dates.` : "No actions were added. You can come back to this session any time."}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {addedCount > 0 && <Button className="h-10 rounded-xl font-bold" onClick={() => navigate("/plan")}>Open action board <ArrowRight className="w-4 h-4 ml-1.5" /></Button>}
                  <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={copySummary}><Copy className="w-4 h-4 mr-1.5" /> Copy summary</Button>
                  <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={() => { setStage("questions"); }}><RotateCcw className="w-4 h-4 mr-1.5" /> Run again</Button>
                </div>
              </motion.section>
            )}

            {/* Follow-up */}
            {result.followUp && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <MessageSquareText className="w-5 h-5 text-primary shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">A question to think about</p>
                  <p className="text-sm font-semibold text-slate-800">{result.followUp}</p>
                </div>
                <Link href={`/insights?ask=${encodeURIComponent(result.followUp)}`} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 shrink-0">
                  Discuss with the analyst
                </Link>
              </section>
            )}

            {stage === "results" && (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" className="h-10 rounded-xl font-bold" onClick={() => setStage("questions")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Change answers</Button>
                <Button variant="ghost" className="h-10 rounded-xl font-bold" onClick={copySummary}><Copy className="w-4 h-4 mr-1.5" /> Copy summary</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: SessionTemplate["fields"][number]; value: ConsultAnswers[string]; onChange: (v: string) => void }) {
  const id = `f-${field.id}`;
  const v = value === undefined ? "" : String(value);
  const label = (
    <label htmlFor={id} className="text-[13px] font-bold text-slate-700">
      {field.label}{field.optional && <span className="font-medium text-slate-400"> (optional)</span>}
    </label>
  );
  if (field.type === "choice") {
    return (
      <div className="space-y-1.5 sm:col-span-2" role="group" aria-labelledby={`${id}-l`}>
        <p id={`${id}-l`} className="text-[13px] font-bold text-slate-700">{field.label}</p>
        <div className="flex flex-wrap gap-2">
          {field.options!.map((o) => (
            <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={v === o}
              className={cn("h-10 px-3.5 rounded-xl border text-sm font-bold transition-colors", v === o ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (field.type === "text") {
    const long = field.id === "strengths" || field.id === "weaknesses" || field.id === "opportunities" || field.id === "threats" || field.id === "headache";
    return (
      <div className={cn("space-y-1.5", long && "sm:col-span-2")}>
        {label}
        {long
          ? <Textarea id={id} value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} maxLength={600} className="rounded-xl min-h-[72px]" />
          : <Input id={id} value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} maxLength={120} className="h-11 rounded-xl" />}
        {field.help && <p className="text-xs text-slate-400">{field.help}</p>}
      </div>
    );
  }
  const prefix = field.type === "money" ? "$" : "";
  const suffix = field.type === "percent" ? "%" : field.type === "days" ? "days" : "";
  return (
    <div className="space-y-1.5">
      {label}
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400" aria-hidden>{prefix}</span>}
        <Input id={id} inputMode="decimal" value={v} onChange={(e) => onChange(e.target.value.replace(/[^0-9.,-]/g, ""))} placeholder={field.placeholder}
          className={cn("h-11 rounded-xl tabular-nums", prefix && "pl-7", suffix && "pr-14")} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400" aria-hidden>{suffix}</span>}
      </div>
      {field.help && <p className="text-xs text-slate-400">{field.help}</p>}
    </div>
  );
}

function OptionCard({ option: o, recommended, onChoose }: { option: ConsultOption; recommended: boolean; onChoose: () => void }) {
  return (
    <article className={cn("h-full flex flex-col rounded-3xl border bg-white p-5 transition-shadow hover:shadow-md", recommended ? "border-primary ring-1 ring-primary/30" : "border-slate-200")} data-testid={`consult-option-${o.id}`}>
      {recommended && <span className="self-start mb-2 inline-flex items-center gap-1 rounded-full bg-primary text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"><Star className="w-3 h-3" /> Recommended</span>}
      <h3 className="font-black text-slate-900 leading-tight">{o.title}</h3>
      <p className="text-[13px] text-slate-500 mt-1">{o.summary}</p>
      <div className="flex gap-2 mt-3 text-[11px] font-bold">
        <span className="rounded-md bg-teal-50 text-teal-700 px-2 py-0.5">Impact: {LEVEL_LABEL[o.impact]}</span>
        <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">Effort: {LEVEL_LABEL[o.effort]}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-3 text-[13px] flex-1">
        {o.pros.length > 0 && <ul className="space-y-1">{o.pros.map((p) => <li key={p} className="flex gap-1.5 text-slate-700"><Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 shrink-0" aria-label="Pro" />{p}</li>)}</ul>}
        {o.cons.length > 0 && <ul className="space-y-1">{o.cons.map((c) => <li key={c} className="flex gap-1.5 text-slate-500"><Minus className="w-3.5 h-3.5 mt-0.5 text-rose-600 shrink-0" aria-label="Con" />{c}</li>)}</ul>}
        <p className="text-[11px] font-bold text-slate-400 mt-1">{o.steps.length} step{o.steps.length === 1 ? "" : "s"} · first due in {o.steps[0].weeks === 1 ? "1 week" : `${o.steps[0].weeks} weeks`}</p>
      </div>
      <Button onClick={onChoose} variant={recommended ? "default" : "outline"} className="mt-4 h-11 rounded-xl font-bold w-full">
        Choose this <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </article>
  );
}
