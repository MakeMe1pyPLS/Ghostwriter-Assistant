// Small, honest details for a KPI card, worked out only from the numbers the
// card already has (its value and its change vs the last period). Nothing here
// invents data: if a value can't be read, the detail is left out.

export interface KpiInput {
  label: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  helpText?: string;
}

export interface KpiDetail {
  /** Last period's value, formatted like the current value ("97.2%", "$110,667"). */
  previous: string | null;
  /** Numeric current and previous values (for the comparison bars). */
  now: number | null;
  prev: number | null;
  /** "up" | "down" | "flat", from the sign of the change. */
  direction: 'up' | 'down' | 'flat';
  /** The change in plain words: "1.2 pts", "12.5%", "2 Days". */
  changeText: string | null;
  /** Good news or needs attention (from isPositive). */
  status: 'good' | 'watch';
  /** One short plain-language sentence for the card. */
  summary: string;
}

interface Parsed { num: number; prefix: string; suffix: string; decimals: number }

/** Reads "$1,240.50", "98.4%", "14 Days", "1,750/day", "4.5x", "-$0.80". */
export function parseKpiNumber(raw: string | undefined | null): Parsed | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^([^0-9+\-.]*?)([+\-−]?)([^0-9.]*?)([0-9][0-9,]*(?:\.[0-9]+)?|\.[0-9]+)(.*)$/);
  if (!m) return null;
  const [, pre1, sign, pre2, digits, rest] = m;
  const num = Number(digits.replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  return { num: sign === '-' || sign === '−' ? -num : num, prefix: (pre1 + pre2).trim(), suffix: rest, decimals };
}

function format(n: number, like: Parsed): string {
  const abs = Math.abs(n);
  const body = abs.toLocaleString('en-US', { minimumFractionDigits: like.decimals, maximumFractionDigits: like.decimals });
  return `${n < 0 ? '-' : ''}${like.prefix}${body}${like.suffix}`;
}

export function kpiDetail(m: KpiInput): KpiDetail {
  const value = parseKpiNumber(m.value);
  const change = parseKpiNumber(m.trend);
  const status: KpiDetail['status'] = m.isPositive === false ? 'watch' : 'good';
  const direction: KpiDetail['direction'] = !change || change.num === 0 ? 'flat' : change.num > 0 ? 'up' : 'down';

  let prev: number | null = null;
  let changeText: string | null = null;
  if (value && change) {
    const valueIsPct = value.suffix.trim().startsWith('%');
    const changeIsPct = change.suffix.trim().startsWith('%');
    if (changeIsPct && valueIsPct) {
      // A rate that moved by percentage points (94.2% vs 92.4%).
      prev = value.num - change.num;
      changeText = `${Math.abs(change.num).toFixed(change.decimals)} pts`;
    } else if (changeIsPct) {
      // A relative change (+12.5% revenue).
      const r = 1 + change.num / 100;
      prev = r > 0 ? value.num / r : null;
      changeText = `${Math.abs(change.num).toFixed(change.decimals)}%`;
    } else {
      // The same unit as the value (-2 Days, -$0.80, +45/day).
      prev = value.num - change.num;
      changeText = format(Math.abs(change.num), { ...change, prefix: change.prefix, suffix: change.suffix, decimals: change.decimals });
    }
    if (prev !== null && !Number.isFinite(prev)) prev = null;
  }

  const previous = value && prev !== null ? format(prev, value) : null;
  const verb = direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change';
  const verdict = status === 'good' ? 'on track' : 'needs attention';
  const summary = changeText && previous
    ? `${verb} ${changeText} from ${previous} last period, ${verdict}.`
    : direction === 'flat' && value
      ? `Holding steady, ${verdict}.`
      : `${m.label} is ${verdict}.`;

  return { previous, now: value?.num ?? null, prev, direction, changeText, status, summary };
}
