import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  businessStructure: BusinessStructure;
  connectedSectors: Sector[];
  dataSharingEnabled: boolean;
  hubEnabled: boolean;
  dataShareRequests: DataShareRequest[];
  setupComplete: boolean;
  analystMode: boolean;

  // Auth
  currentUser: AuthUser | null;
  tutorialCompleted: boolean;
  isDemoMode: boolean;

  setSector: (sector: Sector) => void;
  setSectorMode: (mode: SectorMode) => void;
  setRange: (range: DateRange) => void;
  refresh: () => void;
  setImportedData: (data: any[] | null) => void;

  setBusinessStructure: (structure: BusinessStructure) => void;
  setConnectedSectors: (sectors: Sector[]) => void;
  setDataSharingEnabled: (enabled: boolean) => void;
  setHubEnabled: (enabled: boolean) => void;
  addDataShareRequest: (request: Omit<DataShareRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateDataShareRequestStatus: (id: string, status: DataShareStatus) => void;
  completeSetup: () => void;
  dismissSetup: () => void;
  setAnalystMode: (enabled: boolean) => void;

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

      businessStructure: 'single',
      connectedSectors: ['ecommerce'],
      dataSharingEnabled: false,
      hubEnabled: false,
      dataShareRequests: [],
      setupComplete: false,
      analystMode: false,

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
