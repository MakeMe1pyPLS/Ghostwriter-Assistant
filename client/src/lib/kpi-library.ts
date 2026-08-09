import { TOOL_PROFILES } from './tool-profiles';

export type FormatType = 'currency' | 'percentage' | 'number' | 'decimal' | 'duration' | 'ratio' | 'index';
export type ChartSuggestion = 'kpi' | 'trend' | 'bar' | 'donut' | 'pie' | 'progress' | 'table' | 'sparkline' | 'gauge';
export type CardPresetId = 'clean-corporate' | 'executive-tile' | 'modern-analytics' | 'compact-grid' | 'ops-scorecard' | 'minimal-readout' | 'insight-kpi' | 'comparative-kpi';
export type ToolTarget = 'webapp' | 'excel' | 'google-sheets' | 'power-bi' | 'tableau' | 'json-api';
export type SectorId = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';

export interface ToolHint {
  preferredChart: ChartSuggestion;
  notes: string;
}

export interface KpiDefinition {
  id: string;
  label: string;
  description: string;
  formatType: FormatType;
  suggestedVisualizations: ChartSuggestion[];
  suggestedCardPresets: CardPresetId[];
  sectors: SectorId[];
  toolHints?: Partial<Record<ToolTarget, ToolHint>>;
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
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Merged-cell KPI block with revenue bar by period below' },
      'google-sheets': { preferredChart: 'trend', notes: 'Single revenue line with a monthly summary row' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line and prior-period comparison' },
      tableau: { preferredChart: 'trend', notes: 'Revenue trend paired with a KPI headline tile' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit as headline metric with a trend array' },
    },
    defaultValue: '$2.4M', defaultDelta: '+12.3%', defaultTarget: '$2.8M', priority: 'critical'
  },
  {
    id: 'orders', label: 'Orders', description: 'Total number of orders processed',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'compact-grid'],
    sectors: ['ecommerce', 'unified', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'KPI tile with an order-count bar by period' },
      'google-sheets': { preferredChart: 'bar', notes: 'Simple bar of orders per period' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a target line' },
      tableau: { preferredChart: 'trend', notes: 'Order-volume trend with a KPI pairing' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit count metric with a period breakdown' },
    },
    defaultValue: '12,847', defaultDelta: '+8.1%', priority: 'high'
  },
  {
    id: 'aov', label: 'Average Order Value', description: 'Average revenue per transaction',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'insight-kpi'],
    sectors: ['ecommerce', 'unified', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Currency KPI tile with a prior-period value row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Compact currency readout with delta column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line vs target AOV' },
      tableau: { preferredChart: 'trend', notes: 'AOV trend line with a KPI summary' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit currency metric with a target' },
    },
    defaultValue: '$84.20', defaultDelta: '-2.1%', defaultTarget: '$90.00', priority: 'high'
  },
  {
    id: 'conversion-rate', label: 'Conversion Rate', description: 'Percentage of visitors who complete a purchase',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target-comparison row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against target conversion rate' },
      tableau: { preferredChart: 'trend', notes: 'Conversion trend with a threshold reference line' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '3.2%', defaultDelta: '+0.4%', defaultTarget: '4.0%', priority: 'high'
  },
  {
    id: 'roas', label: 'ROAS', description: 'Return on advertising spend',
    formatType: 'ratio', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Ratio KPI tile (e.g. 4.2x) with target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Ratio readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line at target ROAS' },
      tableau: { preferredChart: 'trend', notes: 'ROAS trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit ratio metric with a target' },
    },
    defaultValue: '4.2x', defaultDelta: '+0.3x', defaultTarget: '5.0x', priority: 'medium'
  },
  {
    id: 'returns-rate', label: 'Returns Rate', description: 'Percentage of orders returned',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Returns-rate bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Simple bar of returns rate over time' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged red when above target (lower is better)' },
      tableau: { preferredChart: 'trend', notes: 'Returns trend with a target threshold band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a lower-is-better target' },
    },
    defaultValue: '4.8%', defaultDelta: '+0.6%', defaultTarget: '3.0%', priority: 'medium'
  },
  {
    id: 'repeat-purchase', label: 'Repeat Purchase Rate', description: 'Percentage of customers making repeat purchases',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['insight-kpi', 'modern-analytics'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a prior-period row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a goal line' },
      tableau: { preferredChart: 'trend', notes: 'Repeat-rate trend with a KPI pairing' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '28.4%', defaultDelta: '+2.1%', defaultTarget: '35%', priority: 'medium'
  },
  {
    id: 'cart-abandonment', label: 'Cart Abandonment', description: 'Percentage of shopping carts not converted to orders',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Abandonment bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of abandonment rate over time' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged when above target (lower is better)' },
      tableau: { preferredChart: 'trend', notes: 'Abandonment trend with a target threshold' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a lower-is-better target' },
    },
    defaultValue: '68%', defaultDelta: '-2.3%', defaultTarget: '60%', priority: 'medium'
  },
  {
    id: 'sales-by-channel', label: 'Sales by Channel', description: 'Revenue breakdown by sales channel',
    formatType: 'currency', suggestedVisualizations: ['donut', 'bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'pie', notes: 'Pie of revenue share by channel plus a supporting table' },
      'google-sheets': { preferredChart: 'pie', notes: 'Pie of channel mix with a data table' },
      'power-bi': { preferredChart: 'donut', notes: 'Donut of channel share with a detail table' },
      tableau: { preferredChart: 'bar', notes: 'Horizontal bar of revenue by channel' },
      'json-api': { preferredChart: 'table', notes: 'Emit channel breakdown as an array of { channel, value }' },
    },
    priority: 'medium'
  },
  {
    id: 'product-performance', label: 'Product Performance', description: 'Top performing products by revenue and units',
    formatType: 'number', suggestedVisualizations: ['table', 'bar'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['ecommerce', 'custom'], category: 'Revenue & Growth',
    toolHints: {
      excel: { preferredChart: 'table', notes: 'Ranked product table with revenue and units columns' },
      'google-sheets': { preferredChart: 'table', notes: 'Sortable product table' },
      'power-bi': { preferredChart: 'bar', notes: 'Top-N product bar chart with a table detail' },
      tableau: { preferredChart: 'bar', notes: 'Ranked product bar with tooltips' },
      'json-api': { preferredChart: 'table', notes: 'Emit ranked products as an array' },
    },
    priority: 'low'
  },
  {
    id: 'on-time-delivery', label: 'On-Time Delivery', description: 'Percentage of shipments delivered within the promised window',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['ops-scorecard', 'executive-tile'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Large KPI card with target comparison' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against the on-time target' },
      tableau: { preferredChart: 'trend', notes: 'Trend line with threshold band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '94.2%', defaultDelta: '-1.8%', defaultTarget: '97%', priority: 'critical'
  },
  {
    id: 'late-shipments', label: 'Late Shipments', description: 'Number of shipments delivered after the promised date',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['ops-scorecard', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Late-shipment count bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of late shipments over time' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged when rising (lower is better)' },
      tableau: { preferredChart: 'trend', notes: 'Late-shipment trend (lower is better)' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit count metric with a period series' },
    },
    defaultValue: '342', defaultDelta: '+11%', priority: 'high'
  },
  {
    id: 'shipment-volume', label: 'Shipment Volume', description: 'Total number of shipments processed',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Shipment-volume bar by period' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of shipment volume' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a volume sparkline' },
      tableau: { preferredChart: 'trend', notes: 'Volume trend with a KPI pairing' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit count metric with a series' },
    },
    defaultValue: '8,421', defaultDelta: '+5.2%', priority: 'high'
  },
  {
    id: 'transit-time', label: 'Transit Time', description: 'Average time from shipment to delivery',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Duration KPI tile (days) with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Duration readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line at target transit time' },
      tableau: { preferredChart: 'trend', notes: 'Transit-time trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: days)' },
    },
    defaultValue: '2.4 days', defaultDelta: '+0.3 days', defaultTarget: '2.0 days', unit: 'days', priority: 'high'
  },
  {
    id: 'warehouse-utilization', label: 'Warehouse Utilization', description: 'Percentage of warehouse capacity in use',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'gauge', 'progress'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a capacity-target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against the capacity target' },
      tableau: { preferredChart: 'bar', notes: 'Utilization bar vs a target reference line' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '92%', defaultDelta: '+4%', defaultTarget: '85%', priority: 'high'
  },
  {
    id: 'cost-per-shipment', label: 'Cost per Shipment', description: 'Average cost to process and deliver a shipment',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['executive-tile', 'compact-grid'],
    sectors: ['logistics', 'unified', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Currency KPI tile with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Currency readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line (lower target)' },
      tableau: { preferredChart: 'trend', notes: 'Cost-per-shipment trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit currency metric with a lower-is-better target' },
    },
    defaultValue: '$12.40', defaultDelta: '+$0.80', defaultTarget: '$11.00', priority: 'medium'
  },
  {
    id: 'delivery-exceptions', label: 'Delivery Exceptions', description: 'Number of delivery issues requiring resolution',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['ops-scorecard', 'minimal-readout'],
    sectors: ['logistics', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Exceptions bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of exception counts' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged when rising' },
      tableau: { preferredChart: 'bar', notes: 'Exception bar with tooltips' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit count metric with a series' },
    },
    defaultValue: '89', defaultDelta: '+12', priority: 'medium'
  },
  {
    id: 'carrier-performance', label: 'Carrier Performance', description: 'Carrier on-time and quality scores',
    formatType: 'percentage', suggestedVisualizations: ['bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['logistics', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Carrier score bar with a supporting table' },
      'google-sheets': { preferredChart: 'table', notes: 'Carrier scorecard table' },
      'power-bi': { preferredChart: 'bar', notes: 'Carrier comparison bar with a detail table' },
      tableau: { preferredChart: 'bar', notes: 'Carrier ranking bar' },
      'json-api': { preferredChart: 'table', notes: 'Emit carrier scores as an array' },
    },
    defaultValue: '87%', defaultDelta: '-3%', priority: 'medium'
  },
  {
    id: 'fulfillment-cycle', label: 'Fulfillment Cycle Time', description: 'Average time from order to shipment',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['logistics', 'ecommerce', 'custom'], category: 'Delivery & Fulfillment',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Duration KPI tile (days)' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Duration readout' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a trend sparkline' },
      tableau: { preferredChart: 'trend', notes: 'Cycle-time trend with a KPI pairing' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: days)' },
    },
    defaultValue: '1.8 days', defaultDelta: '-0.2 days', unit: 'days', priority: 'medium'
  },
  {
    id: 'units-produced', label: 'Units Produced', description: 'Total units manufactured in the period',
    formatType: 'number', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['clean-corporate', 'executive-tile'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Production bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of units produced' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line at target output' },
      tableau: { preferredChart: 'trend', notes: 'Production trend with a KPI pairing' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit count metric with a series and target' },
    },
    defaultValue: '45,200', defaultDelta: '+6.3%', defaultTarget: '50,000', priority: 'critical'
  },
  {
    id: 'throughput', label: 'Throughput', description: 'Units produced per day',
    formatType: 'number', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['ops-scorecard', 'executive-tile'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Throughput KPI tile (units/day) with a target' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Throughput readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a goal line' },
      tableau: { preferredChart: 'trend', notes: 'Throughput trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit rate metric with a target' },
    },
    defaultValue: '1,750/day', defaultDelta: '-4.2%', defaultTarget: '2,000/day', priority: 'critical'
  },
  {
    id: 'downtime', label: 'Downtime', description: 'Total hours of unplanned equipment downtime',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'bar', 'trend'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Downtime-hours bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of downtime hours' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged when above target (lower is better)' },
      tableau: { preferredChart: 'trend', notes: 'Downtime trend with a target threshold' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: hours); lower target' },
    },
    defaultValue: '14.2 hrs', defaultDelta: '+18%', defaultTarget: '<8 hrs', unit: 'hours', priority: 'high'
  },
  {
    id: 'defect-rate', label: 'Defect Rate', description: 'Percentage of produced units failing quality control',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against defect-rate target (lower is better)' },
      tableau: { preferredChart: 'trend', notes: 'Defect-rate trend with a target threshold' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a lower-is-better target' },
    },
    defaultValue: '0.8%', defaultDelta: '+0.3%', defaultTarget: '0.5%', priority: 'high'
  },
  {
    id: 'yield', label: 'Yield', description: 'Percentage of production that passes quality standards',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['executive-tile', 'modern-analytics'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against the yield target' },
      tableau: { preferredChart: 'trend', notes: 'Yield trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '97.8%', defaultDelta: '-0.4%', defaultTarget: '99%', priority: 'high'
  },
  {
    id: 'capacity-utilization', label: 'Capacity Utilization', description: 'Percentage of total production capacity in use',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'gauge', 'progress'], suggestedCardPresets: ['ops-scorecard', 'comparative-kpi'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against the capacity target' },
      tableau: { preferredChart: 'bar', notes: 'Utilization bar vs a target reference' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '78%', defaultDelta: '+2%', defaultTarget: '85%', priority: 'medium'
  },
  {
    id: 'lead-time', label: 'Lead Time', description: 'Average time from order to delivery for materials',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'ops-scorecard'],
    sectors: ['manufacturing', 'unified', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Duration KPI tile (days) with a target' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Duration readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line (lower target)' },
      tableau: { preferredChart: 'trend', notes: 'Lead-time trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: days)' },
    },
    defaultValue: '8.5 days', defaultDelta: '+1.2 days', defaultTarget: '7 days', unit: 'days', priority: 'medium'
  },
  {
    id: 'scrap-rate', label: 'Scrap Rate', description: 'Percentage of materials wasted during production',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['ops-scorecard', 'minimal-readout'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Scrap-rate bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of scrap rate' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile flagged when above target' },
      tableau: { preferredChart: 'bar', notes: 'Scrap-rate bar with a target reference' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a lower-is-better target' },
    },
    defaultValue: '2.1%', defaultDelta: '+0.4%', defaultTarget: '1.5%', priority: 'medium'
  },
  {
    id: 'batch-performance', label: 'Batch Performance', description: 'Production batch completion rate and quality',
    formatType: 'percentage', suggestedVisualizations: ['bar', 'table'], suggestedCardPresets: ['clean-corporate'],
    sectors: ['manufacturing', 'custom'], category: 'Production & Efficiency',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Batch completion bar with a supporting table' },
      'google-sheets': { preferredChart: 'table', notes: 'Batch performance table' },
      'power-bi': { preferredChart: 'bar', notes: 'Batch comparison bar with a detail table' },
      tableau: { preferredChart: 'bar', notes: 'Batch performance ranked bar' },
      'json-api': { preferredChart: 'table', notes: 'Emit batch records as an array' },
    },
    priority: 'low'
  },
  {
    id: 'perfect-order-rate', label: 'Perfect Order Rate', description: 'Orders delivered complete, on-time, undamaged, with correct docs',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend', 'gauge'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['unified', 'ecommerce', 'logistics', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Headline percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge against the perfect-order target' },
      tableau: { preferredChart: 'trend', notes: 'Perfect-order trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '98.4%', defaultDelta: '-0.2%', defaultTarget: '99%', priority: 'critical'
  },
  {
    id: 'cash-to-cash', label: 'Cash-to-Cash Cycle Time', description: 'Days between paying suppliers and receiving customer payment',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'insight-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Duration KPI tile (days) with a target' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Duration readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line (lower target)' },
      tableau: { preferredChart: 'trend', notes: 'Cash-to-cash trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: days)' },
    },
    defaultValue: '14 days', defaultDelta: '+2 days', defaultTarget: '12 days', unit: 'days', priority: 'critical'
  },
  {
    id: 'atp-accuracy', label: 'ATP Accuracy', description: 'Accuracy of Available-to-Promise projections',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a goal line' },
      tableau: { preferredChart: 'trend', notes: 'ATP accuracy trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '94.2%', defaultDelta: '-1.8%', defaultTarget: '97%', priority: 'high'
  },
  {
    id: 'bullwhip-index', label: 'Bullwhip Effect Index', description: 'Ratio measuring demand signal amplification across tiers',
    formatType: 'index', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['insight-kpi', 'executive-tile'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Index KPI tile with a target threshold' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Index readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line at target index' },
      tableau: { preferredChart: 'trend', notes: 'Bullwhip index trend with a target threshold' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit index metric with a lower-is-better target' },
    },
    defaultValue: '1.12', defaultDelta: '+0.03', defaultTarget: '<1.10', priority: 'high'
  },
  {
    id: 'inventory-demand-risk', label: 'Inventory-to-Demand Risk', description: 'Risk score of inventory misalignment with demand',
    formatType: 'index', suggestedVisualizations: ['kpi', 'gauge'], suggestedCardPresets: ['insight-kpi', 'ops-scorecard'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Risk-index KPI tile with a threshold row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Index readout with a threshold column' },
      'power-bi': { preferredChart: 'gauge', notes: 'Gauge of risk index against threshold' },
      tableau: { preferredChart: 'bar', notes: 'Risk index bar vs a threshold reference' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit index metric with a lower-is-better target' },
    },
    defaultValue: '0.82', defaultDelta: '+0.05', defaultTarget: '<0.70', priority: 'medium'
  },
  {
    id: 'cross-sector-delay', label: 'Cross-Sector Delay Impact', description: 'Cascading delay impact across supply chain sectors',
    formatType: 'duration', suggestedVisualizations: ['kpi', 'bar'], suggestedCardPresets: ['insight-kpi', 'comparative-kpi'],
    sectors: ['unified', 'custom'], category: 'Supply Chain Health',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Delay-impact bar by sector with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of delay impact by sector' },
      'power-bi': { preferredChart: 'bar', notes: 'Sector-breakdown bar with a KPI tile' },
      tableau: { preferredChart: 'bar', notes: 'Delay impact by sector bar' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit duration metric (unit: hours) with a sector array' },
    },
    defaultValue: '3.2 hrs', defaultDelta: '+1.1 hrs', unit: 'hours', priority: 'medium'
  },
  {
    id: 'gross-margin', label: 'Gross Margin', description: 'Revenue minus cost of goods sold as a percentage',
    formatType: 'percentage', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['executive-tile', 'modern-analytics'],
    sectors: ['ecommerce', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Percentage KPI with a target row' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Percentage readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line at target margin' },
      tableau: { preferredChart: 'trend', notes: 'Gross-margin trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit percentage metric with a target' },
    },
    defaultValue: '42.3%', defaultDelta: '-1.2%', defaultTarget: '45%', priority: 'high'
  },
  {
    id: 'operating-cost', label: 'Operating Cost', description: 'Total operational expenditure',
    formatType: 'currency', suggestedVisualizations: ['kpi', 'trend', 'bar'], suggestedCardPresets: ['clean-corporate', 'executive-tile'],
    sectors: ['ecommerce', 'logistics', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    toolHints: {
      excel: { preferredChart: 'bar', notes: 'Operating-cost bar by period with a KPI header' },
      'google-sheets': { preferredChart: 'bar', notes: 'Bar of operating cost' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with goal line (lower target)' },
      tableau: { preferredChart: 'trend', notes: 'Operating-cost trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit currency metric with a series' },
    },
    defaultValue: '$1.2M', defaultDelta: '+4.5%', priority: 'high'
  },
  {
    id: 'inventory-turnover', label: 'Inventory Turnover', description: 'How many times inventory is sold and replaced per period',
    formatType: 'ratio', suggestedVisualizations: ['kpi', 'trend'], suggestedCardPresets: ['modern-analytics', 'comparative-kpi'],
    sectors: ['ecommerce', 'manufacturing', 'unified', 'custom'], category: 'Cost & Margin',
    toolHints: {
      excel: { preferredChart: 'kpi', notes: 'Ratio KPI tile (e.g. 6.2x) with a target' },
      'google-sheets': { preferredChart: 'kpi', notes: 'Ratio readout with a target column' },
      'power-bi': { preferredChart: 'kpi', notes: 'KPI tile with a goal line' },
      tableau: { preferredChart: 'trend', notes: 'Turnover trend with a target band' },
      'json-api': { preferredChart: 'kpi', notes: 'Emit ratio metric with a target' },
    },
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

/**
 * Resolve the tool-specific hint for a KPI, falling back to a chart that is
 * compatible with the target tool's profile when no explicit hint is defined.
 * This lets tool-aware generation and the Export Center tailor each KPI's
 * chart + layout guidance per target tool.
 */
export function resolveToolHint(kpi: KpiDefinition, tool: ToolTarget): ToolHint {
  const explicit = kpi.toolHints?.[tool];
  if (explicit) return explicit;

  const profile = TOOL_PROFILES[tool];
  const compatible = profile?.compatibleCharts ?? [];
  const preferredChart =
    kpi.suggestedVisualizations.find(v => compatible.includes(v)) ??
    kpi.suggestedVisualizations[0] ??
    'kpi';

  return {
    preferredChart,
    notes: `Default ${profile?.label ?? tool} layout for ${kpi.label}`,
  };
}

/** Convenience: resolve only the preferred chart for a KPI id on a given tool. */
export function getKpiChartForTool(kpiId: string, tool: ToolTarget): ChartSuggestion {
  const kpi = getKpiById(kpiId);
  if (!kpi) return 'kpi';
  return resolveToolHint(kpi, tool).preferredChart;
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
