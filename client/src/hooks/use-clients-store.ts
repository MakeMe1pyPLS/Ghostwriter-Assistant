// Consultant workspace: a consultant or agency keeps a separate workspace per
// client business (plan, actions, consult sessions, datasets, dashboards) and
// switches between them. The active workspace lives in the normal growth and
// dashboard stores, so every page works unchanged; inactive ones are parked
// here. Saved in this browser until Phase 2 adds accounts and a database.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useGrowthStore, GROWTH_WORKSPACE_KEYS, emptyGrowthWorkspace, type GrowthWorkspace, type ActionItem } from './use-growth-store';
import { useDashboardStore } from './use-dashboard-store';

export type EngagementType = 'Project' | 'Monthly retainer' | 'Advisory' | 'One-off review';
export type ClientStatus = 'Onboarding' | 'Active' | 'Paused' | 'Completed';
export const ENGAGEMENT_TYPES: EngagementType[] = ['Project', 'Monthly retainer', 'Advisory', 'One-off review'];
export const CLIENT_STATUSES: ClientStatus[] = ['Onboarding', 'Active', 'Paused', 'Completed'];

const DASHBOARD_WORKSPACE_KEYS = ['datasetLibrary', 'activeDatasetBySector', 'dashboards', 'connectedSectors', 'businessStructure', 'selectedSector', 'sectorMode'] as const;
type DashboardState = ReturnType<typeof useDashboardStore.getState>;
export type DashboardWorkspace = Pick<DashboardState, typeof DASHBOARD_WORKSPACE_KEYS[number]>;

export interface WorkspaceSnapshot {
  growth: GrowthWorkspace;
  dashboard: DashboardWorkspace;
}

export interface ClientNote { id: string; text: string; createdAt: number }

export interface ClientRecord {
  id: string;
  name: string;
  industryId?: string;
  contactName?: string;
  contactEmail?: string;
  engagement: EngagementType;
  status: ClientStatus;
  /** yyyy-mm-dd */
  nextReview?: string;
  notes: ClientNote[];
  createdAt: number;
  /** Parked workspace. Undefined while this client is the active one (or before first use). */
  workspace?: WorkspaceSnapshot;
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = structuredCloneSafe(obj[k]);
  return out;
}
function structuredCloneSafe<V>(v: V): V {
  try { return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)); } catch { return v; }
}

function emptyDashboardWorkspace(): DashboardWorkspace {
  return { datasetLibrary: [], activeDatasetBySector: {}, dashboards: {}, connectedSectors: ['ecommerce'], businessStructure: 'single', selectedSector: 'unified', sectorMode: 'unified' };
}

/** Copy of whatever workspace is live right now. */
export function captureLiveWorkspace(): WorkspaceSnapshot {
  return {
    growth: pick(useGrowthStore.getState(), GROWTH_WORKSPACE_KEYS),
    dashboard: pick(useDashboardStore.getState(), DASHBOARD_WORKSPACE_KEYS),
  };
}

function loadLiveWorkspace(ws: WorkspaceSnapshot | null | undefined) {
  const growth = ws?.growth ?? emptyGrowthWorkspace();
  const dashboard = ws?.dashboard ?? emptyDashboardWorkspace();
  useGrowthStore.setState({ ...emptyGrowthWorkspace(), ...growth });
  useDashboardStore.setState({ ...emptyDashboardWorkspace(), ...dashboard, importedData: null });
}

// Writes can fail when the browser's storage is full (large datasets). Keep the
// app running and let the clients page warn about it.
let storageFull = false;
export const isStorageFull = () => storageFull;
const safeStorage = createJSONStorage(() => ({
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v); storageFull = false; } catch { storageFull = true; } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
}));

interface ClientsState {
  clients: ClientRecord[];
  activeClientId: string | null;
  /** The consultant's own business, parked while a client workspace is open. */
  ownWorkspace: WorkspaceSnapshot | null;

  activeClient: () => ClientRecord | undefined;
  addClient: (c: Pick<ClientRecord, 'name'> & Partial<Omit<ClientRecord, 'id' | 'createdAt' | 'notes' | 'workspace'>>) => ClientRecord;
  updateClient: (id: string, patch: Partial<Omit<ClientRecord, 'id' | 'workspace'>>) => void;
  removeClient: (id: string) => void;
  addNote: (id: string, text: string) => void;
  removeNote: (id: string, noteId: string) => void;
  /** Switch the live workspace to a client, or back to your own business (null). */
  switchTo: (id: string | null) => void;
  /** The workspace for a client (or your own business), live or parked. */
  workspaceFor: (id: string | null) => WorkspaceSnapshot | null;
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      clients: [],
      activeClientId: null,
      ownWorkspace: null,

      activeClient: () => {
        const { clients, activeClientId } = get();
        return activeClientId ? clients.find((c) => c.id === activeClientId) : undefined;
      },
      addClient: (c) => {
        const client: ClientRecord = {
          engagement: 'Project', status: 'Onboarding', ...c,
          name: c.name.trim().slice(0, 80), id: uid('cli'), createdAt: Date.now(), notes: [],
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        return client;
      },
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeClient: (id) => {
        if (get().activeClientId === id) get().switchTo(null);
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
      },
      addNote: (id, text) => {
        const t = text.trim().slice(0, 1000);
        if (!t) return;
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, notes: [{ id: uid('note'), text: t, createdAt: Date.now() }, ...c.notes] } : c)) }));
      },
      removeNote: (id, noteId) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c)) })),

      switchTo: (target) => {
        const { activeClientId, clients, ownWorkspace } = get();
        if (target === activeClientId) return;
        if (target && !clients.some((c) => c.id === target)) return;
        const live = captureLiveWorkspace();
        const incoming = target ? clients.find((c) => c.id === target)?.workspace : ownWorkspace;

        set({
          activeClientId: target,
          ownWorkspace: activeClientId === null ? live : target === null ? null : ownWorkspace,
          clients: clients.map((c) => {
            if (c.id === activeClientId) return { ...c, workspace: live };
            if (c.id === target) return { ...c, workspace: undefined };
            return c;
          }),
        });
        loadLiveWorkspace(incoming);
        // A client workspace never needs the old one-time setup dialog.
        if (target) useDashboardStore.setState({ setupComplete: true });
      },
      workspaceFor: (id) => {
        const { activeClientId, clients, ownWorkspace } = get();
        if (id === activeClientId) return captureLiveWorkspace();
        if (id === null) return ownWorkspace;
        return clients.find((c) => c.id === id)?.workspace ?? null;
      },
    }),
    {
      name: 'chaininsideiq-clients',
      version: 1,
      storage: safeStorage,
      partialize: (s) => ({ clients: s.clients, activeClientId: s.activeClientId, ownWorkspace: s.ownWorkspace }),
    },
  ),
);

// ------------------------------------------------------------------ summaries

export interface WorkspaceStats {
  businessName?: string;
  planHeadline?: string;
  northStar?: string;
  total: number;
  done: number;
  overdue: number;
  sessions: number;
  decisions: number;
  lastActivity?: number;
  hasPlan: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (a: ActionItem) => a.status !== 'done' && !!a.dueDate && a.dueDate < today();

export function workspaceStats(ws: WorkspaceSnapshot | null | undefined): WorkspaceStats {
  const g = ws?.growth;
  const actions = g?.actions ?? [];
  const sessions = g?.consultSessions ?? [];
  const times = [
    ...actions.map((a) => a.completedAt ?? a.createdAt),
    ...sessions.map((s) => s.decidedAt ?? s.createdAt),
  ];
  return {
    businessName: g?.profile?.businessName,
    planHeadline: g?.plan?.headline,
    northStar: g?.plan ? `${g.plan.northStar.name} → ${g.plan.northStar.target}` : undefined,
    total: actions.length,
    done: actions.filter((a) => a.status === 'done').length,
    overdue: actions.filter(isOverdue).length,
    sessions: sessions.length,
    decisions: sessions.filter((s) => s.chosenOptionId).length,
    lastActivity: times.length ? Math.max(...times) : undefined,
    hasPlan: !!g?.plan,
  };
}

/** Rough size of what this browser stores for the app, in bytes. */
export function storageUsage(): number {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (k.startsWith('chaininsideiq')) n += (localStorage.getItem(k)?.length ?? 0) * 2;
    }
    return n;
  } catch { return 0; }
}
