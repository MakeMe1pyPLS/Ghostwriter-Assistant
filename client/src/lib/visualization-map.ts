export const getRecommendedVisualization = (metricName: string): { type: string, chartType?: string } => {
  if (!metricName) return { type: 'kpi' };
  
  const name = metricName.toLowerCase();
  
  // Rules based on KPI name characteristics
  if (name.includes('revenue') || name.includes('sales')) {
    return { type: 'trend', chartType: 'area' };
  }
  
  if (name.includes('order') || name.includes('volume')) {
    return { type: 'bar', chartType: 'bar' };
  }
  
  if (name.includes('rate') || name.includes('utilization') || name.includes('yield') || name.includes('accuracy') || name.includes('margin')) {
    return { type: 'trend', chartType: 'line' };
  }
  
  if (name.includes('cost') || name.includes('value') || name.includes('time') || name.includes('cycle')) {
    return { type: 'trend', chartType: 'bar' };
  }
  
  // Default fallback
  return { type: 'kpi' };
};