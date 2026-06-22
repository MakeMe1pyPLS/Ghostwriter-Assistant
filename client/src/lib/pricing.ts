export interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string;
  period: string;
  description: string;
  trial: string | null;
  badge: string | null;
  cta: string;
  ctaVariant: 'default' | 'outline';
  features: string[];
  highlighted: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    priceLabel: '$79',
    period: '/month',
    description: 'Best for small teams and early-stage operations.',
    trial: '14-day free trial',
    badge: null,
    cta: 'Start Starter',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'Dashboard Builder with KPI cards, charts, tables, and forecasting widgets',
      'E-commerce, Manufacturing, and Logistics KPI libraries',
      'CSV upload, Excel upload, and manual dataset import',
      'Excel, CSV, and JSON export',
      'AI Supply Chain Analyst (basic) — KPI explanations, dashboard summary, anomaly hints',
      '3 dashboards',
      '3 datasets',
      '1 user',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    priceLabel: '$149',
    period: '/month',
    description: 'Best for growing companies and analytics teams.',
    trial: '14-day free trial',
    badge: 'Most Popular',
    cta: 'Start Professional',
    ctaVariant: 'default',
    highlighted: true,
    features: [
      'Everything in Starter, plus:',
      'Advanced AI Analyst — anomaly detection, trend insights, AI dashboard summaries, operational recommendations, forecast explanations',
      'Unlimited dashboards and widgets',
      'Google Sheets connector, SQL database connection, API ingestion',
      'Formatted PDF reports and scheduled exports',
      'Weekly AI reports',
      'Up to 5 users',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 299,
    priceLabel: '$299',
    period: '/month',
    description: 'Best for operations teams running multiple data systems.',
    trial: '14-day free trial',
    badge: null,
    cta: 'Start Business',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'Everything in Professional, plus:',
      'Unified Supply Chain Mode with Bridge KPIs — Perfect Order Rate, Cash-to-Cash Cycle Time, Available-to-Promise Accuracy, Bullwhip Effect Index',
      'Multi-dataset linking, sector data normalization, metric calculation engine',
      '30-day forecasting and scenario simulation',
      'Comments on dashboards, team notifications, shared workspaces',
      'AI root-cause analysis and KPI prioritization',
      'Up to 15 users',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    period: '',
    description: 'For large companies and supply chain networks.',
    trial: null,
    badge: null,
    cta: 'Contact Sales',
    ctaVariant: 'outline',
    highlighted: false,
    features: [
      'Everything in Business, plus:',
      'Power BI, Tableau, and ERP integrations with custom API pipelines',
      'AI operational simulation, predictive demand modeling, supply chain optimization insights',
      'SSO, audit logs, and role-based access',
      'Dedicated environment',
      'Onboarding assistance and custom KPI engineering',
      'Direct support',
    ],
  },
];

export function getPricingSummary(): string {
  return 'ChainInsideIQ offers four plans: Starter ($79/month), Professional ($149/month), Business ($299/month), and Enterprise (custom pricing). Starter, Professional, and Business include a 14-day free trial. Each tier unlocks more AI capability, integrations, exports, collaboration, and supply chain intelligence features.';
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
  | 'unified-mode';

// Each premium feature → the lowest plan that unlocks it.
export const FEATURE_PLANS: Record<FeatureKey, { plan: PlanId; label: string }> = {
  'bottlenecks':     { plan: 'professional', label: 'Professional' },
  'recommendations': { plan: 'professional', label: 'Professional' },
  'pipeline':        { plan: 'business',     label: 'Business' },
  'advanced-ai':     { plan: 'professional', label: 'Professional' },
  'unified-mode':    { plan: 'business',     label: 'Business' },
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