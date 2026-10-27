// Drag-and-drop motion for the Builder canvas.
//
// While a card is dragged it swings with your hand: a spring follows the
// pointer's horizontal speed and tilts the card (a few degrees at most), then
// settles back when you slow down. Picking up and dropping also give a short
// haptic tick on phones that support it. The rest of the motion (lift, drop
// squash, ripple, pop-in) lives in CSS in pages/builder.tsx.
//
// Everything switches off with "reduce motion".
import { useCallback, useEffect, useRef } from "react";

const MAX_TILT = 7;       // degrees
const TILT_PER_PX = 0.035; // degrees per px/frame of pointer speed
const STIFFNESS = 0.16;
const DAMPING = 0.72;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function buzz(pattern: number | number[]) {
  try { if (!reducedMotion()) navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

// One-shot animations use the Web Animations API rather than CSS classes, so a
// React re-render (which rewrites className) can't cut them short.
const SPRING_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const TEAL = (a: number) => `rgba(20, 184, 166, ${a})`;

function play(el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions) {
  if (!el || reducedMotion() || typeof (el as HTMLElement).animate !== "function") return;
  try { (el as HTMLElement).animate(frames, opts); } catch { /* older browsers: skip */ }
}

function ripple(card: Element | null | undefined) {
  play(card, [{ boxShadow: `0 0 0 0 ${TEAL(0.55)}` }, { boxShadow: `0 0 0 18px ${TEAL(0)}` }], { duration: 640, easing: SPRING_OUT });
}

/** Drop: squash, bounce, settle, with a teal ripple. */
export function animateDrop(card: Element | null | undefined) {
  play(card, [
    { scale: "1.045", translate: "0 -6px" },
    { scale: "0.965 1.02", translate: "0 2px", offset: 0.35 },
    { scale: "1.015 0.99", translate: "0 -1px", offset: 0.6 },
    { scale: "1", translate: "0 0" },
  ], { duration: 560, easing: SPRING_OUT });
  ripple(card);
}

/** New or duplicated card: pops in. */
export function animatePop(card: Element | null | undefined) {
  play(card, [
    { opacity: 0, scale: "0.6", translate: "0 18px" },
    { opacity: 1, scale: "1.04", translate: "0 -2px", offset: 0.7 },
    { opacity: 1, scale: "1", translate: "0 0" },
  ], { duration: 560, easing: OVERSHOOT });
  ripple(card);
}

/** After a resize: a quick elastic nudge. */
export function animateNudge(card: Element | null | undefined) {
  play(card, [{ scale: "0.985" }, { scale: "1.01", offset: 0.6 }, { scale: "1" }], { duration: 400, easing: OVERSHOOT });
}

const cardOf = (item: Element | null | undefined) => item?.querySelector(":scope > .ciq-card-inset") ?? null;

/**
 * Returns handlers for the grid's onDragStart / onDragStop / onResizeStop.
 * `rootRef` is any element that contains the grid.
 */
export function useDragMotion(rootRef: React.RefObject<HTMLElement | null>) {
  const raf = useRef(0);
  const state = useRef({ angle: 0, vel: 0, speed: 0, lastX: 0, hasLast: false, card: null as HTMLElement | null, item: null as HTMLElement | null });

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  const onMove = useCallback((e: PointerEvent | MouseEvent | TouchEvent) => {
    const s = state.current;
    const x = "touches" in e ? e.touches[0]?.clientX ?? s.lastX : (e as MouseEvent).clientX;
    if (s.hasLast) {
      const dx = x - s.lastX;
      // Smooth the speed so one jumpy event doesn't jerk the card.
      s.speed = s.speed * 0.6 + dx * 0.4;
    }
    s.lastX = x;
    s.hasLast = true;
  }, []);

  const tick = useCallback(() => {
    const s = state.current;
    s.speed *= 0.86; // speed fades when the pointer stops
    const target = Math.max(-MAX_TILT, Math.min(MAX_TILT, s.speed * TILT_PER_PX * 10));
    s.vel = (s.vel + (target - s.angle) * STIFFNESS) * DAMPING;
    s.angle += s.vel;
    if (s.card) s.card.style.rotate = `${s.angle.toFixed(2)}deg`;
    raf.current = requestAnimationFrame(tick);
  }, []);

  const onDragStart = useCallback(() => {
    const root = rootRef.current;
    root?.classList.add("ciq-dragging");
    buzz(8);
    if (reducedMotion()) return;
    // The library marks the dragged item on its next render.
    requestAnimationFrame(() => {
      const item = root?.querySelector<HTMLElement>(".react-draggable-dragging") ?? null;
      const s = state.current;
      s.item = item;
      s.card = item?.querySelector<HTMLElement>(":scope > .ciq-card-inset") ?? null;
      s.angle = 0; s.vel = 0; s.speed = 0; s.hasLast = false;
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("touchmove", onMove, { passive: true });
      stopLoop();
      raf.current = requestAnimationFrame(tick);
    });
  }, [rootRef, onMove, tick, stopLoop]);

  const onDragStop = useCallback(() => {
    const s = state.current;
    rootRef.current?.classList.remove("ciq-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("touchmove", onMove);
    stopLoop();
    if (s.card) s.card.style.rotate = "";
    buzz([6, 40, 6]);
    animateDrop(s.card ?? cardOf(s.item));
    s.card = null; s.item = null;
  }, [rootRef, onMove, stopLoop]);

  // Remember which card the pointer went down on, so a resize can be answered on that card.
  const lastPressed = useRef<Element | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const down = (e: PointerEvent) => { lastPressed.current = (e.target as Element | null)?.closest?.(".react-grid-item") ?? null; };
    root.addEventListener("pointerdown", down, { capture: true });
    return () => root.removeEventListener("pointerdown", down, { capture: true });
  }, [rootRef]);

  const onResizeStop = useCallback(() => {
    buzz(6);
    animateNudge(cardOf(lastPressed.current));
  }, []);

  useEffect(() => () => {
    stopLoop();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("touchmove", onMove);
  }, [onMove, stopLoop]);

  return { onDragStart, onDragStop, onResizeStop };
}
