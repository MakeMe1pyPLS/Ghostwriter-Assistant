export type FormatType = 'currency' | 'percentage' | 'number' | 'decimal' | 'duration' | 'ratio' | 'index';
export type ChartSuggestion = 'kpi' | 'trend' | 'bar' | 'donut' | 'pie' | 'progress' | 'table' | 'sparkline' | 'gauge';
export type CardPresetId = 'clean-corporate' | 'executive-tile' | 'modern-analytics' | 'compact-grid' | 'ops-scorecard' | 'minimal-readout' | 'insight-kpi' | 'comparative-kpi';
export type ToolTarget = 'webapp' | 'excel' | 'google-sheets' | 'power-bi' | 'tableau' | 'json-api';
export type SectorId = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';

export interface KpiDefinition {
  id: string;
  label: string;
  description: string;
  formatType: FormatType;
  suggestedVisualizations: ChartSuggestion[];
  suggestedCardPresets: CardPresetId[];
  sectors: SectorId[];
  toolHints: Partial<Record<ToolTarget, { preferredChart: ChartSuggestion; notes: string }>>;
  category: string;
  defaultValue?: string;
  defaultDelta?: string;
  defaultTarget?: string;
  unit?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export const KPI_LIBRARY: KpiDefinition[] = [
  {
    id: 'revenue', label: 'Revenue', description: 'Total revenue generated in the selected period',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['executive-tile', 'modern-analytics'],
    sectors: ['ecommerce', 'unified', 'custom'], category: 'Revenue & Growth',
    toolHints: { excel: { preferredChart: 'bar', notes: 'Use merged-cell KPI block with bar chart below' }, 'power-bi': { preferredChart: 'kpi', notes: 'Use KPI tile with goal line' } },
    defaultValue: '$2.4M', defaultDelta: '+12.3%', defaultTarget: '$2.8M', priority: 'critical'
  },
  {
    id: 'orders', label: 'Orders', description: 'Total number of orders processed',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'compact-grid'],
    sectors: ['ecommerce', 'unified', 'custom'], category: 'Revenue & Growth',
    defaultValue: '12,847', defaultDelta: '+8.1%', priority: 'high'
  },
  {
    id: 'aov', label: 'Average Order Value', description: 'Average revenue per transaction',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'insight-kpi'],
    sectors: ['ecommerce', 'unified', 'custom'], category: 'Revenue & Growth',
    defaultValue: '$84.20', defaultDelta: '-2.1%', defaultTarget: '$90.00', priority: 'high'
  },
  {
    id: 'conversion-rate', label: 'Conversion Rate', description: 'Percentage of visitors who complete a purchase',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    defaultValue: '3.2%', defaultDelta: '+0.4%', defaultTarget: '4.0%', priority: 'high'
  },
  {
    id: 'roas', label: 'ROAS', description: 'Return on advertising spend',
    formatType: 'ratio', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    defaultValue: '4.2x', defaultDelta: '+0.3x', defaultTarget: '5.0x', priority: 'medium'
  },
  {
    id: 'returns-rate', label: 'Returns Rate', description: 'Percentage of orders returned',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    defaultValue: '4.8%', defaultDelta: '+0.6%', defaultTarget: '3.0%', priority: 'medium'
  },
  {
    id: 'repeat-purchase', label: 'Repeat Purchase Rate', description: 'Percentage of customers making repeat purchases',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['insight-kpi', 'modern-analytics'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    defaultValue: '28.4%', defaultDelta: '+2.1%', defaultTarget: '35%', priority: 'medium'
  },
  {
    id: 'cart-abandonment', label: 'Cart Abandonment', description: 'Percentage of shopping carts not converted to orders',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    defaultValue: '68%', defaultDelta: '-2.3%', defaultTarget: '60%', priority: 'medium'
  },
  {
    id: 'sales-by-channel', label: 'Sales by Channel', description: 'Revenue breakdown by sales channel',
    formatType: 'currency', suggestedVisualizations: ['donut', 'bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    priority: 'medium'
  },
  {
    id: 'product-performance', label: 'Product Performance', description: 'Top performing products by revenue and units',
    formatType: 'number', suggestedVisualizations: ['table', 'bar'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    priority: 'low'
  },
  {
    id: 'on-time-delivery', label: 'On-Time Delivery', description: 'Percentage of shipments delivered within the promised window',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['ops-scorecard', 'executive-tile'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: { excel: { preferredChart: 'kpi', notes: 'Large KPI card with target comparison' }, tableau: { preferredChart: 'trend', notes: 'Trend line with threshold band' } },
    defaultValue: '94.2%', defaultDelta: '-1.8%', defaultTarget: '97%', priority: 'critical'
  },
  {
    id: 'late-shipments', label: 'Late Shipments', description: 'Number of shipments delivered after the promised date',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['ops-scorecard', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '342', defaultDelta: '+11%', priority: 'high'
  },
  {
    id: 'shipment-volume', label: 'Shipment Volume', description: 'Total number of shipments processed',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '8,421', defaultDelta: '+5.2%', priority: 'high'
  },
  {
    id: 'transit-time', label: 'Transit Time', description: 'Average time from shipment to delivery',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '2.4 days', defaultDelta: '+0.3 days', defaultTarget: '2.0 days', unit: 'days', priority: 'high'
  },
  {
    id: 'warehouse-utilization', label: 'Warehouse Utilization', description: 'Percentage of warehouse capacity in use',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'gauge', 'progress'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '92%', defaultDelta: '+4%', defaultTarget: '85%', priority: 'high'
  },
  {
    id: 'cost-per-shipment', label: 'Cost per Shipment', description: 'Average cost to process and deliver a shipment',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['executive-tile', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '$12.40', defaultDelta: '+$0.80', defaultTarget: '$11.00', priority: 'medium'
  },
  {
    id: 'delivery-exceptions', label: 'Delivery Exceptions', description: 'Number of delivery issues requiring resolution',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['ops-scorecard', 'minimal-readout'],
    sectors: ['logistics', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '89', defaultDelta: '+12', priority: 'medium'
  },
  {
    id: 'carrier-performance', label: 'Carrier Performance', description: 'Carrier on-time and quality scores',
    formatType: 'percentage', suggestedVisualizations: ['bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['logistics', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '87%', defaultDelta: '-3%', priority: 'medium'
  },
  {
    id: 'fulfillment-cycle', label: 'Fulfillment Cycle Time', description: 'Average time from order to shipment',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['logistics', 'ecommerce', 'custom'], category: 'Delivery & Fulfillment',
    defaultValue: '1.8 days', defaultDelta: '-0.2 days', unit: 'days', priority: 'medium'
  },
  {
    id: 'units-produced', label: 'Units Produced', description: 'Total units manufactured in the period',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'executive-tile'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    defaultValue: '45,200', defaultDelta: '+6.3%', defaultTarget: '50,000', priority: 'critical'
  },
  {
    id: 'throughput', label: 'Throughput', description: 'Units produced per day',
    formatType: 'number', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'executive-tile'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    defaultValue: '1,750/day', defaultDelta: '-4.2%', defaultTarget: '2,000/day', priority: 'critical'
  },
  {
    id: 'downtime', label: 'Downtime', description: 'Total hours of unplanned equipment downtime',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    defaultValue: '14.2 hrs', defaultDelta: '+18%', defaultTarget: '<8 hrs', unit: 'hours', priority: 'high'
  },
  {
    id: 'defect-rate', label: 'Defect Rate', description: 'Percentage of produced units failing quality control',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    defaultValue: '0.8%', defaultDelta: '+0.3%', defaultTarget: '0.5%', priority: 'high'
  },
  {
    id: 'yield', label: 'Yield', description: 'Percentage of production that passes quality standards',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['executive-tile', 'modern-analytics'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    defaultValue: '97.8%', defaultDelta: '-0.4%', defaultTarget: '99%', priority: 'high'
  },
  {
    id: 'capacity-utilization', label: 'Capacity Utilization', description: 'Percentage of total production capacity in use',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'gauge', 'progress'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    defaultValue: '78%', defaultDelta: '+2%', defaultTarget: '85%', priority: 'medium'
  },
  {
    id: 'lead-time', label: 'Lead Time', description: 'Average time from order to delivery for materials',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    defaultValue: '8.5 days', defaultDelta: '+1.2 days', defaultTarget: '7 days', unit: 'days', priority: 'medium'
  },
  {
    id: 'scrap-rate', label: 'Scrap Rate', description: 'Percentage of materials wasted during production',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['ops-scorecard', 'minimal-readout'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    defaultValue: '2.1%', defaultDelta: '+0.4%', defaultTarget: '1.5%', priority: 'medium'
  },
  {
    id: 'batch-performance', label: 'Batch Performance', description: 'Production batch completion rate and quality',
    formatType: 'percentage', suggestedVisualizations: ['bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    priority: 'low'
  },
  {
    id: 'perfect-order-rate', label: 'Perfect Order Rate', description: 'Orders delivered complete, on-time, undamaged, with correct docs',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['unified', 'ecommerce', 'logistics', 'custom'], category: 'Supply Chain Health',
    defaultValue: '98.4%', defaultDelta: '-0.2%', defaultTarget: '99%', priority: 'critical'
  },
  {
    id: 'cash-to-cash', label: 'Cash-to-Cash Cycle Time', description: 'Days between paying suppliers and receiving customer payment',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    defaultValue: '14 days', defaultDelta: '+2 days', defaultTarget: '12 days', unit: 'days', priority: 'critical'
  },
  {
    id: 'atp-accuracy', label: 'ATP Accuracy', description: 'Accuracy of Available-to-Promise projections',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    defaultValue: '94.2%', defaultDelta: '-1.8%', defaultTarget: '97%', priority: 'high'
  },
  {
    id: 'bullwhip-index', label: 'Bullwhip Effect Index', description: 'Ratio measuring demand signal amplification across tiers',
    formatType: 'index', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['insight-kpi', 'executive-tile'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    defaultValue: '1.12', defaultDelta: '+0.03', defaultTarget: '<1.10', priority: 'high'
  },
  {
    id: 'inventory-demand-risk', label: 'Inventory-to-Demand Risk', description: 'Risk score of inventory misalignment with demand',
    formatType: 'index', suggestedVisualizations: ['kpi', 'gauge'], suggestedCardPresets: ['insight-kpi', 'ops-scorecard'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    defaultValue: '0.82', defaultDelta: '+0.05', defaultTarget: '<0.70', priority: 'medium'
  },
  {
    id: 'cross-sector-delay', label: 'Cross-Sector Delay Impact', description: 'Cascading delay impact across supply chain sectors',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['insight-kpi', 'comparative-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    defaultValue: '3.2 hrs', defaultDelta: '+1.1 hrs', unit: 'hours', priority: 'medium'
  },
  {
    id: 'gross-margin', label: 'Gross Margin', description: 'Revenue minus cost of goods sold as a percentage',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'modern-analytics'],
    sectors: ['ecommerce', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    defaultValue: '42.3%', defaultDelta: '-1.2%', defaultTarget: '45%', priority: 'high'
  },
  {
    id: 'operating-cost', label: 'Operating Cost', description: 'Total operational expenditure',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['clean-corporate', 'executive-tile'],
    sectors: ['ecommerce', 'logistics', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    defaultValue: '$1.2M', defaultDelta: '+4.5%', priority: 'high'
  },
  {
    id: 'inventory-turnover', label: 'Inventory Turnover', description: 'How many times inventory is sold and replaced per period',
    formatType: 'ratio', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['ecommerce', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    defaultValue: '6.2x', defaultDelta: '-0.3x', defaultTarget: '7.0x', priority: 'medium'
  },
];

export function getKpisForSector(sector: SectorId): KpiDefinition[] {
  if (sector === 'custom') return KPI_LIBRARY;
  return KPI_LIBRARY.filter(k => k.sectors.includes(sector));
}

export function getKpisByCategory(sector: SectorId): Record<string, KpiDefinition[]> {
  const kpis = getKpisForSector(sector);
  const grouped: Record<string, KpiDefinition[]> = {};
  kpis.forEach(k => {
    if (!grouped[k.category]) grouped[k.category] = [];
    grouped[k.category].push(k);
  });
  return grouped;
}

export function getKpiById(id: string): KpiDefinition | undefined {
  return KPI_LIBRARY.find(k => k.id === id);
}

export const KPI_CATEGORIES = [
  'Revenue & Growth',
  'Delivery & Fulfillment',
  'Production & Efficiency',
  'Supply Chain Health',
  'Cost & Margin',
] as const;

export const SECTOR_LABELS: Record<SectorId, string> = {
  ecommerce: 'E-commerce',
  logistics: 'Logistics',
  manufacturing: 'Manufacturing',
  unified: 'Unified Supply Chain',
  custom: 'Custom',
};
