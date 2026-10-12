// Growth workspace state: the owner's goal profile, their AI growth plan, the
// action board, preset data collabs, Hub threads, AI engine choice and
// connected tools. Persisted in the browser for now; Phase 2 moves it to the
// server so partner companies share the same records.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIEnginePreference } from '@shared/ai-types';
import { describeProfile, type GrowthPlan, type GrowthProfile } from '@shared/growth';
import type { ConsultAnswers, ConsultResult, SessionKind } from '@shared/consult';

export type ActionStatus = 'todo' | 'doing' | 'done';
export type ActionSource = 'plan' | 'bottleneck' | 'hub' | 'manual' | 'consult';

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  owner: string;
  company?: string;
  dueDate?: string;          // yyyy-mm-dd
  status: ActionStatus;
  kpi?: string;
  source: ActionSource;
  sourceRef?: string;
  phaseId?: string;
  threadId?: string;
  createdAt: number;
  completedAt?: number;
}

/** A finished AI consultant session and the decision taken. */
export interface ConsultSession {
  id: string;
  kind: SessionKind;
  title: string;
  answers: ConsultAnswers;
  result: ConsultResult;
  chosenOptionId?: string;
  actionIds: string[];
  createdAt: number;
  decidedAt?: number;
}

export type CollabPermission = 'view' | 'comment' | 'edit';
export type CollabCadence = 'weekly' | 'biweekly' | 'monthly';

export interface CollabPartner {
  id: string;
  name: string;
  role: string;              // e.g. "Carrier", "Supplier"
  contact?: string;          // email
  status: 'invited' | 'active';
}

export interface Collab {
  id: string;
  name: string;
  purpose: string;
  templateId?: string;
  partners: CollabPartner[];
  datasets: string[];
  kpis: string[];
  permission: CollabPermission;
  cadence: CollabCadence;
  active: boolean;
  createdAt: number;
}

export type HubUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type HubStatus = 'Open' | 'In Progress' | 'Resolved';
export type HubType = 'message' | 'alert' | 'notification' | 'discussion';

export interface HubReply {
  id: string;
  author: string;
  company?: string;
  content: string;
  timestamp: number;
}

export interface HubPost {
  id: string;
  type: HubType;
  author?: { name: string; role: string; initials: string };
  title?: string;
  content: string;
  timestamp: number;
  sector: string;
  collabId?: string;
  tags: string[];
  urgency: HubUrgency;
  status: HubStatus;
  kpi?: string;
  isRead: boolean;
  replies: HubReply[];
  bottleneckRef?: string;
}

export interface IntegrationSettings {
  teamsWebhook?: string;
  googleChatWebhook?: string;
  slackWebhook?: string;
  defaultCalendar: 'google' | 'outlook' | 'ics';
}

const now = () => Date.now();
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const SEED_POSTS: HubPost[] = [
  {
    id: 'seed-1', type: 'alert', title: 'On-Time Delivery Drop',
    content: 'On-time delivery fell below the 92% threshold for the West Coast region. Immediate rerouting recommended to mitigate downstream impacts.',
    timestamp: now() - 1000 * 60 * 15, sector: 'logistics', tags: ['Threshold Breach'], urgency: 'High', status: 'Open',
    kpi: 'On-Time Delivery', isRead: false, replies: [],
  },
  {
    id: 'seed-2', type: 'message', author: { name: 'Sarah Chen', role: 'Logistics Lead', initials: 'SC' },
    content: 'Port congestion at Long Beach is worsening. Rerouting all priority E-comm shipments to Vancouver rail link.',
    timestamp: now() - 1000 * 60 * 60 * 2, sector: 'logistics', tags: ['Delay', 'Reroute'], urgency: 'Medium', status: 'In Progress',
    isRead: true,
    replies: [{ id: 'seed-2r', author: 'Marcus Webb', company: 'E-commerce', content: 'Thanks. Can you share the revised ETAs so we can update customers today?', timestamp: now() - 1000 * 60 * 90 }],
  },
  {
    id: 'seed-3', type: 'alert', title: 'Defect Rate Spike',
    content: 'Defect rate exceeded 3% on Line B in the past 4 hours. QA teams deployed for immediate inspection.',
    timestamp: now() - 1000 * 60 * 60 * 5, sector: 'manufacturing', tags: ['Quality Control'], urgency: 'Critical', status: 'Open',
    kpi: 'Defect Rate', isRead: false, replies: [],
  },
  {
    id: 'seed-4', type: 'notification', content: 'AI Insights generated a new mitigation plan for Tier-2 supplier volatility.',
    timestamp: now() - 1000 * 60 * 60 * 24, sector: 'unified', tags: ['AI'], urgency: 'Low', status: 'Resolved', isRead: true, replies: [],
  },
];

export interface CollabTemplate {
  id: string;
  name: string;
  purpose: string;
  roles: string[];
  datasets: string[];
  kpis: string[];
}

export const COLLAB_TEMPLATES: CollabTemplate[] = [
  { id: 'seller-3pl', name: 'Seller + 3PL / carrier', purpose: 'Keep promises to customers by sharing orders, stock and delivery status.', roles: ['3PL', 'Carrier'], datasets: ['Orders', 'Inventory', 'Shipments'], kpis: ['On-time delivery to customers', 'Order accuracy', 'Same-day ship rate'] },
  { id: 'maker-supplier', name: 'Manufacturer + suppliers', purpose: 'Avoid line stoppages by sharing forecasts, purchase orders and quality data.', roles: ['Supplier'], datasets: ['Demand forecast', 'Purchase orders', 'Quality'], kpis: ['Supplier on-time rate', 'Supplier defect rate', 'Schedule attainment'] },
  { id: 'brand-distributor', name: 'Brand + distributors / retailers', purpose: 'Plan production and promotions from real sell-through.', roles: ['Distributor', 'Retailer'], datasets: ['Sell-through', 'Inventory', 'Promotions'], kpis: ['Sell-through rate', 'Order fill rate', 'Stockout rate'] },
  { id: 'restaurant-distributor', name: 'Restaurant + food distributor', purpose: 'Cut waste and stock-outs with shared ordering and delivery windows.', roles: ['Distributor'], datasets: ['Orders', 'Deliveries', 'Waste'], kpis: ['Vendor fill rate', 'Food waste', 'Food cost percentage'] },
  { id: 'client-agency', name: 'Business + agency / consultant', purpose: 'Share results so your agency or consultant can act on real numbers.', roles: ['Agency', 'Consultant'], datasets: ['Campaigns', 'Sales', 'Leads'], kpis: ['Return on ad spend', 'Customer acquisition cost', 'Conversion rate'] },
  { id: 'clinic-lab', name: 'Clinic + lab / referral partners', purpose: 'Shorten turnaround and keep patients informed.', roles: ['Lab', 'Referral partner'], datasets: ['Orders', 'Results', 'Referrals'], kpis: ['Referral lab turnaround', 'Patient satisfaction'] },
  { id: 'property-vendors', name: 'Property manager + vendors', purpose: 'Close work orders faster and keep tenants happy.', roles: ['Vendor', 'Contractor'], datasets: ['Work orders', 'Invoices'], kpis: ['Vendor work-order completion', 'Maintenance response time'] },
  { id: 'custom', name: 'Custom collab', purpose: 'Choose your own partners, data and cadence.', roles: ['Partner'], datasets: [], kpis: [] },
];

interface GrowthState {
  aiEngine: AIEnginePreference;
  profile: GrowthProfile | null;
  plan: GrowthPlan | null;
  planHistory: GrowthPlan[];
  onboardingComplete: boolean;
  tourComplete: boolean;
  actions: ActionItem[];
  collabs: Collab[];
  hubPosts: HubPost[];
  integrations: IntegrationSettings;
  kpiWatchlist: string[];
  consultSessions: ConsultSession[];

  setAiEngine: (e: AIEnginePreference) => void;
  setProfile: (p: GrowthProfile) => void;
  setPlan: (plan: GrowthPlan, opts?: { replaceActions?: boolean }) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  completeTour: () => void;
  restartTour: () => void;
  businessContext: () => string;

  addAction: (a: Omit<ActionItem, 'id' | 'createdAt' | 'status'> & { status?: ActionStatus }) => ActionItem;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  removeAction: (id: string) => void;
  setActionStatus: (id: string, status: ActionStatus) => void;

  createCollab: (c: Omit<Collab, 'id' | 'createdAt' | 'active'> & { active?: boolean }) => Collab;
  duplicateCollab: (id: string, name?: string) => Collab | null;
  updateCollab: (id: string, patch: Partial<Collab>) => void;
  removeCollab: (id: string) => void;

  addHubPost: (p: Omit<HubPost, 'id' | 'timestamp' | 'replies' | 'isRead'> & { isRead?: boolean }) => HubPost;
  updateHubPost: (id: string, patch: Partial<HubPost>) => void;
  replyToHubPost: (id: string, reply: Omit<HubReply, 'id' | 'timestamp'>) => void;

  setIntegrations: (patch: Partial<IntegrationSettings>) => void;
  toggleKpiWatch: (kpiId: string) => void;

  saveConsultSession: (s: Omit<ConsultSession, 'id' | 'createdAt' | 'actionIds'> & { actionIds?: string[] }) => ConsultSession;
  updateConsultSession: (id: string, patch: Partial<ConsultSession>) => void;
  removeConsultSession: (id: string) => void;
}

/**
 * The parts of the growth store that belong to one business. The consultant
 * workspace swaps these in and out when switching between client businesses;
 * app-wide settings (AI engine, integrations) stay put.
 */
export const GROWTH_WORKSPACE_KEYS = ['profile', 'plan', 'planHistory', 'onboardingComplete', 'tourComplete', 'actions', 'collabs', 'hubPosts', 'kpiWatchlist', 'consultSessions'] as const;
export type GrowthWorkspace = Pick<GrowthState, typeof GROWTH_WORKSPACE_KEYS[number]>;

/** A blank workspace for a new client business. */
export function emptyGrowthWorkspace(): GrowthWorkspace {
  return { profile: null, plan: null, planHistory: [], onboardingComplete: false, tourComplete: true, actions: [], collabs: [], hubPosts: [], kpiWatchlist: [], consultSessions: [] };
}

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set, get) => ({
      aiEngine: 'auto',
      profile: null,
      plan: null,
      planHistory: [],
      onboardingComplete: false,
      tourComplete: false,
      actions: [],
      collabs: [],
      hubPosts: SEED_POSTS,
      integrations: { defaultCalendar: 'google' },
      kpiWatchlist: [],
      consultSessions: [],

      setAiEngine: (aiEngine) => set({ aiEngine }),
      setProfile: (profile) => set({ profile }),
      setPlan: (plan, opts) => set((s) => {
        const planActions: ActionItem[] = plan.phases.flatMap((ph) => ph.steps.map((st) => ({
          id: uid('act'),
          title: st.title,
          detail: st.detail,
          owner: st.owner,
          status: 'todo' as ActionStatus,
          kpi: st.kpi,
          source: 'plan' as ActionSource,
          sourceRef: st.id,
          phaseId: ph.id,
          createdAt: Date.now(),
        })));
        const keep = opts?.replaceActions === false ? s.actions : s.actions.filter((a) => a.source !== 'plan');
        return {
          plan,
          planHistory: s.plan ? [s.plan, ...s.planHistory].slice(0, 5) : s.planHistory,
          actions: [...planActions, ...keep],
        };
      }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
      completeTour: () => set({ tourComplete: true }),
      restartTour: () => set({ tourComplete: false }),
      businessContext: () => {
        const { profile, plan } = get();
        if (!profile) return '';
        const { consultSessions } = get();
        const decisions = consultSessions
          .filter((c) => c.chosenOptionId)
          .slice(0, 3)
          .map((c) => `- ${c.title}: chose "${c.result.options.find((o) => o.id === c.chosenOptionId)?.title ?? ''}"`);
        return describeProfile(profile)
          + (plan ? `\nCurrent plan North Star: ${plan.northStar.name} → ${plan.northStar.target}` : '')
          + (decisions.length ? `\nRecent consulting decisions:\n${decisions.join('\n')}` : '');
      },

      addAction: (a) => {
        const item: ActionItem = { ...a, status: a.status ?? 'todo', id: uid('act'), createdAt: Date.now() };
        set((s) => ({ actions: [item, ...s.actions] }));
        return item;
      },
      updateAction: (id, patch) => set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAction: (id) => set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),
      setActionStatus: (id, status) => set((s) => ({
        actions: s.actions.map((a) => (a.id === id ? { ...a, status, completedAt: status === 'done' ? Date.now() : undefined } : a)),
      })),

      createCollab: (c) => {
        const collab: Collab = { ...c, active: c.active ?? true, id: uid('col'), createdAt: Date.now() };
        set((s) => ({ collabs: [collab, ...s.collabs] }));
        return collab;
      },
      duplicateCollab: (id, name) => {
        const src = get().collabs.find((c) => c.id === id);
        if (!src) return null;
        const copy: Collab = {
          ...src,
          id: uid('col'),
          name: name?.trim() || `${src.name} (copy)`,
          partners: src.partners.map((p) => ({ ...p, id: uid('ptr'), status: 'invited' as const })),
          createdAt: Date.now(),
        };
        set((s) => ({ collabs: [copy, ...s.collabs] }));
        return copy;
      },
      updateCollab: (id, patch) => set((s) => ({ collabs: s.collabs.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCollab: (id) => set((s) => ({ collabs: s.collabs.filter((c) => c.id !== id) })),

      addHubPost: (p) => {
        const post: HubPost = { ...p, isRead: p.isRead ?? true, id: uid('hub'), timestamp: Date.now(), replies: [] };
        set((s) => ({ hubPosts: [post, ...s.hubPosts] }));
        return post;
      },
      updateHubPost: (id, patch) => set((s) => ({ hubPosts: s.hubPosts.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      replyToHubPost: (id, reply) => set((s) => ({
        hubPosts: s.hubPosts.map((h) => (h.id === id
          ? { ...h, replies: [...h.replies, { ...reply, id: uid('rep'), timestamp: Date.now() }], status: h.status === 'Open' ? 'In Progress' : h.status }
          : h)),
      })),

      setIntegrations: (patch) => set((s) => ({ integrations: { ...s.integrations, ...patch } })),
      toggleKpiWatch: (kpiId) => set((s) => ({
        kpiWatchlist: s.kpiWatchlist.includes(kpiId) ? s.kpiWatchlist.filter((k) => k !== kpiId) : [...s.kpiWatchlist, kpiId],
      })),

      saveConsultSession: (c) => {
        const session: ConsultSession = { ...c, actionIds: c.actionIds ?? [], id: uid('cns'), createdAt: Date.now() };
        set((s) => ({ consultSessions: [session, ...s.consultSessions].slice(0, 50) }));
        return session;
      },
      updateConsultSession: (id, patch) => set((s) => ({ consultSessions: s.consultSessions.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeConsultSession: (id) => set((s) => ({ consultSessions: s.consultSessions.filter((c) => c.id !== id) })),
    }),
    { name: 'chaininsideiq-growth', version: 1 }
  )
);

export { uid as newId };
