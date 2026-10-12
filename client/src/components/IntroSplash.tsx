// First-visit homepage intro (about 2.3s, skippable, shown once).
// It picks up exactly where the loading screen leaves off: index.html paints the
// same ink background and dot grid before the app loads, so loading → intro →
// site reads as one continuous move.
//   1. A chain of five partners draws across the dot grid.
//   2. One link flickers red (the bottleneck); a teal pulse runs through and fixes it.
//   3. The chain folds into the logo.
//   4. The logo flies to its place in the header while the dark layer opens from
//      the centre and the hero plays its entrance underneath.
// Any click, tap, Esc, Enter or Space skips straight to step 4. Reduced-motion
// users never see it. See docs/BRAND.md → "The intro".
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { Logo } from "@/components/Logo";
import { INTRO_KEY, introWillShow, setIntroReady } from "@/lib/intro-gate";

const NODES = ["Supplier", "Maker", "Warehouse", "Carrier", "Customer"];
const BOTTLENECK = 2; // the link between Warehouse and Carrier
const TEAL = "#2DD4BF";
const RED = "#F43F5E";
const INK = "#070C16";
const DOTS = "radial-gradient(circle, rgba(148,163,184,0.16) 1.2px, transparent 1.5px)";
const FLY_EASE = [0.7, 0, 0.2, 1] as const;

// Stage start times (ms): chain draws (0), jam, fix, fold into logo, open.
const AT = { jam: 600, fix: 820, fold: 1180, open: 1560 };
const OPEN_MS = 760;
type Stage = 0 | 1 | 2 | 3 | 4;

function markSeen() {
  try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* private mode */ }
}

const headerLogo = () => document.querySelector<HTMLElement>("[data-intro-logo] > span");

export function IntroSplash() {
  const [show, setShow] = useState(() => introWillShow());
  const [stage, setStage] = useState<Stage>(0);
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  const timers = useRef<number[]>([]);
  const flyRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  // The hole in the dark layer (in vmax) and the flying logo's position.
  const hole = useMotionValue(-24);
  const mask = useMotionTemplate`radial-gradient(circle at 50% 46%, transparent ${hole}vmax, #000 calc(${hole}vmax + 22vmax))`;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const logoOpacity = useMotionValue(0);
  // 0 = white wordmark (on the dark layer), 1 = the header's own colours (on the page).
  const toneMix = useMotionValue(0);
  const lightOpacity = useTransform(toneMix, (v) => 1 - v);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const finish = useCallback(() => {
    clearTimers();
    markSeen();
    setIntroReady();
    const t = headerLogo();
    if (t) { t.style.transition = ""; t.style.opacity = ""; }
    setShow(false);
  }, []);

  // Step 4: open the dark layer and fly the logo home (`fast` when skipped).
  const open = useCallback((fast = false) => {
    if (opened.current) return;
    opened.current = true;
    clearTimers();
    setStage(4);
    setIntroReady();
    const s = (fast ? 420 : OPEN_MS) / 1000;
    animate(hole, 140, { duration: s, ease: [0.65, 0, 0.35, 1] });
    const t = headerLogo();
    if (t && flyRef.current) {
      const r = t.getBoundingClientRect();
      animate(logoOpacity, 1, { duration: 0.15 });
      animate(x, r.left, { duration: s, ease: FLY_EASE });
      animate(y, r.top, { duration: s, ease: FLY_EASE });
      animate(scale, 1, { duration: s, ease: FLY_EASE });
      // The page shows behind the logo for the last part of the flight; switch to its colours.
      animate(toneMix, 1, { duration: s * 0.5, delay: s * 0.35, ease: "easeInOut" });
      // Hand over to the real header logo as the flying one lands.
      timers.current.push(window.setTimeout(() => {
        t.style.transition = "opacity 220ms ease-out";
        t.style.opacity = "1";
        animate(logoOpacity, 0, { duration: 0.22 });
      }, s * 1000 - 120));
    }
    timers.current.push(window.setTimeout(finish, s * 1000 + 140));
  }, [finish, hole, logoOpacity, scale, toneMix, x, y]);

  // Put the logo in the middle of the screen, large, ready to form.
  useLayoutEffect(() => {
    if (!show) return;
    const el = flyRef.current;
    if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    const S = Math.min(2.4, (window.innerWidth * 0.72) / w);
    scale.set(S);
    x.set((window.innerWidth - w * S) / 2);
    y.set(window.innerHeight * 0.46 - (h * S) / 2);
    const t = headerLogo();
    if (t) t.style.opacity = "0";
  }, [show, scale, x, y]);

  useEffect(() => {
    if (!show) return;
    timers.current.push(
      window.setTimeout(() => setStage(1), AT.jam),
      window.setTimeout(() => setStage(2), AT.fix),
      window.setTimeout(() => { setStage(3); animate(logoOpacity, 1, { duration: 0.3 }); }, AT.fold),
      window.setTimeout(() => open(false), AT.open),
    );
    const onKey = (e: KeyboardEvent) => { if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); open(true); } };
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
      const t = headerLogo();
      if (t) { t.style.transition = ""; t.style.opacity = ""; }
    };
  }, [show, open, logoOpacity]);

  if (!show || typeof document === "undefined") return null;

  // The chain, sized to the screen.
  const W = Math.min(640, vw - 40);
  const H = 120;
  const pad = 26;
  const xs = NODES.map((_, i) => pad + (i * (W - pad * 2)) / (NODES.length - 1));
  const cy = 46;
  const labels = W >= 300;
  const jammed = (i: number) => stage === 1 && (i === BOTTLENECK || i === BOTTLENECK + 1);

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="ChainInsideIQ intro"
      style={{ pointerEvents: stage === 4 ? "none" : "auto" }}
      onPointerDown={() => open(true)}
      data-testid="intro"
    >
      {/* The dark layer: the same ink and dots as the loading screen. It opens from the centre. */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor: INK, backgroundImage: DOTS, backgroundSize: "28px 28px", maskImage: mask, WebkitMaskImage: mask }}
      >
        {/* Soft teal light that gathers where the logo forms. */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[46%] w-[900px] max-w-[180vw] aspect-square rounded-full"
          style={{ x: "-50%", y: "-50%", background: "radial-gradient(closest-side, rgba(45,212,191,0.22), rgba(14,165,233,0.06) 55%, transparent)" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: stage >= 3 ? 0.95 : 0.45, scale: stage >= 3 ? 1 : 0.8 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* The chain */}
        <motion.svg
          aria-hidden
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute left-1/2 top-[46%] overflow-visible"
          style={{ x: "-50%", y: "-38%" }}
          animate={stage >= 3 ? { scaleX: 0.08, scaleY: 0.5, opacity: 0 } : { scaleX: 1, scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.34, ease: [0.55, 0, 0.75, 0] }}
        >
          <motion.line x1={xs[0]} y1={cy} x2={xs[4]} y2={cy} stroke="rgba(148,163,184,0.35)" strokeWidth={2} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} />
          {/* The bottleneck link */}
          <motion.line x1={xs[BOTTLENECK]} y1={cy} x2={xs[BOTTLENECK + 1]} y2={cy} strokeWidth={3} strokeLinecap="round"
            initial={{ opacity: 0, stroke: RED }}
            animate={stage === 1 ? { opacity: [0, 1, 0.45, 1], stroke: RED } : stage >= 2 ? { opacity: 1, stroke: TEAL } : { opacity: 0, stroke: RED }}
            transition={{ duration: stage === 1 ? 0.22 : 0.3 }} />
          {/* The fix: a teal pulse runs the whole chain */}
          <motion.line x1={xs[0]} y1={cy} x2={xs[4]} y2={cy} stroke={TEAL} strokeWidth={2.5} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={stage >= 2 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.65, 0, 0.35, 1] }} />
          {stage >= 2 && (
            <motion.circle cy={cy} r={5} fill={TEAL} style={{ filter: "drop-shadow(0 0 6px rgba(45,212,191,0.9))" }}
              initial={{ cx: xs[0], opacity: 1 }} animate={{ cx: xs[4], opacity: [1, 1, 0] }}
              transition={{ duration: 0.34, ease: [0.65, 0, 0.35, 1] }} />
          )}
          {xs.map((nx, i) => (
            <g key={NODES[i]}>
              <motion.circle cx={nx} cy={cy} r={7} strokeWidth={2}
                initial={{ scale: 0, fill: "#0B1322", stroke: "#475569" }}
                animate={{
                  scale: 1,
                  fill: stage >= 2 ? "#0F2A2A" : jammed(i) ? "#2A0F17" : "#0B1322",
                  stroke: stage >= 2 ? TEAL : jammed(i) ? RED : "#64748B",
                }}
                transition={{
                  scale: { delay: 0.12 + i * 0.07, type: "spring", stiffness: 520, damping: 26 },
                  default: { duration: 0.2, delay: stage >= 2 ? i * 0.07 : 0 },
                }}
                style={{ transformOrigin: `${nx}px ${cy}px` }} />
              {labels && (
                <motion.text x={nx} y={cy + 30} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight={600} fontFamily="Inter, system-ui, sans-serif"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}>
                  {NODES[i]}
                </motion.text>
              )}
            </g>
          ))}
        </motion.svg>

        {/* One soft ring as the chain becomes the logo */}
        {stage >= 3 && (
          <motion.div aria-hidden className="absolute left-1/2 top-[46%] w-40 h-40 -ml-20 -mt-20 rounded-full border border-teal-300/50"
            initial={{ scale: 0.5, opacity: 0.7 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
        )}
      </motion.div>

      {/* The logo forms in the middle, then flies to the header. It sits outside the mask so it is never cut. */}
      <motion.div
        ref={flyRef}
        className="fixed left-0 top-0 origin-top-left will-change-transform"
        style={{ x, y, scale, opacity: logoOpacity }}
        aria-hidden
        data-testid="intro-logo"
      >
        <motion.div
          initial={{ filter: "blur(8px)", scale: 0.9 }}
          animate={stage >= 3 ? { filter: "blur(0px)", scale: 1 } : { filter: "blur(8px)", scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div style={{ opacity: lightOpacity }}>
            <Logo key={stage >= 3 ? "draw" : "wait"} size={34} tone="light" animated={stage >= 3} />
          </motion.div>
          <motion.div className="absolute inset-0" style={{ opacity: toneMix }}>
            <Logo size={34} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        onClick={(e) => { e.stopPropagation(); open(true); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] min-h-10 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-teal-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 4 ? 0 : 1 }}
        transition={{ delay: stage === 4 ? 0 : 0.4, duration: 0.2 }}
        autoFocus
      >
        Skip intro
      </motion.button>
    </div>,
    document.body,
  );
}
