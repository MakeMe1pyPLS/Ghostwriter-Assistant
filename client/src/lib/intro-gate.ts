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
