export interface GenerationRequest {
  sector: string;
  goal: string;
  tool: string;
  style: string;
  kpiPriorities: string[];
  dataContext: string;
  density: string;
  aiHelpLevel: string;
  businessStructure?: string;
  sectors?: string[];
  dataSharing?: boolean;
}

export interface EnhancementRequest {
  sector: string;
  currentTool: string;
  targetTool: string;
  improvements: string[];
  keepKpis: boolean;
  designStyle: string;
  existingWidgets?: any[];
  existingLayout?: any;
}

export interface GeneratedWidget {
  id: string;
  type: string;
  title: string;
  metricIndex: number;
  kpiId?: string;
  chartType?: string;
  cardPreset?: string;
  showDelta?: boolean;
  showSparkline?: boolean;
  showTarget?: boolean;
  description?: string;
}

export interface GeneratedLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardGenerationResult {
  title: string;
  subtitle: string;
  sector: string;
  toolTarget: string;
  widgets: GeneratedWidget[];
  layout: GeneratedLayout[];
  aiSummary?: string;
  cardPreset: string;
  style: string;
}

export interface AIProviderBase {
  generateDashboard(request: GenerationRequest): Promise<DashboardGenerationResult>;
  enhanceDashboard(request: EnhancementRequest): Promise<DashboardGenerationResult>;
}
