// AI consultant sessions: short, structured "meetings" with the analyst.
// Each session asks for a few numbers, returns findings, 2–3 options with
// trade-offs and a recommendation, and turns the chosen option into actions.
//
// The rule-based consultant below does real arithmetic on the answers, so every
// session has a useful answer even with no AI engine connected. AI engines get
// the same templates and must return the same shape (see sanitizeConsult).
import type { StepOwner, GrowthProfile } from './growth';

export type SessionKind = 'health-check' | 'swot' | 'pricing' | 'cash-flow' | 'growth' | 'bottleneck' | 'partners' | 'hiring' | 'ai-check';
export type Level = 'low' | 'medium' | 'high';
export type Tone = 'good' | 'warn' | 'bad' | 'neutral';

export interface SessionField {
  id: string;
  label: string;
  type: 'number' | 'money' | 'percent' | 'days' | 'text' | 'choice';
  placeholder?: string;
  options?: string[];
  help?: string;
  optional?: boolean;
}

export interface SessionTemplate {
  id: SessionKind;
  title: string;
  blurb: string;
  /** lucide icon name, resolved on the client */
  icon: string;
  minutes: number;
  fields: SessionField[];
}

export interface ConsultFinding { label: string; value?: string; tone: Tone; detail: string }
export interface ConsultStep { title: string; detail: string; owner: StepOwner; weeks: number }
export interface ConsultOption {
  id: string;
  title: string;
  summary: string;
  impact: Level;
  effort: Level;
  pros: string[];
  cons: string[];
  steps: ConsultStep[];
}
export interface ConsultResult {
  headline: string;
  findings: ConsultFinding[];
  options: ConsultOption[];
  recommendedOptionId: string;
  /** One question the consultant would ask next. */
  followUp?: string;
  generatedBy: string;
}
export type ConsultAnswers = Record<string, string | number | undefined>;
export interface ConsultRequest { kind: SessionKind; answers: ConsultAnswers; businessContext?: string }

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'health-check', title: 'Business health check', icon: 'Stethoscope', minutes: 4,
    blurb: 'A quick check-up across sales, profit, customers and cash, and the one area to fix first.',
    fields: [
      { id: 'trend', label: 'Sales over the last 3 months', type: 'choice', options: ['Growing', 'Flat', 'Falling'] },
      { id: 'margin', label: 'Gross margin', type: 'percent', placeholder: '40', help: '(Sales − cost of what you sold) ÷ sales' },
      { id: 'repeat', label: 'Customers who come back or renew', type: 'percent', placeholder: '35' },
      { id: 'runway', label: 'Months of cash if sales stopped', type: 'number', placeholder: '4' },
      { id: 'headache', label: 'Biggest headache right now', type: 'text', placeholder: 'e.g. late deliveries, slow sales month', optional: true },
    ],
  },
  {
    id: 'pricing', title: 'Pricing review', icon: 'Tag', minutes: 5,
    blurb: 'Find out if you are leaving money on the table, and how much volume you could lose before a price rise hurts.',
    fields: [
      { id: 'price', label: 'Average selling price', type: 'money', placeholder: '42' },
      { id: 'unitCost', label: 'Cost to deliver one sale', type: 'money', placeholder: '24', help: 'Materials, labor and shipping for one unit or job' },
      { id: 'volume', label: 'Sales per month', type: 'number', placeholder: '600' },
      { id: 'competitor', label: 'Typical competitor price', type: 'money', placeholder: '45', optional: true },
      { id: 'lastChange', label: 'Months since your last price change', type: 'number', placeholder: '18', optional: true },
    ],
  },
  {
    id: 'cash-flow', title: 'Cash flow check', icon: 'Wallet', minutes: 5,
    blurb: 'See your runway and how long cash is stuck between paying suppliers and getting paid.',
    fields: [
      { id: 'cash', label: 'Cash in the bank', type: 'money', placeholder: '45000' },
      { id: 'revenue', label: 'Monthly revenue', type: 'money', placeholder: '60000' },
      { id: 'expenses', label: 'Monthly expenses (everything)', type: 'money', placeholder: '58000' },
      { id: 'dso', label: 'Days until customers pay you', type: 'days', placeholder: '35' },
      { id: 'dpo', label: 'Days until you pay suppliers', type: 'days', placeholder: '20' },
      { id: 'dio', label: 'Days stock sits before it sells', type: 'days', placeholder: '30', optional: true, help: 'Leave blank for service businesses' },
    ],
  },
  {
    id: 'growth', title: 'Growth strategy', icon: 'TrendingUp', minutes: 5,
    blurb: 'Break your revenue target into customers, order size and retention, and pick the fastest lever.',
    fields: [
      { id: 'current', label: 'Monthly revenue today', type: 'money', placeholder: '40000' },
      { id: 'target', label: 'Monthly revenue target', type: 'money', placeholder: '60000' },
      { id: 'months', label: 'Months to get there', type: 'number', placeholder: '9' },
      { id: 'customers', label: 'Customers or orders per month', type: 'number', placeholder: '800' },
      { id: 'repeat', label: 'Share of revenue from repeat customers', type: 'percent', placeholder: '30', optional: true },
      { id: 'channel', label: 'Where most new customers come from', type: 'choice', options: ['Word of mouth', 'Online ads', 'Search / SEO', 'Social media', 'Sales team', 'Partners / referrals', 'Walk-in'] },
    ],
  },
  {
    id: 'bottleneck', title: 'Bottleneck deep-dive', icon: 'Gauge', minutes: 4,
    blurb: 'Size the constraint that limits your output and get the cheapest way to open it up.',
    fields: [
      { id: 'stage', label: 'The slowest stage', type: 'choice', options: ['Taking orders', 'Production / prep', 'Picking & packing', 'Delivery', 'Sales follow-up', 'Billing & collections'] },
      { id: 'throughput', label: 'What that stage handles per day today', type: 'number', placeholder: '120' },
      { id: 'demand', label: 'What it needs to handle per day', type: 'number', placeholder: '160' },
      { id: 'wait', label: 'Average wait before that stage (hours)', type: 'number', placeholder: '6', optional: true },
      { id: 'rework', label: 'Work that has to be redone', type: 'percent', placeholder: '8', optional: true },
    ],
  },
  {
    id: 'partners', title: 'Partner & vendor review', icon: 'Handshake', minutes: 4,
    blurb: 'Score a supplier, carrier or agency, and decide whether to fix, renegotiate or add a backup.',
    fields: [
      { id: 'partner', label: 'Partner name or type', type: 'text', placeholder: 'e.g. main supplier' },
      { id: 'onTime', label: 'On-time rate', type: 'percent', placeholder: '86' },
      { id: 'defects', label: 'Orders with problems', type: 'percent', placeholder: '4' },
      { id: 'share', label: 'Share of your spend with them', type: 'percent', placeholder: '60' },
      { id: 'comms', label: 'How communication feels', type: 'choice', options: ['Great', 'OK', 'Slow', 'Poor'] },
    ],
  },
  {
    id: 'hiring', title: 'Hiring readiness', icon: 'UserPlus', minutes: 4,
    blurb: 'Check whether you can afford the hire, how fast it pays back, and the cheaper alternatives.',
    fields: [
      { id: 'role', label: 'Role you want to hire', type: 'text', placeholder: 'e.g. operations assistant' },
      { id: 'cost', label: 'Monthly cost of the hire (with taxes)', type: 'money', placeholder: '4500' },
      { id: 'runway', label: 'Months of cash today', type: 'number', placeholder: '6' },
      { id: 'hours', label: 'Hours a week this work takes today', type: 'number', placeholder: '25' },
      { id: 'unlocks', label: 'Extra monthly revenue or savings it unlocks', type: 'money', placeholder: '6000', optional: true },
    ],
  },
  {
    id: 'ai-check', title: 'AI project check', icon: 'Cpu', minutes: 5,
    blurb: 'Is your AI or automation paying off? Get the ROI, payback and the weak link, then decide to scale, fix or stop.',
    fields: [
      { id: 'useCase', label: 'What the AI does', type: 'choice', options: ['Quality inspection', 'Predictive maintenance', 'Demand forecasting', 'Scheduling & planning', 'Customer service', 'Office automation', 'Other'] },
      { id: 'before', label: 'Monthly cost of the problem before AI', type: 'money', placeholder: '20000', help: 'Downtime, scrap, overtime or manual hours, in dollars a month' },
      { id: 'after', label: 'Same cost per month now', type: 'money', placeholder: '14000' },
      { id: 'monthlyCost', label: 'Monthly cost of the AI', type: 'money', placeholder: '2500', help: 'Software, cloud, support and upkeep' },
      { id: 'setupCost', label: 'One-time setup cost', type: 'money', placeholder: '30000', optional: true, help: 'Sensors, cameras, integration and training' },
      { id: 'accuracy', label: 'How often the AI is right', type: 'percent', placeholder: '92', optional: true },
      { id: 'acceptance', label: 'Recommendations staff actually follow', type: 'percent', placeholder: '70', optional: true },
      { id: 'dataReady', label: 'Machines or processes with clean, connected data', type: 'percent', placeholder: '60', optional: true },
      { id: 'months', label: 'Months since it went live', type: 'number', placeholder: '4', optional: true },
    ],
  },
  {
    id: 'swot', title: 'SWOT & strategy', icon: 'Grid2x2', minutes: 6,
    blurb: 'Turn your strengths, weaknesses, opportunities and threats into three concrete strategies.',
    fields: [
      { id: 'strengths', label: 'Strengths', type: 'text', placeholder: 'What you do better than others' },
      { id: 'weaknesses', label: 'Weaknesses', type: 'text', placeholder: 'What holds you back' },
      { id: 'opportunities', label: 'Opportunities', type: 'text', placeholder: 'Openings in the market' },
      { id: 'threats', label: 'Threats', type: 'text', placeholder: 'What could hurt you', optional: true },
    ],
  },
];

export function getTemplate(kind: SessionKind): SessionTemplate {
  return SESSION_TEMPLATES.find((t) => t.id === kind) ?? SESSION_TEMPLATES[0];
}

const CHALLENGE_SESSION: Record<string, { kind: SessionKind; why: string }> = {
  'cash-flow': { kind: 'cash-flow', why: 'You said cash flow is tight.' },
  pricing: { kind: 'pricing', why: 'You said pricing feels wrong.' },
  costs: { kind: 'pricing', why: 'Rising costs usually mean prices need a review.' },
  delivery: { kind: 'bottleneck', why: 'Late delivery is usually one slow stage.' },
  quality: { kind: 'bottleneck', why: 'Rework eats capacity at your slowest stage.' },
  inventory: { kind: 'cash-flow', why: 'Stock ties up cash.' },
  'partner-coordination': { kind: 'partners', why: 'You said partners are hard to coordinate.' },
  staffing: { kind: 'hiring', why: 'You named hiring as a challenge.' },
  'lead-flow': { kind: 'growth', why: 'Not enough leads is a growth-lever question.' },
  conversion: { kind: 'growth', why: 'Better conversion is often the cheapest growth.' },
  'customer-churn': { kind: 'growth', why: 'Repeat business is a growth lever.' },
  visibility: { kind: 'health-check', why: 'A health check gives you a clear baseline.' },
};
const MAKERS = ['manufacturing', 'food-production', 'construction', 'agriculture', 'energy'];
const GOAL_SESSION: Record<string, SessionKind> = {
  'grow-revenue': 'growth', 'improve-profit': 'pricing', 'cut-costs': 'pricing', 'fix-operations': 'bottleneck',
  'retain-customers': 'growth', 'expand-markets': 'swot', 'strengthen-partners': 'partners', 'prepare-to-scale': 'hiring',
};

/** Sessions worth running first for this business, with a one-line reason. */
export function recommendSessions(profile?: GrowthProfile | null, done: SessionKind[] = []): { kind: SessionKind; why: string }[] {
  const out: { kind: SessionKind; why: string }[] = [];
  const add = (kind: SessionKind, why: string) => { if (!out.some((o) => o.kind === kind)) out.push({ kind, why }); };
  if (!done.includes('health-check')) add('health-check', 'Start with a baseline across sales, profit, customers and cash.');
  for (const c of profile?.challenges ?? []) { const m = CHALLENGE_SESSION[c]; if (m) add(m.kind, m.why); }
  if (profile?.goal && GOAL_SESSION[profile.goal]) add(GOAL_SESSION[profile.goal], 'It matches your main goal.');
  if (profile?.industryId && MAKERS.includes(profile.industryId)) add('ai-check', 'Using AI or automation on the line? Check it is paying off.');
  add('growth', 'Break your target into the levers that move it.');
  add('cash-flow', 'Know your runway before you invest.');
  return out.slice(0, 3);
}

// ---------------------------------------------------------------- helpers
const num = (a: ConsultAnswers, k: string): number | undefined => {
  const v = a[k];
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,%\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
const str = (a: ConsultAnswers, k: string) => (a[k] === undefined ? '' : String(a[k]).trim());
const money = (v: number) => { const n = Math.round(v * 100) / 100; return Math.abs(n) >= 1000 ? `$${Math.round(n).toLocaleString('en-US')}` : `$${n.toFixed(n % 1 ? 2 : 0)}`; };
const pct = (n: number, d = 0) => `${n.toFixed(d)}%`;
const opt = (id: string, o: Omit<ConsultOption, 'id'>): ConsultOption => ({ id, ...o });

// ---------------------------------------------------------------- rule-based consultant
export function buildRuleBasedConsult(req: ConsultRequest): ConsultResult {
  const a = req.answers;
  const base = (r: Omit<ConsultResult, 'generatedBy'>): ConsultResult => ({ ...r, generatedBy: 'rule-based' });

  switch (req.kind) {
    case 'pricing': {
      const price = num(a, 'price') ?? 0, cost = num(a, 'unitCost') ?? 0, vol = num(a, 'volume') ?? 0;
      const comp = num(a, 'competitor'), since = num(a, 'lastChange');
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      const rise = margin < 30 ? 8 : margin < 50 ? 6 : 4;
      const m = margin / 100, p = rise / 100;
      const breakEvenLoss = (p / (m + p)) * 100; // volume you can lose before profit falls
      const gainIfNoLoss = price * p * vol;
      const gap = comp ? ((comp - price) / comp) * 100 : undefined;
      return base({
        headline: margin < 30 ? 'Your margin is thin. Price is your fastest profit lever.' : gap !== undefined && gap > 5 ? 'You are priced below the market.' : 'Your pricing is healthy. Grow profit by testing small rises.',
        findings: [
          { label: 'Gross margin per sale', value: pct(margin), tone: margin < 30 ? 'bad' : margin < 45 ? 'warn' : 'good', detail: `${money(price - cost)} profit on every ${money(price)} sale.` },
          { label: `If you raise prices ${rise}%`, value: `+${money(gainIfNoLoss)}/mo`, tone: 'good', detail: `You could lose up to ${pct(breakEvenLoss, 1)} of sales and still make the same profit.` },
          ...(gap !== undefined ? [{ label: 'Versus competitors', value: gap > 0 ? `${pct(gap, 1)} cheaper` : `${pct(-gap, 1)} pricier`, tone: (gap > 5 ? 'warn' : 'neutral') as Tone, detail: gap > 5 ? 'Customers already accept higher prices for similar offers.' : 'You are close to the market price.' }] : []),
          ...(since !== undefined && since >= 12 ? [{ label: 'Last price change', value: `${since} months ago`, tone: 'warn' as Tone, detail: 'Costs have likely risen since. Most businesses review prices every year.' }] : []),
        ],
        options: [
          opt('raise', { title: `Raise prices ${rise}% on new orders`, summary: `Adds about ${money(gainIfNoLoss)} a month if volume holds; safe up to a ${pct(breakEvenLoss, 0)} drop.`, impact: 'high', effort: 'low',
            pros: ['Fastest profit lever', 'No new costs'], cons: ['Some price-sensitive customers may leave'],
            steps: [
              { title: `Pick the products or services for a ${rise}% rise`, detail: 'Start with your best sellers and the ones furthest below competitor prices.', owner: 'Owner', weeks: 1 },
              { title: 'Tell existing customers 30 days ahead', detail: 'A short, honest note about rising costs and what stays the same.', owner: 'Sales & marketing', weeks: 2 },
              { title: 'Track weekly sales volume for 6 weeks', detail: `Compare to your ${vol.toLocaleString()} a month baseline. Roll back only if the drop passes ${pct(breakEvenLoss, 0)}.`, owner: 'Owner', weeks: 6 },
            ] }),
          opt('tiers', { title: 'Add a premium option or bundle', summary: 'Keep today’s price and add a higher tier with more value; usually 15–25% of buyers pick it.', impact: 'medium', effort: 'medium',
            pros: ['No customer loses their current price', 'Raises average order value'], cons: ['Needs a clear extra benefit', 'Takes a few weeks to set up'],
            steps: [
              { title: 'Design one premium tier or bundle', detail: 'Add speed, support or extras that cost you little but customers value.', owner: 'Owner', weeks: 2 },
              { title: 'Show it next to the standard option', detail: 'On your menu, site or quote, with the premium option first.', owner: 'Sales & marketing', weeks: 3 },
              { title: 'Review the share who choose premium', detail: 'Aim for 15% or more after one month.', owner: 'Owner', weeks: 7 },
            ] }),
          opt('cost', { title: 'Cut the cost to deliver each sale', summary: `Every ${money(Math.max(1, cost * 0.05))} saved per sale adds ${money(cost * 0.05 * vol)} a month.`, impact: margin < 30 ? 'high' : 'medium', effort: 'medium',
            pros: ['Customers see no change', 'Compounds with any price move'], cons: ['Slower to show results', 'May need supplier negotiations'],
            steps: [
              { title: 'List the top 3 costs in each sale', detail: 'Materials, labor and shipping, from last month’s invoices.', owner: 'Finance', weeks: 1 },
              { title: 'Get 2 competing quotes for the biggest cost', detail: 'Use them to renegotiate with your current supplier.', owner: 'Operations', weeks: 3 },
            ] }),
        ],
        recommendedOptionId: margin < 45 || (gap ?? 0) > 5 ? 'raise' : 'tiers',
        followUp: 'Which products sell most even when you run out or have a wait? Those can usually take a larger rise.',
      });
    }

    case 'cash-flow': {
      const cash = num(a, 'cash') ?? 0, rev = num(a, 'revenue') ?? 0, exp = num(a, 'expenses') ?? 0;
      const dso = num(a, 'dso') ?? 0, dpo = num(a, 'dpo') ?? 0, dio = num(a, 'dio') ?? 0;
      const burn = exp - rev;
      const runway = burn > 0 ? cash / burn : Infinity;
      const ccc = dio + dso - dpo;
      const dailyRev = rev / 30;
      const freed10 = dailyRev * 10;
      return base({
        headline: runway < 3 ? 'Cash is the priority. Protect your runway before anything else.' : ccc > 45 ? 'Cash is stuck too long between paying and getting paid.' : 'Your cash position is stable.',
        findings: [
          { label: burn > 0 ? 'Runway' : 'Monthly cash flow', value: burn > 0 ? `${runway.toFixed(1)} months` : `+${money(-burn)}/mo`, tone: burn > 0 ? (runway < 3 ? 'bad' : runway < 6 ? 'warn' : 'good') : 'good', detail: burn > 0 ? `You spend ${money(burn)} more than you earn each month.` : 'You earn more than you spend each month.' },
          { label: 'Cash conversion cycle', value: `${Math.round(ccc)} days`, tone: ccc > 60 ? 'bad' : ccc > 30 ? 'warn' : 'good', detail: `${dio ? `Stock ${dio}d + ` : ''}Waiting to get paid ${dso}d − supplier terms ${dpo}d.` },
          { label: 'Collecting 10 days faster frees', value: money(freed10), tone: 'good', detail: 'One-time cash you get back without selling more.' },
        ],
        options: [
          opt('collect', { title: 'Get paid faster', summary: `Cut the time customers take to pay from ${dso} to ${Math.max(0, dso - 10)} days and free about ${money(freed10)}.`, impact: 'high', effort: 'low',
            pros: ['Fast, no new debt', 'Works for most businesses'], cons: ['Some customers push back on new terms'],
            steps: [
              { title: 'Send invoices the same day work is done', detail: 'With a pay-now link and clear due date.', owner: 'Finance', weeks: 1 },
              { title: 'Ask for deposits on large or new orders', detail: '25–50% upfront is common and protects you.', owner: 'Sales & marketing', weeks: 2 },
              { title: 'Chase anything 7 days overdue', detail: 'A friendly reminder routine every Monday.', owner: 'Finance', weeks: 4 },
            ] }),
          opt('terms', { title: 'Negotiate longer supplier terms', summary: `Moving from ${dpo} to ${dpo + 15} days keeps about ${money((exp / 30) * 15 * 0.5)} longer in your account.`, impact: 'medium', effort: 'medium',
            pros: ['Cash stays with you longer', 'Builds the supplier relationship'], cons: ['May cost an early-payment discount'],
            steps: [
              { title: 'List suppliers by monthly spend', detail: 'Start with the top 3.', owner: 'Finance', weeks: 1 },
              { title: 'Ask for 15 more days on payment terms', detail: 'Offer reliable payment or a longer commitment in return.', owner: 'Owner', weeks: 3 },
            ] }),
          opt('trim', { title: 'Pause or cut non-essential spend', summary: burn > 0 ? `Closing the ${money(burn)} monthly gap extends runway the most.` : 'Lock in a cash buffer of 3 months of expenses.', impact: runway < 6 ? 'high' : 'low', effort: 'low',
            pros: ['Immediate effect'], cons: ['Can slow growth if you cut the wrong things'],
            steps: [
              { title: 'Review every subscription and recurring cost', detail: 'Cancel or downgrade anything not used weekly.', owner: 'Owner', weeks: 1 },
              { title: 'Delay big purchases until runway is 6+ months', detail: 'Unless they pay back within 3 months.', owner: 'Owner', weeks: 2 },
            ] }),
        ],
        recommendedOptionId: runway < 3 ? 'trim' : 'collect',
        followUp: 'Do any customers owe you more than 60 days? Those are worth a phone call this week. For loans or tax questions, talk to your accountant.',
      });
    }

    case 'growth': {
      const cur = num(a, 'current') ?? 0, tgt = num(a, 'target') ?? 0, months = Math.max(1, num(a, 'months') ?? 6);
      const cust = Math.max(1, num(a, 'customers') ?? 1), rep = num(a, 'repeat') ?? 25, channel = str(a, 'channel') || 'your main channel';
      const growthNeeded = cur > 0 ? ((tgt - cur) / cur) * 100 : 100;
      const monthly = cur > 0 ? (Math.pow(tgt / cur, 1 / months) - 1) * 100 : 0;
      const aov = cur / cust;
      const extraCustomers = Math.ceil((tgt - cur) / Math.max(1, aov));
      return base({
        headline: monthly > 8 ? 'Ambitious target. You will need more than one lever.' : 'Reachable target. Focus on your strongest lever.',
        findings: [
          { label: 'Growth needed', value: `+${pct(growthNeeded)} total`, tone: growthNeeded > 100 ? 'warn' : 'neutral', detail: `About ${pct(monthly, 1)} a month for ${months} months.` },
          { label: 'Average order value', value: money(aov), tone: 'neutral', detail: `${cust.toLocaleString()} orders a month at ${money(aov)} each.` },
          { label: 'Same order value means', value: `+${extraCustomers.toLocaleString()} orders/mo`, tone: extraCustomers / cust > 0.5 ? 'warn' : 'neutral', detail: 'Or reach it with a mix of more customers, bigger orders and more repeat buying.' },
          { label: 'Repeat revenue', value: pct(rep), tone: rep < 25 ? 'warn' : 'good', detail: rep < 25 ? 'Low repeat buying makes growth expensive. Fix retention before spending more on acquisition.' : 'Healthy repeat base to build on.' },
        ],
        options: [
          opt('channel', { title: `Double down on ${channel.toLowerCase()}`, summary: `Your best channel already works; aim it at the ${extraCustomers.toLocaleString()} extra monthly orders.`, impact: 'high', effort: 'medium',
            pros: ['Builds on what works', 'Easy to measure'], cons: ['Can get more expensive as you scale'],
            steps: [
              { title: `Measure cost and conversion for ${channel.toLowerCase()}`, detail: 'Know what one new customer costs you today.', owner: 'Sales & marketing', weeks: 1 },
              { title: 'Increase effort or budget 20% for 4 weeks', detail: 'Keep everything else the same so you can read the result.', owner: 'Sales & marketing', weeks: 5 },
            ] }),
          opt('aov', { title: 'Raise order value 10%', summary: `Adds about ${money(cur * 0.1)} a month with the same customers.`, impact: 'medium', effort: 'low',
            pros: ['No extra marketing spend'], cons: ['Needs good add-ons or bundles'],
            steps: [
              { title: 'Add one add-on or bundle at checkout', detail: 'The item most often bought together.', owner: 'Sales & marketing', weeks: 2 },
              { title: 'Set a free-delivery or discount threshold', detail: 'About 20% above today’s average order.', owner: 'Owner', weeks: 2 },
            ] }),
          opt('retain', { title: 'Win more repeat business', summary: `Moving repeat revenue from ${pct(rep)} to ${pct(Math.min(80, rep + 10))} is usually the cheapest growth.`, impact: rep < 25 ? 'high' : 'medium', effort: 'medium',
            pros: ['Cheapest growth', 'Raises lifetime value'], cons: ['Slower to show up in revenue'],
            steps: [
              { title: 'Follow up every first-time customer within 7 days', detail: 'Thank-you plus a reason to come back.', owner: 'Sales & marketing', weeks: 2 },
              { title: 'Start a simple loyalty or reorder reminder', detail: 'Based on how often customers usually buy.', owner: 'Sales & marketing', weeks: 4 },
            ] }),
        ],
        recommendedOptionId: rep < 25 ? 'retain' : monthly > 8 ? 'channel' : 'aov',
        followUp: 'What do your best customers have in common? Finding more of them usually beats finding any customers.',
      });
    }

    case 'bottleneck': {
      const stage = str(a, 'stage') || 'the slowest stage';
      const tp = Math.max(1, num(a, 'throughput') ?? 1), demand = num(a, 'demand') ?? tp;
      const wait = num(a, 'wait'), rework = num(a, 'rework') ?? 0;
      const gap = Math.max(0, demand - tp), gapPct = (gap / tp) * 100;
      const reworkGain = tp * (rework / 100);
      return base({
        headline: gap > 0 ? `${stage} is ${pct(gapPct)} short of demand.` : `${stage} keeps up today. Protect it as you grow.`,
        findings: [
          { label: 'Capacity gap', value: gap > 0 ? `${Math.round(gap)} per day` : 'None today', tone: gapPct > 20 ? 'bad' : gap > 0 ? 'warn' : 'good', detail: `Handles ${tp} a day; needs ${demand}.` },
          ...(rework > 0 ? [{ label: 'Lost to rework', value: `${Math.round(reworkGain)} per day`, tone: (rework > 5 ? 'warn' : 'neutral') as Tone, detail: `Fixing redo work alone recovers ${pct(rework)} of capacity.` }] : []),
          ...(wait !== undefined ? [{ label: 'Queue before it', value: `${wait} hours`, tone: (wait > 4 ? 'warn' : 'neutral') as Tone, detail: 'Waiting time is usually where delays and errors start.' }] : []),
        ],
        options: [
          opt('quality', { title: 'Stop redo work at the constraint', summary: rework > 0 ? `Recovers about ${Math.round(reworkGain)} units a day with no new people.` : 'Check the work arriving at this stage is complete and right first time.', impact: rework > 5 ? 'high' : 'medium', effort: 'low',
            pros: ['Cheapest capacity you can get', 'Improves customer experience'], cons: ['Needs a few days of tracking first'],
            steps: [
              { title: `Log every redo at ${stage.toLowerCase()} for 2 weeks`, detail: 'Note the cause each time.', owner: 'Operations', weeks: 2 },
              { title: 'Fix the top cause with a checklist or check-step', detail: 'Usually one cause explains half the redo work.', owner: 'Team lead', weeks: 3 },
            ] }),
          opt('capacity', { title: 'Add capacity only at the constraint', summary: gap > 0 ? `Close the ${Math.round(gap)}-a-day gap with an extra shift, person or machine there.` : 'Plan the next capacity step before demand arrives.', impact: 'high', effort: 'high',
            pros: ['Directly raises output'], cons: ['Costs money', 'Wasted if added anywhere else'],
            steps: [
              { title: 'Price an extra shift, hire or tool for this stage', detail: 'Compare to the revenue the gap is costing you.', owner: 'Owner', weeks: 2 },
              { title: 'Run a 2-week trial at peak times', detail: 'Measure daily output before committing.', owner: 'Operations', weeks: 4 },
            ] }),
          opt('flow', { title: 'Smooth the flow into it', summary: 'Smaller batches and a fixed daily cut-off stop work piling up in front of the constraint.', impact: 'medium', effort: 'low',
            pros: ['Quick to try', 'Shorter lead times'], cons: ['Needs everyone to stick to the new rhythm'],
            steps: [
              { title: 'Set a daily cut-off time for new work', detail: 'Share it with customers and partners.', owner: 'Operations', weeks: 1 },
              { title: 'Release work in smaller batches', detail: 'Every 1–2 hours instead of all at once.', owner: 'Team lead', weeks: 2 },
            ] }),
        ],
        recommendedOptionId: rework > 5 ? 'quality' : gapPct > 20 ? 'capacity' : 'flow',
        followUp: 'Does the constraint ever stand idle waiting for work or approvals? Every idle hour there is lost output for the whole business.',
      });
    }

    case 'partners': {
      const name = str(a, 'partner') || 'this partner';
      const ot = num(a, 'onTime') ?? 90, def = num(a, 'defects') ?? 2, share = num(a, 'share') ?? 30, comms = str(a, 'comms') || 'OK';
      const score = Math.round(Math.max(0, Math.min(100, ot - def * 3 - (comms === 'Poor' ? 15 : comms === 'Slow' ? 8 : 0))));
      const concentrated = share >= 50;
      return base({
        headline: score < 75 ? `${name} is hurting your results. Act now.` : concentrated ? `${name} works, but you depend on them heavily.` : `${name} is a solid partner.`,
        findings: [
          { label: 'Partner score', value: `${score}/100`, tone: score < 75 ? 'bad' : score < 88 ? 'warn' : 'good', detail: `On time ${pct(ot)}, problems ${pct(def)}, communication: ${comms.toLowerCase()}.` },
          { label: 'Dependence', value: `${pct(share)} of spend`, tone: concentrated ? 'warn' : 'good', detail: concentrated ? 'If they have a bad month, so do you. A backup lowers the risk.' : 'Healthy spread of risk.' },
        ],
        options: [
          opt('scorecard', { title: 'Agree a shared weekly scorecard', summary: 'Three numbers you both see weekly: on-time, problems and response time.', impact: 'high', effort: 'low',
            pros: ['Fixes most issues without conflict', 'Uses ChainInsideIQ collabs'], cons: ['Needs their buy-in'],
            steps: [
              { title: `Set up a data collab with ${name}`, detail: 'Share orders and delivery status only.', owner: 'Operations', weeks: 1 },
              { title: 'Hold a 20-minute weekly review', detail: 'Same three numbers every week, one owner per fix.', owner: 'Partner', weeks: 4 },
            ] }),
          opt('sla', { title: 'Renegotiate service terms', summary: 'Put on-time and quality targets in writing, with credits if missed.', impact: 'medium', effort: 'medium',
            pros: ['Clear expectations'], cons: ['Can strain the relationship if done badly'],
            steps: [
              { title: 'Gather 8 weeks of on-time and problem data', detail: 'Facts first, then the conversation.', owner: 'Operations', weeks: 2 },
              { title: 'Propose targets and credits', detail: `e.g. ${Math.min(98, Math.round(ot + 6))}% on time, credit for each miss.`, owner: 'Owner', weeks: 4 },
            ] }),
          opt('backup', { title: 'Add a backup partner', summary: 'Move 10–20% of volume to a second partner to lower risk and create healthy competition.', impact: concentrated ? 'high' : 'low', effort: 'medium',
            pros: ['Protects you from a bad month'], cons: ['Smaller volume can mean slightly higher prices'],
            steps: [
              { title: 'Shortlist 2 alternatives and get quotes', detail: 'Ask for references from similar businesses.', owner: 'Owner', weeks: 3 },
              { title: 'Trial one with 10% of volume', detail: 'Compare on-time and quality for a month.', owner: 'Operations', weeks: 8 },
            ] }),
        ],
        recommendedOptionId: score < 75 && concentrated ? 'backup' : score < 88 ? 'scorecard' : 'scorecard',
        followUp: `Has ${name} ever told you what makes your orders hard to fulfil? Fixes often go both ways.`,
      });
    }

    case 'hiring': {
      const role = str(a, 'role') || 'this role';
      const cost = num(a, 'cost') ?? 0, runway = num(a, 'runway') ?? 0, hours = num(a, 'hours') ?? 0, unlocks = num(a, 'unlocks');
      const payback = unlocks && unlocks > 0 ? cost / unlocks : undefined;
      const ready = runway >= 6 && (payback === undefined || payback <= 1.2);
      const rec = runway < 6 || hours < 30 ? (hours < 15 ? 'automate' : 'parttime') : ready ? 'hire' : 'parttime';
      const an = /^[aeiou]/i.test(role) ? 'an' : 'a';
      return base({
        headline: runway < 6 ? 'Not yet. Build runway or try a part-time option first.'
          : rec === 'hire' ? `You are ready to hire ${an} ${role}.`
          : rec === 'parttime' ? (ready ? 'You can afford it. Start part-time until the work fills a full week.' : 'Possible, but prove the payback with a part-time trial first.')
          : 'Not enough work for a hire yet. Simplify first.',
        findings: [
          { label: 'Cash runway', value: `${runway} months`, tone: runway < 3 ? 'bad' : runway < 6 ? 'warn' : 'good', detail: 'A common rule: hire when you have 6+ months of runway.' },
          { label: 'Workload today', value: `${hours} hrs/week`, tone: hours >= 30 ? 'good' : hours >= 15 ? 'neutral' : 'warn', detail: hours >= 30 ? 'Enough work for a full-time role.' : hours >= 15 ? 'Fits a part-time role or contractor.' : 'Probably not enough for a hire yet.' },
          ...(payback !== undefined ? [{ label: 'Pays for itself', value: payback <= 1 ? 'From month one' : `${payback.toFixed(1)}x cost`, tone: (payback <= 1 ? 'good' : 'warn') as Tone, detail: `${money(cost)} a month against ${money(unlocks!)} unlocked.` }] : []),
        ],
        options: [
          opt('hire', { title: `Hire a full-time ${role}`, summary: 'Best when the work is steady, 30+ hours a week, and cash covers 6 months.', impact: 'high', effort: 'high',
            pros: ['Dedicated owner for the work', 'Frees your time for growth'], cons: [`${money(cost)} a month commitment`, 'Takes 4–8 weeks to hire well'],
            steps: [
              { title: 'Write the 3 outcomes this role owns', detail: 'Measurable results, not just tasks.', owner: 'Owner', weeks: 1 },
              { title: 'Post the role and interview 5 candidates', detail: 'Include a short paid work trial.', owner: 'Owner', weeks: 4 },
              { title: 'Set a 90-day plan for the new hire', detail: 'Review progress at day 30, 60 and 90.', owner: 'Owner', weeks: 8 },
            ] }),
          opt('parttime', { title: 'Start part-time or with a contractor', summary: 'Covers the work at lower cost and risk while you prove the need.', impact: 'medium', effort: 'low',
            pros: ['Lower monthly cost', 'Easy to scale up or down'], cons: ['Less commitment and availability'],
            steps: [
              { title: `Scope ${Math.min(hours, 20)} hours a week of the work`, detail: 'The parts that are easiest to hand off.', owner: 'Owner', weeks: 1 },
              { title: 'Trial a contractor for 6 weeks', detail: 'Decide on a full-time hire at the end.', owner: 'Owner', weeks: 7 },
            ] }),
          opt('automate', { title: 'Automate or simplify first', summary: 'Remove the repetitive hours before adding a person.', impact: hours < 15 ? 'medium' : 'low', effort: 'low',
            pros: ['Saves money every month'], cons: ['Only covers repeatable work'],
            steps: [
              { title: 'List the most repetitive weekly tasks', detail: 'Anything done the same way every time.', owner: 'Owner', weeks: 1 },
              { title: 'Automate or template the top two', detail: 'Software, templates or a better process.', owner: 'Operations', weeks: 3 },
            ] }),
        ],
        recommendedOptionId: rec,
        followUp: 'What would you do with the hours this hire gives back? Make sure that work grows the business.',
      });
    }

    case 'ai-check': {
      const useCase = str(a, 'useCase') || 'your AI project';
      const before = num(a, 'before') ?? 0, after = num(a, 'after') ?? before, cost = num(a, 'monthlyCost') ?? 0;
      const setup = num(a, 'setupCost'), accuracy = num(a, 'accuracy'), acceptance = num(a, 'acceptance'), data = num(a, 'dataReady'), months = num(a, 'months');
      const savings = before - after;
      const net = savings - cost;
      const roi = cost > 0 ? (net / cost) * 100 : undefined;
      const payback = setup && net > 0 ? setup / net : undefined;
      // The weakest of the three things AI value depends on: being right, being used, having data.
      const links = [
        accuracy !== undefined && accuracy < 85 ? { id: 'accuracy', score: accuracy / 85, label: 'Accuracy', why: `It is right ${pct(accuracy)} of the time, so people double-check or ignore it.` } : null,
        acceptance !== undefined && acceptance < 60 ? { id: 'adoption', score: acceptance / 60, label: 'Adoption', why: `Staff follow only ${pct(acceptance)} of its recommendations, so most of the value is left on the table.` } : null,
        data !== undefined && data < 60 ? { id: 'data', score: data / 60, label: 'Data', why: `Only ${pct(data)} of machines or processes feed it clean data, which limits how far it can go.` } : null,
      ].filter((x): x is NonNullable<typeof x> => !!x).sort((x, y) => x.score - y.score);
      const weak = links[0];
      const early = months !== undefined && months < 3;
      const rec = net > 0 ? (weak ? 'fix' : 'scale') : (weak || early ? 'fix' : 'stop');
      const fixSteps: Record<string, ConsultStep[]> = {
        accuracy: [
          { title: 'Collect 50 cases the AI got wrong', detail: 'Note what it saw and what was actually true. Patterns show what to retrain on.', owner: 'Operations', weeks: 2 },
          { title: 'Retrain or retune with your vendor', detail: 'Share the wrong cases and agree an accuracy target in writing.', owner: 'Partner', weeks: 5 },
          { title: 'Re-measure accuracy for 4 weeks', detail: 'Same method as before, so the comparison is fair.', owner: 'Operations', weeks: 9 },
        ],
        adoption: [
          { title: 'Ask 5 operators why they override it', detail: 'Short conversations on the floor. The reasons are usually trust, timing or extra clicks.', owner: 'Team lead', weeks: 1 },
          { title: 'Fix the top reason and retrain the shift', detail: 'Show real examples where the AI was right and saved time or money.', owner: 'Team lead', weeks: 3 },
          { title: 'Track acceptance weekly', detail: 'Aim for 70%+ of recommendations followed or a written reason when not.', owner: 'Operations', weeks: 6 },
        ],
        data: [
          { title: 'List the machines or steps with missing data', detail: 'Rank them by how much downtime, scrap or cost they cause.', owner: 'Operations', weeks: 2 },
          { title: 'Connect the top 3 first', detail: 'Sensors, exports or a simple daily log. Clean data beats more data.', owner: 'Operations', weeks: 6 },
        ],
        none: [
          { title: 'Write down the baseline you are comparing to', detail: 'Same metric, same period length, before and after go-live.', owner: 'Owner', weeks: 1 },
          { title: 'Agree success targets with the vendor', detail: 'Accuracy, savings per month and a review date.', owner: 'Partner', weeks: 3 },
        ],
      };
      const fixKey = weak?.id ?? 'none';
      return base({
        headline: rec === 'scale' ? `${useCase} is paying off. Scale it carefully.`
          : rec === 'fix' ? (weak ? `${weak.label} is the weak link. Fix it before you spend more.` : 'Too early to judge. Lock in a baseline and targets.')
          : 'It costs more than it saves. Pause and redirect the budget.',
        findings: [
          { label: 'Monthly savings', value: `${savings >= 0 ? '+' : '−'}${money(Math.abs(savings))}/mo`, tone: savings > 0 ? 'good' : 'bad', detail: `The problem cost ${money(before)} a month before and ${money(after)} now.` },
          { label: 'After the AI’s own cost', value: `${net >= 0 ? '+' : '−'}${money(Math.abs(net))}/mo`, tone: net > 0 ? 'good' : net === 0 ? 'warn' : 'bad', detail: roi !== undefined ? `Return of ${roi < 0 ? '−' : ''}${pct(Math.abs(roi))} on the ${money(cost)} it costs each month.` : 'Add its monthly cost to see the return.' },
          ...(payback !== undefined ? [{ label: 'Payback on setup', value: payback < 1 ? 'Under a month' : `${payback.toFixed(1)} months`, tone: (payback <= 12 ? 'good' : payback <= 24 ? 'warn' : 'bad') as Tone, detail: `${money(setup!)} setup recovered from ${money(net)} a month in net savings.` }] : []),
          ...(accuracy !== undefined ? [{ label: weak?.id === 'accuracy' ? 'Accuracy: the weak link' : 'Accuracy', value: pct(accuracy), tone: (accuracy >= 90 ? 'good' : accuracy >= 85 ? 'warn' : 'bad') as Tone, detail: 'How often the AI is right. Below about 85%, people stop trusting it.' }] : []),
          ...(acceptance !== undefined ? [{ label: weak?.id === 'adoption' ? 'Adoption: the weak link' : 'Adoption', value: pct(acceptance), tone: (acceptance >= 70 ? 'good' : acceptance >= 60 ? 'warn' : 'bad') as Tone, detail: 'Share of AI recommendations staff follow. An ignored AI saves nothing.' }] : []),
          ...(data !== undefined ? [{ label: weak?.id === 'data' ? 'Data: the weak link' : 'Data readiness', value: pct(data), tone: (data >= 80 ? 'good' : data >= 60 ? 'warn' : 'bad') as Tone, detail: 'Share of machines or processes with clean, connected data.' }] : []),
        ],
        options: [
          opt('scale', { title: 'Scale it to the next line or site', summary: 'Copy what works to the next most similar line, with the same measures.', impact: 'high', effort: 'high',
            pros: ['Multiplies proven savings', 'Setup is faster the second time'], cons: ['More cost before more savings', 'Spreads any weak link further'],
            steps: [
              { title: 'Pick the next most similar line or site', detail: 'Same machines, products or process, so results carry over.', owner: 'Operations', weeks: 1 },
              { title: 'Set its baseline before go-live', detail: 'Measure the same cost for 4 weeks first.', owner: 'Operations', weeks: 4 },
              { title: 'Go live and review at 90 days', detail: 'Compare savings, accuracy and adoption with the first line.', owner: 'Owner', weeks: 13 },
            ] }),
          opt('fix', { title: weak ? `Fix the weak link: ${weak.label.toLowerCase()}` : 'Lock in a baseline and targets', summary: weak ? weak.why : 'Without a clear before-and-after you cannot tell if it works.', impact: 'high', effort: 'medium',
            pros: ['Cheapest way to more value', 'Makes scaling safer later'], cons: ['Takes 1–3 months to show results'],
            steps: fixSteps[fixKey] }),
          opt('stop', { title: 'Pause it and redirect the budget', summary: `Free up ${money(cost)} a month for a problem with a clearer payoff.`, impact: net < 0 ? 'medium' : 'low', effort: 'low',
            pros: ['Stops the monthly loss', 'Lessons carry into the next project'], cons: ['Setup money is already spent', 'Team may be wary of the next AI project'],
            steps: [
              { title: 'Write down what you learned', detail: 'What worked, what did not, and which data was missing.', owner: 'Owner', weeks: 1 },
              { title: 'Check the contract for exit terms', detail: 'Notice period, data export and any fees.', owner: 'Finance', weeks: 2 },
            ] }),
        ],
        recommendedOptionId: rec,
        followUp: rec === 'scale' ? 'Which line or site is most like the one where it works today?' : 'Who on the floor trusts it least, and what would change their mind?',
      });
    }

    case 'swot': {
      const s = str(a, 'strengths'), w = str(a, 'weaknesses'), o = str(a, 'opportunities'), t = str(a, 'threats');
      const short = (x: string, fallback: string) => (x ? (x.length > 90 ? x.slice(0, 87) + '…' : x) : fallback);
      return base({
        headline: 'Use your strengths to win the opportunity, and shore up the weakness that threat could exploit.',
        findings: [
          { label: 'Strengths', tone: 'good', detail: short(s, 'Not listed. What do customers praise most?') },
          { label: 'Weaknesses', tone: 'warn', detail: short(w, 'Not listed. Where do complaints or delays come from?') },
          { label: 'Opportunities', tone: 'good', detail: short(o, 'Not listed. What are customers asking for that nobody offers?') },
          { label: 'Threats', tone: 'bad', detail: short(t, 'Not listed. What would hurt most if it happened next quarter?') },
        ],
        options: [
          opt('attack', { title: 'Strength × opportunity: go after it', summary: `Point "${short(s, 'your main strength')}" at "${short(o, 'the biggest opening')}".`, impact: 'high', effort: 'medium',
            pros: ['Plays to what you already do well'], cons: ['Needs focus and some investment'],
            steps: [
              { title: 'Define one offer that uses your strength for this opportunity', detail: 'Who it is for, what it costs, why you.', owner: 'Owner', weeks: 2 },
              { title: 'Test it with 10 customers', detail: 'Measure interest and price acceptance before scaling.', owner: 'Sales & marketing', weeks: 5 },
            ] }),
          opt('fix', { title: 'Weakness × opportunity: fix what blocks you', summary: `Fix "${short(w, 'the main weakness')}" so it stops limiting growth.`, impact: 'medium', effort: 'medium',
            pros: ['Removes a recurring drag'], cons: ['Less exciting than new offers'],
            steps: [
              { title: 'Turn the weakness into one measurable number', detail: 'e.g. late orders per week.', owner: 'Owner', weeks: 1 },
              { title: 'Fix the top cause and track it weekly', detail: 'Use a bottleneck session for the details.', owner: 'Operations', weeks: 4 },
            ] }),
          opt('defend', { title: 'Weakness × threat: protect the downside', summary: `Make sure "${short(t, 'the main threat')}" can’t exploit "${short(w, 'your weak spot')}".`, impact: t ? 'medium' : 'low', effort: 'low',
            pros: ['Lowers risk'], cons: ['Does not grow revenue by itself'],
            steps: [
              { title: 'Write a one-page "if this happens" plan', detail: 'Who does what in the first week.', owner: 'Owner', weeks: 1 },
            ] }),
        ],
        recommendedOptionId: 'attack',
        followUp: 'Which opportunity could you test in the next 30 days for under $500?',
      });
    }

    case 'health-check':
    default: {
      const trend = str(a, 'trend') || 'Flat', margin = num(a, 'margin') ?? 40, repeat = num(a, 'repeat') ?? 30, runway = num(a, 'runway') ?? 4;
      const headache = str(a, 'headache');
      const pillars = [
        { id: 'sales', label: 'Sales', score: trend === 'Growing' ? 85 : trend === 'Flat' ? 60 : 35, detail: `Sales are ${trend.toLowerCase()}.` },
        { id: 'profit', label: 'Profit', score: Math.min(95, Math.round(margin * 1.6)), detail: `Gross margin ${pct(margin)}.` },
        { id: 'customers', label: 'Customers', score: Math.min(95, Math.round(repeat * 1.8)), detail: `${pct(repeat)} come back or renew.` },
        { id: 'cash', label: 'Cash', score: Math.min(95, Math.round(runway * 14)), detail: `${runway} months of runway.` },
      ];
      const tone = (x: number): Tone => (x >= 75 ? 'good' : x >= 55 ? 'warn' : 'bad');
      const weakest = [...pillars].sort((x, y) => x.score - y.score)[0];
      const overall = Math.round(pillars.reduce((s2, p) => s2 + p.score, 0) / pillars.length);
      const fixFor: Record<string, ConsultOption> = {
        cash: opt('cash', { title: 'Protect cash first', summary: 'Runway under 6 months limits every other choice. Run a cash flow session next.', impact: 'high', effort: 'low', pros: ['Removes the biggest risk'], cons: ['Growth waits a few weeks'],
          steps: [{ title: 'Run the cash flow check session', detail: 'Find the fastest cash you can free up.', owner: 'Owner', weeks: 1 }, { title: 'Invoice same day and chase overdue payments', detail: 'Weekly routine.', owner: 'Finance', weeks: 3 }] }),
        profit: opt('profit', { title: 'Lift your margin', summary: 'A thin margin makes growth expensive. Review prices and the cost of each sale.', impact: 'high', effort: 'medium', pros: ['Every sale earns more'], cons: ['Needs careful testing'],
          steps: [{ title: 'Run the pricing review session', detail: 'See how much a small price rise is worth.', owner: 'Owner', weeks: 1 }, { title: 'Get competing quotes for your biggest cost', detail: 'Renegotiate with current suppliers.', owner: 'Operations', weeks: 3 }] }),
        customers: opt('customers', { title: 'Bring customers back', summary: 'Low repeat buying means paying again for every sale.', impact: 'high', effort: 'medium', pros: ['Cheapest growth'], cons: ['Slower to show results'],
          steps: [{ title: 'Follow up every new customer within a week', detail: 'Thank-you and a reason to return.', owner: 'Sales & marketing', weeks: 2 }, { title: 'Ask 10 lapsed customers why they stopped', detail: 'Fix the top reason.', owner: 'Owner', weeks: 3 }] }),
        sales: opt('sales', { title: 'Restart sales momentum', summary: 'Find what changed and double down on your best channel.', impact: 'high', effort: 'medium', pros: ['Direct revenue impact'], cons: ['May need marketing spend'],
          steps: [{ title: 'Compare this quarter with last by channel and product', detail: 'Find where the drop came from.', owner: 'Owner', weeks: 1 }, { title: 'Run the growth strategy session', detail: 'Pick the fastest lever.', owner: 'Sales & marketing', weeks: 2 }] }),
      };
      const others = pillars.filter((p) => p.id !== weakest.id).sort((x, y) => x.score - y.score).slice(0, 2).map((p) => fixFor[p.id]);
      return base({
        headline: `Overall health ${overall}/100. Fix ${weakest.label.toLowerCase()} first.`,
        findings: [
          ...pillars.map((p) => ({ label: p.label, value: `${p.score}/100`, tone: tone(p.score), detail: p.detail })),
          ...(headache ? [{ label: 'Your headache', tone: 'neutral' as Tone, detail: headache }] : []),
        ],
        options: [fixFor[weakest.id], ...others],
        recommendedOptionId: weakest.id,
        followUp: headache ? `You mentioned "${headache}". A bottleneck deep-dive is a good next session for that.` : 'Want to go deeper? The session for your weakest area is a good next step.',
      });
    }
  }
}

// ---------------------------------------------------------------- AI output validation
const LEVELS: Level[] = ['low', 'medium', 'high'];
const TONES: Tone[] = ['good', 'warn', 'bad', 'neutral'];
const OWNERS: StepOwner[] = ['Owner', 'Operations', 'Sales & marketing', 'Finance', 'Partner', 'Team lead'];
const s = (v: any, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Coerces engine output into a safe ConsultResult, or throws so the next engine is tried. */
export function sanitizeConsult(raw: any, engineId: string): ConsultResult {
  const options: ConsultOption[] = (Array.isArray(raw?.options) ? raw.options : []).slice(0, 3).map((o: any, i: number) => ({
    id: s(o?.id, 40) || `opt${i + 1}`,
    title: s(o?.title, 120),
    summary: s(o?.summary, 300),
    impact: LEVELS.includes(o?.impact) ? o.impact : 'medium',
    effort: LEVELS.includes(o?.effort) ? o.effort : 'medium',
    pros: (Array.isArray(o?.pros) ? o.pros : []).slice(0, 3).map((x: any) => s(x, 160)).filter(Boolean),
    cons: (Array.isArray(o?.cons) ? o.cons : []).slice(0, 3).map((x: any) => s(x, 160)).filter(Boolean),
    steps: (Array.isArray(o?.steps) ? o.steps : []).slice(0, 4).map((st: any) => ({
      title: s(st?.title, 120), detail: s(st?.detail, 300),
      owner: OWNERS.includes(st?.owner) ? st.owner : 'Owner',
      weeks: Math.max(1, Math.min(26, Math.round(Number(st?.weeks) || 2))),
    })).filter((st: ConsultStep) => st.title),
  })).filter((o: ConsultOption) => o.title && o.steps.length);
  if (options.length < 2) throw new Error('Consult result needs at least 2 options with steps');
  const findings: ConsultFinding[] = (Array.isArray(raw?.findings) ? raw.findings : []).slice(0, 6).map((f: any) => ({
    label: s(f?.label, 80), value: s(f?.value, 40) || undefined, tone: TONES.includes(f?.tone) ? f.tone : 'neutral', detail: s(f?.detail, 300),
  })).filter((f: ConsultFinding) => f.label);
  const rec = options.find((o) => o.id === raw?.recommendedOptionId)?.id ?? options[0].id;
  return { headline: s(raw?.headline, 160) || 'Here is what I found.', findings, options, recommendedOptionId: rec, followUp: s(raw?.followUp, 240) || undefined, generatedBy: engineId };
}

/** Plain-text summary for copying into email, Teams or a report. */
export function consultSummaryText(title: string, r: ConsultResult, chosen?: ConsultOption): string {
  const lines = [`${title}: ${r.headline}`, '', 'Findings:', ...r.findings.map((f) => `• ${f.label}${f.value ? ` (${f.value})` : ''}: ${f.detail}`)];
  if (chosen) lines.push('', `Decision: ${chosen.title}`, chosen.summary, '', 'Next steps:', ...chosen.steps.map((st, i) => `${i + 1}. ${st.title} (${st.owner}, week ${st.weeks}): ${st.detail}`));
  return lines.join('\n');
}
