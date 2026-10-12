// Small, lightweight illustrations for the feature grid. Each plays once when
// it scrolls into view (and stays still for "reduce motion"). Built from plain
// elements + SVG so they stay crisp in light and dark mode and cost almost
// nothing to load.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Search, FileSpreadsheet, FileJson, FileText, BarChart3, Building2, Truck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function useOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  return { ref, on: seen || !!reduce, still: !!reduce };
}

/** Growth Plan: a progress ring fills while steps tick off. */
export function PlanVisual() {
  const { ref, on } = useOnce<HTMLDivElement>();
  const steps = ["Time every stage for 2 services", "Prep top 5 items before 5pm", "Add an expo on Fri & Sat", "Review invoices with your rep"];
  const done = on ? 3 : 0;
  return (
    <div ref={ref} className="flex items-center gap-5 h-full">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="10" fill="none" />
          <motion.circle cx="50" cy="50" r="42" stroke="#14B8A6" strokeWidth="10" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: on ? 0.75 : 0 }} transition={{ duration: 1.4, ease, delay: 0.2 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-2xl font-black text-slate-900 tabular-nums" initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: 0.5 }}>75%</motion.span>
          <span className="text-[10px] text-slate-400">to goal</span>
        </div>
      </div>
      <ul className="space-y-2 min-w-0 flex-1">
        {steps.map((s, i) => (
          <motion.li key={s} className="flex items-center gap-2.5 text-[13px]" initial={{ opacity: 0, x: 8 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.15 + i * 0.12, ease }}>
            <motion.span
              className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0"
              animate={i < done ? { backgroundColor: "#14B8A6", borderColor: "#14B8A6" } : {}}
              transition={{ delay: 0.6 + i * 0.35 }}
            >
              {i < done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + i * 0.35, type: "spring", stiffness: 500, damping: 20 }}><Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /></motion.span>}
            </motion.span>
            <span className={cn("truncate transition-colors duration-500", i < done && on ? "text-slate-400 line-through" : "text-slate-700")}>{s}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** AI Analyst: a question, a "thinking" beat, an answer — and a live engine switch. */
export function AnalystVisual() {
  const { ref, on } = useOnce<HTMLDivElement>();
  const engines = ["Claude", "ChatGPT", "Gemini"];
  const [engine, setEngine] = useState(0);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!on) return;
    const a = setTimeout(() => setStage(1), 500), b = setTimeout(() => setStage(2), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [on]);
  return (
    <div ref={ref} className="flex flex-col gap-2.5 h-full">
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 self-start" role="tablist" aria-label="AI engine">
        {engines.map((e, i) => (
          <button key={e} role="tab" aria-selected={engine === i} onClick={() => setEngine(i)}
            className={cn("relative px-3 h-7 rounded-lg text-[12px] font-semibold transition-colors", engine === i ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}>
            {engine === i && <motion.span layoutId="engine-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative">{e}</span>
          </button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ ease }}
        className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 text-white text-[13px] px-3.5 py-2">
        Why did on-time delivery drop?
      </motion.div>
      <AnimatePresence mode="wait">
        {stage === 1 && (
          <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-slate-100 self-start">
            {[0, 1, 2].map((d) => <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />)}
          </motion.div>
        )}
        {stage === 2 && (
          <motion.div key={`ans-${engine}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}
            className="max-w-[92%] rounded-2xl rounded-bl-md bg-slate-100 text-slate-700 text-[13px] leading-relaxed px-3.5 py-2.5">
            Carrier pickups moved to 3pm on the 14th. 61% of late orders were packed after 2:30. <span className="font-semibold text-slate-900">Next: move cut-off to 2pm this week.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bottlenecks: issues ranked by impact; the top one pulses. */
export function BottleneckVisual() {
  const { ref, on, still } = useOnce<HTMLDivElement>();
  const rows = [
    { name: "Warehouse picking", impact: 92, tag: "High" },
    { name: "Supplier lead time", impact: 61, tag: "Medium" },
    { name: "Returns processing", impact: 34, tag: "Low" },
  ];
  return (
    <div ref={ref} className="space-y-3 h-full flex flex-col justify-center">
      {rows.map((r, i) => (
        <div key={r.name}>
          <div className="flex items-center justify-between text-[12.5px] mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>{r.name}
            </span>
            <span className={cn("text-[10.5px] font-bold px-1.5 py-0.5 rounded-md", i === 0 ? "bg-rose-50 text-rose-700" : i === 1 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{r.tag}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div className={cn("h-full rounded-full", i === 0 ? "bg-gradient-to-r from-rose-500 to-rose-400" : i === 1 ? "bg-amber-400" : "bg-slate-300")}
              initial={{ width: 0 }} animate={{ width: on ? `${r.impact}%` : 0 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.15, ease }}>
              {i === 0 && !still && <motion.div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, delay: 1.2 }} />}
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** AI Consultant: a session ends in options, a recommendation and actions. */
export function ConsultVisual() {
  const { ref, on } = useOnce<HTMLDivElement>();
  const options = [
    { title: "Raise prices 6%", meta: "Impact high · effort low", rec: true },
    { title: "Add a premium bundle", meta: "Impact medium · effort medium", rec: false },
  ];
  return (
    <div ref={ref} className="space-y-3 h-full flex flex-col justify-center">
      <motion.div className="rounded-2xl bg-slate-900 text-white px-4 py-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }} transition={{ duration: 0.5, ease }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-300">Pricing review</p>
        <p className="text-[14px] font-bold mt-0.5">You are priced below the market.</p>
      </motion.div>
      {options.map((o, i) => (
        <motion.div key={o.title} className={cn("rounded-2xl border bg-white px-4 py-3 flex items-center gap-3", o.rec ? "border-teal-500" : "border-slate-200")}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: on ? 1 : 0, x: on ? 0 : -10 }} transition={{ duration: 0.45, delay: 0.25 + i * 0.15, ease }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{o.title}</p>
            <p className="text-[11px] text-slate-500 truncate">{o.meta}</p>
          </div>
          {o.rec && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-700 text-white shrink-0">Pick</span>}
        </motion.div>
      ))}
      <motion.p className="text-[12px] font-semibold text-teal-700 flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: 0.75 }}>
        <Check className="w-3.5 h-3.5" strokeWidth={3} /> 3 actions added to your plan
      </motion.p>
    </div>
  );
}

/** Data collabs: you and a partner share the numbers you both depend on. */
export function CollabVisual() {
  const { ref, on, still } = useOnce<HTMLDivElement>();
  return (
    <div ref={ref} className="relative h-full flex items-center justify-between gap-3">
      <Party icon={Building2} name="You" sub="Orders · Stock" />
      <div className="relative flex-1 h-16">
        <svg viewBox="0 0 200 64" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
          <motion.path d="M4 22 C 70 4, 130 4, 196 22" fill="none" strokeWidth="2" strokeDasharray="5 6" className="stroke-slate-300 dark:stroke-slate-600"
            initial={{ pathLength: 0 }} animate={{ pathLength: on ? 1 : 0 }} transition={{ duration: 0.8, ease }} />
          <motion.path d="M196 42 C 130 60, 70 60, 4 42" fill="none" strokeWidth="2" strokeDasharray="5 6" className="stroke-slate-300 dark:stroke-slate-600"
            initial={{ pathLength: 0 }} animate={{ pathLength: on ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.2, ease }} />
          {on && !still && (
            <>
              <circle r="4" fill="#14B8A6"><animateMotion dur="2.2s" repeatCount="indefinite" path="M4 22 C 70 4, 130 4, 196 22" /></circle>
              <circle r="4" fill="#0EA5E9"><animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path="M196 42 C 130 60, 70 60, 4 42" /></circle>
            </>
          )}
        </svg>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={on ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 20 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white dark:bg-slate-900 border border-slate-200 shadow-sm px-2.5 py-1 text-[11px] font-bold text-slate-700">
          On-time 94%
        </motion.div>
      </div>
      <Party icon={Truck} name="Your carrier" sub="Pickups · ETAs" />
    </div>
  );
}

function Party({ icon: Icon, name, sub }: { icon: any; name: string; sub: string }) {
  return (
    <div className="shrink-0 w-[88px] rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/60 p-2.5 text-center">
      <span className="mx-auto w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5"><Icon className="w-4 h-4" /></span>
      <p className="text-[12px] font-bold text-slate-900 leading-tight">{name}</p>
      <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">{sub}</p>
    </div>
  );
}

/** KPI Library: a search types itself and matching metrics light up. */
export function KpiVisual() {
  const { ref, on } = useOnce<HTMLDivElement>();
  const query = "food cost";
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!on) return;
    let i = 0;
    const id = setInterval(() => { i++; setTyped(query.slice(0, i)); if (i >= query.length) clearInterval(id); }, 70);
    return () => clearInterval(id);
  }, [on]);
  const chips = ["Food cost %", "Prime cost", "Table turnover", "Ticket time", "Food waste", "Average check", "Labor cost %", "Review rating"];
  const match = typed.length >= 4;
  return (
    <div ref={ref} className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900/60 text-[13px]">
        <Search className="w-4 h-4 text-slate-400" />
        <span className="text-slate-900">{typed}</span>
        <span className="w-[2px] h-4 bg-primary animate-pulse -ml-1" />
        <span className="ml-auto text-[11px] text-slate-400">Restaurant & café</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => {
          const hit = match && (c.includes("Food") || c === "Prime cost");
          return (
            <motion.span key={c} initial={{ opacity: 0, y: 4 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.05 * i }}
              className={cn("text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-300",
                hit ? "bg-primary text-white border-primary shadow-[0_6px_16px_-6px_rgba(13,148,136,0.7)]" : match ? "opacity-40 border-slate-200 text-slate-500" : "border-slate-200 text-slate-600")}>
              {c}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

/** Import & export: files flow in, the dashboard flows out to your tools. */
export function ExportVisual() {
  const { ref, on } = useOnce<HTMLDivElement>();
  const left = [{ icon: FileSpreadsheet, label: "Excel", c: "text-emerald-700" }, { icon: FileText, label: "CSV", c: "text-sky-700" }, { icon: FileJson, label: "JSON", c: "text-amber-700" }];
  const right = [{ icon: FileSpreadsheet, label: "Excel" }, { icon: BarChart3, label: "Power BI" }, { icon: FileText, label: "Sheets" }];
  return (
    <div ref={ref} className="h-full grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="space-y-2">
        {left.map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, x: -10 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1, ease }}
            className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-900/60 text-[12px] font-semibold text-slate-700">
            <f.icon className={cn("w-4 h-4", f.c)} /> {f.label}
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={on ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 18 }} className="relative">
        <span aria-hidden className="absolute inset-0 rounded-2xl bg-teal-400/30 blur-xl" />
        <span className="relative block"><LogoMark size={52} /></span>
      </motion.div>
      <div className="space-y-2">
        {right.map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, x: 10 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.6 + i * 0.1, ease }}
            className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold">
            <f.icon className="w-4 h-4 text-teal-300" /> {f.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
