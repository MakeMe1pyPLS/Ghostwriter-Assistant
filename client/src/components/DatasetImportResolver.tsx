import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStore, Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { classifySector, SECTOR_LABELS, type ManagedDataset } from "@/lib/dataset-library";
import { CheckCircle2, Sparkles, Layers, Plus, RefreshCw, GitMerge } from "lucide-react";

export interface ImportPayload {
  defaultName: string;
  columns: { name: string; type?: string }[];
  rows: Record<string, any>[];
  rowCount: number;
  sourceType: ManagedDataset['sourceType'];
}

type ConflictMode = 'new' | 'overwrite' | 'merge';

const SELECTABLE_SECTORS: Sector[] = ['ecommerce', 'logistics', 'manufacturing', 'unified', 'custom'];

function MiniPreview({ payload }: { payload: ImportPayload }) {
  const rows = payload.rows.slice(0, 5);
  if (rows.length === 0) return null;
  const keys = payload.columns.map((c) => c.name).slice(0, 8);
  return (
    <div className="overflow-auto max-h-[200px] rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 whitespace-nowrap">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              {keys.map((k) => (
                <td key={k} className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap max-w-[180px] truncate">{String(row[k] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DatasetImportResolver({ payload, onApplied }: { payload: ImportPayload; onApplied?: () => void }) {
  const { toast } = useToast();
  const { datasetLibrary, activeDatasetBySector, addDataset, mergeIntoDataset, overwriteDataset } = useDashboardStore();

  const detection = useMemo(
    () => classifySector(payload.columns.map((c) => c.name)),
    [payload.columns]
  );

  const [sector, setSectorState] = useState<Sector>(detection.sector);
  const [name, setName] = useState(payload.defaultName || 'Untitled Dataset');

  const existing = useMemo(
    () => datasetLibrary.filter((d) => d.sector === sector && !d.archived),
    [datasetLibrary, sector]
  );

  const activeId = activeDatasetBySector[sector] ?? null;
  const defaultTarget = activeId && existing.some((d) => d.id === activeId)
    ? activeId
    : existing[0]?.id ?? '';

  const [mode, setMode] = useState<ConflictMode>('new');
  const [targetId, setTargetId] = useState<string>(defaultTarget);

  // Keep the conflict target valid when the user changes sector.
  const effectiveTarget = existing.some((d) => d.id === targetId) ? targetId : defaultTarget;
  const effectiveMode: ConflictMode = existing.length === 0 ? 'new' : mode;

  const handleApply = () => {
    if (effectiveMode === 'new' || !effectiveTarget) {
      addDataset({
        name,
        sector,
        columns: payload.columns,
        rows: payload.rows,
        rowCount: payload.rowCount,
        sourceType: payload.sourceType,
      });
      toast({ title: 'Dataset added', description: `"${name}" is now the active ${SECTOR_LABELS[sector]} dataset.` });
    } else if (effectiveMode === 'overwrite') {
      const target = existing.find((d) => d.id === effectiveTarget);
      overwriteDataset(effectiveTarget, {
        name: name || target?.name,
        columns: payload.columns,
        rows: payload.rows,
        rowCount: payload.rowCount,
        sourceType: payload.sourceType,
      });
      useDashboardStore.getState().setActiveDataset(sector, effectiveTarget);
      toast({ title: 'Dataset overwritten', description: `"${target?.name}" was replaced with the new data.` });
    } else {
      const target = existing.find((d) => d.id === effectiveTarget);
      mergeIntoDataset(effectiveTarget, payload.rows, payload.columns);
      useDashboardStore.getState().setActiveDataset(sector, effectiveTarget);
      toast({ title: 'Dataset merged', description: `${payload.rowCount} rows merged into "${target?.name}".` });
    }
    onApplied?.();
  };

  const confidenceColor =
    detection.confidence === 'high' ? 'text-emerald-600' :
    detection.confidence === 'medium' ? 'text-amber-600' : 'text-slate-400';

  const modeOptions: { id: ConflictMode; label: string; desc: string; icon: any }[] = [
    { id: 'new', label: 'Add as New', desc: 'Keep existing, add a new dataset', icon: Plus },
    { id: 'merge', label: 'Merge', desc: 'Append rows to the active dataset', icon: GitMerge },
    { id: 'overwrite', label: 'Overwrite', desc: 'Replace the active dataset', icon: RefreshCw },
  ];

  return (
    <div className="space-y-5 pt-4 border-t border-slate-100" data-testid="dataset-import-resolver">
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Data ready to organize</p>
          <p className="text-xs text-emerald-600">{payload.rowCount} rows · {payload.columns.length} columns detected</p>
        </div>
      </div>

      {/* Detection */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Detected Sector</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-xs rounded-lg px-3 py-1" data-testid="badge-detected-sector">
            {SECTOR_LABELS[detection.sector]}
          </Badge>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${confidenceColor}`}>
            {detection.confidence} confidence
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Sector</Label>
            <Select value={sector} onValueChange={(v) => setSectorState(v as Sector)}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-medium" data-testid="select-confirm-sector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{SECTOR_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dataset Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Store A — June" className="h-10 rounded-xl border-slate-200 bg-white font-medium" data-testid="input-dataset-name" />
          </div>
        </div>
      </div>

      {/* Conflict resolution */}
      {existing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
              {existing.length} existing {SECTOR_LABELS[sector]} dataset{existing.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {modeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  effectiveMode === opt.id ? 'bg-white border-primary/40 shadow-sm' : 'bg-white/60 border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`button-mode-${opt.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <opt.icon className={`w-3.5 h-3.5 ${effectiveMode === opt.id ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-xs font-black ${effectiveMode === opt.id ? 'text-primary' : 'text-slate-600'}`}>{opt.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
          {(effectiveMode === 'merge' || effectiveMode === 'overwrite') && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Dataset</Label>
              <Select value={effectiveTarget} onValueChange={setTargetId}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-medium" data-testid="select-target-dataset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {existing.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.rowCount} rows)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Data Preview</h4>
        <MiniPreview payload={payload} />
      </div>

      <Button onClick={handleApply} className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md w-full sm:w-auto" data-testid="button-apply-import">
        {effectiveMode === 'new' ? 'Add to Library' : effectiveMode === 'merge' ? 'Merge into Dataset' : 'Overwrite Dataset'}
      </Button>
    </div>
  );
}
