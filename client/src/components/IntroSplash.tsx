// First-visit intro for the homepage (~4.7s, skippable, shown once).
// Story, in motion:
//   1. Particles stream in from the dark and ignite five business nodes.
//   2. Links draw between them — "Every business is a chain."
//   3. Energy pulses race down the chain and jam at one link: it flares red,
//      the chain shudders and a shockwave rolls out — "One weak link slows everyone."
//   4. A teal beam sweeps through, the link snaps teal, pulses flow freely —
//      "Find it. Fix it together."
//   5. The chain folds into the logo; the wordmark sweeps in; we zoom through.
// Interactive: the scene leans toward the pointer; any click, tap or key ends it.
// Reduced-motion users never see it. See docs/BRAND.md → "The intro".
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion";
import { LogoMark } from "@/components/Logo";

const STORAGE_KEY = "ciq_intro_seen_v2";
const NODES = ["Supplier", "Maker", "Warehouse", "Carrier", "Customer"];
const BOTTLENECK = 2; // link between Warehouse (2) and Carrier (3)
const RED = "#F43F5E";
const TEAL = "#2DD4BF";

// Stage start times (ms): stream, chain, jam, fix, logo, exit.
const TIMELINE = [0, 600, 1400, 2350, 3150, 4300];
const TOTAL = 4700;
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

function seen(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return true; }
}
function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
}

// Deterministic pseudo-random so the scene is identical every time.
const rand = (i: number) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); };

export function IntroSplash() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<Stage>(0);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (reduce || seen() || new URLSearchParams(window.location.search).has("nointro")) return;
    setSize({ w: window.innerWidth, h: window.innerHeight });
    setShow(true);
  }, [reduce]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    markSeen();
    setShow(false);
  }, []);

  useEffect(() => {
    if (!show) return;
    TIMELINE.slice(1).forEach((t, i) => {
      timers.current.push(window.setTimeout(() => setStage((i + 1) as Stage), t));
    });
    timers.current.push(window.setTimeout(finish, TOTAL));
    const onKey = (e: KeyboardEvent) => { if (["Escape", "Enter", " "].includes(e.key)) finish(); };
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [show, finish]);

  // Layout: horizontal chain on wide screens, vertical on phones.
  const vertical = size.w < 640;
  const cx = size.w / 2, cy = size.h * 0.46;
  const chain = useMemo(() => NODES.map((_, i) => {
    const t = i / (NODES.length - 1);
    return vertical ? { x: cx, y: size.h * (0.18 + t * 0.56) } : { x: size.w * (0.14 + t * 0.72), y: cy };
  }), [size, vertical, cx, cy]);

  // Particles: start scattered beyond the edges, each assigned to a node.
  const particles = useMemo(() => Array.from({ length: vertical ? 26 : 34 }, (_, i) => {
    const ang = rand(i) * Math.PI * 2;
    const r = Math.max(size.w, size.h) * (0.55 + rand(i + 99) * 0.35);
    return { id: i, sx: cx + Math.cos(ang) * r, sy: cy + Math.sin(ang) * r, node: i % NODES.length, delay: rand(i + 7) * 0.35, s: 1 + rand(i + 3) * 1.6 };
  }), [size, vertical, cx, cy]);

  const L = { x: pointer.x * 10, y: pointer.y * 10 };
  const a = chain[BOTTLENECK], b = chain[BOTTLENECK + 1];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  const linkColor = (i: number) => {
    if (i === BOTTLENECK && stage === 2) return RED;
    if (i === BOTTLENECK && stage >= 3) return TEAL;
    return stage >= 3 ? "rgba(94,234,212,0.55)" : "rgba(148,163,184,0.5)";
  };

  if (typeof document === "undefined") return null;
  // Portal to <body> so page transforms can't trap the fixed overlay under the header.
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="dialog"
          aria-label="ChainInsideIQ intro"
          className="fixed inset-0 z-[300] bg-[#04070D] text-white overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)", transition: { duration: 0.45, ease: EASE_OUT } }}
          onClick={finish}
          onPointerMove={(e) => setPointer({ x: (e.clientX / size.w) * 2 - 1, y: (e.clientY / size.h) * 2 - 1 })}
        >
          {/* Grid floor + vignette */}
          <motion.div aria-hidden className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: stage >= 4 ? 0.15 : 0.5 }} transition={{ duration: 0.8 }}
            style={{
              backgroundImage: "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(60% 60% at 50% 46%, #000 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(60% 60% at 50% 46%, #000 30%, transparent 75%)",
            }} />
          {/* Ambient glow that shifts colour with the story */}
          <motion.div aria-hidden className="absolute rounded-full blur-[90px] pointer-events-none"
            style={{ width: size.w * 0.7, height: size.w * 0.7, left: cx - size.w * 0.35, top: cy - size.w * 0.35 }}
            animate={{
              backgroundColor: stage === 2 ? "rgba(244,63,94,0.22)" : stage >= 3 ? "rgba(45,212,191,0.26)" : "rgba(45,212,191,0.08)",
              scale: stage >= 4 ? 0.7 : stage === 3 ? 1.15 : 1,
            }}
            transition={{ duration: 0.6, ease: EASE_OUT }} />

          {/* Flash on the fix */}
          <AnimatePresence>
            {stage === 3 && (
              <motion.div key="flash" aria-hidden className="absolute inset-0 bg-teal-300 pointer-events-none"
                initial={{ opacity: 0.32 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
            )}
          </AnimatePresence>

          {/* The chain scene */}
          <motion.svg width={size.w} height={size.h} className="absolute inset-0" aria-hidden
            animate={
              stage === 2 ? { x: [0, -7, 6, -4, 3, 0], opacity: 1, scale: 1 }
                : stage >= 4 ? { opacity: 0, scale: 0.55, x: 0 }
                  : { opacity: 1, scale: 1, x: 0 }
            }
            transition={stage === 2 ? { duration: 0.45, delay: 0.35 } : { duration: 0.5, ease: EASE_OUT }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <defs>
              {/* Dots and nodes: a small glow region keeps this cheap. */}
              <filter id="intro-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Lines: userSpaceOnUse, because a percentage region collapses to
                  zero for perfectly straight lines and makes them vanish. */}
              <filter id="intro-glow-line" filterUnits="userSpaceOnUse" x={Math.min(a.x, b.x) - 40} y={Math.min(a.y, b.y) - 40} width={Math.abs(b.x - a.x) + 80} height={Math.abs(b.y - a.y) + 80}>
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="intro-beam" x1="0" x2="1">
                <stop offset="0" stopColor={TEAL} stopOpacity="0" />
                <stop offset="0.5" stopColor="#CCFBF1" stopOpacity="1" />
                <stop offset="1" stopColor={TEAL} stopOpacity="0" />
              </linearGradient>
            </defs>

            <g transform={`translate(${L.x} ${L.y})`}>
              {/* Particles streaming into the nodes */}
              {stage <= 1 && particles.map((p) => (
                <motion.circle key={p.id} r={p.s + 0.6} fill={TEAL}
                  initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
                  animate={{ cx: chain[p.node].x, cy: chain[p.node].y, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.75, delay: p.delay, ease: [0.5, 0, 0.75, 0] }} />
              ))}

              {/* Links */}
              {NODES.slice(0, -1).map((_, i) => {
                const p = chain[i], q = chain[i + 1];
                const hot = i === BOTTLENECK && stage >= 2;
                return (
                  <motion.line key={`l${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                    strokeWidth={hot ? 6 : 3} strokeLinecap="round" filter={hot ? "url(#intro-glow-line)" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0, stroke: linkColor(i) }}
                    transition={{ pathLength: { duration: 0.45, delay: stage === 1 ? i * 0.09 : 0, ease: EASE_OUT }, stroke: { duration: 0.25 }, opacity: { duration: 0.2 } }} />
                );
              })}

              {/* Energy pulses: jam before the bottleneck, then flow after the fix */}
              {(stage === 2 || stage === 3) && [0, 1, 2, 3, 4, 5].map((k) => {
                const flow = stage === 3;
                const end = flow ? chain[NODES.length - 1] : { x: a.x - (vertical ? 0 : 10 + k * 9), y: a.y - (vertical ? 10 + k * 9 : 0) };
                return (
                  <motion.circle key={`${stage}-${k}`} r={flow ? 5 : 4.5} fill={flow ? "#CCFBF1" : "#FDA4AF"} filter="url(#intro-glow)"
                    initial={{ cx: chain[0].x, cy: chain[0].y, opacity: 0 }}
                    animate={{ cx: end.x, cy: end.y, opacity: flow ? [0, 1, 1, 0] : [0, 1, 1] }}
                    transition={{ duration: flow ? 0.7 : 0.55, delay: k * (flow ? 0.09 : 0.07), ease: flow ? "easeIn" : EASE_OUT }} />
                );
              })}

              {/* Shockwaves at the bottleneck */}
              {stage === 2 && [0, 0.18].map((d) => (
                <motion.circle key={`sw-r-${d}`} cx={mid.x} cy={mid.y} fill="none" stroke={RED} strokeWidth="2"
                  initial={{ r: 8, opacity: 0.9 }} animate={{ r: Math.min(size.w, size.h) * 0.32, opacity: 0 }}
                  transition={{ duration: 1, delay: 0.35 + d, ease: "easeOut" }} />
              ))}
              {stage === 3 && [0, 0.12, 0.24].map((d) => (
                <motion.circle key={`sw-t-${d}`} cx={mid.x} cy={mid.y} fill="none" stroke={TEAL} strokeWidth="2.5"
                  initial={{ r: 6, opacity: 1 }} animate={{ r: Math.max(size.w, size.h) * 0.5, opacity: 0 }}
                  transition={{ duration: 1.1, delay: d, ease: "easeOut" }} />
              ))}

              {/* Teal repair beam sweeping across the broken link */}
              {stage === 3 && (
                <motion.line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#intro-beam)" strokeWidth="14" strokeLinecap="round" filter="url(#intro-glow-line)"
                  initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }} />
              )}

              {/* Nodes */}
              {NODES.map((label, i) => {
                const p = chain[i];
                const isBad = i === BOTTLENECK || i === BOTTLENECK + 1;
                const hot = stage === 2 && isBad;
                const fixed = stage >= 3 && isBad;
                return (
                  <motion.g key={label}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: 1, scale: hot ? 1.15 : 1 }}
                    transition={{ opacity: { duration: 0.2, delay: stage === 0 ? 0.55 + i * 0.05 : 0 }, scale: { type: "spring", stiffness: 420, damping: 14, delay: stage === 0 ? 0.55 + i * 0.05 : 0 } }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                    <circle cx={p.x} cy={p.y} r={vertical ? 22 : 26} fill={hot ? "rgba(244,63,94,0.18)" : fixed ? "rgba(45,212,191,0.18)" : "rgba(45,212,191,0.06)"} />
                    <motion.circle cx={p.x} cy={p.y} r={vertical ? 12 : 15} strokeWidth={3} filter="url(#intro-glow)"
                      animate={{ fill: hot ? RED : fixed ? "#14B8A6" : "#0B1424", stroke: hot ? "#FDA4AF" : fixed ? "#99F6E4" : "#2DD4BF" }}
                      transition={{ duration: 0.25 }} />
                    <text x={vertical ? p.x + 30 : p.x} y={vertical ? p.y + 5 : p.y + 46} textAnchor={vertical ? "start" : "middle"}
                      fill="#94A3B8" style={{ fontSize: vertical ? 13 : 14, fontWeight: 700, letterSpacing: "0.04em" }}>
                      {label}
                    </text>
                  </motion.g>
                );
              })}
            </g>
          </motion.svg>

          {/* Captions */}
          <div className="absolute inset-x-0 px-6 text-center pointer-events-none" style={{ top: vertical ? size.h * 0.82 : size.h * 0.63 }}>
            <AnimatePresence mode="wait">
              {stage >= 1 && stage <= 3 && (
                <motion.p key={stage}
                  initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", x: stage === 2 ? [0, -3, 3, -2, 0] : 0 }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)", transition: { duration: 0.16 } }}
                  transition={{ duration: 0.3, ease: EASE_OUT, x: { duration: 0.35, delay: 0.35 } }}
                  className={`text-2xl sm:text-4xl font-black tracking-[-0.03em] ${stage === 2 ? "text-rose-300" : stage === 3 ? "text-teal-200" : "text-white/90"}`}>
                  {stage === 1 ? "Every business is a chain." : stage === 2 ? "One weak link slows everyone." : "Find it. Fix it together."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Logo lockup: the chain folds into the mark */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.div key="logo" className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <motion.div className="relative" initial={{ scale: 0.3, rotate: -25, filter: "blur(10px)" }} animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 220, damping: 16 }}>
                  <motion.span aria-hidden className="absolute -inset-6 rounded-[32px] bg-teal-400/30 blur-2xl" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 0.6], scale: [0.6, 1.3, 1] }} transition={{ duration: 0.9 }} />
                  <span className="relative block"><LogoMark size={vertical ? 76 : 96} animated /></span>
                  {Array.from({ length: 14 }).map((_, i) => {
                    const ang = (i / 14) * Math.PI * 2;
                    return (
                      <motion.span key={i} aria-hidden className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-teal-300"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(ang) * 110, y: Math.sin(ang) * 110, opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }} />
                    );
                  })}
                </motion.div>
                <div className="relative overflow-hidden">
                  <motion.p className="text-[2.2rem] sm:text-6xl font-black tracking-[-0.05em] leading-none py-1"
                    initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }} animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }} transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}>
                    ChainInside<span className="text-teal-300">IQ</span>
                  </motion.p>
                  <motion.span aria-hidden className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                    initial={{ left: "-40%" }} animate={{ left: "120%" }} transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT }} />
                </div>
                <motion.p className="text-white/70 text-base sm:text-xl font-medium" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
                  Find the bottleneck. Fix it together.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress + skip */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-center gap-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden" aria-hidden>
              <motion.div className="h-full bg-gradient-to-r from-teal-500 to-cyan-300 origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: TOTAL / 1000, ease: "linear" }} />
            </div>
            <button
              ref={skipRef}
              onClick={(e) => { e.stopPropagation(); finish(); }}
              className="shrink-0 text-[13px] font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              Skip intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
