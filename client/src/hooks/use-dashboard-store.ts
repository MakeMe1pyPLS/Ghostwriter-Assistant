import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type DashboardData, defaultDashboard } from '@/lib/dashboard-grid';
import { type ManagedDataset, MAX_PERSISTED_ROWS } from '@/lib/dataset-library';

export type Sector = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';
export type SectorMode = 'single' | 'unified';
export type DateRange = '7d' | '30d' | '90d';
export type BusinessStructure = 'single' | 'partnered' | 'unified-chain';
export type DataShareStatus = 'pending' | 'approved' | 'rejected';
export type PlanTier = 'trial' | 'starter' | 'professional' | 'business' | 'enterprise';

export interface DataShareRequest {
  id: string;
  fromSector: Sector;
  toSector: Sector;
  dataset: string;
  message: string;
  status: DataShareStatus;
  createdAt: number;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  plan: PlanTier;
  trialStartedAt: number | null;
  createdAt: number;
}

const TRIAL_LENGTH_DAYS = 14;

interface DashboardState {
  selectedSector: Sector;
  sectorMode: SectorMode;
  selectedRange: DateRange;
  lastRefreshed: number;
  importedData: any[] | null;

  // Per-sector dataset library (replaces the single anonymous imported-data slot)
  datasetLibrary: ManagedDataset[];
  activeDatasetBySector: Record<string, string | null>;

  businessStructure: BusinessStructure;
  connectedSectors: Sector[];
  dataSharingEnabled: boolean;
  hubEnabled: boolean;
  dataShareRequests: DataShareRequest[];
  setupComplete: boolean;
  analystMode: boolean;

  // Per-sector dashboard configuration (single source of truth for Builder + Dashboard)
  dashboards: Record<string, DashboardData>;

  // Auth
  currentUser: AuthUser | null;
  tutorialCompleted: boolean;
  isDemoMode: boolean;

  setSector: (sector: Sector) => void;
  setSectorMode: (mode: SectorMode) => void;
  setRange: (range: DateRange) => void;
  refresh: () => void;
  setImportedData: (data: any[] | null) => void;

  // Dataset library actions
  addDataset: (input: {
    name: string;
    sector: Sector;
    columns: ManagedDataset['columns'];
    rows: Record<string, any>[];
    rowCount?: number;
    sourceType: ManagedDataset['sourceType'];
  }) => ManagedDataset;
  mergeIntoDataset: (targetId: string, rows: Record<string, any>[], columns: ManagedDataset['columns']) => void;
  overwriteDataset: (targetId: string, input: {
    name?: string;
    columns: ManagedDataset['columns'];
    rows: Record<string, any>[];
    rowCount?: number;
    sourceType: ManagedDataset['sourceType'];
  }) => void;
  setActiveDataset: (sector: Sector, id: string | null) => void;
  archiveDataset: (id: string) => void;
  restoreDataset: (id: string) => void;
  renameDataset: (id: string, name: string) => void;
  removeDataset: (id: string) => void;

  setBusinessStructure: (structure: BusinessStructure) => void;
  setConnectedSectors: (sectors: Sector[]) => void;
  setDataSharingEnabled: (enabled: boolean) => void;
  setHubEnabled: (enabled: boolean) => void;
  addDataShareRequest: (request: Omit<DataShareRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateDataShareRequestStatus: (id: string, status: DataShareStatus) => void;
  completeSetup: () => void;
  dismissSetup: () => void;
  setAnalystMode: (enabled: boolean) => void;

  // Dashboard layout/widget persistence
  ensureDashboardLoaded: (sector: string) => void;
  saveDashboard: (sector: string, layout: any[], widgets: any[]) => void;
  resetDashboard: (sector: string) => void;

  // Auth actions
  signUp: (input: { fullName: string; email: string; password: string }) => AuthUser;
  signIn: (input: { email: string; password: string }) => AuthUser;
  signOut: () => void;
  verifyEmail: () => void;
  setPlan: (plan: PlanTier) => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      selectedSector: 'unified',
      sectorMode: 'unified',
      selectedRange: '30d',
      lastRefreshed: Date.now(),
      importedData: null,

      datasetLibrary: [],
      activeDatasetBySector: {},

      businessStructure: 'single',
      connectedSectors: ['ecommerce'],
      dataSharingEnabled: false,
      hubEnabled: false,
      dataShareRequests: [],
      setupComplete: false,
      analystMode: false,

      dashboards: {},

      currentUser: null,
      tutorialCompleted: false,
      isDemoMode: false,

      setSector: (sector) => set({ selectedSector: sector }),
      setSectorMode: (mode) => set({
        sectorMode: mode,
        selectedSector: mode === 'unified' ? 'unified' : 'ecommerce',
      }),
      setRange: (range) => set({ selectedRange: range }),
      refresh: () => set({ lastRefreshed: Date.now() }),
      setImportedData: (data) => set({ importedData: data }),

      addDataset: (input) => {
        const id = `mds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const rows = (input.rows || []).slice(0, MAX_PERSISTED_ROWS);
        const dataset: ManagedDataset = {
          id,
          name: input.name?.trim() || 'Untitled Dataset',
          sector: input.sector,
          columns: input.columns || [],
          rows,
          rowCount: input.rowCount ?? input.rows?.length ?? rows.length,
          sourceType: input.sourceType,
          createdAt: Date.now(),
          archived: false,
        };
        set((state) => ({
          datasetLibrary: [...state.datasetLibrary, dataset],
          activeDatasetBySector: { ...state.activeDatasetBySector, [input.sector]: id },
        }));
        return dataset;
      },
      mergeIntoDataset: (targetId, rows, columns) => set((state) => ({
        datasetLibrary: state.datasetLibrary.map((d) => {
          if (d.id !== targetId) return d;
          const existingNames = new Set(d.columns.map((c) => c.name));
          const mergedColumns = [
            ...d.columns,
            ...columns.filter((c) => !existingNames.has(c.name)),
          ];
          const mergedRows = [...d.rows, ...(rows || [])].slice(0, MAX_PERSISTED_ROWS);
          return {
            ...d,
            columns: mergedColumns,
            rows: mergedRows,
            rowCount: d.rowCount + (rows?.length ?? 0),
          };
        }),
      })),
      overwriteDataset: (targetId, input) => set((state) => {
        const rows = (input.rows || []).slice(0, MAX_PERSISTED_ROWS);
        return {
          datasetLibrary: state.datasetLibrary.map((d) =>
            d.id === targetId
              ? {
                  ...d,
                  name: input.name?.trim() || d.name,
                  columns: input.columns || [],
                  rows,
                  rowCount: input.rowCount ?? input.rows?.length ?? rows.length,
                  sourceType: input.sourceType,
                }
              : d
          ),
        };
      }),
      setActiveDataset: (sector, id) => set((state) => ({
        activeDatasetBySector: { ...state.activeDatasetBySector, [sector]: id },
      })),
      archiveDataset: (id) => set((state) => {
        const target = state.datasetLibrary.find((d) => d.id === id);
        const nextActive = { ...state.activeDatasetBySector };
        if (target && nextActive[target.sector] === id) {
          // Promote another non-archived dataset in the same sector, if any.
          const replacement = state.datasetLibrary.find(
            (d) => d.sector === target.sector && d.id !== id && !d.archived
          );
          nextActive[target.sector] = replacement ? replacement.id : null;
        }
        return {
          datasetLibrary: state.datasetLibrary.map((d) => (d.id === id ? { ...d, archived: true } : d)),
          activeDatasetBySector: nextActive,
        };
      }),
      restoreDataset: (id) => set((state) => {
        const target = state.datasetLibrary.find((d) => d.id === id);
        const nextActive = { ...state.activeDatasetBySector };
        if (target && !nextActive[target.sector]) {
          nextActive[target.sector] = id;
        }
        return {
          datasetLibrary: state.datasetLibrary.map((d) => (d.id === id ? { ...d, archived: false } : d)),
          activeDatasetBySector: nextActive,
        };
      }),
      renameDataset: (id, name) => set((state) => ({
        datasetLibrary: state.datasetLibrary.map((d) =>
          d.id === id ? { ...d, name: name.trim() || d.name } : d
        ),
      })),
      removeDataset: (id) => set((state) => {
        const target = state.datasetLibrary.find((d) => d.id === id);
        const nextActive = { ...state.activeDatasetBySector };
        if (target && nextActive[target.sector] === id) {
          const replacement = state.datasetLibrary.find(
            (d) => d.sector === target.sector && d.id !== id && !d.archived
          );
          nextActive[target.sector] = replacement ? replacement.id : null;
        }
        return {
          datasetLibrary: state.datasetLibrary.filter((d) => d.id !== id),
          activeDatasetBySector: nextActive,
        };
      }),

      setBusinessStructure: (structure) => {
        const updates: Partial<DashboardState> = { businessStructure: structure };
        if (structure === 'single') {
          updates.connectedSectors = [get().connectedSectors[0] || 'ecommerce'];
          updates.sectorMode = 'single';
          updates.selectedSector = updates.connectedSectors[0];
          updates.hubEnabled = false;
        } else if (structure === 'partnered') {
          if (get().connectedSectors.length < 2) {
            updates.connectedSectors = ['ecommerce', 'logistics'];
          }
          updates.sectorMode = 'single';
          updates.hubEnabled = true;
        } else {
          updates.connectedSectors = ['manufacturing', 'ecommerce', 'logistics'];
          updates.sectorMode = 'unified';
          updates.selectedSector = 'unified';
          updates.hubEnabled = true;
        }
        set(updates as any);
      },
      setConnectedSectors: (sectors) => set({ connectedSectors: sectors }),
      setDataSharingEnabled: (enabled) => set({ dataSharingEnabled: enabled }),
      setHubEnabled: (enabled) => set({ hubEnabled: enabled }),
      addDataShareRequest: (request) => set(state => ({
        dataShareRequests: [
          ...state.dataShareRequests,
          { ...request, id: `dsr-${Date.now()}`, status: 'pending' as DataShareStatus, createdAt: Date.now() },
        ],
      })),
      updateDataShareRequestStatus: (id, status) => set(state => ({
        dataShareRequests: state.dataShareRequests.map(r => r.id === id ? { ...r, status } : r),
      })),
      completeSetup: () => set({ setupComplete: true }),
      dismissSetup: () => set({ setupComplete: true }),
      setAnalystMode: (enabled) => set({ analystMode: enabled }),

      ensureDashboardLoaded: (sector) => {
        if (get().dashboards[sector]) return;
        let data: DashboardData | null = null;
        // Migrate any pre-existing per-sector layout from the legacy localStorage keys.
        try {
          const savedLayout = localStorage.getItem(`layout_${sector}`);
          const savedWidgets = localStorage.getItem(`widgets_${sector}`);
          if (savedLayout && savedWidgets) {
            data = { layout: JSON.parse(savedLayout), widgets: JSON.parse(savedWidgets) };
          }
        } catch {
          data = null;
        }
        if (!data || !Array.isArray(data.layout) || !Array.isArray(data.widgets)) {
          data = defaultDashboard();
        }
        set(state => ({ dashboards: { ...state.dashboards, [sector]: data! } }));
      },
      saveDashboard: (sector, layout, widgets) => {
        set(state => ({ dashboards: { ...state.dashboards, [sector]: { layout, widgets } } }));
        // Mirror to the legacy keys so the Export Center and dashboard-spec readers
        // that still read raw localStorage keep working.
        try {
          localStorage.setItem(`layout_${sector}`, JSON.stringify(layout));
          localStorage.setItem(`widgets_${sector}`, JSON.stringify(widgets));
        } catch {
          /* storage may be unavailable; store state is still the source of truth */
        }
      },
      resetDashboard: (sector) => {
        const data = defaultDashboard();
        set(state => ({ dashboards: { ...state.dashboards, [sector]: data } }));
        try {
          localStorage.setItem(`layout_${sector}`, JSON.stringify(data.layout));
          localStorage.setItem(`widgets_${sector}`, JSON.stringify(data.widgets));
        } catch {
          /* ignore */
        }
      },

      signUp: ({ fullName, email, password: _password }) => {
        const now = Date.now();
        const user: AuthUser = {
          id: `usr-${now}`,
          fullName,
          email,
          emailVerified: false,
          plan: 'trial',
          trialStartedAt: now,
          createdAt: now,
        };
        set({ currentUser: user, tutorialCompleted: false, isDemoMode: false });
        return user;
      },
      signIn: ({ email, password: _password }) => {
        const existing = get().currentUser;
        const now = Date.now();
        const user: AuthUser = existing && existing.email.toLowerCase() === email.toLowerCase()
          ? existing
          : {
              id: `usr-${now}`,
              fullName: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              email,
              emailVerified: true,
              plan: 'trial',
              trialStartedAt: now,
              createdAt: now,
            };
        set({ currentUser: user, isDemoMode: false });
        return user;
      },
      signOut: () => set({ currentUser: null, isDemoMode: false }),
      verifyEmail: () => set(state => ({
        currentUser: state.currentUser ? { ...state.currentUser, emailVerified: true } : null,
      })),
      setPlan: (plan) => set(state => ({
        currentUser: state.currentUser ? { ...state.currentUser, plan } : null,
        isDemoMode: false,
      })),
      completeTutorial: () => set({ tutorialCompleted: true }),
      resetTutorial: () => set({ tutorialCompleted: false }),
      enterDemoMode: () => set(state => state.currentUser ? state : { isDemoMode: true }),
      exitDemoMode: () => set({ isDemoMode: false }),
    }),
    {
      name: 'chaininsideiq-storage',
    }
  )
);

/**
 * Display label for a plan tier (e.g. "Trial Active", "Pro Plan").
 */
export function getPlanLabel(plan: PlanTier): string {
  switch (plan) {
    case 'trial': return 'Trial Active';
    case 'starter': return 'Starter Plan';
    case 'professional': return 'Pro Plan';
    case 'business': return 'Business Plan';
    case 'enterprise': return 'Enterprise Plan';
    default: return 'Account Active';
  }
}

/**
 * Single source of truth for the user's frontend access state.
 * Use this hook in any component that needs to branch on demo vs paid vs trial.
 */
export function useUserAccess() {
  const currentUser = useDashboardStore(s => s.currentUser);
  const isDemoMode = useDashboardStore(s => s.isDemoMode);
  const trial = getTrialStatus(currentUser);
  const isAuthenticated = !!currentUser;
  // A user is a "demo user" only when explicitly in demo mode AND not signed in.
  const isDemoUser = isDemoMode && !isAuthenticated;
  const plan = currentUser?.plan ?? null;
  const isTrialActive = isAuthenticated && plan === 'trial' && trial.active;
  const isPaidUser = isAuthenticated && plan !== null && plan !== 'trial';
  return {
    currentUser,
    isAuthenticated,
    isDemoUser,
    isEmailVerified: !!currentUser?.emailVerified,
    plan,
    planLabel: plan ? getPlanLabel(plan) : null,
    isTrialActive,
    isPaidUser,
    trial,
  };
}

export function getTrialStatus(user: AuthUser | null): {
  active: boolean;
  daysRemaining: number;
  totalDays: number;
  expiresAt: number | null;
} {
  if (!user || !user.trialStartedAt) {
    return { active: false, daysRemaining: 0, totalDays: TRIAL_LENGTH_DAYS, expiresAt: null };
  }
  const expiresAt = user.trialStartedAt + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000;
  const msRemaining = expiresAt - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  return {
    active: user.plan === 'trial' && msRemaining > 0,
    daysRemaining,
    totalDays: TRIAL_LENGTH_DAYS,
    expiresAt,
  };
}
