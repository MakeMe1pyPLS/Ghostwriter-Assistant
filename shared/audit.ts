// Activity log: a plain record of what changed in a workspace (data added or
// removed, actions created or finished, clients added, files downloaded).
//
// Honest limits, repeated in the app: the log is kept in this browser only, it is
// not tamper-proof, and it is not shared with anyone. A team audit trail kept on a
// server is not built yet.
//
// What it records: names, counts and ids. It never records file contents, rows,
// notes text, passwords, API keys or tokens, and it scrubs anything that looks like a key.
//
// Pure TypeScript with no dependencies.

export type AuditKind =
  | 'data-added' | 'data-removed' | 'data-archived' | 'data-restored'
  | 'action-added' | 'action-status' | 'action-removed'
  | 'client-added' | 'client-removed' | 'workspace-switched'
  | 'export' | 'bulk';

export interface AuditChange { kind: AuditKind; summary: string }

export const AUDIT_KIND_LABEL: Record<AuditKind, string> = {
  'data-added': 'Data added', 'data-removed': 'Data removed', 'data-archived': 'Data archived', 'data-restored': 'Data restored',
  'action-added': 'Action added', 'action-status': 'Action updated', 'action-removed': 'Action removed',
  'client-added': 'Client added', 'client-removed': 'Client removed', 'workspace-switched': 'Workspace switched',
  export: 'Download', bulk: 'Many changes',
};

/** Things that look like keys or tokens are replaced, wherever they appear. */
const SECRET = /\b(?:sk|pk|rk|whsec)_[A-Za-z0-9_]{8,}\b|\bsk-[A-Za-z0-9_-]{16,}\b|\bAIza[0-9A-Za-z_-]{20,}\b|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{5,}\b|\bBearer\s+[A-Za-z0-9._-]{12,}/g;

export function clean(text: unknown, max = 120): string {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim().replace(SECRET, '[hidden]');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export interface DatasetLike { id: string; name?: string; rowCount?: number; archived?: boolean }
export interface ActionLike { id: string; title?: string; status?: string }
export interface ClientLike { id: string; name?: string }

/** Changes bigger than this are summarised as one entry (a sync or a plan, not a person clicking). */
export const BULK = { datasets: 4, actions: 10, clients: 4 };

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
const safeList = <T>(x: T[] | undefined | null): T[] => (Array.isArray(x) ? x.filter(Boolean) : []);

export function diffDatasets(prev: DatasetLike[] | undefined, next: DatasetLike[] | undefined): AuditChange[] {
  const a = safeList(prev), b = safeList(next);
  const pm = byId(a), nm = byId(b);
  const added = b.filter((d) => !pm.has(d.id));
  const removed = a.filter((d) => !nm.has(d.id));
  if (added.length >= BULK.datasets || removed.length >= BULK.datasets) {
    return [{ kind: 'bulk', summary: `${added.length} data files added and ${removed.length} removed at once (for example a sync or switching workspace).` }];
  }
  const out: AuditChange[] = [];
  added.forEach((d) => out.push({ kind: 'data-added', summary: `Added data file "${clean(d.name, 60)}"${d.rowCount ? ` (${d.rowCount.toLocaleString('en-US')} rows)` : ''}.` }));
  removed.forEach((d) => out.push({ kind: 'data-removed', summary: `Removed data file "${clean(d.name, 60)}".` }));
  for (const d of b) {
    const old = pm.get(d.id);
    if (!old) continue;
    if (!old.archived && d.archived) out.push({ kind: 'data-archived', summary: `Archived data file "${clean(d.name, 60)}".` });
    if (old.archived && !d.archived) out.push({ kind: 'data-restored', summary: `Restored data file "${clean(d.name, 60)}".` });
  }
  return out;
}

export function diffActions(prev: ActionLike[] | undefined, next: ActionLike[] | undefined): AuditChange[] {
  const a = safeList(prev), b = safeList(next);
  const pm = byId(a), nm = byId(b);
  const added = b.filter((x) => !pm.has(x.id));
  const removed = a.filter((x) => !nm.has(x.id));
  if (added.length >= BULK.actions || removed.length >= BULK.actions) {
    return [{ kind: 'bulk', summary: `${added.length} actions added and ${removed.length} removed at once (for example a new plan, a sync or switching workspace).` }];
  }
  const out: AuditChange[] = [];
  added.forEach((x) => out.push({ kind: 'action-added', summary: `Added action "${clean(x.title, 80)}".` }));
  removed.forEach((x) => out.push({ kind: 'action-removed', summary: `Removed action "${clean(x.title, 80)}".` }));
  for (const x of b) {
    const old = pm.get(x.id);
    if (old && old.status !== x.status) out.push({ kind: 'action-status', summary: `Action "${clean(x.title, 80)}" changed from ${clean(old.status, 12)} to ${clean(x.status, 12)}.` });
  }
  return out;
}

export function diffClients(prev: ClientLike[] | undefined, next: ClientLike[] | undefined): AuditChange[] {
  const a = safeList(prev), b = safeList(next);
  const pm = byId(a), nm = byId(b);
  const added = b.filter((x) => !pm.has(x.id));
  const removed = a.filter((x) => !nm.has(x.id));
  if (added.length >= BULK.clients || removed.length >= BULK.clients) {
    return [{ kind: 'bulk', summary: `${added.length} clients added and ${removed.length} removed at once (for example signing in or out).` }];
  }
  return [
    ...added.map((x): AuditChange => ({ kind: 'client-added', summary: `Added client "${clean(x.name, 60)}".` })),
    ...removed.map((x): AuditChange => ({ kind: 'client-removed', summary: `Removed client "${clean(x.name, 60)}".` })),
  ];
}

export interface AuditEntry { id: string; at: number; kind: AuditKind; summary: string; workspace: string }

export const AUDIT_MAX = 500;

/** Add entries, newest first, keeping at most AUDIT_MAX. */
export function appendEntries(existing: AuditEntry[], add: AuditEntry[], max = AUDIT_MAX): AuditEntry[] {
  return [...add, ...existing].slice(0, max);
}

/** A CSV the person can download or hand to someone. Cells starting with = + - @ are neutralised for spreadsheets. */
export function auditCsv(entries: AuditEntry[]): string {
  const cell = (v: string) => {
    const t = /^[=+\-@]/.test(v) ? `'${v}` : v;
    return `"${t.replace(/"/g, '""')}"`;
  };
  return ['When,Workspace,Type,What happened', ...entries.map((e) => [new Date(e.at).toISOString(), e.workspace, AUDIT_KIND_LABEL[e.kind], e.summary].map(cell).join(','))].join('\n') + '\n';
}
