#!/usr/bin/env node
// Generates client/src/styles/dark-theme.css.
//
// The app was designed light-first with Tailwind's slate/white classes used
// directly on hundreds of elements. Rather than add `dark:` to every one, this
// script scans the source for the light-surface and neutral-text classes in use
// and writes dark-mode equivalents scoped to `.dark`. Re-run it after adding new
// colour classes:  node script/gen-dark-theme.mjs
//
// Rules are emitted inside `@layer utilities` with a zero-specificity `.dark`
// prefix (:where), so they replace the light value but still lose to hover /
// focus / state variants exactly as the light theme does.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "client/src");
const OUT = path.join(SRC, "styles/dark-theme.css");

// ---- Palette (dark) --------------------------------------------------------
// Surfaces get darker as they go "down"; ink panels (slate-900) are lifted so
// hero cards and active pills still read as distinct objects.
const BG = {
  white: "var(--dk-surface)",
  "slate-50": "var(--dk-surface-2)",
  "slate-100": "var(--dk-surface-3)",
  "slate-200": "var(--dk-line)",
  "slate-300": "var(--dk-line-strong)",
  "slate-800": "#24324A",
  "slate-900": "var(--dk-ink)",
  "slate-950": "#05080F",
  "[#F4F7FA]": "var(--dk-canvas)",
  "[#f4f7fa]": "var(--dk-canvas)",
};
const TEXT = {
  "slate-950": "#F3F6FA",
  "slate-900": "#EEF2F8",
  "slate-800": "#E2E8F0",
  "slate-700": "#CBD5E1",
  "slate-600": "#AEB9C8",
  "slate-500": "#8D9AAB",
  "slate-400": "#7A8799",
  "slate-300": "#8A96A8",
};
const LINE = {
  white: "var(--dk-line)",
  "slate-50": "var(--dk-surface-3)",
  "slate-100": "var(--dk-line-soft)",
  "slate-200": "var(--dk-line)",
  "slate-300": "var(--dk-line-strong)",
};
const HUES = ["amber", "rose", "red", "emerald", "green", "teal", "blue", "sky", "violet", "indigo", "orange", "yellow", "purple", "cyan", "pink", "lime", "fuchsia"];

function hueValue(prop, hue, shade) {
  const n = Number(shade);
  if (prop === "bg") {
    if (n <= 50) return `color-mix(in oklab, var(--color-${hue}-500) 12%, transparent)`;
    if (n <= 100) return `color-mix(in oklab, var(--color-${hue}-500) 18%, transparent)`;
    if (n <= 200) return `color-mix(in oklab, var(--color-${hue}-500) 26%, transparent)`;
    return null;
  }
  if (prop === "border" || prop === "ring" || prop === "divide") {
    if (n <= 300) return `color-mix(in oklab, var(--color-${hue}-400) ${n <= 100 ? 22 : 32}%, transparent)`;
    return null;
  }
  if (prop === "text") {
    if (n >= 700) return `var(--color-${hue}-300)`;
    if (n === 600) return `var(--color-${hue}-400)`;
    return null;
  }
  return null;
}

// ---- Scan -----------------------------------------------------------------
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f !== "styles") walk(p); }
    else if (/\.(tsx?|css)$/.test(f)) files.push(p);
  }
})(SRC);

const TOKEN = /(?<![\w-])((?:(?:sm|md|lg|xl|2xl|hover|focus|focus-visible|active|group-hover|placeholder|disabled|data-\[state=(?:active|open|checked|on)\]):)*)(bg|text|border(?:-[trblxy])?|divide|ring|from|via|to|outline|placeholder|fill|stroke)-((?:white|slate-\d{2,3}|\[#[Ff]4[Ff]7[Ff][Aa]\]|(?:amber|rose|red|emerald|green|teal|blue|sky|violet|indigo|orange|yellow|purple|cyan|pink|lime|fuchsia)-\d{2,3}))(?:\/(\d{1,3}))?(?![\w-])/g;
const found = new Set();
for (const f of files) for (const m of fs.readFileSync(f, "utf8").matchAll(TOKEN)) found.add(m[0]);

// ---- Emit -----------------------------------------------------------------
const BP = { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" };
const esc = (s) => s.replace(/([:/\[\]#=.%])/g, "\\$1");

function valueFor(prop, color, alpha) {
  const base = prop.startsWith("border") ? "border" : prop;
  let v = null;
  const hue = HUES.find((h) => color.startsWith(h + "-"));
  if (hue) v = hueValue(base === "from" || base === "via" || base === "to" ? "bg" : base, hue, color.split("-")[1]);
  else if (base === "text" || base === "placeholder") v = TEXT[color] ?? null;
  else if (base === "bg" || base === "from" || base === "via" || base === "to") v = BG[color] ?? null;
  else if (base === "border" || base === "divide" || base === "ring" || base === "outline") v = LINE[color] ?? null;
  if (!v) return null;
  if (alpha) {
    const a = Number(alpha);
    // Low-opacity white is "glass" on dark panels — already correct in dark mode.
    if (color === "white" && a <= 30) return null;
    v = `color-mix(in oklab, ${v} ${a}%, transparent)`;
  }
  return v;
}

const rules = [];
for (const tok of [...found].sort()) {
  const m = new RegExp(TOKEN.source).exec(tok);
  if (!m) continue;
  const [, variantStr, prop, color, alpha] = m;
  if (prop === "fill" || prop === "stroke") continue;
  const value = valueFor(prop, color, alpha);
  if (!value) continue;
  const variants = variantStr ? variantStr.split(":").filter(Boolean) : [];
  let sel = `.${esc(tok)}`;
  const media = [];
  let groupHover = false;
  for (const v of variants) {
    if (BP[v]) media.push(`(width >= ${BP[v]})`);
    else if (v === "hover") sel += ":hover";
    else if (v === "focus") sel += ":focus";
    else if (v === "focus-visible") sel += ":focus-visible";
    else if (v === "active") sel += ":active";
    else if (v === "disabled") sel += ":disabled";
    else if (v === "placeholder") sel += "::placeholder";
    else if (v === "group-hover") groupHover = true;
    else if (v.startsWith("data-")) sel += `[${v.slice(6, -1).replace("=", '="')}"]`;
  }
  if (groupHover) sel = `:where(.group):hover ${sel}`;
  let decl;
  switch (prop) {
    case "bg": decl = `background-color: ${value};`; break;
    case "text": decl = `color: ${value};`; break;
    case "placeholder": sel += "::placeholder"; decl = `color: ${value};`; break;
    case "border": decl = `border-color: ${value};`; break;
    case "border-t": decl = `border-top-color: ${value};`; break;
    case "border-b": decl = `border-bottom-color: ${value};`; break;
    case "border-l": decl = `border-left-color: ${value};`; break;
    case "border-r": decl = `border-right-color: ${value};`; break;
    case "border-x": decl = `border-left-color: ${value}; border-right-color: ${value};`; break;
    case "border-y": decl = `border-top-color: ${value}; border-bottom-color: ${value};`; break;
    case "divide": sel = `${sel} > :not(:last-child)`; decl = `border-color: ${value};`; break;
    case "ring": decl = `--tw-ring-color: ${value};`; break;
    case "outline": decl = `outline-color: ${value};`; break;
    case "from": decl = `--tw-gradient-from: ${value};`; break;
    case "via": decl = `--tw-gradient-via: ${value}; --tw-gradient-via-stops: var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-via) var(--tw-gradient-via-position), var(--tw-gradient-to) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-via-stops);`; break;
    case "to": decl = `--tw-gradient-to: ${value};`; break;
    default: continue;
  }
  const rule = `:where(.dark) ${sel} { ${decl} }`;
  rules.push(media.length ? `@media ${media.join(" and ")} { ${rule} }` : rule);
}

const header = `/* GENERATED by script/gen-dark-theme.mjs — do not edit by hand.\n   ${rules.length} dark-mode mappings for the light-first utility classes in use. */\n`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${header}@layer utilities {\n${rules.map((r) => "  " + r).join("\n")}\n}\n`);
console.log(`dark-theme.css: ${rules.length} rules from ${found.size} classes`);
