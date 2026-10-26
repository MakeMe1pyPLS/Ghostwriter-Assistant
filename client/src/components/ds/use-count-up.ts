import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** Counts from 0 to `target` once, when the element scrolls into view.
 *  With reduced motion (or no animation wanted) it shows the final value at once. */
export function useCountUp(target: number, opts: { duration?: number; decimals?: number } = {}) {
  const { duration = 0.9, decimals = 0 } = opts;
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setV(target); return; }
    if (!inView) return;
    const c = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (x) => setV(decimals ? Math.round(x * 10 ** decimals) / 10 ** decimals : Math.round(x)),
      onComplete: () => setV(target),
    });
    return () => c.stop();
  }, [inView, reduce, target, duration, decimals]);
  return { ref, value: v };
}
