// Growth planning: the onboarding interview answers (GrowthProfile) and the
// step-by-step plan every engine returns (GrowthPlan). The rule-based builder
// lives here so the browser can produce a plan with no server or API keys.

import type { AIEngineId } from './ai-types';
import { getIndustry, kpisForIndustry, type IndustryKpi } from './kpi-industries';

export type GoalId =
  | 'grow-revenue'
  | 'improve-profit'
  | 'cut-costs'
  | 'fix-operations'
  | 'retain-customers'
  | 'expand-markets'
  | 'strengthen-partners'
  | 'prepare-to-scale';

export const GOALS: { id: GoalId; label: string; hint: string }[] = [
  { id: 'grow-revenue', label: 'Grow revenue', hint: 'More customers, bigger orders, new channels' },
  { id: 'improve-profit', label: 'Improve profit margins', hint: 'Keep more of every dollar you earn' },
  { id: 'cut-costs', label: 'Cut costs', hint: 'Find waste and spend less to deliver the same' },
  { id: 'fix-operations', label: 'Fix operations & delivery', hint: 'Faster, more reliable, fewer mistakes' },
  { id: 'retain-customers', label: 'Keep customers coming back', hint: 'Retention, reviews and repeat business' },
  { id: 'expand-markets', label: 'Expand to new markets', hint: 'New locations, regions or customer types' },
  { id: 'strengthen-partners', label: 'Work better with partners', hint: 'Suppliers, carriers, distributors, agencies' },
  { id: 'prepare-to-scale', label: 'Prepare to scale or raise funding', hint: 'Systems, numbers and team ready for growth' },
];

export type CompanySize = 'solo' | '2-10' | '11-50' | '51-250' | '251-1000' | '1000+';
export const COMPANY_SIZES: { id: CompanySize; label: string }[] = [
  { id: 'solo', label: 'Just me' },
  { id: '2-10', label: '2–10 people' },
  { id: '11-50', label: '11–50' },
  { id: '51-250', label: '51–250' },
  { id: '251-1000', label: '251–1,000' },
  { id: '1000+', label: '1,000+' },
];

export type BusinessStage = 'starting' | 'growing' | 'established' | 'enterprise';
export const STAGES: { id: BusinessStage; label: string; hint: string }[] = [
  { id: 'starting', label: 'Just starting', hint: 'Under 2 years or pre-revenue' },
  { id: 'growing', label: 'Growing', hint: 'Revenue is climbing, systems are catching up' },
  { id: 'established', label: 'Established', hint: 'Steady business, looking for the next level' },
  { id: 'enterprise', label: 'Enterprise', hint: 'Multiple teams, sites or business units' },
];

export type ChallengeId =
  | 'cash-flow' | 'lead-flow' | 'conversion' | 'pricing' | 'delivery' | 'inventory'
  | 'quality' | 'staffing' | 'visibility' | 'partner-coordination' | 'customer-churn' | 'costs';

export const CHALLENGES: { id: ChallengeId; label: string }[] = [
  { id: 'cash-flow', label: 'Cash flow is tight' },
  { id: 'lead-flow', label: 'Not enough leads' },
  { id: 'conversion', label: 'Leads don’t convert' },
  { id: 'pricing', label: 'Pricing feels wrong' },
  { id: 'delivery', label: 'Late or slow delivery' },
  { id: 'inventory', label: 'Stock-outs or excess stock' },
  { id: 'quality', label: 'Quality issues or rework' },
  { id: 'staffing', label: 'Hiring or keeping staff' },
  { id: 'visibility', label: 'I can’t see my numbers clearly' },
  { id: 'partner-coordination', label: 'Partners are hard to coordinate' },
  { id: 'customer-churn', label: 'Customers don’t come back' },
  { id: 'costs', label: 'Costs keep rising' },
];

export type Timeframe = 30 | 90 | 180 | 365;

export interface GrowthProfile {
  businessName?: string;
  goal: GoalId;
  goalDetail?: string;
  industryId: string;
  size: CompanySize;
  stage: BusinessStage;
  challenges: ChallengeId[];
  targetKpi: string;          // KPI name
  targetValue?: string;       // free text like "+20%" or "$50k/month"
  timeframeDays: Timeframe;
  partners: string[];         // partner company names or types
}

export type StepOwner = 'Owner' | 'Operations' | 'Sales & marketing' | 'Finance' | 'Partner' | 'Team lead';
export type Effort = 'low' | 'medium' | 'high';

export interface PlanStep {
  id: string;
  title: string;
  detail: string;
  owner: StepOwner;
  kpi?: string;
  effort: Effort;
}

export interface PlanPhase {
  id: string;
  title: string;
  window: string;             // e.g. "Days 1–30"
  objective: string;
  steps: PlanStep[];
}

export interface PlanKpi {
  name: string;
  target: string;
  why: string;
}

export interface GrowthPlan {
  headline: string;
  summary: string;
  northStar: PlanKpi;
  kpis: PlanKpi[];
  phases: PlanPhase[];
  quickWins: string[];
  risks: string[];
  partnerPlays: string[];
  generatedBy: AIEngineId;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Rule-based plan builder
// ---------------------------------------------------------------------------

const GOAL_KPI_HINTS: Record<GoalId, string[]> = {
  'grow-revenue': ['revenue growth', 'conversion rate', 'trial-to-paid', 'lead-to', 'booking conversion', 'average order', 'average ticket', 'average check', 'recurring revenue', 'win rate', 'pipeline'],
  'improve-profit': ['gross margin', 'net profit', 'prime cost', 'margin', 'realization', 'cost per'],
  'cut-costs': ['cost per', 'operating expenses', 'waste', 'scrap', 'spoilage', 'shrinkage', 'deadhead'],
  'fix-operations': ['on-time', 'cycle time', 'accuracy', 'fill rate', 'downtime', 'first-time fix', 'turnaround', 'first pass'],
  'retain-customers': ['retention', 'churn', 'repeat', 'rebooking', 'promoter', 'satisfaction'],
  'expand-markets': ['revenue growth', 'customer acquisition', 'new patients', 'new client', 'lead conversion', 'conversion rate', 'audience growth'],
  'strengthen-partners': ['supplier', 'partner', 'vendor', 'sla', 'fill rate', 'on-time'],
  'prepare-to-scale': ['cash runway', 'ltv to cac', 'revenue per employee', 'burn', 'net profit', 'cash conversion'],
};

const CHALLENGE_STEPS: Record<ChallengeId, Omit<PlanStep, 'id'>> = {
  'cash-flow': { title: 'Build a 13-week cash forecast', detail: 'List expected cash in and out week by week. Move slow payers to deposits or shorter terms, and time big purchases to when cash lands.', owner: 'Finance', kpi: 'Cash runway', effort: 'medium' },
  'lead-flow': { title: 'Open two new lead channels', detail: 'Pick the two channels your best customers already use (referrals, local search, partners, events). Run each for four weeks with a set budget and track cost per lead.', owner: 'Sales & marketing', kpi: 'Customer acquisition cost', effort: 'medium' },
  'conversion': { title: 'Fix the biggest drop-off in your sales path', detail: 'Map every step from first contact to paid. Find the step that loses the most people and test one change there each week.', owner: 'Sales & marketing', effort: 'medium' },
  'pricing': { title: 'Run a pricing review', detail: 'Compare your prices to three competitors and your cost to serve. Raise prices on the products or services where you are clearly better or underpriced.', owner: 'Owner', kpi: 'Gross margin', effort: 'low' },
  'delivery': { title: 'Find where time is lost in delivery', detail: 'Time each stage from order to delivery for two weeks. Fix the slowest stage first and set a promise date you can hit 95% of the time.', owner: 'Operations', kpi: 'On-time delivery to customers', effort: 'medium' },
  'inventory': { title: 'Set reorder points for your top items', detail: 'For the 20% of items that drive 80% of sales, set a reorder point based on real lead time and weekly demand. Review slow movers monthly.', owner: 'Operations', effort: 'medium' },
  'quality': { title: 'Track rework at the source', detail: 'Log every defect or redo with its cause for 30 days. Fix the top two causes with a checklist or a process change.', owner: 'Team lead', effort: 'low' },
  'staffing': { title: 'Tighten hiring and onboarding', detail: 'Write a one-page role scorecard, add a paid trial shift or task, and give every new hire a 30-day onboarding checklist.', owner: 'Owner', kpi: 'Employee turnover', effort: 'medium' },
  'visibility': { title: 'Connect your data and set a weekly scorecard', detail: 'Import your sales, cost and operations data. Pick five numbers to review every Monday in a 20-minute meeting.', owner: 'Owner', effort: 'low' },
  'partner-coordination': { title: 'Start a shared data collab with your key partner', detail: 'Share the two or three numbers you both depend on (orders, delivery times, stock) and agree a weekly check-in in the Hub.', owner: 'Partner', effort: 'low' },
  'customer-churn': { title: 'Launch a win-back and check-in routine', detail: 'Contact customers who have not bought in 60 days with a personal note or offer. Ask every departing customer one question: why?', owner: 'Sales & marketing', kpi: 'Customer retention rate', effort: 'low' },
  'costs': { title: 'Audit your top ten costs', detail: 'List your ten largest expenses. Renegotiate, rebid or cut at least three of them this quarter.', owner: 'Finance', kpi: 'Operating expenses ratio', effort: 'low' },
};

const GOAL_PLAYBOOK: Record<GoalId, { headline: string; phases: [string, string, Omit<PlanStep, 'id'>[]][] }> = {
  'grow-revenue': {
    headline: 'Grow revenue with a focused sales engine',
    phases: [
      ['Find your growth levers', 'Know exactly where revenue comes from today.', [
        { title: 'Break revenue down by customer, product and channel', detail: 'Rank what brings in the most profit, not just the most sales. This shows where to push first.', owner: 'Owner', kpi: 'Revenue', effort: 'low' },
        { title: 'Profile your best 20 customers', detail: 'Write down what they have in common: industry, size, how they found you. That is who to find more of.', owner: 'Sales & marketing', effort: 'low' },
      ]],
      ['Launch and test', 'Put more of the right customers into the pipeline.', [
        { title: 'Create one offer aimed at your best customer profile', detail: 'A bundle, package or starter offer that makes it easy to say yes.', owner: 'Sales & marketing', effort: 'medium' },
        { title: 'Raise average order value', detail: 'Add a recommended add-on or tier at checkout or in every quote.', owner: 'Sales & marketing', kpi: 'Average order value', effort: 'low' },
      ]],
      ['Scale what works', 'Double down on the channels with the best return.', [
        { title: 'Move budget to your top two channels', detail: 'Cut anything with a customer cost above your target and reinvest in what converts.', owner: 'Owner', kpi: 'LTV to CAC ratio', effort: 'low' },
        { title: 'Set a monthly revenue review', detail: 'Compare actuals to target, check the pipeline and agree next month’s focus.', owner: 'Owner', effort: 'low' },
      ]],
    ],
  },
  'improve-profit': {
    headline: 'Lift margins without losing customers',
    phases: [
      ['Know your true margins', 'See profit by product, customer and job.', [
        { title: 'Calculate margin per product or service', detail: 'Include materials, labor and delivery. Flag anything under your target margin.', owner: 'Finance', kpi: 'Gross margin', effort: 'medium' },
        { title: 'Find unprofitable customers', detail: 'Some accounts cost more to serve than they pay. Reprice or change terms for them.', owner: 'Finance', effort: 'low' },
      ]],
      ['Price and cost moves', 'Fix the biggest margin leaks.', [
        { title: 'Raise prices where you are underpriced', detail: 'Start with new customers and your most valued offers. Communicate the value, not the increase.', owner: 'Owner', effort: 'low' },
        { title: 'Renegotiate your top supplier costs', detail: 'Use volume, longer terms or a competing quote. Your partners can help here.', owner: 'Partner', effort: 'medium' },
      ]],
      ['Protect the gains', 'Keep margins from sliding back.', [
        { title: 'Set margin floors for quotes and discounts', detail: 'No deal goes out below the floor without owner approval.', owner: 'Owner', kpi: 'Net profit margin', effort: 'low' },
      ]],
    ],
  },
  'cut-costs': {
    headline: 'Spend less to deliver the same or better',
    phases: [
      ['Map your spending', 'Know where every dollar goes.', [
        { title: 'Group costs into fixed, variable and one-off', detail: 'Variable costs that grow faster than revenue are the first place to look.', owner: 'Finance', effort: 'low' },
      ]],
      ['Remove waste', 'Cut what does not add value.', [
        { title: 'Cancel or combine overlapping tools and subscriptions', detail: 'Most businesses find 10–20% waste in software and services.', owner: 'Owner', effort: 'low' },
        { title: 'Reduce waste in your core process', detail: 'Measure scrap, spoilage, returns or rework and cut the top cause.', owner: 'Operations', effort: 'medium' },
      ]],
      ['Lock in savings', 'Make lower costs the new normal.', [
        { title: 'Set a monthly budget-vs-actual review', detail: 'Owners of each cost area explain any variance over 5%.', owner: 'Finance', kpi: 'Operating expenses ratio', effort: 'low' },
      ]],
    ],
  },
  'fix-operations': {
    headline: 'Make delivery fast, reliable and predictable',
    phases: [
      ['Measure the flow', 'See where work gets stuck.', [
        { title: 'Time every stage of your process', detail: 'From order or request to done. The slowest stage sets the pace for everything.', owner: 'Operations', effort: 'low' },
      ]],
      ['Fix the bottleneck', 'Remove the biggest constraint first.', [
        { title: 'Add capacity or cut work at the slowest stage', detail: 'Shift people, change the schedule or remove steps that add no value.', owner: 'Operations', kpi: 'On-time delivery to customers', effort: 'medium' },
        { title: 'Share delivery data with partners', detail: 'Many delays start upstream. Give your supplier or carrier the same numbers you see.', owner: 'Partner', effort: 'low' },
      ]],
      ['Standardize', 'Keep it working as volume grows.', [
        { title: 'Write checklists for your five most common jobs', detail: 'Short, visual and kept where the work happens.', owner: 'Team lead', effort: 'low' },
      ]],
    ],
  },
  'retain-customers': {
    headline: 'Turn one-time buyers into loyal customers',
    phases: [
      ['Understand why they leave', 'Hear it from customers directly.', [
        { title: 'Survey recent and lost customers', detail: 'Two questions: how likely are you to recommend us, and what would make us better?', owner: 'Sales & marketing', kpi: 'Net Promoter Score', effort: 'low' },
      ]],
      ['Improve the experience', 'Fix the top complaints.', [
        { title: 'Fix the most common complaint', detail: 'Usually speed, communication or quality. Assign an owner and a deadline.', owner: 'Operations', effort: 'medium' },
        { title: 'Add a follow-up after every purchase', detail: 'A thank-you, a tip or a check-in within seven days.', owner: 'Sales & marketing', effort: 'low' },
      ]],
      ['Reward loyalty', 'Give people a reason to return.', [
        { title: 'Launch a simple loyalty or membership offer', detail: 'Keep it easy to understand and valuable enough to matter.', owner: 'Owner', kpi: 'Customer retention rate', effort: 'medium' },
      ]],
    ],
  },
  'expand-markets': {
    headline: 'Enter a new market with low risk',
    phases: [
      ['Choose the market', 'Pick the best next market with data.', [
        { title: 'Score three candidate markets', detail: 'Compare demand, competition, cost to serve and fit with what you do best.', owner: 'Owner', effort: 'medium' },
      ]],
      ['Test before you commit', 'Prove demand cheaply.', [
        { title: 'Run a small pilot', detail: 'A pop-up, a partner, a test region or a limited offer. Set a clear success number.', owner: 'Sales & marketing', effort: 'medium' },
        { title: 'Line up local partners', detail: 'Distributors, carriers or agencies already in that market shorten the learning curve.', owner: 'Partner', effort: 'medium' },
      ]],
      ['Scale in', 'Grow what the pilot proved.', [
        { title: 'Build the launch budget from pilot numbers', detail: 'Use real conversion and cost data, not guesses.', owner: 'Finance', kpi: 'Customer acquisition cost', effort: 'low' },
      ]],
    ],
  },
  'strengthen-partners': {
    headline: 'Run your supply chain like one team',
    phases: [
      ['Connect', 'Get the key partners into one shared view.', [
        { title: 'Invite your two most important partners to a collab', detail: 'Agree which numbers you both share, like orders, stock, delivery times and forecasts.', owner: 'Partner', effort: 'low' },
      ]],
      ['Spot and fix together', 'Find the bottlenecks between companies.', [
        { title: 'Review shared bottlenecks every week', detail: 'Use the Bottlenecks page together and assign each fix to one company.', owner: 'Partner', effort: 'low' },
        { title: 'Set shared service levels', detail: 'Write down on-time, fill-rate and response targets both sides commit to.', owner: 'Operations', effort: 'medium' },
      ]],
      ['Grow together', 'Turn the partnership into an advantage.', [
        { title: 'Plan demand together for the next quarter', detail: 'Share your forecast so partners can plan capacity and you avoid stock-outs.', owner: 'Partner', effort: 'medium' },
      ]],
    ],
  },
  'prepare-to-scale': {
    headline: 'Get the business ready to scale',
    phases: [
      ['Clean up the numbers', 'Know your unit economics cold.', [
        { title: 'Build a monthly financial dashboard', detail: 'Revenue, margin, cash, customer cost and customer value on one page.', owner: 'Finance', kpi: 'LTV to CAC ratio', effort: 'medium' },
      ]],
      ['Systemize', 'Make the business run without you in every decision.', [
        { title: 'Document your core processes', detail: 'Sales, delivery and billing written down so new people can follow them.', owner: 'Team lead', effort: 'medium' },
        { title: 'Hire or assign owners for each area', detail: 'One person accountable for each number on the dashboard.', owner: 'Owner', kpi: 'Revenue per employee', effort: 'high' },
      ]],
      ['Plan the raise or the push', 'Tell a clear growth story.', [
        { title: 'Build an 18-month plan with milestones', detail: 'Show what extra capital or capacity unlocks, month by month.', owner: 'Owner', kpi: 'Cash runway', effort: 'medium' },
      ]],
    ],
  },
};

function phaseWindows(days: Timeframe): string[] {
  const a = Math.round(days / 3), b = Math.round((days * 2) / 3);
  return [`Days 1–${a}`, `Days ${a + 1}–${b}`, `Days ${b + 1}–${days}`];
}

const GOAL_CATEGORIES: Record<GoalId, string[]> = {
  'grow-revenue': ['Growth'],
  'improve-profit': ['Profit'],
  'cut-costs': ['Profit', 'Operations'],
  'fix-operations': ['Operations', 'Quality'],
  'retain-customers': ['Customer'],
  'expand-markets': ['Growth'],
  'strengthen-partners': ['Partners', 'Operations'],
  'prepare-to-scale': ['Cash', 'People', 'Profit'],
};

export function pickKpisForGoal(industryId: string, goal: GoalId, count = 4): IndustryKpi[] {
  const pool = kpisForIndustry(industryId);
  const hints = GOAL_KPI_HINTS[goal];
  const cats = GOAL_CATEGORIES[goal];
  const scored = pool.map((k, i) => {
    const n = k.name.toLowerCase();
    const hit = hints.findIndex((h) => n.includes(h));
    const catBonus = cats.includes(k.category) ? 0 : 40;
    return { k, score: (hit === -1 ? 60 : hit) + catBonus + (k.industryId === 'universal' ? 15 : 0) + i / 1000 };
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, count).map((s) => s.k);
}

function defaultTarget(k: IndustryKpi, days: Timeframe): string {
  const scale = days <= 30 ? 'small' : days <= 90 ? 'medium' : 'large';
  const pct = { small: 5, medium: 10, large: 20 }[scale];
  if (k.unit === '%' || k.unit === 'score') return k.direction === 'up' ? `Up ${Math.max(2, Math.round(pct / 2))} points` : `Down ${Math.max(2, Math.round(pct / 2))} points`;
  return k.direction === 'up' ? `+${pct}%` : `−${pct}%`;
}

export function buildRuleBasedGrowthPlan(p: GrowthProfile): GrowthPlan {
  const industry = getIndustry(p.industryId);
  const industryName = industry?.name ?? 'your industry';
  const playbook = GOAL_PLAYBOOK[p.goal] ?? GOAL_PLAYBOOK['grow-revenue'];
  const windows = phaseWindows(p.timeframeDays);
  const goalLabel = GOALS.find((g) => g.id === p.goal)?.label ?? 'Grow the business';
  const isSmall = p.size === 'solo' || p.size === '2-10';
  let n = 0;
  const id = (prefix: string) => `${prefix}-${++n}`;

  const ownerFor = (o: StepOwner): StepOwner => (isSmall && o !== 'Partner' ? 'Owner' : o);

  const phases: PlanPhase[] = playbook.phases.map(([title, objective, steps], i) => ({
    id: id('phase'),
    title,
    window: windows[i],
    objective,
    steps: steps.map((s) => ({ ...s, owner: ownerFor(s.owner), id: id('step') })),
  }));

  // Challenge-specific steps go into the phase where they fit best.
  p.challenges.slice(0, 4).forEach((c, i) => {
    const step = CHALLENGE_STEPS[c];
    if (!step) return;
    if (phases.some((ph) => ph.steps.some((s) => s.title === step.title))) return;
    // Spread across phases, favouring whichever phase has the fewest steps.
    const target = [...phases].sort((a, b) => a.steps.length - b.steps.length || phases.indexOf(a) - phases.indexOf(b))[0];
    target.steps.push({ ...step, owner: ownerFor(step.owner), id: id('step') });
  });

  if (p.partners.length && !p.challenges.includes('partner-coordination') && p.goal !== 'strengthen-partners') {
    phases[1].steps.push({ ...CHALLENGE_STEPS['partner-coordination'], id: id('step') });
  }

  const picked = pickKpisForGoal(p.industryId, p.goal, 4);
  const northStarName = p.targetKpi || picked[0]?.name || 'Revenue';
  const northStarKpi = picked.find((k) => k.name === northStarName) ?? kpisForIndustry(p.industryId).find((k) => k.name === northStarName);
  const northStar: PlanKpi = {
    name: northStarName,
    target: p.targetValue?.trim() || (northStarKpi ? defaultTarget(northStarKpi, p.timeframeDays) : '+10%'),
    why: `The single number that tells you whether "${goalLabel.toLowerCase()}" is working.`,
  };
  const kpis: PlanKpi[] = picked
    .filter((k) => k.name !== northStarName)
    .slice(0, 3)
    .map((k) => ({ name: k.name, target: defaultTarget(k, p.timeframeDays), why: k.formula }));

  const quickWins = [
    'Pick one day a week to review your North Star number with the team.',
    p.challenges.includes('visibility') ? 'Import last month’s sales and cost data so the analyst can spot patterns.' : 'Import your latest data so the analyst can track progress for you.',
    p.partners.length ? `Send a data-share request to ${p.partners[0]}.` : 'List the suppliers or partners your results depend on.',
  ];

  const risks = [
    isSmall ? 'Trying to do every step at once. Finish one phase before starting the next.' : 'Unclear ownership. Every step needs one named person.',
    p.challenges.includes('cash-flow') ? 'Cash gets tight while you invest in growth. Keep the 13-week forecast current.' : 'Targets drift without a weekly check-in.',
  ];

  const partnerPlays = p.partners.length
    ? p.partners.slice(0, 3).map((name) => `Share the numbers you both depend on with ${name} and review them together every week.`)
    : ['Invite a key supplier, carrier or distributor to a data collab when you are ready.'];

  const name = p.businessName?.trim();
  return {
    headline: playbook.headline,
    summary: `${name ? name + ' is' : 'You are'} a ${STAGES.find((s) => s.id === p.stage)?.label.toLowerCase() ?? ''} ${industryName.toLowerCase()} business focused on "${goalLabel.toLowerCase()}". This ${p.timeframeDays}-day plan runs in three phases, targets ${northStar.name} (${northStar.target}) and tackles ${p.challenges.length ? p.challenges.length + ' challenge' + (p.challenges.length > 1 ? 's' : '') + ' you named' : 'the most common blockers for businesses like yours'}.`,
    northStar,
    kpis,
    phases,
    quickWins,
    risks,
    partnerPlays,
    generatedBy: 'rule-based',
    createdAt: Date.now(),
  };
}

/**
 * Validates an engine's JSON against the GrowthPlan shape and fills gaps from
 * the rule-based plan, so a partial or malformed model answer never reaches the UI.
 */
export function sanitizeGrowthPlan(raw: any, profile: GrowthProfile, generatedBy: AIEngineId): GrowthPlan {
  const base = buildRuleBasedGrowthPlan(profile);
  const str = (v: any, d = '') => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 600) : d);
  const owners: StepOwner[] = ['Owner', 'Operations', 'Sales & marketing', 'Finance', 'Partner', 'Team lead'];
  const efforts: Effort[] = ['low', 'medium', 'high'];
  let n = 0;
  const phases: PlanPhase[] = Array.isArray(raw?.phases)
    ? raw.phases.slice(0, 5).map((ph: any, i: number) => ({
        id: `phase-${++n}`,
        title: str(ph?.title, `Phase ${i + 1}`),
        window: str(ph?.window, base.phases[i]?.window ?? ''),
        objective: str(ph?.objective),
        steps: (Array.isArray(ph?.steps) ? ph.steps : []).slice(0, 7).map((s: any) => ({
          id: `step-${++n}`,
          title: str(s?.title, 'Next step'),
          detail: str(s?.detail),
          owner: owners.includes(s?.owner) ? s.owner : 'Owner',
          kpi: str(s?.kpi) || undefined,
          effort: efforts.includes(s?.effort) ? s.effort : 'medium',
        })),
      })).filter((ph: PlanPhase) => ph.steps.length > 0)
    : [];
  if (phases.length === 0) return base;
  const kpi = (k: any): PlanKpi => ({ name: str(k?.name, 'KPI'), target: str(k?.target, '—'), why: str(k?.why) });
  const list = (v: any, d: string[]) => (Array.isArray(v) && v.length ? v.slice(0, 6).map((x: any) => str(x)).filter(Boolean) : d);
  return {
    headline: str(raw?.headline, base.headline),
    summary: str(raw?.summary, base.summary),
    northStar: raw?.northStar ? kpi(raw.northStar) : base.northStar,
    kpis: Array.isArray(raw?.kpis) && raw.kpis.length ? raw.kpis.slice(0, 5).map(kpi) : base.kpis,
    phases,
    quickWins: list(raw?.quickWins, base.quickWins),
    risks: list(raw?.risks, base.risks),
    partnerPlays: list(raw?.partnerPlays, base.partnerPlays),
    generatedBy,
    createdAt: Date.now(),
  };
}

/** Plain-language description of the profile, used in AI prompts. */
export function describeProfile(p: GrowthProfile): string {
  const industry = getIndustry(p.industryId)?.name ?? p.industryId;
  const goal = GOALS.find((g) => g.id === p.goal)?.label ?? p.goal;
  const size = COMPANY_SIZES.find((s) => s.id === p.size)?.label ?? p.size;
  const stage = STAGES.find((s) => s.id === p.stage)?.label ?? p.stage;
  const challenges = p.challenges.map((c) => CHALLENGES.find((x) => x.id === c)?.label ?? c).join('; ') || 'none named';
  return [
    `Business name: ${p.businessName || 'not given'}`,
    `Industry: ${industry}`,
    `Team size: ${size}`,
    `Stage: ${stage}`,
    `Main goal: ${goal}${p.goalDetail ? ` (in their words: "${p.goalDetail}")` : ''}`,
    `Target metric: ${p.targetKpi}${p.targetValue ? `, target ${p.targetValue}` : ''} within ${p.timeframeDays} days`,
    `Challenges: ${challenges}`,
    `Partners they work with: ${p.partners.join(', ') || 'none named'}`,
  ].join('\n');
}
