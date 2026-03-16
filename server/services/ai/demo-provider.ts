import type {
  AIProviderBase,
  GenerationRequest,
  EnhancementRequest,
  DashboardGenerationResult,
  GeneratedWidget,
  GeneratedLayout,
} from './base-provider';

const SECTOR_KPI_MAP: Record<string, { id: string; type: string; title: string; chartType?: string }[]> = {
  ecommerce: [
    { id: 'revenue', type: 'kpi', title: 'Revenue' },
    { id: 'orders', type: 'kpi', title: 'Orders' },
    { id: 'aov', type: 'kpi', title: 'Avg Order Value' },
    { id: 'conversion-rate', type: 'kpi', title: 'Conversion Rate' },
    { id: 'cart-abandonment', type: 'kpi', title: 'Cart Abandonment' },
    { id: 'returns-rate', type: 'kpi', title: 'Returns Rate' },
    { id: 'repeat-purchase', type: 'kpi', title: 'Repeat Purchase Rate' },
    { id: 'roas', type: 'kpi', title: 'ROAS' },
    { id: 'revenue-trend', type: 'trend', title: 'Revenue Trend', chartType: 'area' },
    { id: 'orders-bar', type: 'bar', title: 'Orders by Channel', chartType: 'bar' },
    { id: 'channel-mix', type: 'donut', title: 'Channel Mix' },
  ],
  logistics: [
    { id: 'on-time-delivery', type: 'kpi', title: 'On-Time Delivery' },
    { id: 'late-shipments', type: 'kpi', title: 'Late Shipments' },
    { id: 'shipment-volume', type: 'kpi', title: 'Shipment Volume' },
    { id: 'transit-time', type: 'kpi', title: 'Transit Time' },
    { id: 'warehouse-utilization', type: 'kpi', title: 'Warehouse Util.' },
    { id: 'cost-per-shipment', type: 'kpi', title: 'Cost/Shipment' },
    { id: 'fulfillment-cycle', type: 'kpi', title: 'Fulfillment Cycle' },
    { id: 'delivery-exceptions', type: 'kpi', title: 'Exceptions' },
    { id: 'delivery-trend', type: 'trend', title: 'Delivery Performance', chartType: 'line' },
    { id: 'carrier-bar', type: 'bar', title: 'Carrier Performance', chartType: 'bar' },
  ],
  manufacturing: [
    { id: 'units-produced', type: 'kpi', title: 'Units Produced' },
    { id: 'throughput', type: 'kpi', title: 'Throughput' },
    { id: 'defect-rate', type: 'kpi', title: 'Defect Rate' },
    { id: 'yield', type: 'kpi', title: 'Yield' },
    { id: 'downtime', type: 'kpi', title: 'Downtime' },
    { id: 'capacity-utilization', type: 'kpi', title: 'Capacity Util.' },
    { id: 'lead-time', type: 'kpi', title: 'Lead Time' },
    { id: 'scrap-rate', type: 'kpi', title: 'Scrap Rate' },
    { id: 'production-trend', type: 'trend', title: 'Production Trend', chartType: 'area' },
    { id: 'quality-bar', type: 'bar', title: 'Quality by Line', chartType: 'bar' },
  ],
  unified: [
    { id: 'perfect-order-rate', type: 'kpi', title: 'Perfect Order Rate' },
    { id: 'cash-to-cash', type: 'kpi', title: 'Cash-to-Cash Cycle' },
    { id: 'atp-accuracy', type: 'kpi', title: 'ATP Accuracy' },
    { id: 'bullwhip-index', type: 'kpi', title: 'Bullwhip Index' },
    { id: 'on-time-delivery', type: 'kpi', title: 'On-Time Delivery' },
    { id: 'defect-rate', type: 'kpi', title: 'Defect Rate' },
    { id: 'revenue', type: 'kpi', title: 'Revenue' },
    { id: 'operating-cost', type: 'kpi', title: 'Operating Cost' },
    { id: 'supply-chain-trend', type: 'trend', title: 'Supply Chain Health', chartType: 'area' },
    { id: 'sector-mix', type: 'donut', title: 'Cross-Sector Overview' },
  ],
};

const GOAL_KPI_PRIORITIES: Record<string, string[]> = {
  'sales': ['revenue', 'orders', 'aov', 'conversion-rate', 'roas'],
  'fulfillment': ['on-time-delivery', 'late-shipments', 'fulfillment-cycle', 'shipment-volume', 'delivery-exceptions'],
  'efficiency': ['throughput', 'capacity-utilization', 'yield', 'downtime', 'defect-rate'],
  'executive': ['revenue', 'perfect-order-rate', 'on-time-delivery', 'gross-margin', 'operating-cost'],
  'forecasting': ['revenue', 'orders', 'throughput', 'on-time-delivery'],
  'visibility': ['perfect-order-rate', 'cash-to-cash', 'bullwhip-index', 'atp-accuracy', 'inventory-demand-risk'],
};

const STYLE_PRESETS: Record<string, { cardPreset: string; density: string }> = {
  'executive': { cardPreset: 'executive-tile', density: 'spacious' },
  'operational': { cardPreset: 'ops-scorecard', density: 'standard' },
  'analytics': { cardPreset: 'modern-analytics', density: 'standard' },
  'minimal': { cardPreset: 'minimal-readout', density: 'spacious' },
  'board-ready': { cardPreset: 'executive-tile', density: 'spacious' },
  'auto': { cardPreset: 'clean-corporate', density: 'standard' },
};

const TOOL_LIMITS: Record<string, { maxKpis: number; maxCharts: number; kpiPerRow: number; cols: number }> = {
  'webapp': { maxKpis: 8, maxCharts: 4, kpiPerRow: 4, cols: 12 },
  'excel': { maxKpis: 6, maxCharts: 2, kpiPerRow: 3, cols: 6 },
  'google-sheets': { maxKpis: 4, maxCharts: 2, kpiPerRow: 2, cols: 4 },
  'power-bi': { maxKpis: 6, maxCharts: 3, kpiPerRow: 4, cols: 8 },
  'tableau': { maxKpis: 6, maxCharts: 3, kpiPerRow: 4, cols: 8 },
  'json-api': { maxKpis: 8, maxCharts: 4, kpiPerRow: 4, cols: 12 },
};

function buildLayout(widgets: GeneratedWidget[], tool: string, density: string): GeneratedLayout[] {
  const limits = TOOL_LIMITS[tool] || TOOL_LIMITS['webapp'];
  const kpiWidth = Math.floor(limits.cols / limits.kpiPerRow);
  const layout: GeneratedLayout[] = [];
  let currentY = 0;
  let currentX = 0;
  const kpiHeight = density === 'compact' ? 2 : density === 'spacious' ? 3 : 2;
  const chartHeight = density === 'compact' ? 3 : density === 'spacious' ? 5 : 4;

  widgets.forEach(w => {
    if (w.type === 'kpi') {
      if (currentX + kpiWidth > limits.cols) {
        currentX = 0;
        currentY += kpiHeight;
      }
      layout.push({ i: w.id, x: currentX, y: currentY, w: kpiWidth, h: kpiHeight });
      currentX += kpiWidth;
    }
  });

  if (currentX > 0) {
    currentY += kpiHeight;
    currentX = 0;
  }

  widgets.forEach(w => {
    if (w.type !== 'kpi') {
      const chartW = w.type === 'donut' || w.type === 'pie' ? Math.floor(limits.cols / 3) : Math.floor(limits.cols * 2 / 3);
      const remainW = limits.cols - chartW;
      if (w.type === 'trend' || w.type === 'bar') {
        layout.push({ i: w.id, x: 0, y: currentY, w: chartW, h: chartHeight });
      } else if (w.type === 'donut' || w.type === 'pie') {
        layout.push({ i: w.id, x: chartW > remainW ? limits.cols - remainW : 0, y: currentY, w: Math.max(remainW, 3), h: chartHeight });
      } else if (w.type === 'insights' || w.type === 'summary') {
        layout.push({ i: w.id, x: chartW, y: currentY - chartHeight, w: remainW, h: chartHeight });
      } else {
        layout.push({ i: w.id, x: 0, y: currentY, w: limits.cols, h: chartHeight });
        currentY += chartHeight;
      }
    }
  });

  return layout;
}

function selectWidgets(
  sector: string,
  goal: string,
  tool: string,
  density: string,
  kpiPriorities: string[],
  aiHelpLevel: string,
  style: string
): GeneratedWidget[] {
  const sectorKpis = SECTOR_KPI_MAP[sector] || SECTOR_KPI_MAP['unified'];
  const limits = TOOL_LIMITS[tool] || TOOL_LIMITS['webapp'];
  const goalPriorities = GOAL_KPI_PRIORITIES[goal] || [];

  const kpiCandidates = sectorKpis.filter(k => k.type === 'kpi');
  const chartCandidates = sectorKpis.filter(k => k.type !== 'kpi');

  let sortedKpis = [...kpiCandidates];
  if (goalPriorities.length > 0) {
    sortedKpis.sort((a, b) => {
      const ai = goalPriorities.indexOf(a.id);
      const bi = goalPriorities.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  const kpiCount = density === 'light' ? Math.min(3, limits.maxKpis)
    : density === 'dense' ? limits.maxKpis
    : density === 'executive' ? Math.min(4, limits.maxKpis)
    : Math.min(4, limits.maxKpis);

  const selectedKpis = sortedKpis.slice(0, kpiCount);
  const selectedCharts = chartCandidates.slice(0, Math.min(2, limits.maxCharts));

  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['auto'];
  const ts = Date.now();

  const widgets: GeneratedWidget[] = selectedKpis.map((k, i) => ({
    id: `gen-${k.id}-${ts}-${i}`,
    type: 'kpi',
    title: k.title,
    metricIndex: i,
    kpiId: k.id,
    cardPreset: stylePreset.cardPreset,
    showDelta: true,
    showTarget: style === 'executive' || style === 'board-ready',
    showSparkline: tool === 'webapp' && (style === 'analytics' || aiHelpLevel === 'full'),
  }));

  selectedCharts.forEach((c, i) => {
    widgets.push({
      id: `gen-${c.id}-${ts}-${i}`,
      type: c.type,
      title: c.title,
      metricIndex: 0,
      chartType: c.chartType,
      cardPreset: stylePreset.cardPreset,
    });
  });

  if (aiHelpLevel === 'full' || aiHelpLevel === 'auto') {
    widgets.push({
      id: `gen-insights-${ts}`,
      type: 'insights',
      title: 'AI Recommendations',
      metricIndex: 0,
    });
  }

  return widgets;
}

export class DemoAIProvider implements AIProviderBase {
  async generateDashboard(request: GenerationRequest): Promise<DashboardGenerationResult> {
    const {
      sector = 'unified',
      goal = 'executive',
      tool = 'webapp',
      style = 'auto',
      kpiPriorities = [],
      density = 'standard',
      aiHelpLevel = 'auto',
    } = request;

    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['auto'];
    const widgets = selectWidgets(sector, goal, tool, density, kpiPriorities, aiHelpLevel, style);
    const layout = buildLayout(widgets, tool, density);

    const sectorLabels: Record<string, string> = {
      ecommerce: 'E-commerce', logistics: 'Logistics',
      manufacturing: 'Manufacturing', unified: 'Supply Chain', custom: 'Custom',
    };
    const goalLabels: Record<string, string> = {
      sales: 'Sales Performance', fulfillment: 'Fulfillment Operations',
      efficiency: 'Operational Efficiency', executive: 'Executive Overview',
      forecasting: 'Forecasting & Planning', visibility: 'End-to-End Visibility',
    };

    return {
      title: `${sectorLabels[sector] || 'Supply Chain'} ${goalLabels[goal] || 'Dashboard'}`,
      subtitle: `Auto-generated for ${TOOL_LIMITS[tool] ? tool.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Web App'} · ${new Date().toLocaleDateString()}`,
      sector,
      toolTarget: tool,
      widgets,
      layout,
      aiSummary: `This dashboard was generated based on your ${sectorLabels[sector] || ''} business context, optimized for ${goalLabels[goal] || 'general'} tracking. It includes ${widgets.filter(w => w.type === 'kpi').length} KPI cards and ${widgets.filter(w => w.type !== 'kpi').length} visualizations, styled for ${tool === 'webapp' ? 'the ChainInsideIQ platform' : tool}.`,
      cardPreset: stylePreset.cardPreset,
      style,
    };
  }

  async enhanceDashboard(request: EnhancementRequest): Promise<DashboardGenerationResult> {
    const {
      sector = 'unified',
      targetTool = 'webapp',
      improvements = [],
      designStyle = 'auto',
      existingWidgets = [],
    } = request;

    const stylePreset = STYLE_PRESETS[designStyle] || STYLE_PRESETS['auto'];
    const enhancedWidgets: GeneratedWidget[] = [];
    const ts = Date.now();

    if (existingWidgets.length > 0) {
      existingWidgets.forEach((w: any, i: number) => {
        enhancedWidgets.push({
          id: w.id || `enh-${i}-${ts}`,
          type: w.type || 'kpi',
          title: w.title || w.type || 'Metric',
          metricIndex: w.metricIndex ?? i,
          kpiId: w.kpiId,
          chartType: w.chartType,
          cardPreset: stylePreset.cardPreset,
          showDelta: improvements.includes('readability') || improvements.includes('kpi-design') ? true : w.showDelta,
          showTarget: improvements.includes('executive-storytelling') ? true : w.showTarget,
          showSparkline: improvements.includes('kpi-design') && targetTool === 'webapp' ? true : w.showSparkline,
        });
      });
    } else {
      const generated = await this.generateDashboard({
        sector, goal: 'executive', tool: targetTool,
        style: designStyle, kpiPriorities: [], dataContext: 'demo',
        density: 'standard', aiHelpLevel: 'auto',
      });
      return generated;
    }

    const layout = buildLayout(enhancedWidgets, targetTool, stylePreset.density);

    return {
      title: 'Enhanced Dashboard',
      subtitle: `Improved for ${targetTool} · ${improvements.join(', ')}`,
      sector,
      toolTarget: targetTool,
      widgets: enhancedWidgets,
      layout,
      aiSummary: `Your dashboard has been enhanced with focus on: ${improvements.join(', ')}. Card styles updated to ${stylePreset.cardPreset.replace('-', ' ')} preset for better readability.`,
      cardPreset: stylePreset.cardPreset,
      style: designStyle,
    };
  }
}
