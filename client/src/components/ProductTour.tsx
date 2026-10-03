// Skippable product tour shown once, right after the onboarding interview.
// On wide screens it spotlights each sidebar item; on phones (sidebar hidden)
// it shows the same steps as centered cards.
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { EASE_OUT } from "@/components/motion";

interface TourStep {
  target?: string; // data-tour value
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  { title: 'Your plan is ready', body: 'Here’s a one-minute tour of where everything lives. You can skip it and come back from Settings any time.' },
  { target: 'nav-plan', title: 'Growth Plan', body: 'Your step-by-step plan and action board. Tick steps off, set due dates and add them to Outlook or Google Calendar.' },
  { target: 'nav-analyst', title: 'AI Analyst', body: 'Ask why a number moved or what to do next. It knows your goal and runs on Claude, ChatGPT or Gemini.' },
  { target: 'nav-bottlenecks', title: 'Bottlenecks', body: 'The analyst ranks what’s slowing you down. Turn any fix into tracked actions, or discuss it with a partner in one click.' },
  { target: 'nav-collabs', title: 'Data collabs', body: 'Share the numbers you and a partner both depend on. Save a collab as a preset and reuse it for your next partner.' },
  { target: 'nav-hub', title: 'Hub', body: 'Talk through issues with your team and partners, and send updates to Microsoft Teams or Google Chat.' },
  { target: 'nav-data', title: 'Import & export', body: 'Bring in CSV, Excel, Google Sheets or an API. Export to Excel, CSV or JSON whenever you need to.' },
  { title: 'You’re all set', body: 'Start with the first step in your plan. The analyst is one tap away if you get stuck.' },
];

type Rect = { top: number; left: number; width: number; height: number };

export function ProductTour() {
  const [location] = useLocation();
  const { onboardingComplete, tourComplete, completeTour } = useGrowthStore();
  const isDemo = useDashboardStore((s) => s.isDemoMode);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const active = onboardingComplete && !tourComplete && !isDemo && location === '/plan';
  const step = STEPS[index];

  const measure = useCallback(() => {
    if (!step?.target) { setRect(null); return; }
    // The sidebar on desktop, or the bottom tab bar on phones and tablets.
    const alt = step.target.replace(/^nav-/, 'tab-');
    const el = [...document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"], [data-tour="${alt}"]`)]
      .find((n) => n.offsetParent !== null && n.getBoundingClientRect().width > 0);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    if (r.width === 0) { setRect(null); return; }
    setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
  }, [step]);

  useLayoutEffect(() => { if (active) measure(); }, [active, index, measure]);
  useEffect(() => {
    if (!active) return;
    const on = () => measure();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [active, measure]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') completeTour();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, completeTour]);

  if (!active) return null;

  const last = index === STEPS.length - 1;
  // Beside the target when there's room (sidebar), otherwise above it (tab bar).
  const cardW = Math.min(360, window.innerWidth - 32);
  const roomRight = rect ? window.innerWidth - (rect.left + rect.width) > cardW + 32 : false;
  const cardStyle: React.CSSProperties = !rect
    ? {}
    : roomRight
      ? { top: Math.max(16, Math.min(rect.top, window.innerHeight - 260)), left: rect.left + rect.width + 16 }
      : { bottom: Math.max(16, window.innerHeight - rect.top + 12), left: Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, window.innerWidth - cardW - 16)) };

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Dim layer with a spotlight hole */}
      <AnimatePresence>
        {rect ? (
          <motion.div key="spot" className="absolute rounded-2xl pointer-events-none"
            initial={false}
            animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            style={{ boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)', outline: '2px solid rgba(94, 234, 212, 0.9)' }} />
        ) : (
          <motion.div key="dim" className="absolute inset-0 bg-slate-900/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: EASE_OUT }}
          className={rect
            ? 'absolute w-[min(360px,calc(100vw-32px))] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5'
            : 'absolute left-4 right-4 bottom-4 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6'}
          style={cardStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
            <button onClick={completeTour} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Skip tour"><X className="w-4 h-4" /></button>
          </div>
          <h2 id="tour-title" className="mt-3 text-lg font-black text-slate-900">{step.title}</h2>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.body}</p>
          <div className="mt-5 flex items-center gap-2">
            <div className="flex gap-1 mr-auto" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-primary' : 'w-1.5 bg-slate-200'}`} />
              ))}
            </div>
            {index === 0 ? (
              <Button variant="ghost" size="sm" onClick={completeTour} className="font-bold text-slate-500">Skip tour</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIndex(index - 1)} className="font-bold text-slate-500"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            )}
            <Button size="sm" onClick={() => (last ? completeTour() : setIndex(index + 1))} className="rounded-xl font-black uppercase tracking-widest text-[11px] h-9 px-4">
              {last ? 'Start step 1' : index === 0 ? 'Show me' : 'Next'} {!last && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
