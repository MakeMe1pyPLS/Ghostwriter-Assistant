interface JsonExportInput {
  sector?: string;
  dateRange?: string;
  widgets?: any[];
  layouts?: any;
  metrics?: any[];
  chartData?: any[];
  donutData?: any[];
  theme?: any;
}

export function generateJsonExport(input: JsonExportInput): object {
  const { sector, dateRange, widgets, layouts, metrics, chartData, donutData, theme } = input;

  return {
    meta: {
      platform: 'ChainInsideIQ',
      version: '1.0',
      export_type: 'dashboard_spec',
      generated_at: new Date().toISOString(),
      sector: sector || 'unified',
      date_range: dateRange || '30d'
    },
    dashboard: {
      widgets: (widgets || []).map((w: any) => ({
        id: w.id,
        type: w.type,
        title: w.title || w.type,
        metricIndex: w.metricIndex,
        chartType: w.chartType,
        isAI: ['insights', 'chat', 'forecast', 'summary'].includes(w.type),
        settings: w.settings || {}
      })),
      layout: layouts || {},
      visualization_types: [...new Set((widgets || []).map((w: any) => w.type))],
    },
    data_snapshot: {
      metrics: metrics || [],
      chart_data: chartData || [],
      donut_data: donutData || []
    },
    theme: theme || { mode: 'light', primary: '#0F766E' }
  };
}