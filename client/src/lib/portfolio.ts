// Turns a client workspace into the plain input the consultant summary needs.
import type { ClientRecord, WorkspaceSnapshot } from "@/hooks/use-clients-store";
import { workspaceStats } from "@/hooks/use-clients-store";
import type { ClientInput } from "@shared/consultant";

export function clientInputFrom(client: ClientRecord, ws: WorkspaceSnapshot | null): ClientInput {
  const dash = ws?.dashboard;
  const live = (dash?.datasetLibrary ?? []).filter((d) => !d.archived && d.rows.length > 0);
  const activeId = dash ? dash.activeDatasetBySector?.[dash.selectedSector] : undefined;
  // The client's chosen file, or its newest if none is chosen.
  const ds = live.find((d) => d.id === activeId) ?? [...live].sort((a, b) => b.createdAt - a.createdAt)[0];
  return {
    id: client.id,
    name: client.name,
    status: client.status,
    nextReview: client.nextReview,
    actions: (ws?.growth.actions ?? []).map((a) => ({
      id: a.id, title: a.title, status: a.status, dueDate: a.dueDate, createdAt: a.createdAt, completedAt: a.completedAt, baseline: a.baseline,
    })),
    dataset: ds ? { name: ds.name, rows: ds.rows, headers: ds.columns.map((c) => c.name), rowCount: ds.rowCount } : undefined,
    lastActivity: workspaceStats(ws).lastActivity,
    assessments: client.assessments,
  };
}
