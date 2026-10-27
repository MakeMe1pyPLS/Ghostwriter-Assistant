// Isometric warehouse: the five zones on one floor, in the order work flows.
// Each zone's floor is coloured by health (with an icon and a word on its pin),
// and the stack of cartons on it grows with how much work is waiting there.
// Tap a zone (or its row below) to open the same drawer as the zone cards.
// Plugs into <Overview ZoneView={WarehouseIso} />. Original artwork.
import { motion } from "framer-motion";
import type { ZoneId, ZoneStat } from "@shared/fulfillment";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/components/motion";
import { TONE, hrs } from "./parts";
import type { ZoneViewProps } from "./Overview";

const S = 24; // one grid unit, in px
const C = Math.cos(Math.PI / 6), N = Math.sin(Math.PI / 6);
const OX = 236, OY = 58;
/** Grid (x, y, height) → screen. x runs down-right, y runs down-left. */
const P = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * C * S, OY + (x + y) * N * S - z * S];
const pts = (...ps: [number, number][]) => ps.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

/** Where each zone sits on the floor: x, y, width (x), depth (y). Flow goes round in a U. */
const LAYOUT: Record<ZoneId, [number, number, number, number]> = {
  receiving: [0, 0, 4, 3.6],
  pick: [4.2, 0, 4, 3.6],
  pack: [8.4, 0, 3.6, 3.6],
  ship: [8.4, 3.8, 3.6, 3.8],
  returns: [0, 3.8, 4, 3.8],
};

const FLOOR: Record<ZoneStat["health"], { top: string; side: string }> = {
  ok: { top: "fill-emerald-50 dark:fill-emerald-400/15", side: "fill-emerald-200 dark:fill-emerald-400/30" },
  watch: { top: "fill-amber-50 dark:fill-amber-400/15", side: "fill-amber-200 dark:fill-amber-400/30" },
  bottleneck: { top: "fill-rose-100 dark:fill-rose-400/20", side: "fill-rose-300 dark:fill-rose-400/40" },
};
const EDGE = "stroke-slate-400/70 dark:stroke-slate-500";

/** A box in grid space: x, y, z of its near-bottom corner, then size. */
function Box({ x, y, z = 0, w, d, h, top, left, right, stroke = true }: {
  x: number; y: number; z?: number; w: number; d: number; h: number; top: string; left: string; right: string; stroke?: boolean;
}) {
  const s = stroke ? EDGE : "stroke-transparent";
  return (
    <g strokeWidth="0.75" strokeLinejoin="round">
      <polygon points={pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h))} className={cn(left, s)} />
      <polygon points={pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h))} className={cn(right, s)} />
      <polygon points={pts(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h))} className={cn(top, s)} />
    </g>
  );
}

const carton = { top: "fill-amber-100 dark:fill-amber-200", left: "fill-amber-300 dark:fill-amber-400", right: "fill-amber-200 dark:fill-amber-300" };
const steel = { top: "fill-slate-200 dark:fill-slate-500", left: "fill-slate-400 dark:fill-slate-600", right: "fill-slate-300 dark:fill-slate-500" };
const blue = { top: "fill-sky-200 dark:fill-sky-400/60", left: "fill-sky-500 dark:fill-sky-500/70", right: "fill-sky-400 dark:fill-sky-400/70" };

/** The fixed piece of equipment that tells you what each zone is. */
function Equipment({ id, x, y, w, d }: { id: ZoneId; x: number; y: number; w: number; d: number }) {
  switch (id) {
    case "receiving":
    case "ship": {
      // Dock doors along the back wall, a pallet in front of one.
      const doors = id === "receiving" ? [0.5, 2.2] : [0.6, 2.2];
      return (
        <g>
          {id === "receiving" ? doors.map((o) => (
            <polygon key={o} points={pts(P(x + o, y, 0.15), P(x + o + 1.2, y, 0.15), P(x + o + 1.2, y, 2.2), P(x + o, y, 2.2))} className="fill-slate-300 stroke-slate-400 dark:fill-slate-600 dark:stroke-slate-500" strokeWidth="0.75" />
          )) : doors.map((o) => (
            <polygon key={o} points={pts(P(x + w, y + o, 0.15), P(x + w, y + o + 1.2, 0.15), P(x + w, y + o + 1.2, 2.2), P(x + w, y + o, 2.2))} className="fill-slate-300 stroke-slate-400 dark:fill-slate-600 dark:stroke-slate-500" strokeWidth="0.75" />
          ))}
          <Box x={x + 0.4} y={y + d - 1.3} z={0.15} w={1.1} d={1.1} h={0.15} {...steel} />
        </g>
      );
    }
    case "pick":
      // Two rows of shelving.
      return (
        <g>
          {[0.3, 2.3].map((o) => (
            <g key={o}>
              <Box x={x + 0.4} y={y + o} z={0.15} w={w - 0.8} d={0.7} h={1.8} {...blue} />
              {[0.6, 1.2].map((lvl) => (
                <polygon key={lvl} points={pts(P(x + 0.4, y + o + 0.7, 0.15 + lvl), P(x + w - 0.4, y + o + 0.7, 0.15 + lvl))} className="stroke-sky-700/50 dark:stroke-sky-200/50" strokeWidth="0.75" fill="none" />
              ))}
            </g>
          ))}
        </g>
      );
    case "pack":
      // A packing bench.
      return <Box x={x + 0.4} y={y + 0.4} z={0.15} w={w - 0.8} d={1} h={0.8} {...steel} />;
    case "returns":
      // Sorting bins.
      return (
        <g>
          {[0.4, 1.5, 2.6].map((o) => <Box key={o} x={x + o} y={y + 0.4} z={0.15} w={0.9} d={0.9} h={0.6} {...steel} />)}
        </g>
      );
  }
}

/** Cartons waiting in a zone: 1–12, scaled to the busiest zone. */
function Cartons({ id, x, y, w, d, count, delay }: { id: ZoneId; x: number; y: number; w: number; d: number; count: number; delay: number }) {
  const startY = id === "pack" ? y + 1.8 : id === "pick" ? y + 1.2 : id === "returns" ? y + 1.7 : y + 0.6;
  const startX = id === "receiving" ? x + 0.5 : id === "ship" ? x + 0.4 : x + 0.5;
  const perRow = Math.max(2, Math.floor((w - 1) / 0.75));
  const boxes = Array.from({ length: count }, (_, i) => {
    const layer = Math.floor(i / (perRow * 2));
    const inLayer = i % (perRow * 2);
    return { bx: startX + (inLayer % perRow) * 0.75, by: startY + Math.floor(inLayer / perRow) * 0.75, bz: 0.15 + layer * 0.6 };
  }).filter((b) => b.by + 0.6 <= y + d - 0.1);
  // Draw back to front so nearer boxes cover farther ones.
  boxes.sort((a, b) => a.bz - b.bz || (a.bx + a.by) - (b.bx + b.by));
  return (
    <motion.g initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT, delay }}>
      {boxes.map((b, i) => <Box key={i} x={b.bx} y={b.by} z={b.bz} w={0.6} d={0.6} h={0.55} {...carton} />)}
    </motion.g>
  );
}

function Pin({ zone, cx, cy, selected }: { zone: ZoneStat; cx: number; cy: number; selected: boolean }) {
  const t = TONE[zone.health];
  const w = 118, h = 38;
  return (
    <g transform={`translate(${cx - w / 2} ${cy - h - 10})`} className="hidden sm:inline pointer-events-none">
      <rect width={w} height={h} rx="8" className={cn("fill-white dark:fill-slate-800", selected ? "stroke-primary" : zone.health === "bottleneck" ? "stroke-rose-500" : "stroke-slate-300 dark:stroke-slate-600")} strokeWidth={selected || zone.health === "bottleneck" ? 2 : 1} />
      <path d={`M${w / 2 - 6} ${h} l6 7 l6 -7z`} className="fill-white dark:fill-slate-800" />
      <text x="10" y="16" className="fill-slate-900 dark:fill-white text-[12px] font-black">{zone.name}</text>
      <text x="10" y="30" className="fill-slate-500 dark:fill-slate-400 text-[11px]">{zone.queue} waiting</text>
      <text x={w - 10} y="30" textAnchor="end" className={cn("text-[11px] font-black", zone.health === "ok" ? "fill-emerald-700 dark:fill-emerald-300" : zone.health === "watch" ? "fill-amber-700 dark:fill-amber-300" : "fill-rose-700 dark:fill-rose-300")}>{t.label}</text>
    </g>
  );
}

export function WarehouseIso({ zones, selectedId, onSelect }: ZoneViewProps) {
  const maxQueue = Math.max(1, ...zones.map((z) => z.queue));
  const byId = Object.fromEntries(zones.map((z) => [z.id, z])) as Record<ZoneId, ZoneStat>;
  const order: ZoneId[] = ["receiving", "pick", "returns", "pack", "ship"]; // back to front for drawing
  const flow: [number, number][] = [[2, 1.8], [6.2, 1.8], [10.2, 1.8], [10.2, 5.7]];

  return (
    <div className="rounded-card border border-slate-200 bg-white shadow-card p-3 sm:p-5" data-testid="ff-zones">
      <svg viewBox="0 0 500 330" className="w-full h-auto" role="group" aria-label="Warehouse floor. Each zone shows how much work is waiting there.">
        {/* building slab and back walls */}
        <polygon points={pts(P(-0.4, -0.4, 0), P(12.4, -0.4, 0), P(12.4, 8, 0), P(-0.4, 8, 0))} className="fill-slate-100 stroke-slate-300 dark:fill-white/5 dark:stroke-white/10" strokeWidth="1" />
        <polygon points={pts(P(-0.4, -0.4, 0), P(12.4, -0.4, 0), P(12.4, -0.4, 2.6), P(-0.4, -0.4, 2.6))} className="fill-slate-50 stroke-slate-300 dark:fill-white/[0.03] dark:stroke-white/10" strokeWidth="1" />
        <polygon points={pts(P(-0.4, -0.4, 0), P(-0.4, 8, 0), P(-0.4, 8, 2.6), P(-0.4, -0.4, 2.6))} className="fill-white stroke-slate-300 dark:fill-white/[0.05] dark:stroke-white/10" strokeWidth="1" />

        {/* flow path */}
        <polyline points={pts(...flow.map(([x, y]) => P(x, y, 0.16)))} fill="none" className="stroke-teal-600/60 dark:stroke-teal-300/60" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />
        <polyline points={pts(P(2, 5.7, 0.16), P(2, 3.2, 0.16))} fill="none" className="stroke-slate-400/60" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />

        {order.map((id, i) => {
          const z = byId[id];
          if (!z) return null;
          const [x, y, w, d] = LAYOUT[id];
          const f = FLOOR[z.health];
          const selected = selectedId === id;
          const count = Math.max(1, Math.round((z.queue / maxQueue) * 12));
          const t = TONE[z.health];
          return (
            <g key={id} role="button" tabIndex={0} aria-pressed={selected}
              aria-label={`${z.name}: ${z.queue} ${z.queueLabel}, ${hrs(z.backlogHrs)} of work waiting. ${t.label}.`}
              onClick={() => onSelect(id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}
              className="cursor-pointer focus:outline-none group" data-testid={`ff-zone-${id}`}>
              <Box x={x} y={y} w={w} d={d} h={0.15} top={f.top} left={f.side} right={f.side} />
              {(selected || z.health === "bottleneck") && (
                <polygon points={pts(P(x, y, 0.15), P(x + w, y, 0.15), P(x + w, y + d, 0.15), P(x, y + d, 0.15))} fill="none"
                  className={selected ? "stroke-primary" : "stroke-rose-500"} strokeWidth="2.5" strokeLinejoin="round" />
              )}
              <polygon points={pts(P(x, y, 0.15), P(x + w, y, 0.15), P(x + w, y + d, 0.15), P(x, y + d, 0.15))} fill="none"
                className="stroke-primary opacity-0 group-focus-visible:opacity-100" strokeWidth="3" />
              <Equipment id={id} x={x} y={y} w={w} d={d} />
              <Cartons id={id} x={x} y={y} w={w} d={d} count={count} delay={0.05 * i} />
            </g>
          );
        })}

        {/* a truck backed up to the shipping doors */}
        <Box x={12.5} y={4.3} w={3.2} d={1.3} h={1.5} top="fill-slate-100 dark:fill-slate-600" left="fill-slate-200 dark:fill-slate-700" right="fill-white dark:fill-slate-500" />
        <Box x={15.7} y={4.4} w={0.9} d={1.1} h={1.1} {...blue} />

        {order.map((id) => {
          const z = byId[id];
          if (!z) return null;
          const [x, y, w, d] = LAYOUT[id];
          const [cx, cy] = P(x + w / 2, y + d / 2, 2.4);
          return <Pin key={id} zone={z} cx={cx} cy={cy} selected={selectedId === id} />;
        })}
      </svg>

      {/* Same zones as a list: readable on phones, and the keyboard-friendly way in. */}
      <ul className="mt-3 grid sm:grid-cols-5 gap-2">
        {zones.map((z) => {
          const t = TONE[z.health];
          const Icon = t.icon;
          return (
            <li key={z.id}>
              <button onClick={() => onSelect(z.id)} aria-pressed={selectedId === z.id}
                className={cn("w-full flex sm:flex-col items-center sm:items-start justify-between gap-1 rounded-xl border px-3 py-2 text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  z.health === "bottleneck" ? t.box : "border-slate-200 bg-white hover:bg-slate-50 dark:bg-white/5 dark:border-white/10",
                  selectedId === z.id && "outline outline-2 outline-primary")}>
                <span className="text-sm font-bold text-slate-900">{z.name}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="tabular-nums text-slate-600">{z.queue} waiting</span>
                  <span className={cn("inline-flex items-center gap-1 font-bold", t.text)}><Icon className="w-3.5 h-3.5" aria-hidden />{t.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">Cartons on each floor are drawn to scale with the work waiting there. The busiest zone shows 12. Floor colour shows health.</p>
    </div>
  );
}
