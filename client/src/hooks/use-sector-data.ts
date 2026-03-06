import { useDashboardStore, Sector, DateRange } from "@/hooks/use-dashboard-store";

export interface Metric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  helpText: string;
  category: Sector;
}

export const getAllMetrics = (rangeMultiplier: number): Metric[] => {
  const formatValue = (baseValue: number, prefix = '', suffix = '') => {
    const val = Math.round(baseValue * rangeMultiplier);
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  return [
    // E-commerce
    { category: 'ecommerce', label: 'Revenue', value: formatValue(124500, '$'), trend: '+12.5%', isPositive: true, helpText: 'Total sales revenue for the period' },
    { category: 'ecommerce', label: 'Orders', value: formatValue(1450), trend: '+8.2%', isPositive: true, helpText: 'Total number of orders placed' },
    { category: 'ecommerce', label: 'AOV', value: '$84.20', trend: '-2.1%', isPositive: false, helpText: 'Average Order Value' },
    { category: 'ecommerce', label: 'Conversion Rate', value: '3.2%', trend: '+0.4%', isPositive: true, helpText: 'Percentage of visitors who purchased' },
    { category: 'ecommerce', label: 'ROAS', value: '4.5x', trend: '+0.2x', isPositive: true, helpText: 'Return on Ad Spend' },
    { category: 'ecommerce', label: 'Returns Rate', value: '4.1%', trend: '-0.5%', isPositive: true, helpText: 'Percentage of orders returned' },
    
    // Logistics
    { category: 'logistics', label: 'On-Time Delivery', value: '94.2%', trend: '+1.8%', isPositive: true, helpText: 'Orders delivered within promised window' },
    { category: 'logistics', label: 'Late Shipments', value: formatValue(48), trend: '-12%', isPositive: true, helpText: 'Shipments that missed delivery window' },
    { category: 'logistics', label: 'Cost per Shipment', value: '$12.40', trend: '-$0.80', isPositive: true, helpText: 'Average shipping cost per unit' },
    { category: 'logistics', label: 'Transit Time', value: '2.4 Days', trend: '-0.2 Days', isPositive: true, helpText: 'Average time from dispatch to delivery' },
    { category: 'logistics', label: 'Warehouse Utilization', value: '88%', trend: '+2%', isPositive: false, helpText: 'Percentage of storage capacity used' },
    { category: 'logistics', label: 'Shipment Volume', value: formatValue(8432), trend: '+5.2%', isPositive: true, helpText: 'Total number of shipments processed' },

    // Manufacturing
    { category: 'manufacturing', label: 'Units Produced', value: formatValue(42000), trend: '+8.4%', isPositive: true, helpText: 'Total units manufactured' },
    { category: 'manufacturing', label: 'Throughput', value: formatValue(1750, '', '/day'), trend: '+45/day', isPositive: true, helpText: 'Average production rate' },
    { category: 'manufacturing', label: 'Defect Rate', value: '0.8%', trend: '-0.2%', isPositive: true, helpText: 'Percentage of units failing QC' },
    { category: 'manufacturing', label: 'Downtime', value: formatValue(14, '', 'h'), trend: '-4h', isPositive: true, helpText: 'Total machine non-productive time' },
    { category: 'manufacturing', label: 'Yield', value: '98.2%', trend: '+0.5%', isPositive: true, helpText: 'Ratio of usable product to raw material' },
    { category: 'manufacturing', label: 'Capacity Utilization', value: '82%', trend: '+1.5%', isPositive: true, helpText: 'Percentage of manufacturing potential used' },

    // Unified Bridge
    { category: 'unified', label: 'Perfect Order Rate', value: '98.4%', trend: '+1.2%', isPositive: true, helpText: 'Orders meeting all delivery criteria' },
    { category: 'unified', label: 'Cash-to-Cash Cycle', value: '14 Days', trend: '-2 Days', isPositive: true, helpText: 'Time between paying suppliers and receiving customer cash' },
    { category: 'unified', label: 'ATP Accuracy', value: '94.2%', trend: '+0.8%', isPositive: true, helpText: 'Available-to-Promise projection precision' },
    { category: 'unified', label: 'Bullwhip Index', value: '1.12', trend: '-0.05', isPositive: true, helpText: 'Supply chain demand amplification factor' },
  ];
};

export const useSectorData = () => {
  const { selectedSector, selectedRange, importedData } = useDashboardStore();

  const getMetrics = (): Metric[] => {
    const rangeMultiplier = selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25;
    const allMetrics = getAllMetrics(rangeMultiplier);

    // If custom, just return unified as a baseline since custom lets them mix and match anyway
    if (selectedSector === 'custom') {
       if (importedData && importedData.length > 0) {
          // If we have imported data, try to create some dummy metrics from its headers
          const firstRow = importedData[0];
          const keys = Object.keys(firstRow).slice(0, 4);
          return keys.map((key) => ({
             category: 'custom',
             label: key,
             value: String(firstRow[key]),
             trend: '+0%',
             isPositive: true,
             helpText: `Imported data column: ${key}`
          }));
       }
       return allMetrics.filter(m => m.category === 'unified');
    }

    return allMetrics.filter(m => m.category === selectedSector);
  };

  const getChartData = () => {
    // If we have imported data and custom sector, try to plot it
    if (selectedSector === 'custom' && importedData && importedData.length > 0) {
        const firstNumericKey = Object.keys(importedData[0]).find(key => !isNaN(Number(importedData[0][key])));
        const firstStringKey = Object.keys(importedData[0]).find(key => isNaN(Number(importedData[0][key])));
        
        if (firstNumericKey && firstStringKey) {
            return importedData.slice(0, 30).map((row, i) => ({
                name: String(row[firstStringKey] || `Row ${i}`),
                value: Number(row[firstNumericKey]) || 0
            }));
        }
    }

    const base = [
      { name: 'Mon', value: 4000 },
      { name: 'Tue', value: 3000 },
      { name: 'Wed', value: 2000 },
      { name: 'Thu', value: 2780 },
      { name: 'Fri', value: 1890 },
      { name: 'Sat', value: 2390 },
      { name: 'Sun', value: 3490 },
    ];
    
    const multipliers: Record<string, number> = {
      ecommerce: 1.5,
      logistics: 0.8,
      manufacturing: 1.2,
      unified: 1.0,
      custom: 1.0
    };

    const rangeMultiplier = selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25;
    const multi = multipliers[selectedSector] || 1.0;

    return base.map(d => ({ ...d, value: Math.round(d.value * multi * rangeMultiplier) }));
  };

  return {
    metrics: getMetrics(),
    allMetrics: getAllMetrics(selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25),
    chartData: getChartData(),
    sector: selectedSector,
    dateRange: selectedRange,
    hasImportedData: !!importedData && importedData.length > 0
  };
};