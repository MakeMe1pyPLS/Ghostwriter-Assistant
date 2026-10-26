// One series over time, drawn with Recharts. Line, area or bar; optional target line.
// Marks follow docs/BRAND.md: 2px line, area wash at 10%, bars at most 24px with a 4px
// rounded top, hairline gridlines, selective labels (the end value), tooltip on hover
// and keyboard focus, and the numbers always available in the Table view.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact } from "./format";

export type TrendPoint = { x: string; y: number };
export type TrendKind = "line" | "area" | "bar";

function TipBox({ active, payload, label, unit, name }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-pop text-[12px]">
      <p className="text-slate-600">{label}</p>
      <p className="mt-0.5 flex items-center gap-2">
        <span aria-hidden className="inline-block h-0.5 w-3 rounded-full" style={{ background: "var(--chart-1)" }} />
        <span className="text-base font-black text-slate-900">{compact(v)}{unit}</span>
        <span className="text-slate-600">{name}</span>
      </p>
    </div>
  );
}

export function TrendChart({ data, kind = "line", unit = "", name = "Value", target, targetLabel = "Target", height = 220, yMin, yMax }: {
  data: TrendPoint[]; kind?: TrendKind; unit?: string; name?: string; target?: number; targetLabel?: string; height?: number; yMin?: number; yMax?: number;
}) {
  const last = data[data.length - 1];
  const common = { data, margin: { top: 12, right: 12, bottom: 0, left: 0 } };
  const axes = [
      <CartesianGrid key="g" vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />,
      <XAxis key="x" dataKey="x" tickLine={false} axisLine={{ stroke: "var(--chart-axis)" }} tick={{ fontSize: 11, fill: "var(--chart-label)" }} interval="preserveStartEnd" minTickGap={24} />,
      <YAxis key="y" width={40} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--chart-label)" }} tickFormatter={(v: number) => compact(v)} domain={[yMin ?? (kind === "bar" ? 0 : (m: number) => (target !== undefined ? Math.min(m, target) : m)), yMax ?? "auto"]} />,
      <Tooltip key="t" content={<TipBox unit={unit} name={name} />} cursor={kind === "bar" ? { fill: "var(--chart-grid)", opacity: 0.5 } : { stroke: "var(--chart-axis)", strokeWidth: 1 }} />,
      target !== undefined ? (
        <ReferenceLine key="r" y={target} stroke="var(--chart-muted)" strokeWidth={1} label={{ value: `${targetLabel} ${compact(target)}${unit}`, position: "insideTopRight", fontSize: 11, fill: "var(--chart-label)" }} />
      ) : null,
  ];
  const endDot = (props: any) => props.index === data.length - 1
    ? <circle key="end" cx={props.cx} cy={props.cy} r={4} fill="var(--chart-1)" stroke="var(--chart-surface)" strokeWidth={2} />
    : <g key={props.index} />;

  return (
    <div style={{ height }} role="img" aria-label={`${name} over ${data.length} periods. Latest ${last ? compact(last.y) : ""}${unit}. A table view is available.`}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart {...common} barCategoryGap="30%">
            {axes}
            <Bar dataKey="y" fill="var(--chart-1)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
          </BarChart>
        ) : kind === "area" ? (
          <AreaChart {...common}>
            {axes}
            <Area type="monotone" dataKey="y" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.1} dot={endDot} activeDot={{ r: 4, stroke: "var(--chart-surface)", strokeWidth: 2, fill: "var(--chart-1)" }} isAnimationActive animationDuration={800} />
          </AreaChart>
        ) : (
          <LineChart {...common}>
            {axes}
            <Line type="monotone" dataKey="y" stroke="var(--chart-1)" strokeWidth={2} strokeLinecap="round" dot={endDot} activeDot={{ r: 4, stroke: "var(--chart-surface)", strokeWidth: 2, fill: "var(--chart-1)" }} isAnimationActive animationDuration={800} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
