// Light / dark theme. The choice is saved per browser; with no saved choice we
// follow the device setting. index.html applies the class before first paint
// so there is never a flash of the wrong theme.
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "ciq_theme";

const listeners = new Set<() => void>();

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch { return null; }
}

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "dark" ? "#070B13" : "#F4F7FA");
  listeners.forEach((l) => l());
}

/**
 * Switch theme. When the browser supports View Transitions (and motion is
 * allowed) the new theme spreads out in a circle from the point clicked.
 */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce || !origin) { apply(theme); return; }

  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  document.documentElement.dataset.themeSwitching = "";
  const t = doc.startViewTransition(() => apply(theme));
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
    ).finished.finally(() => { delete document.documentElement.dataset.themeSwitching; });
  }).catch(() => { delete document.documentElement.dataset.themeSwitching; });
}

export function toggleTheme(origin?: { x: number; y: number }) {
  setTheme(getTheme() === "dark" ? "light" : "dark", origin);
}

/** Follow the device setting live until the person picks a theme themselves. */
export function initTheme() {
  if (typeof window === "undefined") return;
  apply(savedTheme() ?? systemTheme());
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => { if (!savedTheme()) apply(systemTheme()); });
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    getTheme,
    () => "light",
  );
}
