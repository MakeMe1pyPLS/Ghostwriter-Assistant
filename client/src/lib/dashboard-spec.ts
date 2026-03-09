/**
 * Dashboard Spec Engine
 * Provides the schema and mappers for converting a visual dashboard
 * into a portable JSON blueprint.
 */

export interface WidgetSpec {
  id: string;
  type: 'kpi' | 'trend' | 'bar' | 'donut' | 'pie' | 'progress' | 'table' | 'chat' | 'summary' | 'forecast' | string;
  
  // Data binding
  metricId?: string;
  dataSource?: 'demo' | 'live' | 'imported';
  aggregation?: 'sum' | 'avg' | 'max' | 'min';
  dateRangeOverride?: string;
  
  // Visual config
  title?: string;
  description?: string;
  stylePreset?: 'soft' | 'corporate' | 'elevated' | 'executive' | 'compact';
  badgeColor?: 'default' | 'teal' | 'blue' | 'indigo' | 'rose';
  chartType?: string; // override for visualization renderer
  
  // Feature flags
  showDelta?: boolean;
  showSparkline?: boolean;
  showTarget?: boolean;
  showActions?: boolean; // AI specific
  showForecastNote?: boolean; // AI specific
  
  // Layout parameters for various breakpoints (standardized to 12-col grid)
  layout: {
    lg?: { x: number, y: number, w: number, h: number };
    md?: { x: number, y: number, w: number, h: number };
    sm?: { x: number, y: number, w: number, h: number };
  };
}

export interface DashboardSpec {
  version: "1.0.0";
  meta: {
    id: string;
    title: string;
    sectorContext: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  globalConfig: {
    theme: 'light' | 'dark' | 'system';
    dateRange: string;
    primaryColor: string;
  };
  widgets: WidgetSpec[];
}

/**
 * Maps current builder state (separate layouts and widgets arrays)
 * into a unified DashboardSpec
 */
export function buildSpecFromState(
  title: string,
  sector: string, 
  widgets: any[], 
  layouts: Record<string, any[]>
): DashboardSpec {
  const specWidgets: WidgetSpec[] = widgets.map(w => {
    // Find layouts for this specific widget across all breakpoints
    const widgetLayouts: any = {};
    
    Object.keys(layouts).forEach(breakpoint => {
      const breakpointLayout = layouts[breakpoint];
      if (breakpointLayout) {
        const itemLayout = breakpointLayout.find((l: any) => l.i === w.id);
        if (itemLayout) {
          widgetLayouts[breakpoint] = {
            x: itemLayout.x,
            y: itemLayout.y,
            w: itemLayout.w,
            h: itemLayout.h
          };
        }
      }
    });

    return {
      id: w.id,
      type: w.type,
      metricId: w.customMetricId || w.metricIndex?.toString(), // Fallback for backwards compat
      dataSource: w.dataSource || 'demo',
      aggregation: w.aggregation || 'sum',
      dateRangeOverride: w.dateRange,
      
      title: w.title,
      description: w.description,
      stylePreset: w.stylePreset,
      badgeColor: w.badgeColor,
      chartType: w.chartType,
      
      showDelta: w.showDelta,
      showSparkline: w.showSparkline,
      showTarget: w.showTarget,
      showActions: w.showActions,
      showForecastNote: w.showForecastNote,
      
      layout: widgetLayouts
    };
  });

  return {
    version: "1.0.0",
    meta: {
      id: `dash-${Date.now()}`,
      title: title,
      sectorContext: sector,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    globalConfig: {
      theme: 'light',
      dateRange: '30d',
      primaryColor: 'teal'
    },
    widgets: specWidgets
  };
}

/**
 * Maps a DashboardSpec back into the builder's separated state structure
 */
export function buildStateFromSpec(spec: DashboardSpec): { widgets: any[], layouts: Record<string, any[]> } {
  const layouts: Record<string, any[]> = { lg: [], md: [], sm: [] };
  
  const widgets = spec.widgets.map(w => {
    // Reconstruct the layout item for each breakpoint
    Object.entries(w.layout).forEach(([breakpoint, layoutParams]) => {
      if (!layouts[breakpoint]) layouts[breakpoint] = [];
      layouts[breakpoint].push({
        i: w.id,
        ...layoutParams
      });
    });

    // We assume layout.lg is present as a fallback for the main grid if md/sm are empty
    if (w.layout.lg && (!layouts.md || layouts.md.length === 0)) {
        // Simple fallback mapping for missing breakpoints can go here
    }

    return {
      id: w.id,
      type: w.type,
      customMetricId: isNaN(Number(w.metricId)) ? w.metricId : undefined,
      metricIndex: !isNaN(Number(w.metricId)) ? Number(w.metricId) : 0,
      dataSource: w.dataSource,
      aggregation: w.aggregation,
      dateRange: w.dateRangeOverride,
      
      title: w.title,
      description: w.description,
      stylePreset: w.stylePreset,
      badgeColor: w.badgeColor,
      chartType: w.chartType,
      
      showDelta: w.showDelta,
      showSparkline: w.showSparkline,
      showTarget: w.showTarget,
      showActions: w.showActions,
      showForecastNote: w.showForecastNote,
    };
  });

  return { widgets, layouts };
}

/**
 * Helper to download the spec as a JSON file
 */
export function downloadSpecJson(spec: DashboardSpec, filename?: string) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename || `${spec.meta.id}-blueprint.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
