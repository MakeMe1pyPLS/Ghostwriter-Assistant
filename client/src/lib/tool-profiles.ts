import type { CardPresetId } from './kpi-card-presets';

export type ToolTarget = 'webapp' | 'excel' | 'google-sheets' | 'power-bi' | 'tableau' | 'json-api';

export interface ToolProfile {
  id: ToolTarget;
  label: string;
  description: string;
  compatibleCharts: string[];
  compatibleCardPresets: CardPresetId[];
  layoutRules: {
    maxColumns: number;
    preferredKpiPerRow: number;
    maxWidgetsPerDashboard: number;
    supportsMergedCells: boolean;
    supportsAnimation: boolean;
    supportsInteractivity: boolean;
  };
  readabilityGuidelines: string[];
  sectionLayout: string[];
}

export const TOOL_PROFILES: Record<ToolTarget, ToolProfile> = {
  webapp: {
    id: 'webapp', label: 'Web App', description: 'Richest layout and best native in-app experience',
    compatibleCharts: ['kpi', 'trend', 'bar', 'donut', 'pie', 'progress', 'table', 'gauge', 'sparkline'],
    compatibleCardPresets: ['executive-tile', 'modern-analytics', 'insight-kpi', 'clean-corporate', 'ops-scorecard', 'compact-grid', 'minimal-readout', 'comparative-kpi'],
    layoutRules: { maxColumns: 12, preferredKpiPerRow: 4, maxWidgetsPerDashboard: 20, supportsMergedCells: false, supportsAnimation: true, supportsInteractivity: true },
    readabilityGuidelines: ['Use responsive grid layout', 'Include interactive tooltips', 'Support dark/light modes', 'Enable drag-and-drop editing'],
    sectionLayout: ['kpi-row', 'primary-chart', 'secondary-charts', 'ai-insights', 'data-tables'],
  },
  excel: {
    id: 'excel', label: 'Excel', description: 'Readable KPI cards with merged-cell-friendly layouts',
    compatibleCharts: ['kpi', 'bar', 'trend', 'pie', 'table'],
    compatibleCardPresets: ['clean-corporate', 'compact-grid', 'executive-tile', 'ops-scorecard'],
    layoutRules: { maxColumns: 6, preferredKpiPerRow: 3, maxWidgetsPerDashboard: 12, supportsMergedCells: true, supportsAnimation: false, supportsInteractivity: false },
    readabilityGuidelines: ['Use strong spacing between sections', 'Prioritize simple chart types', 'Include executive summary blocks', 'Use large readable fonts for KPIs', 'Avoid complex nested layouts'],
    sectionLayout: ['executive-summary', 'kpi-row', 'primary-chart', 'data-tables'],
  },
  'google-sheets': {
    id: 'google-sheets', label: 'Google Sheets', description: 'Clean spreadsheet-compatible sections',
    compatibleCharts: ['kpi', 'bar', 'trend', 'pie', 'table'],
    compatibleCardPresets: ['clean-corporate', 'compact-grid', 'minimal-readout'],
    layoutRules: { maxColumns: 4, preferredKpiPerRow: 2, maxWidgetsPerDashboard: 10, supportsMergedCells: true, supportsAnimation: false, supportsInteractivity: false },
    readabilityGuidelines: ['Keep layouts simple and linear', 'Use practical chart types', 'Include easy-to-read data summaries', 'Minimize visual complexity'],
    sectionLayout: ['kpi-row', 'summary-block', 'primary-chart', 'data-tables'],
  },
  'power-bi': {
    id: 'power-bi', label: 'Power BI', description: 'Strong KPI tiles with comparison visuals and rich hierarchy',
    compatibleCharts: ['kpi', 'bar', 'trend', 'donut', 'gauge', 'table', 'sparkline'],
    compatibleCardPresets: ['executive-tile', 'ops-scorecard', 'comparative-kpi', 'insight-kpi'],
    layoutRules: { maxColumns: 8, preferredKpiPerRow: 4, maxWidgetsPerDashboard: 16, supportsMergedCells: false, supportsAnimation: false, supportsInteractivity: true },
    readabilityGuidelines: ['Use stronger KPI tiles with goal lines', 'Include comparison visuals', 'Create visual groupings like BI reports', 'Use richer layout hierarchy'],
    sectionLayout: ['kpi-row', 'comparison-panel', 'primary-chart', 'secondary-charts', 'detail-tables'],
  },
  tableau: {
    id: 'tableau', label: 'Tableau', description: 'Analysis-friendly visual structure with trend pairings',
    compatibleCharts: ['kpi', 'trend', 'bar', 'donut', 'table', 'sparkline'],
    compatibleCardPresets: ['modern-analytics', 'insight-kpi', 'comparative-kpi', 'executive-tile'],
    layoutRules: { maxColumns: 8, preferredKpiPerRow: 4, maxWidgetsPerDashboard: 16, supportsMergedCells: false, supportsAnimation: false, supportsInteractivity: true },
    readabilityGuidelines: ['Use analysis-friendly visual structure', 'Pair KPIs with trend lines', 'Include insight panels', 'Design comparative card layouts'],
    sectionLayout: ['kpi-trend-pairs', 'analysis-charts', 'insight-panel', 'data-tables'],
  },
  'json-api': {
    id: 'json-api', label: 'JSON / API', description: 'Structured output for custom API integration',
    compatibleCharts: ['kpi', 'bar', 'trend', 'table'],
    compatibleCardPresets: ['clean-corporate', 'compact-grid'],
    layoutRules: { maxColumns: 12, preferredKpiPerRow: 4, maxWidgetsPerDashboard: 20, supportsMergedCells: false, supportsAnimation: false, supportsInteractivity: false },
    readabilityGuidelines: ['Optimize for structured data output', 'Include metadata for each widget', 'Use standard chart type identifiers'],
    sectionLayout: ['kpi-row', 'charts', 'data-tables'],
  },
};

export const TOOL_LIST = Object.values(TOOL_PROFILES);

export function getToolProfile(tool: ToolTarget): ToolProfile {
  return TOOL_PROFILES[tool] || TOOL_PROFILES.webapp;
}

export const TOOL_LABELS: Record<ToolTarget, string> = {
  webapp: 'ChainInsideIQ Web App',
  excel: 'Microsoft Excel',
  'google-sheets': 'Google Sheets',
  'power-bi': 'Power BI',
  tableau: 'Tableau',
  'json-api': 'JSON Spec / Custom API',
};
