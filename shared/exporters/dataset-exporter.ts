interface DatasetExportInput {
  metrics: any[];
  chartData?: any[];
  donutData?: any[];
  sector?: string;
  dateRange?: string;
}

export function generateDatasetExport(input: DatasetExportInput): object {
  const { metrics, chartData, donutData, sector, dateRange } = input;

  return {
    meta: {
      platform: 'ChainInsideIQ',
      export_type: 'dataset',
      generated_at: new Date().toISOString(),
      sector: sector || 'unified',
      date_range: dateRange || '30d',
      record_counts: {
        metrics: (metrics || []).length,
        timeseries: (chartData || []).length,
        channels: (donutData || []).length
      }
    },
    metrics: (metrics || []).map((m: any) => ({
      label: m.label,
      value: m.value,
      trend: m.trend,
      direction: m.isPositive ? 'up' : 'down',
      category: m.category || sector || 'unified',
      help_text: m.helpText || ''
    })),
    timeseries: (chartData || []).map((d: any) => ({
      period: d.name,
      actual: d.value,
      forecast: d.forecast,
      lower_bound: d.lower,
      upper_bound: d.upper
    })),
    channels: (donutData || []).map((d: any) => ({
      name: d.name,
      percentage: d.value,
      absolute: d.absolute
    }))
  };
}

export function generateDatasetCsv(input: DatasetExportInput): string {
  const { metrics, chartData, donutData, sector } = input;
  const lines: string[] = [];

  lines.push('Category,Label,Value,Trend,Direction');
  for (const m of metrics) {
    lines.push([
      `"${m.category || sector || 'unified'}"`,
      `"${m.label}"`,
      `"${m.value}"`,
      `"${m.trend}"`,
      m.isPositive ? 'Up' : 'Down'
    ].join(','));
  }

  if (chartData && chartData.length > 0) {
    lines.push('');
    lines.push('Period,Actual,Forecast,Lower,Upper');
    for (const d of chartData) {
      lines.push([`"${d.name}"`, d.value ?? '', d.forecast ?? '', d.lower ?? '', d.upper ?? ''].join(','));
    }
  }

  if (donutData && donutData.length > 0) {
    lines.push('');
    lines.push('Channel,Percentage,Absolute Value');
    for (const d of donutData) {
      lines.push([`"${d.name}"`, d.value, d.absolute ?? ''].join(','));
    }
  }

  return lines.join('\n');
}