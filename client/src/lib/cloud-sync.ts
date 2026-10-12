// Keeps a signed-in user's workspaces in their account.
//
// The app still works from the browser stores (fast, works offline); this
// module mirrors them to Supabase:
//   • On sign-in: anything made before signing in is moved into the account;
//     on a new device the account's data is loaded.
//   • While working: changes are saved a couple of seconds after they happen,
//     per workspace (your business, and each client).
//   • On sign-out: the session ends and this browser's copy is cleared, so the
//     next person on the computer can't see it.
import { create } from 'zustand';
import {
  cloudEnabled, getSession, onSessionChange, consumeAuthRedirect, getProfile, listWorkspaces, upsertWorkspaces,
  deleteWorkspaces, signOut as cloudSignOut, CloudError, type CloudSession, type WorkspaceRow,
} from '@/lib/supabase';
import { useGrowthStore, GROWTH_WORKSPACE_KEYS, emptyGrowthWorkspace } from '@/hooks/use-growth-store';
import { useDashboardStore, type AuthUser, type PlanTier } from '@/hooks/use-dashboard-store';
import {
  useClientsStore, DASHBOARD_WORKSPACE_KEYS, emptyDashboardWorkspace, loadLiveWorkspace,
  type ClientRecord, type WorkspaceSnapshot,
} from '@/hooks/use-clients-store';

export type SyncState = 'off' | 'loading' | 'syncing' | 'saved' | 'offline' | 'error';
export const useSyncStatus = create<{ state: SyncState; lastSyncedAt?: number; message?: string }>(() => ({ state: 'off' }));
const status = (state: SyncState, message?: string) =>
  useSyncStatus.setState({ state, message, ...(state === 'saved' ? { lastSyncedAt: Date.now() } : {}) });

const OWNER_KEY = 'ciq_data_owner';
const AUTH_RESULT_KEY = 'ciq_auth_result';
const OWN = 'own';
const PLANS: PlanTier[] = ['trial', 'starter', 'professional', 'business', 'enterprise'];

let activeUserId: string | null = null;
let unsubscribers: (() => void)[] = [];

// ------------------------------------------------------------------ snapshots

const pickKeys = <T extends object, K extends keyof T>(o: T, keys: readonly K[]) => {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = o[k];
  return out;
};
const liveGrowth = () => pickKeys(useGrowthStore.getState(), GROWTH_WORKSPACE_KEYS);
const liveDashboard = () => pickKeys(useDashboardStore.getState(), DASHBOARD_WORKSPACE_KEYS);
const activeId = () => useClientsStore.getState().activeClientId ?? OWN;

/** The current copy of a workspace: live if it's open, otherwise the parked snapshot. */
function snapshotOf(id: string): WorkspaceSnapshot | null {
  if (id === activeId()) return { growth: liveGrowth(), dashboard: liveDashboard() };
  const c = useClientsStore.getState();
  if (id === OWN) return c.ownWorkspace;
  return c.clients.find((x) => x.id === id)?.workspace ?? null;
}

const META_KEYS = ['industryId', 'contactName', 'contactEmail', 'engagement', 'status', 'nextReview', 'notes', 'createdAt'] as const;
const metaOf = (c: ClientRecord) => pickKeys(c, META_KEYS);

function clientFromRow(row: WorkspaceRow): ClientRecord {
  const m = row.meta ?? {};
  return {
    id: row.id,
    name: row.name || 'Client',
    industryId: m.industryId,
    contactName: m.contactName,
    contactEmail: m.contactEmail,
    engagement: m.engagement ?? 'Project',
    status: m.status ?? 'Active',
    nextReview: m.nextReview,
    notes: Array.isArray(m.notes) ? m.notes : [],
    createdAt: Number(m.createdAt) || Date.now(),
    workspace: snapshotFromRow(row),
  };
}

function snapshotFromRow(row: WorkspaceRow): WorkspaceSnapshot {
  return {
    growth: { ...emptyGrowthWorkspace(), ...(row.growth ?? {}) },
    dashboard: { ...emptyDashboardWorkspace(), ...(row.dashboard ?? {}) },
  };
}

const hasWork = (g: any) => !!(g && (g.profile || g.plan || (Array.isArray(g.actions) && g.actions.length) || (Array.isArray(g.consultSessions) && g.consultSessions.length)));

// ------------------------------------------------------------------ change tracking

const dirty = new Map<string, Set<'growth' | 'dashboard'>>();
const lastMeta = new Map<string, string>();
let switching = false;
let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;
let retryDelay = 4000;

function markDirty(id: string, part: 'growth' | 'dashboard') {
  if (!activeUserId || switching || applying) return;
  const parts = dirty.get(id) ?? new Set();
  parts.add(part);
  dirty.set(id, parts);
  schedule();
}

function schedule(delay = 1800) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void flush(); }, delay);
}

function subscribe() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [
    useGrowthStore.subscribe((s, p) => {
      if (GROWTH_WORKSPACE_KEYS.some((k) => s[k] !== p[k])) markDirty(activeId(), 'growth');
    }),
    useDashboardStore.subscribe((s, p) => {
      if (DASHBOARD_WORKSPACE_KEYS.some((k) => s[k] !== p[k])) markDirty(activeId(), 'dashboard');
    }),
    useClientsStore.subscribe((s, p) => {
      // Switching workspaces reloads the live stores; that isn't an edit.
      if (s.activeClientId !== p.activeClientId) {
        switching = true;
        queueMicrotask(() => { switching = false; });
      }
      if (s.clients !== p.clients && activeUserId && !applying) schedule();
    }),
  ];
}

/** Save everything that changed. Safe to call any time. */
export async function flush(): Promise<void> {
  if (!activeUserId) return;
  if (flushing) { await flushing; if (!dirty.size && !clientsChanged()) return; }
  flushing = (async () => {
    const work = new Map(dirty);
    dirty.clear();
    const rows = new Map<string, any>();
    for (const [id, parts] of work) {
      const snap = snapshotOf(id);
      if (!snap) continue; // removed meanwhile
      const row = rows.get(id) ?? { id, kind: id === OWN ? 'own' : 'client' };
      if (parts.has('growth')) {
        row.growth = snap.growth;
        if (id === OWN) row.name = (snap.growth.profile?.businessName || 'My business').slice(0, 120);
      }
      if (parts.has('dashboard')) row.dashboard = snap.dashboard;
      rows.set(id, row);
    }
    const { clients } = useClientsStore.getState();
    const nextMeta = new Map<string, string>();
    for (const c of clients) {
      const m = JSON.stringify([c.name, metaOf(c)]);
      nextMeta.set(c.id, m);
      if (lastMeta.get(c.id) !== m) {
        const row = rows.get(c.id) ?? { id: c.id, kind: 'client' };
        row.name = c.name.slice(0, 120);
        row.meta = metaOf(c);
        // A brand-new client also needs its workspace saved.
        if (!lastMeta.has(c.id) && row.growth === undefined) {
          const snap = snapshotOf(c.id) ?? { growth: emptyGrowthWorkspace(), dashboard: emptyDashboardWorkspace() };
          row.growth = snap.growth; row.dashboard = snap.dashboard;
        }
        rows.set(c.id, row);
      }
    }
    const removed = [...lastMeta.keys()].filter((id) => !nextMeta.has(id));
    if (!rows.size && !removed.length) return;
    status('syncing');
    try {
      await upsertWorkspaces([...rows.values()]);
      await deleteWorkspaces(removed);
      lastMeta.clear();
      nextMeta.forEach((v, k) => lastMeta.set(k, v));
      retryDelay = 4000;
      status('saved');
    } catch (e) {
      // Put the work back and try again later.
      for (const [id, parts] of work) {
        const cur = dirty.get(id) ?? new Set();
        parts.forEach((x) => cur.add(x));
        dirty.set(id, cur);
      }
      const offline = e instanceof CloudError && e.code === 'network';
      status(offline ? 'offline' : 'error', e instanceof Error ? e.message : undefined);
      if (e instanceof CloudError && e.code === 'no_session') return;
      schedule(retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60_000);
    }
  })();
  try { await flushing; } finally { flushing = null; }
}

function clientsChanged(): boolean {
  const { clients } = useClientsStore.getState();
  if (clients.length !== lastMeta.size) return true;
  return clients.some((c) => lastMeta.get(c.id) !== JSON.stringify([c.name, metaOf(c)]));
}

// ------------------------------------------------------------------ sign-in

function toAuthUser(s: CloudSession, profile: Awaited<ReturnType<typeof getProfile>>): AuthUser {
  const plan = PLANS.includes(profile?.plan as PlanTier) ? (profile!.plan as PlanTier) : 'trial';
  return {
    id: s.user.id,
    fullName: profile?.full_name || s.user.fullName || s.user.email.split('@')[0],
    email: s.user.email,
    emailVerified: s.user.emailConfirmed,
    plan,
    trialStartedAt: profile?.trial_started_at ? Date.parse(profile.trial_started_at) : s.user.createdAt,
    createdAt: profile?.created_at ? Date.parse(profile.created_at) : s.user.createdAt,
  };
}

/**
 * Called after sign-in (and on load when a session exists): loads the profile,
 * merges this browser's workspaces with the account's, and starts syncing.
 */
let activating: { id: string; done: Promise<void> } | null = null;
export function activate(s: CloudSession): Promise<void> {
  if (activeUserId === s.user.id) return Promise.resolve();
  if (activating?.id === s.user.id) return activating.done;
  const done = doActivate(s).finally(() => { if (activating?.done === done) activating = null; });
  activating = { id: s.user.id, done };
  return done;
}

async function doActivate(s: CloudSession): Promise<void> {
  status('loading');
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try { profile = await getProfile(); } catch { /* use defaults */ }
  useDashboardStore.setState({ currentUser: toAuthUser(s, profile), isDemoMode: false });

  let rows: WorkspaceRow[];
  try {
    rows = await listWorkspaces();
  } catch (e) {
    status(e instanceof CloudError && e.code === 'network' ? 'offline' : 'error', e instanceof Error ? e.message : undefined);
    // Keep working locally; try again when the connection is back.
    setTimeout(() => { if (getSession()?.user.id === s.user.id && activeUserId !== s.user.id) void activate(s); }, 15_000);
    return;
  }

  applying = true;
  const toPush: string[] = [];
  try {
    // Data left in this browser by a different account is never merged in.
    let owner: string | null = null;
    try { owner = localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
    if (owner && owner !== s.user.id) clearLocalData();

    // Work from "my business" open, with clients parked.
    useClientsStore.getState().switchTo(null);
    const local = useClientsStore.getState();

    const ownRow = rows.find((r) => r.kind === 'own');
    if (ownRow && hasWork(ownRow.growth)) {
      loadLiveWorkspace(snapshotFromRow(ownRow));
    } else {
      toPush.push(OWN);
    }

    const cloudClients = rows.filter((r) => r.kind === 'client').map(clientFromRow);
    const cloudIds = new Set(cloudClients.map((c) => c.id));
    const localOnly = local.clients.filter((c) => !cloudIds.has(c.id));
    useClientsStore.setState({ clients: [...localOnly, ...cloudClients], activeClientId: null, ownWorkspace: null });

    lastMeta.clear();
    for (const c of cloudClients) lastMeta.set(c.id, JSON.stringify([c.name, metaOf(c)]));
    // Local-only clients are absent from lastMeta, so the next flush uploads them with their workspaces.
    try { localStorage.setItem(OWNER_KEY, s.user.id); } catch { /* ignore */ }
  } finally {
    applying = false;
  }

  activeUserId = s.user.id;
  subscribe();
  for (const id of toPush) dirty.set(id, new Set(['growth', 'dashboard']));
  await flush();
  if (useSyncStatus.getState().state === 'loading') status('saved');
}

/** Empty this browser's copy of every workspace. */
export function clearLocalData() {
  applying = true;
  try {
    useClientsStore.setState({ clients: [], activeClientId: null, ownWorkspace: null });
    loadLiveWorkspace(null);
    useGrowthStore.setState({ tourComplete: false });
  } finally {
    applying = false;
  }
  dirty.clear();
  lastMeta.clear();
  try { localStorage.removeItem(OWNER_KEY); } catch { /* ignore */ }
}

/** Save pending changes, end the session and clear this browser. */
export async function signOutEverywhere(): Promise<void> {
  try { await Promise.race([flush(), new Promise((r) => setTimeout(r, 4000))]); } catch { /* ignore */ }
  stop();
  // Clear first, so other open tabs see the data owner gone when the session ends.
  clearLocalData();
  useDashboardStore.setState({ currentUser: null, isDemoMode: false });
  await cloudSignOut();
}

function stop() {
  activeUserId = null;
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  if (timer) { clearTimeout(timer); timer = null; }
  status('off');
}

/** Result of the last email link (confirm sign-up / reset password), for those pages to show. */
export function takeAuthResult(): { type: string; error?: string; email?: string } | null {
  try {
    const raw = sessionStorage.getItem(AUTH_RESULT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AUTH_RESULT_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}

// ------------------------------------------------------------------ start

let started = false;

/** Call once when the app loads. Does nothing when accounts are switched off. */
export function startCloudSync() {
  if (started || !cloudEnabled) return;
  started = true;

  const handleLink = async () => {
    const r = await consumeAuthRedirect();
    if (r) {
      try { sessionStorage.setItem(AUTH_RESULT_KEY, JSON.stringify({ type: r.type, error: r.error, email: r.session?.user.email })); } catch { /* ignore */ }
      window.dispatchEvent(new Event('ciq-auth-result'));
      const target = r.type === 'recovery' ? '/reset-password' : '/verify-email';
      if (window.location.pathname !== target) {
        history.replaceState(null, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
    return r;
  };
  void (async () => {
    await handleLink();
    const s = getSession();
    if (s) await activate(s);
  })();
  // An email link opened in a tab that's already on the site only changes the hash.
  window.addEventListener('hashchange', () => { void handleLink(); });

  onSessionChange((s) => {
    if (s && s.user.id !== activeUserId) void activate(s);
    if (!s && activeUserId) {
      // Signed out in another tab (which already cleared the shared storage),
      // or the session expired here (keep the data; signing back in syncs it).
      let signedOutElsewhere = false;
      try { signedOutElsewhere = !localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
      stop();
      if (signedOutElsewhere) clearLocalData();
      useDashboardStore.setState({ currentUser: null });
    }
  });

  // The app's sign-out buttons call the store; finish the job here.
  window.addEventListener('ciq-sign-out', () => {
    if (activeUserId || getSession()) void signOutEverywhere();
  });

  window.addEventListener('online', () => { if (dirty.size) schedule(500); });
  // Last chance to save small pending edits when the tab closes.
  window.addEventListener('pagehide', () => { if (dirty.size) void flush(); });
}
