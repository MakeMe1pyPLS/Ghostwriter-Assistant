import { useMemo } from "react";
import { useDashboardStore, Sector } from "@/hooks/use-dashboard-store";

export interface Metric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  helpText: string;
  category: Sector;
}

const BASE_CHART_DATA = [
  { name: 'Jan 1', value: 4000, forecast: null, lower: null, upper: null },
  { name: 'Jan 2', value: 3000, forecast: null, lower: null, upper: null },
  { name: 'Jan 3', value: 2000, forecast: null, lower: null, upper: null },
  { name: 'Jan 4', value: 2780, forecast: null, lower: null, upper: null },
  { name: 'Jan 5', value: 1890, forecast: null, lower: null, upper: null },
  { name: 'Jan 6', value: 2390, forecast: null, lower: null, upper: null },
  { name: 'Jan 7', value: 3490, forecast: null, lower: null, upper: null },
  { name: 'Jan 8', value: null, forecast: 3600, lower: 3200, upper: 4000 },
  { name: 'Jan 9', value: null, forecast: 3800, lower: 3300, upper: 4300 },
  { name: 'Jan 10', value: null, forecast: 4100, lower: 3500, upper: 4700 },
  { name: 'Jan 11', value: null, forecast: 4300, lower: 3600, upper: 5000 },
  { name: 'Jan 12', value: null, forecast: 4000, lower: 3300, upper: 4700 },
  { name: 'Jan 13', value: null, forecast: 4200, lower: 3400, upper: 5000 },
  { name: 'Jan 14', value: null, forecast: 4500, lower: 3600, upper: 5400 },
];

const SECTOR_MULTIPLIERS: Record<string, number> = {
  ecommerce: 1.5,
  logistics: 0.8,
  manufacturing: 1.2,
  unified: 1.0,
  custom: 1.0,
};

const DONUT_DATA = [
  { name: 'Direct Sales', value: 48, absolute: 420000, fill: '#0F766E' },
  { name: 'Distributor', value: 27, absolute: 236000, fill: '#14B8A6' },
  { name: 'Retail', value: 25, absolute: 218000, fill: '#2DD4BF' },
];

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

  const rangeMultiplier = useMemo(
    () => (selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25),
    [selectedRange]
  );

  const allMetrics = useMemo(() => getAllMetrics(rangeMultiplier), [rangeMultiplier]);

  const metrics = useMemo((): Metric[] => {
    if (selectedSector === 'custom') {
      if (importedData && importedData.length > 0) {
        const firstRow = importedData[0];
        const keys = Object.keys(firstRow).slice(0, 4);
        return keys.map((key) => ({
          category: 'custom' as Sector,
          label: key,
          value: String(firstRow[key]),
          trend: '+0%',
          isPositive: true,
          helpText: `Imported data column: ${key}`,
        }));
      }
      return allMetrics.filter(m => m.category === 'unified');
    }
    return allMetrics.filter(m => m.category === selectedSector);
  }, [selectedSector, allMetrics, importedData]);

  const chartData = useMemo(() => {
    if (selectedSector === 'custom' && importedData && importedData.length > 0) {
      const firstNumericKey = Object.keys(importedData[0]).find(key => !isNaN(Number(importedData[0][key])));
      const firstStringKey = Object.keys(importedData[0]).find(key => isNaN(Number(importedData[0][key])));
      if (firstNumericKey && firstStringKey) {
        return importedData.slice(0, 30).map((row, i) => ({
          name: String(row[firstStringKey] || `Row ${i}`),
          value: Number(row[firstNumericKey]) || 0,
        }));
      }
    }
    const multi = SECTOR_MULTIPLIERS[selectedSector] ?? 1.0;
    return BASE_CHART_DATA.map(d => ({
      ...d,
      value: d.value != null ? Math.round(d.value * multi * rangeMultiplier) : null,
      forecast: d.forecast != null ? Math.round(d.forecast * multi * rangeMultiplier) : null,
      lower: d.lower != null ? Math.round(d.lower * multi * rangeMultiplier) : null,
      upper: d.upper != null ? Math.round(d.upper * multi * rangeMultiplier) : null,
    }));
  }, [selectedSector, importedData, rangeMultiplier]);

  const hasImportedData = useMemo(
    () => !!importedData && importedData.length > 0,
    [importedData]
  );

  return {
    metrics,
    allMetrics,
    chartData,
    donutData: DONUT_DATA,
    sector: selectedSector,
    dateRange: selectedRange,
    hasImportedData,
  };
};
