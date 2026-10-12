// The homepage's one big interactive moment: a live miniature of the product.
// Orders flow down a supply chain, one link backs up (the bottleneck), the AI
// analyst explains it, and "Apply fix" clears it while the KPIs climb.
// Plays the fix once by itself if the visitor doesn't touch it. Pure SVG +
// Framer Motion; pauses off-screen and respects "reduce motion".
import { useEffect, useRef, useState } from "react";
import {
  animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, AnimatePresence,
} from "framer-motion";
import { Check, Sparkles, MessageSquare, RotateCcw, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useIntroReady } from "@/lib/intro-gate";
import { cn } from "@/lib/utils";

const NODES = ["Supplier", "Roaster", "Warehouse", "Carrier", "Customer"];
const W = 640, H = 170, Y = 92;
const X = NODES.map((_, i) => 48 + i * ((W - 96) / (NODES.length - 1)));
const BOTTLENECK = 2; // Warehouse

const KPIS = [
  { label: "On-time delivery", from: 82, to: 95, unit: "%", spark: [70, 74, 72, 76, 73, 75, 74] },
  { label: "Pick time", from: 41, to: 18, unit: " min", spark: [30, 33, 36, 35, 39, 40, 41], lowerBetter: true },
  { label: "Orders / day", from: 312, to: 388, unit: "", spark: [300, 296, 305, 310, 302, 309, 312] },
];

export function HeroProduct() {
  const introReady = useIntroReady();
  const ref = useRef<HTMLDivElement>(null);
  // Waits for the intro to open, so the auto-play isn't half over before anyone sees it.
  const inView = useInView(ref, { margin: "-80px" }) && introReady;
  const reduce = useReducedMotion();
  const [fixed, setFixed] = useState(false);
  const [touched, setTouched] = useState(false);

  // Auto-play the fix once for passive visitors.
  useEffect(() => {
    if (!inView || touched || fixed) return;
    const t = window.setTimeout(() => setFixed(true), 4200);
    return () => clearTimeout(t);
  }, [inView, touched, fixed]);

  // Gentle 3D tilt toward the pointer (desktop only).
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 18 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["10%", "90%"]);
  const sheen = useTransform([glowX, glowY] as any, ([x, y]: any) => `radial-gradient(500px circle at ${x} ${y}, rgba(94,234,212,0.14), transparent 60%)`);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const run = inView && !reduce;

  return (
    <div className="relative mx-auto max-w-5xl [perspective:1600px]" ref={ref}>
      {/* Halo */}
      <div aria-hidden className="absolute -inset-x-10 -top-10 -bottom-16 rounded-[48px] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(45,212,191,0.28),transparent_70%)] blur-2xl" />
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative rounded-[22px] sm:rounded-[28px] border border-slate-200/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_40px_120px_-30px_rgba(15,23,42,0.35)] dark:shadow-[0_40px_140px_-30px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Pointer-follow sheen */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
          style={{ background: sheen }} />

        {/* Window chrome */}
        <div className="relative flex items-center gap-3 px-4 sm:px-5 h-12 border-b border-slate-200/80">
          <div className="flex gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /><span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <LogoMark size={20} />
            <span className="text-[13px] font-semibold text-slate-700 truncate">Harbor &amp; Pine Coffee · Growth Plan</span>
          </div>
          <span className={cn("ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2 py-1 transition-colors",
            fixed ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50")}>
            <span className={cn("w-1.5 h-1.5 rounded-full", fixed ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
            {fixed ? "Flowing" : "1 bottleneck"}
          </span>
        </div>

        <div className="relative grid lg:grid-cols-[1.6fr_1fr]">
          {/* Supply chain flow */}
          <div className="p-4 sm:p-6 lg:border-r border-slate-200/80">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[13px] font-semibold text-slate-900">Order flow this week</p>
              <p className="text-[12px] text-slate-400">Tap a stage</p>
            </div>
            <ChainFlow fixed={fixed} running={run} />
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2">
              {KPIS.map((k) => <KpiTile key={k.label} {...k} fixed={fixed} />)}
            </div>
          </div>

          {/* Analyst */}
          <div className="p-4 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-teal-300 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></span>
              <p className="text-[13px] font-semibold text-slate-900">AI Analyst</p>
              <span className="ml-auto text-[11px] text-slate-400">Claude · ChatGPT · Gemini</span>
            </div>
            <AnimatePresence mode="wait">
              {!fixed ? (
                <motion.div key="diag" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-[13.5px] leading-relaxed text-slate-700">
                  <Typewriter run={run} text="Your biggest bottleneck is warehouse picking at peak: pick time is up 38%, so orders miss the carrier's 4pm pickup." />
                  <p className="mt-3 text-slate-900 font-semibold">Fix: add a second pick wave at 2pm and share the order cut-off with your carrier.</p>
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-[13.5px] leading-relaxed text-emerald-900">
                  <p className="font-semibold flex items-center gap-1.5"><Check className="w-4 h-4" /> 3 actions added to your plan</p>
                  <ul className="mt-2 space-y-1 text-emerald-800">
                    <li>· Second pick wave at 2pm — Operations</li>
                    <li>· Share cut-off time with the carrier — Partner</li>
                    <li>· Track pick time daily — Owner</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {!fixed ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setTouched(true); setFixed(true); }}
                  className="relative inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold shadow-[0_8px_24px_-8px_rgba(13,148,136,0.7)] hover:brightness-110 transition"
                >
                  {!touched && <span aria-hidden className="absolute inset-0 rounded-xl ring-2 ring-primary/40 animate-ping [animation-duration:2s]" />}
                  <Sparkles className="w-4 h-4" /> Apply fix
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setTouched(true); setFixed(false); }}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition">
                  <RotateCcw className="w-4 h-4" /> Replay
                </motion.button>
              )}
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold">
                <MessageSquare className="w-4 h-4" /> Discuss with carrier
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChainFlow({ fixed, running }: { fixed: boolean; running: boolean }) {
  const [focus, setFocus] = useState<number | null>(null);
  const packets = 7;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label={fixed ? "Orders flowing smoothly through all five stages" : "Orders backing up at the warehouse"}>
      <defs>
        <linearGradient id="hp-line" x1="0" x2="1">
          <stop offset="0" stopColor="#2DD4BF" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#2DD4BF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2DD4BF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Track */}
      <line x1={X[0]} y1={Y} x2={X[X.length - 1]} y2={Y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="6" strokeLinecap="round" />
      <line x1={X[0]} y1={Y} x2={X[X.length - 1]} y2={Y} stroke="url(#hp-line)" strokeWidth="6" strokeLinecap="round" />
      {/* Bottleneck segment */}
      <motion.line x1={X[BOTTLENECK]} y1={Y} x2={X[BOTTLENECK + 1]} y2={Y} strokeWidth="6" strokeLinecap="round"
        animate={{ stroke: fixed ? "#14B8A6" : "#F43F5E", opacity: 1 }} transition={{ duration: 0.5 }} />

      {/* Packets */}
      {running && Array.from({ length: packets }).map((_, i) => (
        <Packet key={i} i={i} n={packets} fixed={fixed} />
      ))}

      {/* Queue piling up before the bottleneck */}
      <AnimatePresence>
        {!fixed && [0, 1, 2, 3].map((q) => (
          <motion.circle key={`q${q}`} r="5" cy={Y} fill="#FB7185"
            initial={{ cx: X[BOTTLENECK] - 10, opacity: 0 }}
            animate={{ cx: X[BOTTLENECK] - 16 - q * 13, opacity: 0.9 - q * 0.15 }}
            exit={{ cx: X[BOTTLENECK + 1], opacity: 0, transition: { duration: 0.5, delay: q * 0.05 } }}
            transition={{ delay: 0.4 + q * 0.2, type: "spring", stiffness: 200, damping: 18 }} />
        ))}
      </AnimatePresence>

      {/* Nodes */}
      {NODES.map((label, i) => {
        const hot = i === BOTTLENECK && !fixed;
        const healed = i === BOTTLENECK && fixed;
        return (
          <g key={label} transform={`translate(${X[i]} ${Y})`} onPointerEnter={() => setFocus(i)} onPointerLeave={() => setFocus(null)} onClick={() => setFocus(focus === i ? null : i)} className="cursor-pointer">
            {hot && running && (
              <motion.circle r="18" fill="none" stroke="#F43F5E" strokeWidth="2"
                initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2.1, opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
            )}
            {healed && (
              <motion.circle r="18" fill="none" stroke="#2DD4BF" strokeWidth="3"
                initial={{ scale: 0.8, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }} />
            )}
            <motion.circle r="16" strokeWidth="3"
              className={cn(!hot && !healed && "fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-600")}
              animate={hot ? { fill: "#FFE4E6", stroke: "#F43F5E" } : healed ? { fill: "#CCFBF1", stroke: "#14B8A6" } : {}}
              transition={{ duration: 0.4 }} />
            <motion.circle r="5" animate={{ fill: hot ? "#F43F5E" : healed ? "#0D9488" : "#94A3B8" }} />
            <text y="40" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" style={{ fontSize: 13, fontWeight: 600 }}>{label}</text>
            {(hot || focus === i) && (
              <g transform="translate(0 -44)">
                <rect x="-74" y="-17" width="148" height="30" rx="10" className={hot ? "fill-rose-600" : "fill-slate-900 dark:fill-slate-700"} />
                <text y="3" textAnchor="middle" fill="#fff" style={{ fontSize: 12, fontWeight: 700 }}>
                  {hot ? "Pick time 41 min ▲38%" : i === BOTTLENECK ? "Pick time 18 min ▼56%" : ["On time 98%", "Batches on plan", "", "Pickup 4:00pm", "Rating 4.8★"][i]}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Packet({ i, n, fixed }: { i: number; n: number; fixed: boolean }) {
  // Before the fix, packets crawl through the warehouse segment; after, they flow evenly.
  const dur = fixed ? 3.2 : 5.2;
  const L = X[X.length - 1] - X[0];
  const stops = fixed
    ? [X[0], X[0] + 0.08 * L, X[0] + 0.92 * L, X[X.length - 1]]
    : [X[0], X[BOTTLENECK] - 8, X[BOTTLENECK] + 8, X[X.length - 1]];
  const times = fixed ? [0, 0.08, 0.92, 1] : [0, 0.3, 0.82, 1];
  return (
    <motion.circle key={String(fixed)} r="4.5" cy={Y} fill={fixed ? "#2DD4BF" : "#0D9488"}
      initial={{ cx: X[0], opacity: 0 }}
      animate={{ cx: stops, opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur, times, repeat: Infinity, delay: (i / n) * dur, ease: "linear" }} />
  );
}

function KpiTile({ label, from, to, unit, spark, fixed, lowerBetter }: { label: string; from: number; to: number; unit: string; spark: number[]; fixed: boolean; lowerBetter?: boolean }) {
  const value = useCountTo(fixed ? to : from);
  const series = fixed ? [...spark.slice(0, 4), ...[0.35, 0.7, 1].map((t) => spark[3] + (to - spark[3]) * t)] : spark;
  const min = Math.min(...series, from, to), max = Math.max(...series, from, to);
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(" ");
  const good = fixed;
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white/70 dark:bg-slate-900/40 p-2.5 sm:p-3 min-w-0">
      <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 truncate">{label}</p>
      <div className="flex items-end justify-between gap-1">
        <p className="text-[17px] sm:text-[22px] font-black tracking-tight text-slate-900 tabular-nums leading-tight">{Math.round(value)}{unit}</p>
        <AnimatePresence>
          {good && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="hidden sm:inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 mb-1">
              <TrendingUp className={cn("w-3 h-3", lowerBetter && "-scale-y-100")} />{Math.abs(Math.round(((to - from) / from) * 100))}%
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-6 mt-1" aria-hidden>
        <motion.polyline points={pts} fill="none" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
          animate={{ stroke: good ? "#14B8A6" : "#94A3B8" }} initial={false} transition={{ duration: 0.5 }} />
      </svg>
    </div>
  );
}

function useCountTo(target: number) {
  const [v, setV] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const c = animate(prev.current, target, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    prev.current = target;
    return () => c.stop();
  }, [target]);
  return v;
}

function Typewriter({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(run ? 0 : text.length);
  useEffect(() => {
    if (!run) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => { i += 2; setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(id); }, 22);
    return () => clearInterval(id);
  }, [text, run]);
  return (
    <p>
      {text.slice(0, n)}
      {n < text.length && <span className="inline-block w-[2px] h-[1em] align-[-2px] bg-primary ml-0.5 animate-pulse" />}
    </p>
  );
}
