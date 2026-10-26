// One illustration style: 160x110, 2.5px round strokes, flat teal fills at low opacity,
// no gradients, no shadows. Teal = currentColor (set by the parent's text colour);
// ink = the INK constant. Decorative only: always aria-hidden.
const INK = "var(--chart-label)";
const base = { viewBox: "0 0 160 110", fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className: "w-full h-auto" } as const;
const wash = { fill: "currentColor", fillOpacity: 0.12, stroke: "currentColor" } as const;
const ink = { stroke: INK } as const;

export const Illo = {
  logistics: () => (
    <svg {...base}>
      <path d="M10 92h140" {...ink} />
      <rect x="18" y="38" width="64" height="40" rx="5" {...wash} />
      <path d="M82 50h26l14 14v14H82z" {...ink} />
      <circle cx="42" cy="82" r="8" fill="var(--chart-surface)" {...ink} />
      <circle cx="108" cy="82" r="8" fill="var(--chart-surface)" {...ink} />
      <path d="M30 52h30M30 62h18" stroke="currentColor" />
    </svg>
  ),
  warehouse: () => (
    <svg {...base}>
      <path d="M12 94h136M20 94V44l60-26 60 26v50" {...ink} />
      <rect x="34" y="58" width="22" height="20" rx="3" {...wash} />
      <rect x="62" y="58" width="22" height="20" rx="3" {...wash} />
      <rect x="48" y="38" width="22" height="20" rx="3" {...wash} />
      <path d="M100 94V64h26v30" {...ink} />
    </svg>
  ),
  ecommerce: () => (
    <svg {...base}>
      <path d="M24 28h14l10 40h56l10-30H42" {...ink} />
      <circle cx="56" cy="82" r="6" {...ink} fill="var(--chart-surface)" />
      <circle cx="98" cy="82" r="6" {...ink} fill="var(--chart-surface)" />
      <rect x="64" y="14" width="30" height="26" rx="4" {...wash} />
      <path d="M64 24h30M79 14v10" stroke="currentColor" />
    </svg>
  ),
  manufacturing: () => (
    <svg {...base}>
      <path d="M12 94h136M20 94V52l28 16V52l28 16V36h14v58" {...ink} />
      <circle cx="116" cy="62" r="14" {...wash} />
      <circle cx="116" cy="62" r="5" stroke="currentColor" />
      <path d="M116 42v6M116 76v6M96 62h6M130 62h6" stroke="currentColor" />
    </svg>
  ),
  retail: () => (
    <svg {...base}>
      <path d="M14 94h132M24 94V52M136 94V52" {...ink} />
      <path d="M18 30h124l-8 22H26z" {...wash} />
      <path d="M52 30l-4 22M80 30v22M108 30l4 22" stroke="currentColor" />
      <rect x="62" y="64" width="36" height="30" rx="3" {...ink} />
    </svg>
  ),
  generic: () => (
    <svg {...base}>
      <rect x="14" y="40" width="36" height="30" rx="5" {...wash} />
      <rect x="62" y="22" width="36" height="30" rx="5" {...ink} />
      <rect x="110" y="58" width="36" height="30" rx="5" {...wash} />
      <path d="M50 55h6l6-18M98 37h6l6 36" {...ink} />
    </svg>
  ),
};
export type IlloKey = keyof typeof Illo;
