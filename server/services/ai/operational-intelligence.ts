// Operational Intelligence layer for the Executive Command Center.
// Provider-agnostic types, a deterministic Business Health Score engine, and a
// rule-based fallback provider. The Claude-backed provider lives in
// `anthropic-provider.ts` and implements the same interface so models can be
// swapped (Claude -> OpenAI -> Gemini) without changing callers.

export interface CommandCenterMetric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export interface CommandCenterRequest {
  sector: string;
  metrics: CommandCenterMetric[];
  businessStructure?: string;
}

export type Severity = 'high' | 'medium' | 'low';

export interface TopPriority {
  id: string;
  title: string;
  severity: Severity;
  whatHappened: string;
  whyItMatters: string;
  businessImpact: string;
  recommendedAction: string;
  expectedOutcome: string;
}

export interface HealthPillar {
  pillar: string;
  score: number;
}

export interface CommandCenterResult {
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthPillar[];
  executiveSummary: string;
  topPriorities: TopPriority[];
  alerts: { label: string; severity: Severity }[];
  generatedBy: 'claude' | 'rule-based';
}

// A single operational intelligence item powers the Bottleneck Detection,
// AI Recommendations, and Operations Pipeline pages — all three project from
// this one shape so the underlying intelligence stays consistent.
export interface OperationsIntelItem {
  id: string;
  type: 'bottleneck' | 'opportunity';
  title: string;
  severity: Severity;
  priorityRank: number; // 1 = highest priority
  affectedWorkflow: string;
  currentState: string;
  issueDetected: string;
  rootCause: string;
  reasoning: string;
  recommendedAction: string;
  actionPlanSteps: string[];
  estimatedImpact: string;
  expectedOutcome: string;
}

export interface OperationsIntelResult {
  items: OperationsIntelItem[];
  generatedBy: 'claude' | 'rule-based';
}

export interface OperationalIntelligenceProvider {
  generateCommandCenter(req: CommandCenterRequest): Promise<CommandCenterResult>;
  generateOperationsIntel(req: CommandCenterRequest): Promise<OperationsIntelResult>;
}

export const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

// ---------------------------------------------------------------------------
// Deterministic Business Health Score engine
// ---------------------------------------------------------------------------
// The score is computed from the actual metric trends so it is grounded and
// reproducible. The AI narrates this score; it never invents it.

const PILLAR_KEYWORDS: { pillar: string; keywords: string[] }[] = [
  { pillar: 'Revenue & Growth', keywords: ['revenue', 'orders', 'aov', 'conversion', 'roas', 'sales', 'margin', 'repeat'] },
  { pillar: 'Fulfillment & Delivery', keywords: ['delivery', 'shipment', 'transit', 'fulfillment', 'carrier', 'exception', 'on-time', 'late'] },
  { pillar: 'Efficiency & Quality', keywords: ['throughput', 'units', 'defect', 'yield', 'downtime', 'capacity', 'utilization', 'scrap', 'lead'] },
  { pillar: 'Supply Chain Health', keywords: ['perfect order', 'cash-to-cash', 'atp', 'bullwhip', 'inventory', 'cost', 'returns'] },
];

function parseTrendMagnitude(trend: string): number {
  const match = trend.match(/-?\d+(\.\d+)?/);
  return match ? Math.abs(parseFloat(match[0])) : 0;
}

// A single metric maps to a 35-99 health contribution based on the direction
// and magnitude of its trend. A strongly improving metric approaches 99
// (Strong), while a sharply declining one approaches 35 (Critical), so the
// full grade spread is reachable.
export function scoreMetric(metric: CommandCenterMetric): number {
  const magnitude = Math.min(parseTrendMagnitude(metric.trend), 20);
  const base = 80;
  const delta = metric.isPositive ? magnitude * 1.1 : -(magnitude * 1.8 + 8);
  return Math.max(35, Math.min(99, Math.round(base + delta)));
}

function assignPillar(label: string): string {
  const l = String(label ?? '').toLowerCase();
  for (const { pillar, keywords } of PILLAR_KEYWORDS) {
    if (keywords.some((k) => l.includes(k))) return pillar;
  }
  return 'Supply Chain Health';
}

export function gradeForScore(score: number): string {
  if (score >= 90) return 'Strong';
  if (score >= 78) return 'Stable';
  if (score >= 65) return 'At Risk';
  return 'Critical';
}

export function computeHealth(metrics: CommandCenterMetric[]): {
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthPillar[];
} {
  if (!metrics.length) {
    return { healthScore: 80, healthGrade: 'Stable', healthBreakdown: [] };
  }

  const buckets = new Map<string, number[]>();
  for (const m of metrics) {
    const pillar = assignPillar(m.label);
    if (!buckets.has(pillar)) buckets.set(pillar, []);
    buckets.get(pillar)!.push(scoreMetric(m));
  }

  const healthBreakdown: HealthPillar[] = Array.from(buckets.entries()).map(
    ([pillar, scores]) => ({
      pillar,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    })
  );

  const allScores = metrics.map(scoreMetric);
  const healthScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  return { healthScore, healthGrade: gradeForScore(healthScore), healthBreakdown };
}

// ---------------------------------------------------------------------------
// Rule-based fallback provider (used when no AI key is configured or the AI
// call fails). Produces grounded, operationally-focused output.
// ---------------------------------------------------------------------------

const SECTOR_PRIORITY_TEMPLATES: Record<
  string,
  Omit<TopPriority, 'id'>[]
> = {
  ecommerce: [
    {
      title: 'Fulfillment delays climbing',
      severity: 'high',
      whatHappened: 'Late shipments rose 11% as warehouse utilization neared 92%.',
      whyItMatters: 'Delivery slippage erodes customer satisfaction and lifts refund risk.',
      businessImpact: 'NPS could drop 3–5 points and returns may rise within 48 hours.',
      recommendedAction: 'Shift overflow orders to a backup carrier and add picking labor at peak.',
      expectedOutcome: 'On-time delivery stabilizes and refund exposure falls within a week.',
    },
    {
      title: 'AOV softening on category mix',
      severity: 'medium',
      whatHappened: 'Average order value slipped as the accessories mix grew.',
      whyItMatters: 'Lower AOV pressures contribution margin even when traffic holds.',
      businessImpact: 'Margin dilution of roughly 1–2% if the mix shift persists.',
      recommendedAction: 'Launch bundle promotions pairing accessories with core SKUs.',
      expectedOutcome: 'AOV recovers toward target and margin stabilizes.',
    },
  ],
  logistics: [
    {
      title: 'Transit times extending',
      severity: 'high',
      whatHappened: 'Average transit times moved beyond the 2.4-day baseline on port congestion.',
      whyItMatters: 'Longer transit reduces ATP accuracy and raises stockout risk downstream.',
      businessImpact: 'ATP accuracy could fall below 90%, triggering SLA pressure.',
      recommendedAction: 'Reroute critical freight through secondary ports and renegotiate spot rates.',
      expectedOutcome: 'Transit normalizes within 6–8 days as congestion clears.',
    },
    {
      title: 'Cost per shipment rising',
      severity: 'medium',
      whatHappened: 'Fuel surcharges pushed cost-per-shipment up over 4%.',
      whyItMatters: 'Unchecked freight cost compresses logistics margin.',
      businessImpact: 'Several points of margin erosion across high-volume lanes.',
      recommendedAction: 'Optimize routing on the most exposed lanes and consolidate loads.',
      expectedOutcome: 'Cost per shipment trends back toward target within two weeks.',
    },
  ],
  manufacturing: [
    {
      title: 'Line C downtime spiking',
      severity: 'high',
      whatHappened: 'Unplanned maintenance on Assembly Line C rose 18% week over week.',
      whyItMatters: 'Lost capacity puts the daily throughput target at risk.',
      businessImpact: 'Backorder conditions for active customer POs if throughput dips.',
      recommendedAction: 'Run preventive maintenance off-shift and reallocate staff to Line B.',
      expectedOutcome: 'Yield recovers to ~98% within 48 hours after calibration.',
    },
    {
      title: 'Defect rate near ceiling',
      severity: 'medium',
      whatHappened: 'Component defect rate crept to the upper edge of target.',
      whyItMatters: 'Rising defects increase scrap and rework cost.',
      businessImpact: 'Quality cost rises and usable yield softens.',
      recommendedAction: 'Switch sub-components to a secondary supplier above 1% defect.',
      expectedOutcome: 'Defect rate returns inside target band within the cycle.',
    },
  ],
  unified: [
    {
      title: 'Cash-to-cash cycle extending',
      severity: 'high',
      whatHappened: 'The cash-to-cash cycle stretched as safety stock grew 15%.',
      whyItMatters: 'Longer cycles tie up working capital and signal a bullwhip effect.',
      businessImpact: 'Reduced liquidity and rising carrying cost across DCs.',
      recommendedAction: 'Tighten dynamic reorder points and discount aging stock.',
      expectedOutcome: 'Cycle compresses toward the 12-day target, freeing capital.',
    },
    {
      title: 'Bullwhip index trending up',
      severity: 'medium',
      whatHappened: 'Demand amplification rose as supplier lead times grew.',
      whyItMatters: 'Amplified demand signal risks overstock and stockouts simultaneously.',
      businessImpact: 'Estimated six-figure carrying-cost increase if unaddressed.',
      recommendedAction: 'Improve top-supplier lead-time reliability and deploy demand sensing.',
      expectedOutcome: 'Bullwhip index settles below 1.10 over the next quarter.',
    },
  ],
};

function sectorKey(sector: string): string {
  return SECTOR_PRIORITY_TEMPLATES[sector] ? sector : 'unified';
}

// Operations intelligence templates power the Bottleneck, Recommendations, and
// Pipeline pages. Each item is a full operational story (state → issue → root
// cause → action → outcome) so all three views can project from one source.
type OperationsTemplate = Omit<OperationsIntelItem, 'id' | 'priorityRank'>;

const SECTOR_OPERATIONS_TEMPLATES: Record<string, OperationsTemplate[]> = {
  ecommerce: [
    {
      type: 'bottleneck',
      title: 'Pick-pack capacity saturated',
      severity: 'high',
      affectedWorkflow: 'Order Fulfillment',
      currentState: 'Warehouse utilization is running near 92% with late shipments up 11%.',
      issueDetected: 'Outbound throughput cannot keep pace with order inflow at peak hours.',
      rootCause: 'Insufficient picking labor scheduled against the afternoon order surge.',
      reasoning: 'Every hour of backlog compounds into next-day delivery misses and refund requests.',
      recommendedAction: 'Add a flex picking shift at peak and divert overflow orders to a backup carrier.',
      actionPlanSteps: [
        'Identify the 2-hour daily peak from order timestamps',
        'Schedule 3 flex pickers for that window',
        'Pre-authorize a backup carrier for overflow volume',
      ],
      estimatedImpact: 'Protects ~$40K/week of at-risk orders and 3–5 NPS points.',
      expectedOutcome: 'On-time delivery stabilizes above 95% within one week.',
    },
    {
      type: 'bottleneck',
      title: 'Cart abandonment elevated',
      severity: 'medium',
      affectedWorkflow: 'Checkout & Conversion',
      currentState: 'Cart abandonment is sitting above the 68% benchmark.',
      issueDetected: 'A meaningful share of ready-to-buy carts drop at the payment step.',
      rootCause: 'Limited payment options and shipping cost revealed late in checkout.',
      reasoning: 'Late-stage friction wastes hard-won acquisition spend.',
      recommendedAction: 'Surface shipping cost earlier and add express wallet payment options.',
      actionPlanSteps: [
        'Show estimated shipping on the cart page',
        'Enable Apple Pay / Google Pay express checkout',
        'A/B test a free-shipping threshold nudge',
      ],
      estimatedImpact: 'Recovering 2pts of abandonment lifts revenue ~1.5%.',
      expectedOutcome: 'Checkout completion rate improves within two weeks.',
    },
    {
      type: 'opportunity',
      title: 'Bundle upside on accessories',
      severity: 'medium',
      affectedWorkflow: 'Merchandising & Pricing',
      currentState: 'Accessory attach rate is climbing but AOV has softened.',
      issueDetected: 'High-traffic SKUs are selling without profitable add-ons attached.',
      rootCause: 'No bundle or cross-sell prompts on top product pages.',
      reasoning: 'Bundling raises contribution margin without new traffic cost.',
      recommendedAction: 'Launch curated bundles pairing accessories with core SKUs.',
      actionPlanSteps: [
        'Rank the top 10 SKUs by traffic',
        'Create 3 bundle offers with a small discount',
        'Add a cross-sell module to product pages',
      ],
      estimatedImpact: 'Potential 1–2% AOV and margin lift.',
      expectedOutcome: 'AOV recovers toward target within the quarter.',
    },
    {
      type: 'opportunity',
      title: 'Repeat purchase momentum',
      severity: 'low',
      affectedWorkflow: 'Retention & Lifecycle',
      currentState: 'Repeat purchase rate is trending up modestly.',
      issueDetected: 'First-time buyers are not being systematically converted to repeat buyers.',
      rootCause: 'No post-purchase lifecycle flow beyond the order confirmation.',
      reasoning: 'Repeat buyers carry far higher lifetime value at lower acquisition cost.',
      recommendedAction: 'Add a 30-day post-purchase win-back and replenishment flow.',
      actionPlanSteps: [
        'Segment first-time buyers',
        'Build a 3-email lifecycle sequence',
        'Trigger replenishment reminders on consumables',
      ],
      estimatedImpact: 'Each point of repeat rate adds durable recurring revenue.',
      expectedOutcome: 'Repeat purchase rate compounds over the next two quarters.',
    },
  ],
  logistics: [
    {
      type: 'bottleneck',
      title: 'Transit times extending',
      severity: 'high',
      affectedWorkflow: 'Linehaul & Transit',
      currentState: 'Average transit has moved beyond the 2.4-day baseline on port congestion.',
      issueDetected: 'Critical lanes are slipping SLA as containers dwell at congested ports.',
      rootCause: 'Over-reliance on a single congested port of entry.',
      reasoning: 'Longer transit erodes ATP accuracy and raises downstream stockout risk.',
      recommendedAction: 'Reroute critical freight through a secondary port and book spot capacity.',
      actionPlanSteps: [
        'Flag shipments exceeding 2.4-day transit',
        'Open a secondary port lane for priority freight',
        'Negotiate spot rates for the congested lane',
      ],
      estimatedImpact: 'Prevents ATP from falling below 90% and avoids SLA penalties.',
      expectedOutcome: 'Transit normalizes within 6–8 days as congestion clears.',
    },
    {
      type: 'bottleneck',
      title: 'Cost per shipment rising',
      severity: 'medium',
      affectedWorkflow: 'Freight Cost Management',
      currentState: 'Cost-per-shipment is up over 4% on fuel surcharges.',
      issueDetected: 'High-volume lanes are absorbing surcharges without consolidation.',
      rootCause: 'Sub-optimal load consolidation and routing on exposed lanes.',
      reasoning: 'Unchecked freight cost directly compresses logistics margin.',
      recommendedAction: 'Consolidate loads and optimize routing on the most exposed lanes.',
      actionPlanSteps: [
        'Rank lanes by surcharge exposure',
        'Consolidate LTL into FTL where possible',
        'Re-optimize routing on the top 3 lanes',
      ],
      estimatedImpact: 'Several margin points across high-volume lanes.',
      expectedOutcome: 'Cost per shipment trends back to target within two weeks.',
    },
    {
      type: 'bottleneck',
      title: 'Delivery exceptions clustering',
      severity: 'medium',
      affectedWorkflow: 'Last-Mile Delivery',
      currentState: 'Delivery exceptions are clustering in specific regions.',
      issueDetected: 'Failed first-attempt deliveries are concentrated in one carrier zone.',
      rootCause: 'Address quality and carrier coverage gaps in those zones.',
      reasoning: 'Each exception adds re-delivery cost and damages customer experience.',
      recommendedAction: 'Add address validation and switch carriers in the worst zones.',
      actionPlanSteps: [
        'Map exceptions by region and carrier',
        'Enable address validation at booking',
        'Re-allocate the worst zones to a stronger carrier',
      ],
      estimatedImpact: 'Cuts re-delivery cost and lifts on-time rate.',
      expectedOutcome: 'Exception rate drops within 1–2 weeks.',
    },
    {
      type: 'opportunity',
      title: 'Carrier scorecard leverage',
      severity: 'low',
      affectedWorkflow: 'Carrier Management',
      currentState: 'Carrier performance varies widely but volume is split evenly.',
      issueDetected: 'Volume is not being steered toward the best-performing carriers.',
      rootCause: 'No performance-based allocation in the routing guide.',
      reasoning: 'Shifting volume to top carriers improves service at similar cost.',
      recommendedAction: 'Re-weight the routing guide toward top-quartile carriers.',
      actionPlanSteps: [
        'Build a carrier scorecard (on-time, cost, exceptions)',
        'Identify top-quartile carriers per lane',
        'Shift 15% of volume to top performers and monitor',
      ],
      estimatedImpact: 'Service-level gains at neutral cost.',
      expectedOutcome: 'On-time delivery improves over the next month.',
    },
  ],
  manufacturing: [
    {
      type: 'bottleneck',
      title: 'Line C downtime spiking',
      severity: 'high',
      affectedWorkflow: 'Assembly — Line C',
      currentState: 'Unplanned maintenance on Line C is up 18% week over week.',
      issueDetected: 'Line C is the constraint capping daily throughput.',
      rootCause: 'Deferred preventive maintenance and an aging calibration cycle.',
      reasoning: 'Lost capacity on the bottleneck line directly risks the throughput target.',
      recommendedAction: 'Run preventive maintenance off-shift and shift load to Line B.',
      actionPlanSteps: [
        'Schedule PM for Line C on the off-shift',
        'Reallocate priority POs to Line B temporarily',
        'Recalibrate and verify cycle time',
      ],
      estimatedImpact: 'Protects active POs from backorder and recovers yield to ~98%.',
      expectedOutcome: 'Throughput recovers within 48 hours after calibration.',
    },
    {
      type: 'bottleneck',
      title: 'Defect rate near ceiling',
      severity: 'medium',
      affectedWorkflow: 'Quality Control',
      currentState: 'Component defect rate has crept to the upper edge of target.',
      issueDetected: 'Incoming component quality is driving rework and scrap.',
      rootCause: 'A single sub-supplier is above the 1% defect threshold.',
      reasoning: 'Rising defects inflate scrap and rework cost and lower usable yield.',
      recommendedAction: 'Switch affected sub-components to a qualified secondary supplier.',
      actionPlanSteps: [
        'Trace defects to supplier and lot',
        'Qualify a secondary supplier',
        'Dual-source above 1% defect and re-test',
      ],
      estimatedImpact: 'Lowers quality cost and lifts usable yield.',
      expectedOutcome: 'Defect rate returns inside the target band within the cycle.',
    },
    {
      type: 'bottleneck',
      title: 'Production lead time stretching',
      severity: 'medium',
      affectedWorkflow: 'Production Scheduling',
      currentState: 'Order-to-finish lead time is stretching beyond plan.',
      issueDetected: 'Changeovers between runs are consuming productive hours.',
      rootCause: 'High changeover frequency from un-batched, small production runs.',
      reasoning: 'Excess changeovers shrink effective capacity and delay delivery.',
      recommendedAction: 'Batch similar runs and sequence to minimize changeovers.',
      actionPlanSteps: [
        'Group orders by tooling and material',
        'Sequence runs to cut changeovers',
        'Lock a weekly frozen schedule window',
      ],
      estimatedImpact: 'Recovers productive hours and shortens lead time.',
      expectedOutcome: 'Lead time returns to plan within two cycles.',
    },
    {
      type: 'opportunity',
      title: 'Capacity headroom on Line B',
      severity: 'low',
      affectedWorkflow: 'Capacity Planning',
      currentState: 'Line B is running below its rated capacity.',
      issueDetected: 'Available capacity sits idle while demand is steady.',
      rootCause: 'Demand is not balanced across lines.',
      reasoning: 'Idle capacity is margin left on the table.',
      recommendedAction: 'Rebalance compatible volume to fill Line B headroom.',
      actionPlanSteps: [
        'Measure utilization per line',
        'Shift compatible SKUs to Line B',
        'Monitor yield after rebalancing',
      ],
      estimatedImpact: 'Higher output with no added fixed cost.',
      expectedOutcome: 'Overall capacity utilization rises next cycle.',
    },
  ],
  unified: [
    {
      type: 'bottleneck',
      title: 'Cash-to-cash cycle extending',
      severity: 'high',
      affectedWorkflow: 'Working Capital & Inventory',
      currentState: 'The cash-to-cash cycle has stretched as safety stock grew 15%.',
      issueDetected: 'Capital is tied up in inventory faster than it converts to cash.',
      rootCause: 'Static reorder points reacting to a bullwhip-amplified demand signal.',
      reasoning: 'Longer cycles drain liquidity and inflate carrying cost across DCs.',
      recommendedAction: 'Tighten dynamic reorder points and discount aging stock.',
      actionPlanSteps: [
        'Identify aging and excess SKUs by DC',
        'Reset reorder points with demand sensing',
        'Run a targeted markdown on aging stock',
      ],
      estimatedImpact: 'Frees working capital and cuts carrying cost.',
      expectedOutcome: 'Cycle compresses toward the 12-day target.',
    },
    {
      type: 'bottleneck',
      title: 'Bullwhip index trending up',
      severity: 'medium',
      affectedWorkflow: 'Demand & Supply Planning',
      currentState: 'Demand amplification is rising as supplier lead times grow.',
      issueDetected: 'Order variability is amplifying upstream into over/under-stock swings.',
      rootCause: 'Forecast updates and order batching overreact to small demand changes.',
      reasoning: 'Amplified signals risk simultaneous overstock and stockouts.',
      recommendedAction: 'Deploy demand sensing and stabilize top-supplier lead times.',
      actionPlanSteps: [
        'Smooth forecast updates with demand sensing',
        'Shorten review cycles with key suppliers',
        'Cap order batching on volatile SKUs',
      ],
      estimatedImpact: 'Avoids six-figure carrying-cost swings.',
      expectedOutcome: 'Bullwhip index settles below 1.10 over the quarter.',
    },
    {
      type: 'bottleneck',
      title: 'Cross-sector delay impact',
      severity: 'medium',
      affectedWorkflow: 'End-to-End Order Flow',
      currentState: 'Upstream delays are cascading into the perfect order rate.',
      issueDetected: 'A delay in one sector is degrading downstream fulfillment.',
      rootCause: 'Limited visibility and no buffer at sector handoffs.',
      reasoning: 'Perfect order rate is the truest end-to-end health signal.',
      recommendedAction: 'Add handoff buffers and shared visibility at sector boundaries.',
      actionPlanSteps: [
        'Map the slowest sector handoff',
        'Add a small time buffer at that handoff',
        'Share live status across sectors',
      ],
      estimatedImpact: 'Protects perfect order rate and SLA.',
      expectedOutcome: 'Perfect order rate stabilizes within two weeks.',
    },
    {
      type: 'opportunity',
      title: 'ATP accuracy upside',
      severity: 'low',
      affectedWorkflow: 'Available-to-Promise',
      currentState: 'ATP accuracy is near but not at target.',
      issueDetected: 'Promise dates rely on stale inventory and capacity data.',
      rootCause: 'The ATP calculation refreshes too infrequently.',
      reasoning: 'Accurate promises reduce both stockouts and over-promising.',
      recommendedAction: 'Increase ATP refresh frequency and include in-transit stock.',
      actionPlanSteps: [
        'Add in-transit inventory to the ATP calc',
        'Increase refresh cadence',
        'Validate against actual fulfillment',
      ],
      estimatedImpact: 'Higher promise reliability and fewer escalations.',
      expectedOutcome: 'ATP accuracy climbs above 97% next cycle.',
    },
  ],
};

export class RuleBasedIntelligenceProvider implements OperationalIntelligenceProvider {
  async generateCommandCenter(req: CommandCenterRequest): Promise<CommandCenterResult> {
    const { sector, metrics } = req;
    const health = computeHealth(metrics);
    const key = sectorKey(sector);

    const priorities = SECTOR_PRIORITY_TEMPLATES[key].map((p, i) => ({
      ...p,
      id: `prio-${i}`,
    }));

    const weak = metrics.filter((m) => !m.isPositive);
    const alerts = (weak.length ? weak : metrics.slice(0, 2)).slice(0, 4).map((m) => ({
      label: `${m.label} ${m.trend}`,
      severity: (m.isPositive ? 'low' : 'medium') as Severity,
    }));

    // A 4-part executive summary: current condition, largest opportunity,
    // largest risk, and the single recommended focus area.
    const bestOpportunity = metrics
      .filter((m) => m.isPositive)
      .slice()
      .sort((a, b) => parseTrendMagnitude(b.trend) - parseTrendMagnitude(a.trend))[0];
    const biggestRisk = weak
      .slice()
      .sort((a, b) => parseTrendMagnitude(b.trend) - parseTrendMagnitude(a.trend))[0];
    const weakestPillar = health.healthBreakdown
      .slice()
      .sort((a, b) => a.score - b.score)[0];

    const condition = `Operational health is ${health.healthGrade.toLowerCase()} at ${health.healthScore}/100.`;
    const opportunity = bestOpportunity
      ? `Largest opportunity: ${bestOpportunity.label} is improving (${bestOpportunity.trend}) and can be pressed further.`
      : `Largest opportunity: core metrics are steady, so the focus is consolidating recent gains.`;
    const risk = biggestRisk
      ? `Largest risk: ${biggestRisk.label} is trending against target (${biggestRisk.trend}) and needs containment.`
      : `Largest risk: no metric is materially declining, but watch for early warning signs.`;
    const focus = weakestPillar
      ? `Recommended focus: shore up ${weakestPillar.pillar} (${weakestPillar.score}/100) and clear the priorities below within 48 hours.`
      : `Recommended focus: maintain momentum and clear the priorities below within 48 hours.`;

    const summary = `${condition} ${opportunity} ${risk} ${focus}`;

    return {
      ...health,
      executiveSummary: summary,
      topPriorities: priorities,
      alerts,
      generatedBy: 'rule-based',
    };
  }

  async generateOperationsIntel(req: CommandCenterRequest): Promise<OperationsIntelResult> {
    const key = sectorKey(req.sector);
    const items = SECTOR_OPERATIONS_TEMPLATES[key]
      .slice()
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .map((t, i) => ({ ...t, id: `ops-${i}`, priorityRank: i + 1 }));
    return { items, generatedBy: 'rule-based' };
  }
}
