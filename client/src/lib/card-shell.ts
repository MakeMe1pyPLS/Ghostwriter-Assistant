// One source of truth for the outer card ("shell") around each widget, used by
// both the Builder and the Dashboard so a preset looks the same in both.
// The inner KPI styling is handled by WidgetRenderer via `cardPreset`.
// Accepts current preset IDs and the legacy ones saved by older versions.

export type ShellContext = 'builder' | 'dashboard';

const SHELLS: Record<string, string> = {
  'clean-corporate': 'bg-white rounded-lg border border-slate-300 shadow-sm',
  'executive-tile': 'bg-white rounded-2xl border border-slate-200 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)]',
  'modern-analytics': 'bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
  'compact-grid': 'bg-white rounded-md border border-slate-200 shadow-sm',
  'ops-scorecard': 'bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-600 shadow-sm',
  'minimal-readout': 'bg-white rounded-xl border border-transparent',
  'insight-kpi': 'bg-gradient-to-b from-white to-teal-50/40 rounded-2xl border border-teal-100 shadow-sm',
  'comparative-kpi': 'bg-white rounded-2xl border border-slate-200 shadow-sm',
  soft: 'bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)]',
  elevated: 'bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
};

const LEGACY: Record<string, string> = {
  corporate: 'clean-corporate',
  executive: 'executive-tile',
  compact: 'compact-grid',
};

const DENSE = new Set(['compact-grid']);

export function getCardShellClasses(preset: string | undefined, context: ShellContext): string {
  const id = LEGACY[preset ?? ''] ?? preset ?? 'soft';
  const shell = SHELLS[id] ?? SHELLS.soft;
  // The Builder adds its own inner padding (below the drag handle), so its shell has none.
  const pad = context === 'builder' ? '' : DENSE.has(id) ? 'p-3 sm:p-4' : 'p-4 sm:p-6';
  return `${shell} ${pad}`;
}
