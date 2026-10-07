export interface PricingTier {
  id: string;
  name: string;
  /** Monthly price when billed monthly. */
  price: number | null;
  /** Effective monthly price when billed yearly (about 20% less). */
  priceAnnual: number | null;
  priceLabel: string;
  /** Fair-use AI answers included per month (chat, plan rebuilds, analyses). */
  aiAnswers: number | null;
  /** Who it's sized for, used by the plan finder. */
  bestFor: string;
  period: string;
  description: string;
  trial: string | null;
  badge: string | null;
  cta: string;
  ctaVariant: 'default' | 'outline';
  /** Only features that work today. */
  features: string[];
  /** Planned for this plan but not built yet. Shown separately and labeled. */
  comingSoon?: string[];
  highlighted: boolean;
}

// Keep these lists honest: a feature goes in `features` only once it ships.
// Anything planned belongs in `comingSoon`, which the pricing page labels clearly.
//
// HOW THESE PRICES WERE SET (October 2026) — see docs/PRICING.md for the full model.
// Supply (cost to serve): one AI answer ≈ 3.5k input + 1k output tokens.
//   Claude Sonnet 5 ($2 / $10 per 1M) ≈ $0.017 · Gemini 3.8 Flash ($0.75 / $3.75) ≈ $0.006
//   GPT-6 Luna ($0.10 / $0.50) ≈ $0.001. Allowances below keep worst-case AI cost
//   (all-Claude) under ~17% of the plan price, so margins hold as usage grows.
// Demand (what buyers compare against): Julius AI $20 (solo analyst), Databox
//   $64–$399, Fathom $65 per company. Starter moves under $50 to win owner-operators;
//   Business stays at $299 for multi-partner operations teams.
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceAnnual: 39,
    priceLabel: '$49',
    aiAnswers: 200,
    bestFor: 'Solo owners and small teams',
    period: '/month',
    description: 'For owner-operators and small businesses getting started.',
    trial: '14-day free trial',
    badge: null,
    cta: 'Start Starter',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'AI Analyst interview and a step-by-step Growth Plan',
      'Action board with owners, due dates and calendar links (Google, Outlook, Apple)',
      'AI Analyst chat that knows your goal and your numbers',
      'AI Consultant sessions: health check, pricing, cash flow, growth, hiring and more',
      'Dashboard Builder, Generate For Me and Enhance My Dashboard',
      'KPI Library: 300+ metrics across 45 industries',
      'Import CSV, Excel and JSON files',
      'Export to Excel, CSV and JSON',
      '1 data collab with a partner',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 129,
    priceAnnual: 99,
    priceLabel: '$129',
    aiAnswers: 1000,
    bestFor: 'Growing teams with key partners',
    period: '/month',
    description: 'For growing businesses that work closely with partners.',
    trial: '14-day free trial',
    badge: 'Most Popular',
    cta: 'Start Professional',
    ctaVariant: 'default',
    highlighted: true,
    features: [
      'Everything in Starter, plus:',
      'Bottleneck detection with root causes, ranked by business impact',
      'AI recommendations with step-by-step action plans',
      'Choose your AI engine: Claude, ChatGPT or Gemini',
      'Unlimited data collabs, saved as reusable presets',
      'Ops Hub with discussion threads tied to each issue',
      'Client workspaces for consultants and agencies, with printable progress reports',
      'Send updates to Microsoft Teams, Google Chat and Slack',
      'Import from public Google Sheets and JSON APIs',
    ],
    comingSoon: [
      'Up to 5 team members',
      'Scheduled exports and PDF reports',
      'Weekly AI summary emails',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 299,
    priceAnnual: 249,
    priceLabel: '$299',
    aiAnswers: 3000,
    bestFor: 'Operations teams across a supply chain',
    period: '/month',
    description: 'For operations teams running a full supply chain.',
    trial: '14-day free trial',
    badge: null,
    cta: 'Start Business',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'Everything in Professional, plus:',
      'Operations Pipeline: track every issue from signal to resolution',
      'Unified Supply Chain mode with bridge KPIs: Perfect Order Rate, Cash-to-Cash Cycle, ATP Accuracy, Bullwhip Index',
      'Dataset library per sector with merge and overwrite',
      '7- and 14-day demand forecasts',
      'Priority email support',
    ],
    comingSoon: [
      'Up to 15 team members',
      'Shared workspaces where partners sign in and see live data',
      'Scenario simulation',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceAnnual: null,
    priceLabel: 'Custom',
    aiAnswers: null,
    bestFor: 'Multi-location companies and networks',
    period: '',
    description: 'For multi-location companies and supply chain networks.',
    trial: null,
    badge: null,
    cta: 'Contact Sales',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'Everything in Business, plus:',
      'Guided onboarding and setup with our team',
      'Custom KPI and dashboard engineering',
      'Custom data imports set up for your systems',
      'Volume pricing for multiple locations or business units',
      'Direct support',
    ],
    comingSoon: [
      'Single sign-on (SSO) and audit logs',
      'Role-based access controls',
      'Power BI, Tableau and ERP integrations',
      'Dedicated environment',
    ],
  },
];

export function getPricingSummary(): string {
  return 'ChainInsideIQ offers four plans: Starter ($49/month, or $39/month billed yearly), Professional ($129/month, or $99/month yearly), Business ($299/month, or $249/month yearly) and Enterprise (custom pricing). Starter, Professional and Business start with a 14-day free trial and include 200, 1,000 and 3,000 AI answers a month respectively. Every plan includes the AI growth plan, AI Analyst chat, AI Consultant sessions, KPI Library and Excel/CSV/JSON import and export. Higher plans add bottleneck detection, AI engine choice, client workspaces for consultants, unlimited partner collabs, Teams and Google Chat updates, and supply-chain-wide analysis. Features marked "Coming soon" on the pricing page are not available yet.';
}

export function getTierByName(name: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.name.toLowerCase() === name.toLowerCase());
}

export function getTierById(id: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.id === id);
}

// ---- Feature gating (frontend-only, cosmetic upsell) ----

export type PlanId = 'trial' | 'starter' | 'professional' | 'business' | 'enterprise';

// Higher rank = more access. Trial unlocks everything during the trial window.
export const PLAN_RANK: Record<PlanId, number> = {
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
  trial: 99,
};

export type FeatureKey =
  | 'bottlenecks'
  | 'recommendations'
  | 'pipeline'
  | 'advanced-ai'
  | 'unified-mode'
  | 'client-workspaces';

// Each premium feature → the lowest plan that unlocks it.
export const FEATURE_PLANS: Record<FeatureKey, { plan: PlanId; label: string }> = {
  'bottlenecks':     { plan: 'professional', label: 'Professional' },
  'recommendations': { plan: 'professional', label: 'Professional' },
  'pipeline':        { plan: 'business',     label: 'Business' },
  'advanced-ai':     { plan: 'professional', label: 'Professional' },
  'unified-mode':    { plan: 'business',     label: 'Business' },
  'client-workspaces': { plan: 'professional', label: 'Professional' },
};

export function getFeatureRequirement(feature: FeatureKey) {
  return FEATURE_PLANS[feature];
}

/**
 * Cosmetic gating check. Returns true (full access) when there is no signed-in
 * plan yet (demo / browsing) or during trial, so the demo stays unobstructed.
 * Signed-in paid users below the required tier get a soft upgrade nudge.
 */
export function hasPlan(userPlan: PlanId | null | undefined, feature: FeatureKey): boolean {
  if (!userPlan) return true;
  const req = FEATURE_PLANS[feature];
  if (!req) return true;
  return (PLAN_RANK[userPlan] ?? 0) >= PLAN_RANK[req.plan];
}