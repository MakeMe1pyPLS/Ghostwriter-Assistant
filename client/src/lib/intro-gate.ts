// Tells the homepage hero when to play its entrance, so it animates in as the
// intro opens instead of finishing unseen underneath it.
import { useSyncExternalStore } from "react";

export const INTRO_KEY = "ciq_intro_seen_v3";

let willShow: boolean | null = null;
let ready: boolean | null = null;
const subs = new Set<() => void>();

/** Decided once per page load: first homepage visit, motion allowed, no ?nointro. */
export function introWillShow(): boolean {
  if (willShow !== null) return willShow;
  try {
    willShow =
      typeof window !== "undefined" &&
      window.location.pathname === "/" &&
      !new URLSearchParams(window.location.search).has("nointro") &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      // Don't make people on slow connections or data saver wait for it.
      !((navigator as any).connection?.saveData || /2g|3g/.test((navigator as any).connection?.effectiveType ?? "")) &&
      localStorage.getItem(INTRO_KEY) !== "1";
  } catch {
    willShow = false;
  }
  // The loading screen in index.html set this; clear it if there's no intro.
  if (!willShow && typeof document !== "undefined") delete document.documentElement.dataset.intro;
  return willShow;
}

export function setIntroReady() {
  if (ready) return;
  ready = true;
  if (typeof document !== "undefined") delete document.documentElement.dataset.intro;
  subs.forEach((f) => f());
}

const snapshot = () => ready ?? !introWillShow();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** true once the hero may play its entrance (immediately when there's no intro). */
export function useIntroReady(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}

/**
 * index.html paints a static copy of the homepage hero before the app loads
 * (fast first paint on phones). Returns true once if it did, so the hero can
 * appear as it already is instead of animating in again.
 */
let shellRead = false;
export function consumeShell(): boolean {
  if (shellRead || typeof window === "undefined") return false;
  shellRead = true;
  return (window as any).__ciqShell === true;
}
