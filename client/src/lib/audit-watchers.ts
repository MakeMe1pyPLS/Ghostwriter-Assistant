// Watches the three stores and writes plain entries to the activity log.
// It never reads file contents: only names, counts and ids reach shared/audit.ts.
import { useGrowthStore } from '@/hooks/use-growth-store';
import { useDashboardStore } from '@/hooks/use-dashboard-store';
import { useClientsStore } from '@/hooks/use-clients-store';
import { recordAudit, auditPaused } from '@/hooks/use-audit-store';
import { diffActions, diffClients, diffDatasets, clean, type AuditChange } from '@shared/audit';

let started = false;

export function workspaceLabel(): string {
  const c = useClientsStore.getState();
  const client = c.activeClientId ? c.clients.find((x) => x.id === c.activeClientId) : undefined;
  return client ? clean(client.name, 60) : 'My business';
}

const log = (changes: AuditChange[], workspace = workspaceLabel()) => changes.forEach((c) => recordAudit(c.kind, c.summary, workspace));

export function startAuditWatchers() {
  if (started) return;
  started = true;

  // When the open workspace changes, the growth and dashboard stores are swapped for the other
  // workspace's data. That swap is not the person adding or removing anything, so it is not logged.
  let swapping = false;

  useGrowthStore.subscribe((s, p) => {
    if (s.actions === p.actions || swapping || auditPaused()) return;
    log(diffActions(p.actions, s.actions));
  });
  useDashboardStore.subscribe((s, p) => {
    if (s.datasetLibrary === p.datasetLibrary || swapping || auditPaused()) return;
    log(diffDatasets(p.datasetLibrary, s.datasetLibrary));
  });
  useClientsStore.subscribe((s, p) => {
    if (s.activeClientId !== p.activeClientId) {
      swapping = true;
      queueMicrotask(() => { swapping = false; });
      if (!auditPaused()) {
        const to = s.activeClientId ? s.clients.find((c) => c.id === s.activeClientId)?.name : undefined;
        recordAudit('workspace-switched', `Opened ${s.activeClientId ? `client "${clean(to, 60)}"` : 'your own business'}.`, workspaceLabel());
      }
      return;
    }
    if (s.clients === p.clients || auditPaused()) return;
    // A client's parked workspace changing is not a client being added or removed; compare by id only.
    log(diffClients(p.clients, s.clients), 'All clients');
  });
}
