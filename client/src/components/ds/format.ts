// Number formatting shared by the design-system pieces. Big numbers are compact
// (1,284 / 12.9K / 4.2M); small ones keep one decimal only when they need it.
export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (a >= 10_000) return `${trim(n / 1_000)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: a < 100 && !Number.isInteger(n) ? 1 : 0 });
}
const trim = (n: number) => String(Math.round(n * 10) / 10);

/** "+12%" / "-0.4" / "0": always signed, so direction never depends on colour. */
export function signed(n: number, suffix = ""): string {
  const v = Math.abs(n) < 1 ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10;
  if (v === 0) return `0${suffix}`;
  return `${v > 0 ? "+" : "-"}${Math.abs(v)}${suffix}`;
}
