// Load check: pick a vehicle, enter total weight and volume (or upload a list)
// and see how full it is. This is an ESTIMATE, not a load plan: there is no
// pallet layout, and volume assumes the freight packs perfectly.
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, OctagonAlert, Pencil, Sparkles, Truck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NEAR_LIMIT_PCT, VEHICLES, estimateLoad, parseLoadCsv, type LoadImport, type VehicleId } from "@shared/fulfillment";
import { Card, Chip, TONE } from "./parts";
import { VehicleScene, VehicleIcon, SECTION_DOTS, type LoadSection } from "./VehicleScene";

const SAMPLE_CSV = `Item,Quantity,Weight (lb),Length (in),Width (in),Height (in)
Carton of tees,40,18,24,16,12
Carton of hoodies,25,26,24,18,14
Pallet of returns,2,420,48,40,48
Display fixtures,6,35,
`;

function Meter({ label, pct, detail, limiting }: { label: string; pct: number; detail: string; limiting: boolean }) {
  const shown = Math.min(100, Math.round(pct));
  const over = pct > 100;
  const near = pct >= NEAR_LIMIT_PCT && !over;
  const tone = over ? TONE.bottleneck : near ? TONE.watch : TONE.ok;
  const Icon = over ? OctagonAlert : near ? AlertTriangle : CheckCircle2;
  return (
    <div data-testid={`load-meter-${label.toLowerCase()}`}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
          <Icon className={cn("w-4 h-4", tone.text)} aria-hidden /> By {label.toLowerCase()}
          {limiting && <Chip tone="neutral" className="ml-1">Limit hit first</Chip>}
        </p>
        <p className={cn("text-xl font-black tabular-nums", tone.text)}>{Math.round(pct)}%</p>
      </div>
      <div className="relative h-3.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden" role="meter" aria-valuenow={shown} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} fill`}>
        <div className={cn("h-full rounded-full transition-[width] duration-300", tone.bar)} style={{ width: `${shown}%` }} />
        <span className="absolute top-0 bottom-0 w-0.5 bg-slate-900/50 dark:bg-white/60" style={{ left: `${NEAR_LIMIT_PCT}%` }} aria-hidden />
      </div>
      <p className="text-[12px] text-slate-500 mt-1">{detail}</p>
    </div>
  );
}

const nonNeg = (s: string) => {
  if (s.trim() === "") return { v: 0, err: "" };
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n)) return { v: 0, err: "Enter a number." };
  if (n < 0) return { v: 0, err: "Can't be negative." };
  return { v: n, err: "" };
};

export function LoadCheck() {
  const { toast } = useToast();
  const [vid, setVid] = useState<VehicleId>("box-truck");
  const preset = VEHICLES.find((v) => v.id === vid)!;
  const [limits, setLimits] = useState<Record<string, { w: string; v: string }>>({});
  const [editLimits, setEditLimits] = useState(false);
  const [w, setW] = useState("");
  const [v, setV] = useState("");
  const [list, setList] = useState<LoadImport | null>(null);
  const [preview, setPreview] = useState<{ name: string; data: LoadImport } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const lim = limits[vid] ?? { w: String(preset.maxWeightLb), v: String(preset.maxVolumeCuFt) };
  const maxW = nonNeg(lim.w), maxV = nonNeg(lim.v);
  const wIn = nonNeg(w), vIn = nonNeg(v);
  const limitsOk = !maxW.err && !maxV.err && maxW.v > 0 && maxV.v > 0;

  const weight = list ? list.totalWeightLb : wIn.v;
  const volume = list ? list.totalVolumeCuFt : vIn.v;
  const est = useMemo(() => estimateLoad({ maxWeightLb: maxW.v, maxVolumeCuFt: maxV.v }, weight, volume), [maxW.v, maxV.v, weight, volume]);
  const tone = est.status === "over" ? TONE.bottleneck : est.status === "near" ? TONE.watch : est.status === "ok" ? TONE.ok : TONE.info;
  const ToneIcon = tone.icon;

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 2_000_000) { toast({ title: "That file is too big", description: "Keep it under 2 MB (about 20,000 rows).", variant: "destructive" }); return; }
    if (/\.xlsx?$/i.test(f.name)) { toast({ title: "Save it as CSV first", description: "In Excel choose File → Save As → CSV. Excel upload is coming soon." }); return; }
    const text = await f.text();
    setPreview({ name: f.name, data: parseLoadCsv(text) });
  }
  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "load-list-sample.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const errors = preview?.data.issues.filter((i) => i.level === "error") ?? [];
  const warnings = preview?.data.issues.filter((i) => i.level === "warning") ?? [];
  const items = list ? list.rows.reduce((s, r) => s + r.qty, 0) : 0;

  // The truck view: one section per line, as wide as its share of capacity.
  const [basisPick, setBasisPick] = useState<"weight" | "volume" | null>(null);
  const basis: "weight" | "volume" = basisPick ?? (est.limiting === "volume" ? "volume" : "weight");
  const [selected, setSelected] = useState<string | null>(null);
  const lines = useMemo(() => {
    if (!limitsOk) return [];
    const cap = basis === "weight" ? maxW.v : maxV.v;
    if (list) {
      const all = list.rows.map((r) => ({
        key: `l${r.line}`, label: r.description, qty: r.qty,
        weightLb: r.weightLb * r.qty, volumeCuFt: r.volumeCuFt == null ? null : r.volumeCuFt * r.qty,
      }));
      // Keep the picture readable: the six biggest lines, then everything else together.
      const metric = (x: typeof all[number]) => (basis === "weight" ? x.weightLb : x.volumeCuFt ?? 0);
      const sorted = all.slice().sort((a, b) => metric(b) - metric(a));
      const top = sorted.slice(0, 6);
      const rest = sorted.slice(6);
      const merged = rest.length ? [...top, {
        key: "rest", label: `${rest.length} more lines`, qty: rest.reduce((s, x) => s + x.qty, 0),
        weightLb: rest.reduce((s, x) => s + x.weightLb, 0), volumeCuFt: rest.reduce((s, x) => s + (x.volumeCuFt ?? 0), 0),
      }] : top;
      return merged.map((x) => ({ ...x, share: metric(x) / cap }));
    }
    const amount = basis === "weight" ? wIn.v : vIn.v;
    return amount > 0 ? [{ key: "manual", label: "Your load", qty: 0, weightLb: wIn.v, volumeCuFt: vIn.v || null, share: amount / cap }] : [];
  }, [list, basis, limitsOk, maxW.v, maxV.v, wIn.v, vIn.v]);
  const sections: LoadSection[] = lines.filter((l) => l.share > 0).map(({ key, label, share }) => ({ key, label, share }));
  const noSize = basis === "volume" && list ? list.rows.filter((r) => r.volumeCuFt == null).length : 0;
  const tryExample = () => {
    const data = parseLoadCsv(SAMPLE_CSV);
    setList(data);
    setSelected(null);
    toast({ title: "Example load added", description: "These are made-up lines. Use “Clear list” to start fresh." });
  };

  return (
    <div className="space-y-4" data-testid="ff-load">
    <Card className="p-4 sm:p-6" data-testid="load-scene">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">How full is the {preset.name.toLowerCase()}?</h2>
          <p className="text-sm text-slate-500">
            {sections.length ? "Each block is one line of your load, as wide as its share of the vehicle. Tap one to find it in the list." : "Add your load below, or try an example, to see it inside the vehicle."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="info">Estimate only</Chip>
          <div role="radiogroup" aria-label="Size the blocks by" className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 dark:bg-white/5 dark:border-white/10">
            {(["weight", "volume"] as const).map((b) => (
              <button key={b} role="radio" aria-checked={basis === b} onClick={() => setBasisPick(b)}
                className={cn("h-8 px-3 rounded-lg text-sm font-bold capitalize", basis === b ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")}>
                By {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-white/5 px-2 sm:px-6 pt-4 pb-1">
        <VehicleScene id={vid} sections={sections} selectedKey={selected} basisLabel={basis}
          onSelect={(k) => setSelected((cur) => (cur === k ? null : k))} className="max-h-[260px] mx-auto" />
      </div>

      {limitsOk && (
        <dl className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { k: "By weight", v: `${Math.round(est.weightPct)}%`, d: `${Math.round(weight).toLocaleString()} of ${maxW.v.toLocaleString()} lb`, bad: est.weightPct > 100 },
            { k: "Room left", v: `${est.roomWeightLb.toLocaleString()} lb`, d: `${est.roomVolumeCuFt.toLocaleString()} cu ft of space`, bad: false },
            { k: "By volume", v: `${Math.round(est.volumePct)}%`, d: `${Math.round(volume * 10) / 10} of ${maxV.v.toLocaleString()} cu ft${list && !list.volumeComplete ? " (at least)" : ""}`, bad: est.volumePct > 100 },
            { k: "On board", v: list ? `${items.toLocaleString()} items` : sections.length ? "1 load" : "Nothing yet", d: list ? `${list.rows.length} lines` : "Entered by hand", bad: false },
          ].map((s) => (
            <div key={s.k} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
              <dt className="text-xs font-semibold text-slate-500">{s.k}</dt>
              <dd className={cn("text-xl font-black tabular-nums", s.bad ? "text-danger" : "text-slate-900")}>{s.v}</dd>
              <dd className="text-xs text-slate-500 mt-0.5">{s.d}</dd>
            </div>
          ))}
        </dl>
      )}

      {list && lines.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
          <table className="w-full text-sm" data-testid="load-lines">
            <caption className="sr-only">Load lines and their share of the vehicle</caption>
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-white/10">
                <th className="p-2.5 pl-3">Item</th><th className="p-2.5 text-right">Qty</th><th className="p-2.5 text-right">Weight</th>
                <th className="p-2.5 text-right">Volume</th><th className="p-2.5 pr-3 text-right">Share by {basis}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const on = selected === l.key;
                return (
                  <tr key={l.key} onClick={() => setSelected((cur) => (cur === l.key ? null : l.key))}
                    className={cn("border-t border-slate-100 dark:border-white/10 cursor-pointer", on ? "bg-teal-50 dark:bg-teal-400/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                    <td className="p-2.5 pl-3">
                      <button type="button" className="flex items-center gap-2 text-left font-semibold text-slate-900 focus-visible:outline-none focus-visible:underline" aria-pressed={on}
                        onClick={(e) => { e.stopPropagation(); setSelected((cur) => (cur === l.key ? null : l.key)); }}>
                        <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", SECTION_DOTS[i % SECTION_DOTS.length])} aria-hidden />{l.label}
                      </button>
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{l.qty.toLocaleString()}</td>
                    <td className="p-2.5 text-right tabular-nums">{Math.round(l.weightLb).toLocaleString()} lb</td>
                    <td className="p-2.5 text-right tabular-nums">{l.volumeCuFt == null ? <span className="text-slate-400">No size</span> : `${Math.round(l.volumeCuFt * 10) / 10} cu ft`}</td>
                    <td className="p-2.5 pr-3 text-right font-bold tabular-nums">{Math.round(l.share * 1000) / 10}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {noSize > 0 && <p className="p-2.5 text-xs text-slate-500 border-t border-slate-100 dark:border-white/10">{noSize} line{noSize === 1 ? " has" : "s have"} no size, so {noSize === 1 ? "it isn't" : "they aren't"} shown by volume.</p>}
        </div>
      )}

      {!list && !sections.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={tryExample} data-testid="load-example"><Sparkles className="w-4 h-4 mr-2" aria-hidden /> Try an example load</Button>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Blocks show how much of the vehicle each line uses, not where it goes. Loading order and placement are up to your team.</p>
    </Card>

    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-bold text-primary">Step 1</p>
          <h2 className="text-lg font-black text-slate-900">Pick a vehicle</h2>
        </div>
        <div role="radiogroup" aria-label="Vehicle type" className="grid grid-cols-3 gap-2">
          {VEHICLES.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={vid === o.id}
              onClick={() => setVid(o.id)}
              className={cn("rounded-2xl border p-2 sm:p-3 text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", vid === o.id ? "border-primary ring-1 ring-primary/30 bg-teal-50/40 dark:bg-teal-400/10" : "border-slate-200 bg-white hover:bg-slate-50 dark:hover:bg-white/5")}
              data-testid={`load-vehicle-${o.id}`}
            >
              <VehicleIcon id={o.id} tone="none" className="h-12 sm:h-14" />
              <p className="text-xs sm:text-sm font-black text-slate-900 mt-1 leading-tight">{o.name}</p>
              <p className="hidden sm:block text-xs text-slate-500">Up to {o.maxWeightLb.toLocaleString()} lb · {o.maxVolumeCuFt.toLocaleString()} cu ft</p>
            </button>
          ))}
        </div>
        <div>
          <button onClick={() => setEditLimits((e) => !e)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary min-h-10" aria-expanded={editLimits} data-testid="load-edit-limits">
            <Pencil className="w-3.5 h-3.5" aria-hidden /> {editLimits ? "Hide limits" : "Edit this vehicle's limits"}
          </button>
          {editLimits && (
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <Label htmlFor="max-w" className="text-[12px] font-bold">Max weight (lb)</Label>
                <Input id="max-w" inputMode="decimal" value={lim.w} onChange={(e) => setLimits({ ...limits, [vid]: { ...lim, w: e.target.value } })} aria-invalid={!!maxW.err || maxW.v <= 0} data-testid="load-max-weight" />
              </div>
              <div>
                <Label htmlFor="max-v" className="text-[12px] font-bold">Max volume (cu ft)</Label>
                <Input id="max-v" inputMode="decimal" value={lim.v} onChange={(e) => setLimits({ ...limits, [vid]: { ...lim, v: e.target.value } })} aria-invalid={!!maxV.err || maxV.v <= 0} data-testid="load-max-volume" />
              </div>
              <p className="col-span-2 text-[12px] text-slate-500">{preset.note}. These are typical figures. Use the payload rating on your own vehicle's door label.</p>
              {!limitsOk && <p className="col-span-2 text-[12px] font-bold text-danger">Both limits need to be numbers above 0.</p>}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-primary">Step 2</p>
          <h2 className="text-lg font-black text-slate-900">Tell us what's going on</h2>
        </div>
        {list ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10 p-3 flex items-start gap-3" data-testid="load-list-summary">
            <FileSpreadsheet className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900">{list.rows.length} lines · {items.toLocaleString()} items</p>
              <p className="text-[13px] text-slate-600">{Math.round(list.totalWeightLb).toLocaleString()} lb · {list.totalVolumeCuFt.toLocaleString()} cu ft{!list.volumeComplete && " (at least: some lines have no size)"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setList(null); setSelected(null); }} data-testid="load-clear-list"><X className="w-4 h-4 mr-1" aria-hidden /> Clear list</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="load-w" className="text-[12px] font-bold">Total weight (lb)</Label>
                <Input id="load-w" inputMode="decimal" placeholder="e.g. 4200" value={w} onChange={(e) => setW(e.target.value)} aria-invalid={!!wIn.err} data-testid="load-weight" />
                {wIn.err && <p className="text-[12px] font-bold text-danger mt-1">{wIn.err}</p>}
              </div>
              <div>
                <Label htmlFor="load-v" className="text-[12px] font-bold">Total volume (cu ft)</Label>
                <Input id="load-v" inputMode="decimal" placeholder="e.g. 640" value={v} onChange={(e) => setV(e.target.value)} aria-invalid={!!vIn.err} data-testid="load-volume" />
                {vIn.err && <p className="text-[12px] font-bold text-danger mt-1">{vIn.err}</p>}
              </div>
            </div>
            <p className="text-[12px] text-slate-500">Cubic feet = length × width × height in feet. Not sure? Upload a list and we'll work it out.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} data-testid="load-upload"><Upload className="w-4 h-4 mr-2" aria-hidden /> Upload a CSV list</Button>
              <Button variant="ghost" onClick={tryExample}><Sparkles className="w-4 h-4 mr-2" aria-hidden /> Example load</Button>
              <Button variant="ghost" onClick={downloadSample}><Download className="w-4 h-4 mr-2" aria-hidden /> Sample file</Button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" aria-label="Upload a CSV load list" data-testid="load-file" onChange={(e) => { onFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-5 lg:sticky lg:top-4" data-testid="load-result">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs font-bold text-primary">Result</p>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-slate-500" aria-hidden /> {preset.name}</h2>
          </div>
          <Chip tone="info">Estimate only</Chip>
        </div>
        {limitsOk ? (
          <>
            <Meter label="Weight" pct={est.weightPct} detail={`${Math.round(weight).toLocaleString()} of ${maxW.v.toLocaleString()} lb · ${est.roomWeightLb.toLocaleString()} lb of room left`} limiting={est.limiting === "weight"} />
            <Meter label="Volume" pct={est.volumePct} detail={`${Math.round(volume * 10) / 10} of ${maxV.v.toLocaleString()} cu ft · ${est.roomVolumeCuFt.toLocaleString()} cu ft of room left`} limiting={est.limiting === "volume"} />
            <div className={cn("rounded-xl border p-3 flex items-start gap-2", tone.box)} role="status" aria-live="polite" data-testid="load-status">
              <ToneIcon className={cn("w-4 h-4 mt-0.5 shrink-0", tone.text)} aria-hidden />
              <p className="text-sm font-semibold text-slate-800">{est.message}</p>
            </div>
          </>
        ) : (
          <p className="text-sm font-bold text-danger" role="alert">Fix the vehicle limits to see the result.</p>
        )}
        <p className="text-[12px] text-slate-500">
          This is a rough check. It uses typical vehicle limits, assumes the freight packs perfectly, and doesn't plan where anything goes. Marks on the bars show {NEAR_LIMIT_PCT}%, where we start warning you.
        </p>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto" data-testid="load-preview">
          <DialogHeader>
            <DialogTitle>Check your list</DialogTitle>
            <DialogDescription>{preview?.name}. Nothing is used until you confirm.</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">Columns we matched</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[13px]">
                  {([["description", "Item"], ["qty", "Quantity"], ["weight", "Weight"], ["length", "Length"], ["width", "Width"], ["height", "Height"]] as const).map(([k, l]) => (
                    <div key={k} className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-xs text-slate-500">{l}</dt>
                      <dd className={cn("font-bold truncate", preview.data.mapping[k] ? "text-slate-900" : "text-warning")}>{preview.data.mapping[k] ?? "Not found"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {preview.data.rows.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-xs font-semibold text-slate-500"><th className="p-2">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Each (lb)</th><th className="p-2 text-right">Each (cu ft)</th></tr></thead>
                    <tbody>
                      {preview.data.rows.slice(0, 6).map((r) => (
                        <tr key={r.line} className="border-t border-slate-100 dark:border-white/10">
                          <td className="p-2 max-w-[200px] truncate">{r.description}</td>
                          <td className="p-2 text-right tabular-nums">{r.qty}</td>
                          <td className="p-2 text-right tabular-nums">{Math.round(r.weightLb * 10) / 10}</td>
                          <td className="p-2 text-right tabular-nums">{r.volumeCuFt === null ? "—" : Math.round(r.volumeCuFt * 100) / 100}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.data.rows.length > 6 && <p className="p-2 text-[12px] text-slate-500 border-t border-slate-100 dark:border-white/10">…and {preview.data.rows.length - 6} more lines.</p>}
                </div>
              )}
              {errors.length > 0 && (
                <div className="rounded-xl border border-danger-line bg-danger-soft p-3" data-testid="load-errors">
                  <p className="text-[12px] font-black text-danger flex items-center gap-1.5"><OctagonAlert className="w-4 h-4" aria-hidden /> {errors.length} problem{errors.length === 1 ? "" : "s"}</p>
                  <ul className="mt-1 text-[13px] text-slate-800 list-disc pl-5 space-y-0.5">{errors.slice(0, 5).map((i) => <li key={i.line}>Line {i.line}: {i.text}</li>)}</ul>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="rounded-xl border border-warning-line bg-warning-soft p-3" data-testid="load-warnings">
                  <p className="text-[12px] font-black text-warning flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" aria-hidden /> {warnings.length} to check</p>
                  <ul className="mt-1 text-[13px] text-slate-800 list-disc pl-5 space-y-0.5">{warnings.slice(0, 5).map((i) => <li key={i.line}>Line {i.line}: {i.text}</li>)}</ul>
                </div>
              )}
              {preview.data.rows.length > 0 && (
                <p className="text-sm font-bold text-slate-900">Total: {Math.round(preview.data.totalWeightLb).toLocaleString()} lb · {preview.data.totalVolumeCuFt.toLocaleString()} cu ft{!preview.data.volumeComplete && " (at least)"}</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
            <Button disabled={!preview || preview.data.rows.length === 0} onClick={() => { if (preview) { setList(preview.data); setPreview(null); toast({ title: "List added", description: `${preview.data.rows.length} lines are now counted. Use “Clear list” to undo.` }); } }} data-testid="load-confirm">
              Use this list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
