import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore, Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { SECTOR_LABELS, type ManagedDataset } from "@/lib/dataset-library";
import {
  Library, CheckCircle2, Circle, Archive, ArchiveRestore, Trash2, Pencil, Check, X,
  FileText, Database, FileSpreadsheet, Globe, Layers,
} from "lucide-react";

const SOURCE_ICONS: Record<string, any> = {
  csv: FileText,
  sql: Database,
  'google-sheets': FileSpreadsheet,
  api: Globe,
};

const SECTOR_ORDER: Sector[] = ['ecommerce', 'logistics', 'manufacturing', 'unified', 'custom'];

function DatasetRow({ ds, isActive }: { ds: ManagedDataset; isActive: boolean }) {
  const { setActiveDataset, archiveDataset, restoreDataset, removeDataset, renameDataset } = useDashboardStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(ds.name);
  const Icon = SOURCE_ICONS[ds.sourceType] || Database;

  const commitRename = () => {
    if (draftName.trim() && draftName.trim() !== ds.name) {
      renameDataset(ds.id, draftName);
      toast({ title: 'Dataset renamed' });
    }
    setEditing(false);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
        ds.archived
          ? 'bg-slate-50/60 border-slate-200 opacity-70'
          : isActive
            ? 'bg-primary/5 border-primary/30 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
      data-testid={`dataset-row-${ds.id}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive && !ds.archived ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="h-7 rounded-lg text-sm font-bold"
              data-testid={`input-rename-${ds.id}`}
            />
            <Button size="sm" variant="ghost" onClick={commitRename} className="h-7 w-7 p-0 text-emerald-600" data-testid={`button-rename-save-${ds.id}`}><Check className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 w-7 p-0 text-slate-400"><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate" data-testid={`text-dataset-name-${ds.id}`}>{ds.name}</p>
            {isActive && !ds.archived && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[9px] uppercase tracking-wider rounded-md px-1.5 py-0" data-testid={`badge-active-${ds.id}`}>Active</Badge>
            )}
            {ds.archived && (
              <Badge variant="secondary" className="bg-slate-200 text-slate-500 font-black text-[9px] uppercase tracking-wider rounded-md px-1.5 py-0">Archived</Badge>
            )}
          </div>
        )}
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{ds.rowCount} rows · {ds.columns.length} cols · {ds.sourceType}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!ds.archived && !isActive && (
          <Button size="sm" variant="ghost" onClick={() => { setActiveDataset(ds.sector, ds.id); toast({ title: 'Active dataset switched', description: `"${ds.name}" now drives ${SECTOR_LABELS[ds.sector]} widgets.` }); }} className="h-8 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/10" data-testid={`button-activate-${ds.id}`}>
            <Circle className="w-3 h-3 mr-1" /> Set Active
          </Button>
        )}
        {isActive && !ds.archived && (
          <span className="h-8 px-2 flex items-center text-emerald-600" title="Active dataset"><CheckCircle2 className="w-4 h-4" /></span>
        )}
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => { setDraftName(ds.name); setEditing(true); }} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700" data-testid={`button-edit-${ds.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
        )}
        {ds.archived ? (
          <Button size="sm" variant="ghost" onClick={() => restoreDataset(ds.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600" data-testid={`button-restore-${ds.id}`}><ArchiveRestore className="w-3.5 h-3.5" /></Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => archiveDataset(ds.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600" data-testid={`button-archive-${ds.id}`}><Archive className="w-3.5 h-3.5" /></Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => { removeDataset(ds.id); toast({ title: 'Dataset removed' }); }} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" data-testid={`button-remove-${ds.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export function DatasetManagementPanel() {
  const datasetLibrary = useDashboardStore((s) => s.datasetLibrary);
  const activeDatasetBySector = useDashboardStore((s) => s.activeDatasetBySector);

  const grouped = useMemo(() => {
    const groups: Partial<Record<Sector, ManagedDataset[]>> = {};
    for (const ds of datasetLibrary) {
      (groups[ds.sector] ||= []).push(ds);
    }
    // Sort each group: active first, then non-archived, then archived.
    Object.values(groups).forEach((list) => list?.sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return b.createdAt - a.createdAt;
    }));
    return groups;
  }, [datasetLibrary]);

  const sectorsWithData = SECTOR_ORDER.filter((s) => grouped[s] && grouped[s]!.length > 0);

  if (datasetLibrary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Library className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-700 mb-1">Your dataset library is empty</p>
        <p className="text-xs text-slate-400">Import data above — it will be auto-sorted by sector here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dataset-management-panel">
      <div className="flex items-center gap-2">
        <Library className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dataset Library</h3>
        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] rounded-md">{datasetLibrary.length}</Badge>
      </div>

      {sectorsWithData.map((sector) => {
        const list = grouped[sector]!;
        const activeId = activeDatasetBySector[sector] ?? null;
        return (
          <div key={sector} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">{SECTOR_LABELS[sector]}</span>
              <span className="text-[10px] font-bold text-slate-400">· {list.length} dataset{list.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {list.map((ds) => (
                <DatasetRow key={ds.id} ds={ds} isActive={activeId === ds.id} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
