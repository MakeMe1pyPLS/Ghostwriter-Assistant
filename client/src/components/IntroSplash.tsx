// First-visit intro for the homepage (≤ 4s, skippable, shown once).
// Story: scattered businesses link into a chain → one link glows red (the
// bottleneck) → it snaps teal (fixed together) → logo lockup → homepage.
// Interactive: nodes lean toward the pointer; any click, tap or key ends it.
// Reduced-motion users never see it. See docs/BRAND.md → "The intro".
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion";

const STORAGE_KEY = "ciq_intro_seen_v1";
const NODES = ["Supplier", "Maker", "Warehouse", "Carrier", "Customer"];
const BOTTLENECK = 2; // link between Warehouse (2) and Carrier (3)

// Stage timeline in ms. Total ≤ 4000.
const TIMELINE = [0, 650, 1450, 2150, 2750, 3550];
type Stage = 0 | 1 | 2 | 3 | 4 | 5; // scatter, chain, bottleneck, fixed, logo, exit

function seen(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return true; }
}
function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
}

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
    timers.current.push(window.setTimeout(finish, 4000));
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

  // Layout: a horizontal chain on wide screens, vertical on phones.
  const vertical = size.w < 640;
  const chain = useMemo(() => NODES.map((_, i) => {
    const t = i / (NODES.length - 1);
    return vertical
      ? { x: size.w / 2, y: size.h * (0.2 + t * 0.55) }
      : { x: size.w * (0.14 + t * 0.72), y: size.h * 0.46 };
  }), [size, vertical]);
  // Deterministic scattered start positions.
  const scatter = useMemo(() => NODES.map((_, i) => {
    const a = (i * 137.5 * Math.PI) / 180;
    const r = Math.min(size.w, size.h) * (0.22 + (i % 3) * 0.07);
    return { x: size.w / 2 + Math.cos(a) * r, y: size.h * 0.46 + Math.sin(a) * r * 0.8 };
  }), [size]);

  const lean = (i: number) => {
    // Nodes drift slightly toward the pointer (max ~14px), alternating depth.
    const depth = 0.5 + (i % 3) * 0.25;
    return { dx: pointer.x * 14 * depth, dy: pointer.y * 14 * depth };
  };

  const pos = (i: number) => {
    const base = stage === 0 ? scatter[i] : chain[i];
    const { dx, dy } = lean(i);
    return { x: base.x + dx, y: base.y + dy };
  };

  const linkColor = (i: number) => {
    if (i === BOTTLENECK && stage === 2) return "#F43F5E";
    if (i === BOTTLENECK && stage >= 3) return "#5EEAD4";
    return "rgba(148, 163, 184, 0.55)";
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
          className="fixed inset-0 z-[300] bg-slate-950 text-white overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
          onClick={finish}
          onPointerMove={(e) => setPointer({ x: (e.clientX / size.w) * 2 - 1, y: (e.clientY / size.h) * 2 - 1 })}
        >
          {/* Soft brand glow */}
          <motion.div
            aria-hidden
            className="absolute rounded-full bg-teal-500/20 blur-3xl pointer-events-none"
            style={{ width: size.w * 0.6, height: size.w * 0.6, left: size.w * 0.2, top: size.h * 0.46 - size.w * 0.3 }}
            animate={{ opacity: stage >= 3 ? 0.9 : 0.35, scale: stage >= 4 ? 1.2 : 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />

          {/* Chain */}
          <motion.svg
            width={size.w}
            height={size.h}
            className="absolute inset-0"
            aria-hidden
            animate={{ opacity: stage >= 4 ? 0 : 1, scale: stage >= 4 ? 0.92 : 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            style={{ transformOrigin: "50% 46%" }}
          >
            {NODES.slice(0, -1).map((_, i) => {
              const a = pos(i), b = pos(i + 1);
              return (
                <motion.line
                  key={`l${i}`}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={linkColor(i)}
                  strokeWidth={i === BOTTLENECK && stage >= 2 ? 5 : 3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.45, delay: stage === 1 ? i * 0.08 : 0, ease: EASE_OUT }}
                />
              );
            })}
            {NODES.map((label, i) => {
              const p = pos(i);
              const hot = stage === 2 && (i === BOTTLENECK || i === BOTTLENECK + 1);
              const fixed = stage >= 3 && (i === BOTTLENECK || i === BOTTLENECK + 1);
              return (
                <motion.g
                  key={label}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: hot ? 1.12 : 1, x: p.x, y: p.y }}
                  transition={{
                    opacity: { duration: 0.3, delay: i * 0.06 },
                    scale: { type: "spring", stiffness: 400, damping: 18 },
                    x: { type: "spring", stiffness: 120, damping: 18 },
                    y: { type: "spring", stiffness: 120, damping: 18 },
                  }}
                >
                  <circle r={vertical ? 13 : 16} fill={hot ? "#F43F5E" : fixed ? "#14B8A6" : "#0F172A"} stroke={hot ? "#FDA4AF" : fixed ? "#99F6E4" : "#334155"} strokeWidth={3} />
                  <text
                    y={vertical ? 4 : 40}
                    x={vertical ? 26 : 0}
                    textAnchor={vertical ? "start" : "middle"}
                    className="fill-slate-300"
                    style={{ fontSize: vertical ? 13 : 14, fontWeight: 700, letterSpacing: "0.04em" }}
                  >
                    {label}
                  </text>
                </motion.g>
              );
            })}
          </motion.svg>

          {/* Captions */}
          <div className="absolute inset-x-0 px-6 text-center pointer-events-none" style={{ top: vertical ? size.h * 0.82 : size.h * 0.62 }}>
            <AnimatePresence mode="wait">
              {stage >= 1 && stage <= 3 && (
                <motion.p
                  key={stage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className={`text-lg sm:text-2xl font-black tracking-tight ${stage === 2 ? "text-rose-300" : stage === 3 ? "text-teal-200" : "text-slate-200"}`}
                >
                  {stage === 1 ? "Every business is a chain." : stage === 2 ? "One weak link slows everyone." : "Find it. Fix it together."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Logo lockup */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.div
                key="logo"
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 text-teal-300 flex items-center justify-center shadow-2xl">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">ChainInside</p>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-300 mt-1.5">Intelligence IQ</p>
                  </div>
                </div>
                <p className="text-slate-300 text-base sm:text-lg font-medium">Find the bottleneck. Fix it together.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress + skip */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-center gap-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden" aria-hidden>
              <motion.div className="h-full bg-teal-400 origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4, ease: "linear" }} />
            </div>
            <button
              ref={skipRef}
              onClick={(e) => { e.stopPropagation(); finish(); }}
              className="shrink-0 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
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
