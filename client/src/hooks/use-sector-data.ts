import { useDashboardStore, Sector, DateRange } from "@/hooks/use-dashboard-store";

export interface Metric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  helpText: string;
}

export const useSectorData = () => {
  const { selectedSector, selectedRange } = useDashboardStore();

  const getMetrics = (): Metric[] => {
    // Simulate backend response variations based on date range
    const rangeMultiplier = selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25;
    
    const formatValue = (baseValue: number, prefix = '', suffix = '') => {
      const val = Math.round(baseValue * rangeMultiplier);
      return `${prefix}${val.toLocaleString()}${suffix}`;
    };

    switch (selectedSector) {
      case 'ecommerce':
        return [
          { label: 'Revenue', value: formatValue(124500, '$'), trend: '+12.5%', isPositive: true, helpText: 'Total sales revenue for the period' },
          { label: 'Conversion Rate', value: formatValue(3.2, '', '%'), trend: '+0.4%', isPositive: true, helpText: 'Percentage of visitors who purchased' },
          { label: 'AOV', value: '$84.20', trend: '-2.1%', isPositive: false, helpText: 'Average Order Value' },
          { label: 'Returns Rate', value: '4.1%', trend: '-0.5%', isPositive: true, helpText: 'Percentage of orders returned' },
        ];
      case 'logistics':
        return [
          { label: 'On-Time Delivery', value: '94.2%', trend: '+1.8%', isPositive: true, helpText: 'Orders delivered within promised window' },
          { label: 'Shipments', value: formatValue(8432), trend: '+5.2%', isPositive: true, helpText: 'Total number of shipments processed' },
          { label: 'Cost per Shipment', value: '$12.40', trend: '-0.80', isPositive: true, helpText: 'Average shipping cost per unit' },
          { label: 'Warehouse Util.', value: '88%', trend: '+2%', isPositive: false, helpText: 'Percentage of storage capacity used' },
        ];
      case 'manufacturing':
        return [
          { label: 'Units Produced', value: formatValue(42000), trend: '+8.4%', isPositive: true, helpText: 'Total units manufactured' },
          { label: 'Defect Rate', value: '0.8%', trend: '-0.2%', isPositive: true, helpText: 'Percentage of units failing QC' },
          { label: 'Downtime', value: formatValue(14, '', 'h'), trend: '-4h', isPositive: true, helpText: 'Total machine non-productive time' },
          { label: 'Yield', value: '98.2%', trend: '+0.5%', isPositive: true, helpText: 'Ratio of usable product to raw material' },
        ];
      default:
        return [
          { label: 'Perfect Order Rate', value: '98.4%', trend: '+1.2%', isPositive: true, helpText: 'Orders meeting all delivery criteria' },
          { label: 'Cash-to-Cash', value: '14 Days', trend: '-2 Days', isPositive: true, helpText: 'Time between paying suppliers and receiving customer cash' },
          { label: 'ATP Accuracy', value: '94.2%', trend: '+0.8%', isPositive: true, helpText: 'Available-to-Promise projection precision' },
          { label: 'Bullwhip Index', value: '1.12', trend: '-0.05', isPositive: true, helpText: 'Supply chain demand amplification factor' },
        ];
    }
  };

  const getChartData = () => {
    // Return variations based on sector and range
    const base = [
      { name: 'Mon', value: 4000 },
      { name: 'Tue', value: 3000 },
      { name: 'Wed', value: 2000 },
      { name: 'Thu', value: 2780 },
      { name: 'Fri', value: 1890 },
      { name: 'Sat', value: 2390 },
      { name: 'Sun', value: 3490 },
    ];
    
    const multipliers: Record<Sector, number> = {
      ecommerce: 1.5,
      logistics: 0.8,
      manufacturing: 1.2,
      unified: 1.0
    };

    const rangeMultiplier = selectedRange === '90d' ? 3 : selectedRange === '30d' ? 1 : 0.25;

    return base.map(d => ({ ...d, value: Math.round(d.value * multipliers[selectedSector] * rangeMultiplier) }));
  };

  return {
    metrics: getMetrics(),
    chartData: getChartData(),
    sector: selectedSector,
    dateRange: selectedRange
  };
};
