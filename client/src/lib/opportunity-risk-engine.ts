export interface OpportunityRiskHighlight {
  type: 'risk' | 'opportunity' | 'urgent' | 'action' | 'forecast';
  icon: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  color: string;
}

const ECOMMERCE_HIGHLIGHTS: OpportunityRiskHighlight[] = [
  { type: 'risk', icon: '🔴', title: 'Cart Abandonment Rising', description: 'Cart abandonment rate increased 8% over 7 days — conversion funnel at risk.', severity: 'high', color: 'rose' },
  { type: 'opportunity', icon: '🟢', title: 'Conversion Uplift Window', description: 'Conversion improved +3.2% while returns stayed flat — strong growth opportunity this cycle.', severity: 'medium', color: 'emerald' },
  { type: 'urgent', icon: '🟠', title: 'ROAS Below Threshold', description: 'Return on ad spend dropped below 3.0x — review campaign spend allocation.', severity: 'high', color: 'amber' },
  { type: 'action', icon: '⚡', title: 'Top Action: Optimize Checkout', description: 'A/B test a simplified checkout flow to reduce 2-step drop-off by ~15%.', severity: 'medium', color: 'blue' },
  { type: 'forecast', icon: '📈', title: 'Revenue Forecast', description: 'If current conversion trend holds, revenue may increase 6% over the next 14 days.', severity: 'low', color: 'indigo' },
];

const LOGISTICS_HIGHLIGHTS: OpportunityRiskHighlight[] = [
  { type: 'risk', icon: '🔴', title: 'Late Shipments Increasing', description: 'Late shipments increased 12% this period — risk to on-time delivery SLA compliance.', severity: 'high', color: 'rose' },
  { type: 'opportunity', icon: '🟢', title: 'Route Consolidation Savings', description: 'Consolidating 3 overlapping routes could save ~$14K/month in carrier costs.', severity: 'medium', color: 'emerald' },
  { type: 'urgent', icon: '🟠', title: 'Warehouse Utilization Critical', description: 'Warehouse utilization at 94% — above safe threshold. Overflow risk imminent.', severity: 'high', color: 'amber' },
  { type: 'action', icon: '⚡', title: 'Top Action: Shift Overflow', description: 'Redirect overflow inventory to backup carrier or regional hub to avoid bottleneck.', severity: 'high', color: 'blue' },
  { type: 'forecast', icon: '📉', title: 'Delivery Performance Forecast', description: 'If delays continue at current rate, delivery performance may drop another 1.5% by end of month.', severity: 'medium', color: 'indigo' },
];

const MANUFACTURING_HIGHLIGHTS: OpportunityRiskHighlight[] = [
  { type: 'risk', icon: '🔴', title: 'Defect Rate Spike', description: 'Defect rate on Line B increased 2.1% — quality control review needed before next batch.', severity: 'high', color: 'rose' },
  { type: 'opportunity', icon: '🟢', title: 'Throughput Capacity Available', description: 'Line A running at 72% capacity — opportunity to schedule additional production runs.', severity: 'medium', color: 'emerald' },
  { type: 'urgent', icon: '🟠', title: 'Downtime Above Target', description: 'Unplanned downtime exceeded 8% this week — investigate root cause on Line C.', severity: 'high', color: 'amber' },
  { type: 'action', icon: '⚡', title: 'Top Action: Preventive Maintenance', description: 'Schedule preventive maintenance on Line C equipment to reduce unplanned stops.', severity: 'medium', color: 'blue' },
  { type: 'forecast', icon: '📈', title: 'Production Forecast', description: 'At current yield rates, monthly output target is achievable with 3 additional shifts.', severity: 'low', color: 'indigo' },
];

const UNIFIED_HIGHLIGHTS: OpportunityRiskHighlight[] = [
  { type: 'risk', icon: '🔴', title: 'Cross-Sector Delay Impact', description: 'Manufacturing delays are cascading into logistics — 18% of shipments affected downstream.', severity: 'high', color: 'rose' },
  { type: 'opportunity', icon: '🟢', title: 'Perfect Order Rate Improving', description: 'Perfect order rate up 2.4% — strong alignment between production and fulfillment teams.', severity: 'medium', color: 'emerald' },
  { type: 'urgent', icon: '🟠', title: 'Bullwhip Effect Warning', description: 'Demand signal variance increasing — consider smoothing inventory buffers across tiers.', severity: 'high', color: 'amber' },
  { type: 'action', icon: '⚡', title: 'Top Action: Align Planning Cycles', description: 'Synchronize procurement and production planning to reduce cash-to-cash cycle by ~4 days.', severity: 'medium', color: 'blue' },
  { type: 'forecast', icon: '📊', title: 'Supply Chain Health Forecast', description: 'Overall supply chain health score projected to improve 3% if current actions are sustained.', severity: 'low', color: 'indigo' },
];

export function getHighlights(sector: string): OpportunityRiskHighlight[] {
  switch (sector) {
    case 'ecommerce': return ECOMMERCE_HIGHLIGHTS;
    case 'logistics': return LOGISTICS_HIGHLIGHTS;
    case 'manufacturing': return MANUFACTURING_HIGHLIGHTS;
    case 'unified':
    default: return UNIFIED_HIGHLIGHTS;
  }
}

export function getTopHighlight(sector: string): OpportunityRiskHighlight {
  const highlights = getHighlights(sector);
  return highlights.find(h => h.type === 'risk') || highlights[0];
}

export function getHighlightsByType(sector: string, type: OpportunityRiskHighlight['type']): OpportunityRiskHighlight[] {
  return getHighlights(sector).filter(h => h.type === type);
}
