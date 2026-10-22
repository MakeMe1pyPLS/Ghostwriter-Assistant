// Load check: pick a vehicle, enter total weight and volume (or upload a list)
// and see how full it is. This is an ESTIMATE, not a load plan: there is no
// pallet layout, and volume assumes the freight packs perfectly.
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, OctagonAlert, Pencil, Truck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NEAR_LIMIT_PCT, VEHICLES, estimateLoad, parseLoadCsv, type LoadImport, type VehicleId } from "@shared/fulfillment";
import { Card, Chip, TONE } from "./parts";

const SAMPLE_CSV = `Item,Quantity,Weight (lb),Length (in),Width (in),Height (in)
Carton of tees,40,18,24,16,12
Carton of hoodies,25,26,24,18,14
Pallet of returns,2,420,48,40,48
Display fixtures,6,35,
`;

// Where the cargo area sits inside each vehicle drawing: [x, y, width, height].
const CARGO: Record<VehicleId, [number, number, number, number]> = {
  "cargo-van": [14, 18, 120, 52],
  "box-truck": [10, 10, 150, 62],
  "trailer-53": [6, 22, 208, 48],
};

function VehicleArt({ id, pct, status, className }: { id: VehicleId; pct: number; status?: "empty" | "ok" | "near" | "over"; className?: string }) {
  const [x, y, w, h] = CARGO[id];
  const fillH = Math.max(0, Math.min(100, pct)) / 100 * h;
  const fill = status === "over" ? "fill-rose-500" : status === "near" ? "fill-amber-500" : "fill-teal-600 dark:fill-teal-400";
  return (
    <svg viewBox="0 0 240 90" className={cn("w-full text-slate-400 dark:text-slate-500", className)} aria-hidden>
      {/* cargo box */}
      <rect x={x} y={y} width={w} height={h} rx="5" className="fill-slate-100 dark:fill-white/10" stroke="currentColor" strokeWidth="2" />
      {pct > 0 && <rect x={x + 1.5} y={y + h - fillH + 0.5} width={w - 3} height={Math.max(0, fillH - 2)} rx="3" className={cn(fill, "opacity-80")} />}
      {/* cab */}
      {id === "cargo-van" && <path d="M134 28h40l24 22v20h-64z" className="fill-white dark:fill-slate-800" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
      {id === "box-truck" && <path d="M160 26h30l26 22v22h-56z" className="fill-white dark:fill-slate-800" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
      {id === "trailer-53" && <path d="M214 46h10v24h-10" className="fill-none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
      {/* wheels */}
      {(id === "cargo-van" ? [50, 168] : id === "box-truck" ? [46, 70, 192] : [30, 54, 78, 204]).map((cx) => (
        <circle key={cx} cx={cx} cy="76" r="9" className="fill-slate-700 dark:fill-slate-300" stroke="currentColor" strokeWidth="2" />
      ))}
      <line x1="2" y1="85" x2="238" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start" data-testid="ff-load">
      <Card className="space-y-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Step 1</p>
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
              <VehicleArt id={o.id} pct={0} className="h-12 sm:h-14" />
              <p className="text-[12px] sm:text-sm font-black text-slate-900 mt-1 leading-tight">{o.name}</p>
              <p className="hidden sm:block text-[11px] text-slate-500">Up to {o.maxWeightLb.toLocaleString()} lb · {o.maxVolumeCuFt.toLocaleString()} cu ft</p>
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
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Step 2</p>
          <h2 className="text-lg font-black text-slate-900">Tell us what's going on</h2>
        </div>
        {list ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10 p-3 flex items-start gap-3" data-testid="load-list-summary">
            <FileSpreadsheet className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900">{list.rows.length} lines · {items.toLocaleString()} items</p>
              <p className="text-[13px] text-slate-600">{Math.round(list.totalWeightLb).toLocaleString()} lb · {list.totalVolumeCuFt.toLocaleString()} cu ft{!list.volumeComplete && " (at least: some lines have no size)"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setList(null)} data-testid="load-clear-list"><X className="w-4 h-4 mr-1" aria-hidden /> Clear list</Button>
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
              <Button variant="ghost" onClick={downloadSample}><Download className="w-4 h-4 mr-2" aria-hidden /> Sample file</Button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" aria-label="Upload a CSV load list" data-testid="load-file" onChange={(e) => { onFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-5 lg:sticky lg:top-4" data-testid="load-result">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Result</p>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-slate-500" aria-hidden /> {preset.name}</h2>
          </div>
          <Chip tone="info">Estimate only</Chip>
        </div>
        <VehicleArt id={vid} pct={Math.max(est.weightPct, est.volumePct)} status={est.status} className="h-24 sm:h-28" />
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
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Columns we matched</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[13px]">
                  {([["description", "Item"], ["qty", "Quantity"], ["weight", "Weight"], ["length", "Length"], ["width", "Width"], ["height", "Height"]] as const).map(([k, l]) => (
                    <div key={k} className="rounded-lg border border-slate-200 p-2">
                      <dt className="text-[11px] text-slate-500">{l}</dt>
                      <dd className={cn("font-bold truncate", preview.data.mapping[k] ? "text-slate-900" : "text-warning")}>{preview.data.mapping[k] ?? "Not found"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {preview.data.rows.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="p-2">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Each (lb)</th><th className="p-2 text-right">Each (cu ft)</th></tr></thead>
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
  );
}
