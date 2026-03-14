interface CsvExportInput {
  metrics: any[];
  chartData?: any[];
  sector?: string;
  dateRange?: string;
}

export function generateCsvExport(input: CsvExportInput): string {
  const { metrics, chartData } = input;
  const lines: string[] = [];

  lines.push('Section,Label,Value,Trend,Direction,Help Text');
  for (const m of metrics) {
    const direction = m.isPositive ? 'Positive' : 'Negative';
    lines.push([
      'KPI',
      `"${m.label}"`,
      `"${m.value}"`,
      `"${m.trend}"`,
      direction,
      `"${(m.helpText || '').replace(/"/g, '""')}"`
    ].join(','));
  }

  if (chartData && Array.isArray(chartData) && chartData.length > 0) {
    lines.push('');
    lines.push('Period,Actual,Forecast,Lower Bound,Upper Bound');
    for (const d of chartData) {
      lines.push([
        `"${d.name}"`,
        d.value ?? '',
        d.forecast ?? '',
        d.lower ?? '',
        d.upper ?? ''
      ].join(','));
    }
  }

  return lines.join('\n');
}