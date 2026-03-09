import { DashboardSpec, WidgetSpec } from '../dashboard-spec';

export interface RenderContext {
  spec: DashboardSpec;
  theme: ThemeConfig;
  data: Record<string, any>; // The hydrated data for widgets
}

export interface RenderResult {
  success: boolean;
  output: any; // Format-specific output (e.g., ArrayBuffer for Excel, string for PDF)
  errors?: string[];
}

export interface BaseRenderer {
  /**
   * Initializes the renderer with the target dashboard specification.
   */
  initialize(context: RenderContext): Promise<void>;
  
  /**
   * Renders the complete dashboard to the target format.
   */
  render(): Promise<RenderResult>;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontFamily: string;
  chartColors: string[];
  cardBackground: string;
  textColor: string;
  borderColor: string;
}

export interface RenderInstruction {
  widgetId: string;
  type: string;
  data: any;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    preset: string;
    badgeColor?: string;
  };
}