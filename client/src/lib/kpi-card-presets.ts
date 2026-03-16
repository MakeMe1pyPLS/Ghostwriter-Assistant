export type CardPresetId = 'clean-corporate' | 'executive-tile' | 'modern-analytics' | 'compact-grid' | 'ops-scorecard' | 'minimal-readout' | 'insight-kpi' | 'comparative-kpi';

export interface CardPresetConfig {
  id: CardPresetId;
  name: string;
  description: string;
  titlePlacement: 'top' | 'top-left' | 'bottom';
  subtitlePlacement: 'below-title' | 'above-value' | 'hidden';
  valueEmphasis: 'xl' | 'lg' | 'md' | 'sm';
  deltaPosition: 'inline' | 'below-value' | 'top-right' | 'hidden';
  iconVisible: boolean;
  iconPosition: 'top-left' | 'top-right' | 'inline' | 'hidden';
  borderStyle: 'none' | 'subtle' | 'left-accent' | 'top-accent' | 'full';
  backgroundStyle: 'white' | 'subtle-gradient' | 'tinted' | 'dark';
  accentStrip: boolean;
  accentPosition: 'left' | 'top' | 'bottom' | 'none';
  sparklineVisible: boolean;
  benchmarkVisible: boolean;
  comparisonLabelVisible: boolean;
  statusBadgeVisible: boolean;
  shadowIntensity: 'none' | 'sm' | 'md' | 'lg';
  borderRadius: 'sm' | 'md' | 'lg' | 'xl';
  density: 'compact' | 'standard' | 'spacious';
  alignment: 'left' | 'center';
}

export const CARD_PRESETS: Record<CardPresetId, CardPresetConfig> = {
  'clean-corporate': {
    id: 'clean-corporate', name: 'Clean Corporate', description: 'Professional, balanced layout with clear hierarchy',
    titlePlacement: 'top-left', subtitlePlacement: 'below-title', valueEmphasis: 'lg', deltaPosition: 'inline',
    iconVisible: true, iconPosition: 'top-right', borderStyle: 'subtle', backgroundStyle: 'white',
    accentStrip: false, accentPosition: 'none', sparklineVisible: false, benchmarkVisible: false,
    comparisonLabelVisible: true, statusBadgeVisible: false, shadowIntensity: 'sm', borderRadius: 'lg',
    density: 'standard', alignment: 'left',
  },
  'executive-tile': {
    id: 'executive-tile', name: 'Executive Tile', description: 'Bold, high-impact tiles for leadership dashboards',
    titlePlacement: 'top-left', subtitlePlacement: 'hidden', valueEmphasis: 'xl', deltaPosition: 'below-value',
    iconVisible: true, iconPosition: 'top-right', borderStyle: 'none', backgroundStyle: 'subtle-gradient',
    accentStrip: true, accentPosition: 'left', sparklineVisible: false, benchmarkVisible: true,
    comparisonLabelVisible: true, statusBadgeVisible: true, shadowIntensity: 'md', borderRadius: 'xl',
    density: 'spacious', alignment: 'left',
  },
  'modern-analytics': {
    id: 'modern-analytics', name: 'Modern Analytics', description: 'Data-forward design with sparklines and trends',
    titlePlacement: 'top-left', subtitlePlacement: 'below-title', valueEmphasis: 'lg', deltaPosition: 'inline',
    iconVisible: false, iconPosition: 'hidden', borderStyle: 'subtle', backgroundStyle: 'white',
    accentStrip: false, accentPosition: 'none', sparklineVisible: true, benchmarkVisible: true,
    comparisonLabelVisible: true, statusBadgeVisible: false, shadowIntensity: 'sm', borderRadius: 'lg',
    density: 'standard', alignment: 'left',
  },
  'compact-grid': {
    id: 'compact-grid', name: 'Compact Grid', description: 'Dense, efficient layout for ops dashboards',
    titlePlacement: 'top-left', subtitlePlacement: 'hidden', valueEmphasis: 'md', deltaPosition: 'inline',
    iconVisible: false, iconPosition: 'hidden', borderStyle: 'subtle', backgroundStyle: 'white',
    accentStrip: false, accentPosition: 'none', sparklineVisible: false, benchmarkVisible: false,
    comparisonLabelVisible: false, statusBadgeVisible: false, shadowIntensity: 'none', borderRadius: 'md',
    density: 'compact', alignment: 'left',
  },
  'ops-scorecard': {
    id: 'ops-scorecard', name: 'Ops Scorecard', description: 'Operations-focused with status badges and targets',
    titlePlacement: 'top-left', subtitlePlacement: 'below-title', valueEmphasis: 'lg', deltaPosition: 'top-right',
    iconVisible: true, iconPosition: 'inline', borderStyle: 'left-accent', backgroundStyle: 'white',
    accentStrip: true, accentPosition: 'left', sparklineVisible: false, benchmarkVisible: true,
    comparisonLabelVisible: true, statusBadgeVisible: true, shadowIntensity: 'sm', borderRadius: 'lg',
    density: 'standard', alignment: 'left',
  },
  'minimal-readout': {
    id: 'minimal-readout', name: 'Minimal Readout', description: 'Ultra-clean, distraction-free metric display',
    titlePlacement: 'top-left', subtitlePlacement: 'hidden', valueEmphasis: 'xl', deltaPosition: 'below-value',
    iconVisible: false, iconPosition: 'hidden', borderStyle: 'none', backgroundStyle: 'white',
    accentStrip: false, accentPosition: 'none', sparklineVisible: false, benchmarkVisible: false,
    comparisonLabelVisible: false, statusBadgeVisible: false, shadowIntensity: 'none', borderRadius: 'lg',
    density: 'spacious', alignment: 'center',
  },
  'insight-kpi': {
    id: 'insight-kpi', name: 'Insight KPI Card', description: 'KPI with contextual insight text and AI annotation',
    titlePlacement: 'top-left', subtitlePlacement: 'below-title', valueEmphasis: 'lg', deltaPosition: 'inline',
    iconVisible: true, iconPosition: 'top-right', borderStyle: 'subtle', backgroundStyle: 'tinted',
    accentStrip: true, accentPosition: 'top', sparklineVisible: true, benchmarkVisible: true,
    comparisonLabelVisible: true, statusBadgeVisible: true, shadowIntensity: 'md', borderRadius: 'xl',
    density: 'standard', alignment: 'left',
  },
  'comparative-kpi': {
    id: 'comparative-kpi', name: 'Comparative KPI Card', description: 'Side-by-side comparison with target vs actual',
    titlePlacement: 'top', subtitlePlacement: 'above-value', valueEmphasis: 'lg', deltaPosition: 'inline',
    iconVisible: true, iconPosition: 'top-left', borderStyle: 'top-accent', backgroundStyle: 'white',
    accentStrip: true, accentPosition: 'top', sparklineVisible: false, benchmarkVisible: true,
    comparisonLabelVisible: true, statusBadgeVisible: true, shadowIntensity: 'sm', borderRadius: 'lg',
    density: 'standard', alignment: 'center',
  },
};

export const CARD_PRESET_LIST = Object.values(CARD_PRESETS);

export function getPreset(id: CardPresetId): CardPresetConfig {
  return CARD_PRESETS[id] || CARD_PRESETS['clean-corporate'];
}

export function getPresetsForTool(tool: string): CardPresetId[] {
  const toolPresets: Record<string, CardPresetId[]> = {
    'webapp': ['executive-tile', 'modern-analytics', 'insight-kpi', 'clean-corporate', 'ops-scorecard', 'compact-grid', 'minimal-readout', 'comparative-kpi'],
    'excel': ['clean-corporate', 'compact-grid', 'executive-tile', 'ops-scorecard'],
    'google-sheets': ['clean-corporate', 'compact-grid', 'minimal-readout'],
    'power-bi': ['executive-tile', 'ops-scorecard', 'comparative-kpi', 'insight-kpi'],
    'tableau': ['modern-analytics', 'insight-kpi', 'comparative-kpi', 'executive-tile'],
    'json-api': ['clean-corporate', 'compact-grid'],
  };
  return toolPresets[tool] || toolPresets['webapp'];
}
