import { useState, useMemo, useCallback } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  ChevronUp, ChevronDown, ChevronsUpDown, Target, Users, MapPin, Package,
  BarChart3, Globe, Layers, ShieldAlert, Zap
} from "lucide-react";

type SortDir = 'asc' | 'desc' | null;

const SECTOR_AI_INSIGHTS: Record<string, {
  kpi: string;
  product: string;
  region: string;
  heatmap: string;
  pivot: string;
}> = {
  ecommerce: {
    kpi: "Revenue is up 18.4% — Electronics and Paid Search are the primary growth drivers. Cart abandonment remains a high-priority risk, particularly on mobile.",
    product: "Electronics leads in score and revenue, but Accessories shows the lowest performance with high returns. Consider category-specific retention strategies.",
    region: "North East outperforms all regions in conversion rate and LTV. International revenue grew 41% and merits further investment.",
    heatmap: "Accessories scores below 60 across multiple KPIs. Apparel's return rate is the worst performing metric — a targeted intervention is recommended.",
    pivot: "Social channel is the fastest growing with Apparel up 38%. Direct Electronics channel remains the highest absolute revenue contributor.",
  },
  logistics: {
    kpi: "On-time delivery improved 1.8% this period. However, Cost per Shipment rose $1.20 from fuel surcharges, and damaged goods increased — both require attention.",
    product: "LA→NY route leads across all metrics. DEN→PHX shows the lowest score at 68 — on-time rate and cost per unit both need improvement.",
    region: "Express Hub is the standout performer (A+ rating) despite highest utilization at 96%. South Hub has the most incidents and lowest on-time rate.",
    heatmap: "Express Hub scores highest across all 5 KPIs. South Hub's capacity utilization and cost efficiency are the weakest areas in the network.",
    pivot: "Ground Standard shipments dominate volume. Air Priority is growing fastest at +18%. FTL freight declined 8% — review contract terms.",
  },
  manufacturing: {
    kpi: "Production exceeded target by 8.4%, led by Line B. OEE decline on Line C is the primary risk — 8.6 hours of downtime requires root cause investigation.",
    product: "Line A and Line B are top performers. Line C is underperforming significantly with only 69.2% OEE and a 1.42% defect rate — immediate action required.",
    region: "Main Plant has the highest grade (A) and best labor efficiency. South Plant is running at 92% utilization — capacity risk if demand increases.",
    heatmap: "Line C shows red across Quality, OEE, and Efficiency columns. All other lines score well on Yield and Safety. Focus maintenance resources on Line C.",
    pivot: "Morning shift outperforms other shifts in Product A output. Night shift shows declining Product C production — investigate shift-specific issues.",
  },
  unified: {
    kpi: "Perfect Order Rate at 98.4% is above target. Inventory turns declined due to slow-moving Specialty SKUs. Supply chain cost increases are driven by logistics.",
    product: "Electronics has the strongest fill rate and shortest inventory days. Specialty and Industrial segments are underperforming and carry excess inventory.",
    region: "North America leads in all key metrics. Latin America has the highest supply chain cost at 16.2% and the most improvement opportunity.",
    heatmap: "North America consistently outperforms. Asia Pacific and Latin America show weakness in Cost Efficiency and satisfaction. Investment in regional infrastructure recommended.",
    pivot: "Labor is the largest cost driver in Operations. Last-mile logistics costs grew 18% — the highest growth rate across all cost categories.",
  },
};

const SECTOR_TABLES: Record<string, {
  advanced_kpis: Array<{ label: string; value: string; change: string; positive: boolean; comparison: string; contributor: string; risk: 'low' | 'medium' | 'high' }>;
  product_table: { columns: string[]; rows: Array<Record<string, any>> };
  region_table: { columns: string[]; rows: Array<Record<string, any>> };
  pivot: { title: string; groups: Array<{ name: string; items: Array<{ label: string; value: string; share: number; trend: string; positive: boolean }> }> };
}> = {
  ecommerce: {
    advanced_kpis: [
      { label: 'Gross Revenue', value: '$2.41M', change: '+18.4%', positive: true, comparison: '$2.03M prior period', contributor: 'Electronics', risk: 'low' },
      { label: 'Customer Acquisition', value: '4,820', change: '+11.2%', positive: true, comparison: '4,334 prior period', contributor: 'Paid Search', risk: 'low' },
      { label: 'Cart Abandonment', value: '68.3%', change: '+3.1%', positive: false, comparison: '65.2% prior period', contributor: 'Mobile users', risk: 'high' },
      { label: 'Avg. Order Value', value: '$94.70', change: '-5.2%', positive: false, comparison: '$99.90 prior period', contributor: 'Accessories', risk: 'medium' },
    ],
    product_table: {
      columns: ['Product', 'Revenue', 'Units', 'Margin', 'Returns', 'Score'],
      rows: [
        { Product: 'Electronics', Revenue: '$820,400', Units: 8_420, Margin: '38%', Returns: '2.1%', Score: 92 },
        { Product: 'Apparel', Revenue: '$612,000', Units: 14_200, Margin: '52%', Returns: '6.8%', Score: 74 },
        { Product: 'Home & Garden', Revenue: '$389,000', Units: 5_980, Margin: '44%', Returns: '3.2%', Score: 85 },
        { Product: 'Sports', Revenue: '$274,000', Units: 3_800, Margin: '41%', Returns: '2.9%', Score: 88 },
        { Product: 'Accessories', Revenue: '$198,000', Units: 9_200, Margin: '62%', Returns: '8.4%', Score: 61 },
        { Product: 'Beauty', Revenue: '$117,000', Units: 4_100, Margin: '55%', Returns: '4.1%', Score: 79 },
      ],
    },
    region_table: {
      columns: ['Region', 'Revenue', 'Growth', 'Conv. Rate', 'Avg. Session', 'LTV'],
      rows: [
        { Region: 'North East', Revenue: '$741K', Growth: '+22%', 'Conv. Rate': '4.8%', 'Avg. Session': '3m 42s', LTV: '$240' },
        { Region: 'West Coast', Revenue: '$680K', Growth: '+15%', 'Conv. Rate': '4.1%', 'Avg. Session': '3m 18s', LTV: '$220' },
        { Region: 'South', Revenue: '$512K', Growth: '+8%', 'Conv. Rate': '3.2%', 'Avg. Session': '2m 54s', LTV: '$185' },
        { Region: 'Mid-West', Revenue: '$348K', Growth: '+6%', 'Conv. Rate': '2.9%', 'Avg. Session': '2m 38s', LTV: '$170' },
        { Region: 'International', Revenue: '$129K', Growth: '+41%', 'Conv. Rate': '2.1%', 'Avg. Session': '2m 10s', LTV: '$145' },
      ],
    },
    pivot: {
      title: 'Revenue by Category & Channel',
      groups: [
        { name: 'Direct', items: [{ label: 'Electronics', value: '$412K', share: 48, trend: '+14%', positive: true }, { label: 'Apparel', value: '$208K', share: 24, trend: '+9%', positive: true }, { label: 'Other', value: '$241K', share: 28, trend: '+6%', positive: true }] },
        { name: 'Marketplace', items: [{ label: 'Electronics', value: '$280K', share: 52, trend: '+21%', positive: true }, { label: 'Apparel', value: '$162K', share: 30, trend: '-4%', positive: false }, { label: 'Other', value: '$98K', share: 18, trend: '+11%', positive: true }] },
        { name: 'Social', items: [{ label: 'Apparel', value: '$242K', share: 64, trend: '+38%', positive: true }, { label: 'Beauty', value: '$89K', share: 24, trend: '+52%', positive: true }, { label: 'Other', value: '$45K', share: 12, trend: '+18%', positive: true }] },
      ],
    },
  },
  logistics: {
    advanced_kpis: [
      { label: 'On-Time Rate', value: '94.2%', change: '+1.8%', positive: true, comparison: '92.4% prior period', contributor: 'West Hub', risk: 'low' },
      { label: 'Avg. Transit Time', value: '2.4 days', change: '-0.2d', positive: true, comparison: '2.6d prior period', contributor: 'Air Freight', risk: 'low' },
      { label: 'Cost per Shipment', value: '$12.40', change: '+$1.20', positive: false, comparison: '$11.20 prior period', contributor: 'Fuel surcharge', risk: 'medium' },
      { label: 'Damaged Goods', value: '0.42%', change: '+0.12%', positive: false, comparison: '0.30% prior period', contributor: 'Last-mile', risk: 'high' },
    ],
    product_table: {
      columns: ['Route', 'Volume', 'On-Time', 'Cost/Unit', 'Transit', 'Score'],
      rows: [
        { Route: 'LA → NY', Volume: 12_400, 'On-Time': '97.1%', 'Cost/Unit': '$10.20', Transit: '2.1d', Score: 96 },
        { Route: 'CHI → MIA', Volume: 8_900, 'On-Time': '95.3%', 'Cost/Unit': '$11.80', Transit: '2.4d', Score: 91 },
        { Route: 'SEA → DFW', Volume: 7_200, 'On-Time': '93.8%', 'Cost/Unit': '$12.40', Transit: '2.8d', Score: 84 },
        { Route: 'ATL → BOS', Volume: 5_400, 'On-Time': '91.2%', 'Cost/Unit': '$13.60', Transit: '3.1d', Score: 76 },
        { Route: 'DEN → PHX', Volume: 3_800, 'On-Time': '88.4%', 'Cost/Unit': '$14.20', Transit: '3.4d', Score: 68 },
      ],
    },
    region_table: {
      columns: ['Hub', 'Throughput', 'Utilization', 'On-Time', 'Incidents', 'Rating'],
      rows: [
        { Hub: 'West Hub', Throughput: '18,400/wk', Utilization: '78%', 'On-Time': '96.8%', Incidents: 3, Rating: 'A' },
        { Hub: 'Central Hub', Throughput: '14,200/wk', Utilization: '91%', 'On-Time': '93.4%', Incidents: 8, Rating: 'B+' },
        { Hub: 'East Hub', Throughput: '12,800/wk', Utilization: '84%', 'On-Time': '94.9%', Incidents: 5, Rating: 'A-' },
        { Hub: 'South Hub', Throughput: '9,600/wk', Utilization: '69%', 'On-Time': '92.1%', Incidents: 11, Rating: 'B' },
        { Hub: 'Express Hub', Throughput: '4,200/wk', Utilization: '96%', 'On-Time': '98.2%', Incidents: 1, Rating: 'A+' },
      ],
    },
    pivot: {
      title: 'Shipment Volume by Mode & Class',
      groups: [
        { name: 'Ground', items: [{ label: 'Standard', value: '28,400', share: 62, trend: '+5%', positive: true }, { label: 'Express', value: '9,800', share: 21, trend: '+12%', positive: true }, { label: 'Economy', value: '7,600', share: 17, trend: '-3%', positive: false }] },
        { name: 'Air', items: [{ label: 'Priority', value: '4,200', share: 54, trend: '+18%', positive: true }, { label: 'Standard', value: '2,800', share: 36, trend: '+8%', positive: true }, { label: 'Charter', value: '780', share: 10, trend: '+31%', positive: true }] },
        { name: 'Freight', items: [{ label: 'LTL', value: '6,400', share: 58, trend: '+2%', positive: true }, { label: 'FTL', value: '3,200', share: 29, trend: '-8%', positive: false }, { label: 'Intermodal', value: '1,480', share: 13, trend: '+22%', positive: true }] },
      ],
    },
  },
  manufacturing: {
    advanced_kpis: [
      { label: 'Units Produced', value: '42,840', change: '+8.4%', positive: true, comparison: '39,520 prior period', contributor: 'Line B', risk: 'low' },
      { label: 'OEE Score', value: '81.2%', change: '-2.1%', positive: false, comparison: '83.3% prior period', contributor: 'Line C downtime', risk: 'high' },
      { label: 'Defect Rate', value: '0.81%', change: '+0.21%', positive: false, comparison: '0.60% prior period', contributor: 'Assembly step 4', risk: 'high' },
      { label: 'Yield Rate', value: '98.2%', change: '+0.5%', positive: true, comparison: '97.7% prior period', contributor: 'Raw material quality', risk: 'low' },
    ],
    product_table: {
      columns: ['Line', 'Units', 'OEE', 'Defect Rate', 'Downtime', 'Score'],
      rows: [
        { Line: 'Line A', Units: 14_200, OEE: '87.4%', 'Defect Rate': '0.52%', Downtime: '2.1h', Score: 94 },
        { Line: 'Line B', Units: 16_800, OEE: '84.1%', 'Defect Rate': '0.68%', Downtime: '3.4h', Score: 89 },
        { Line: 'Line C', Units: 7_400, OEE: '69.2%', 'Defect Rate': '1.42%', Downtime: '8.6h', Score: 54 },
        { Line: 'Line D', Units: 4_440, OEE: '76.8%', 'Defect Rate': '0.91%', Downtime: '4.2h', Score: 72 },
      ],
    },
    region_table: {
      columns: ['Plant', 'Capacity', 'Utilization', 'Yield', 'Labor Eff.', 'Grade'],
      rows: [
        { Plant: 'Main Plant', Capacity: '20,000/mo', Utilization: '84%', Yield: '98.8%', 'Labor Eff.': '94%', Grade: 'A' },
        { Plant: 'North Plant', Capacity: '12,000/mo', Utilization: '78%', Yield: '97.9%', 'Labor Eff.': '89%', Grade: 'B+' },
        { Plant: 'South Plant', Capacity: '8,000/mo', Utilization: '92%', Yield: '96.4%', 'Labor Eff.': '82%', Grade: 'B' },
        { Plant: 'Overflow', Capacity: '4,000/mo', Utilization: '61%', Yield: '99.1%', 'Labor Eff.': '91%', Grade: 'A-' },
      ],
    },
    pivot: {
      title: 'Output by Product Family & Shift',
      groups: [
        { name: 'Morning Shift', items: [{ label: 'Product A', value: '8,420', share: 44, trend: '+6%', positive: true }, { label: 'Product B', value: '6,200', share: 32, trend: '+3%', positive: true }, { label: 'Product C', value: '4,580', share: 24, trend: '-2%', positive: false }] },
        { name: 'Evening Shift', items: [{ label: 'Product A', value: '7,800', share: 42, trend: '+4%', positive: true }, { label: 'Product B', value: '6,600', share: 36, trend: '+8%', positive: true }, { label: 'Product C', value: '4,000', share: 22, trend: '-5%', positive: false }] },
        { name: 'Night Shift', items: [{ label: 'Product A', value: '5,200', share: 40, trend: '+1%', positive: true }, { label: 'Product B', value: '4,600', share: 35, trend: '+2%', positive: true }, { label: 'Product C', value: '3,240', share: 25, trend: '-8%', positive: false }] },
      ],
    },
  },
  unified: {
    advanced_kpis: [
      { label: 'Perfect Order Rate', value: '98.4%', change: '+1.2%', positive: true, comparison: '97.2% prior period', contributor: 'East region', risk: 'low' },
      { label: 'Cash-to-Cash Cycle', value: '14 days', change: '-2d', positive: true, comparison: '16d prior period', contributor: 'Payables opt.', risk: 'low' },
      { label: 'Inventory Turns', value: '8.4x', change: '-0.6x', positive: false, comparison: '9.0x prior period', contributor: 'Slow-movers', risk: 'medium' },
      { label: 'Supply Chain Cost', value: '11.2%', change: '+0.8%', positive: false, comparison: '10.4% prior period', contributor: 'Logistics', risk: 'medium' },
    ],
    product_table: {
      columns: ['Segment', 'Revenue', 'Fill Rate', 'Inventory', 'Lead Time', 'Score'],
      rows: [
        { Segment: 'Electronics', Revenue: '$1.2M', 'Fill Rate': '98.2%', Inventory: '24d', 'Lead Time': '8d', Score: 94 },
        { Segment: 'Apparel', Revenue: '$820K', 'Fill Rate': '94.8%', Inventory: '38d', 'Lead Time': '12d', Score: 78 },
        { Segment: 'Home Goods', Revenue: '$640K', 'Fill Rate': '96.1%', Inventory: '31d', 'Lead Time': '10d', Score: 85 },
        { Segment: 'Industrial', Revenue: '$480K', 'Fill Rate': '91.4%', Inventory: '52d', 'Lead Time': '18d', Score: 68 },
        { Segment: 'Specialty', Revenue: '$220K', 'Fill Rate': '88.9%', Inventory: '67d', 'Lead Time': '24d', Score: 59 },
      ],
    },
    region_table: {
      columns: ['Region', 'Revenue', 'OTD', 'Fill Rate', 'Cost', 'Index'],
      rows: [
        { Region: 'North America', Revenue: '$2.1M', OTD: '96.4%', 'Fill Rate': '97.8%', Cost: '10.2%', Index: 94 },
        { Region: 'Europe', Revenue: '$1.4M', OTD: '93.8%', 'Fill Rate': '95.2%', Cost: '12.4%', Index: 84 },
        { Region: 'Asia Pacific', Revenue: '$980K', OTD: '91.2%', 'Fill Rate': '92.8%', Cost: '14.8%', Index: 72 },
        { Region: 'Latin America', Revenue: '$420K', OTD: '88.4%', 'Fill Rate': '89.6%', Cost: '16.2%', Index: 64 },
      ],
    },
    pivot: {
      title: 'Supply Chain Costs by Function',
      groups: [
        { name: 'Procurement', items: [{ label: 'Materials', value: '$4.2M', share: 68, trend: '+3%', positive: false }, { label: 'Overhead', value: '$1.1M', share: 18, trend: '+1%', positive: false }, { label: 'Quality', value: '$880K', share: 14, trend: '-8%', positive: true }] },
        { name: 'Logistics', items: [{ label: 'Freight', value: '$1.8M', share: 54, trend: '+12%', positive: false }, { label: 'Warehousing', value: '$920K', share: 28, trend: '+2%', positive: false }, { label: 'Last-mile', value: '$600K', share: 18, trend: '+18%', positive: false }] },
        { name: 'Operations', items: [{ label: 'Labor', value: '$2.4M', share: 58, trend: '+4%', positive: false }, { label: 'Equipment', value: '$1.1M', share: 27, trend: '-3%', positive: true }, { label: 'Utilities', value: '$620K', share: 15, trend: '+7%', positive: false }] },
      ],
    },
  },
};

function getRiskStyle(risk: 'low' | 'medium' | 'high') {
  if (risk === 'high') return { badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'High Risk' };
  if (risk === 'medium') return { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Watch' };
  return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'On Track' };
}

function getScoreColor(score: number) {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-teal-500';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-rose-500';
}

function getScoreTextColor(score: number) {
  if (score >= 90) return 'text-emerald-700 bg-emerald-50';
  if (score >= 75) return 'text-teal-700 bg-teal-50';
  if (score >= 60) return 'text-amber-700 bg-amber-50';
  return 'text-rose-700 bg-rose-50';
}

function getPercentCellStyle(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  if (num >= 95) return 'bg-emerald-50 text-emerald-700';
  if (num >= 85) return 'bg-teal-50 text-teal-700';
  if (num >= 70) return 'bg-amber-50 text-amber-700';
  if (num < 70 && value.endsWith('%')) return 'bg-rose-50 text-rose-700';
  return '';
}

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 text-slate-300 ml-1 shrink-0" />;
  if (sortDir === 'asc') return <ChevronUp className="w-3 h-3 text-primary ml-1 shrink-0" />;
  return <ChevronDown className="w-3 h-3 text-primary ml-1 shrink-0" />;
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-primary' }: {
  icon: any; title: string; subtitle: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );
}

function AIInsightBlurb({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Zap className="w-3 h-3 text-primary" />
      </div>
      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-slate-100 my-8" />;
}

function AdvancedKPISection({ kpis }: { kpis: typeof SECTOR_TABLES['ecommerce']['advanced_kpis'] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const rs = getRiskStyle(kpi.risk);
        return (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3" data-testid={`analyst-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${rs.badge}`}>
                {rs.label}
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{kpi.value}</span>
              <span className={`flex items-center gap-0.5 text-xs font-bold mb-0.5 ${kpi.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {kpi.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {kpi.change}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="text-slate-300">vs</span>
                <span className="font-medium text-slate-600">{kpi.comparison}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[10px] text-slate-500">Top: <span className="font-bold text-slate-700">{kpi.contributor}</span></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisTable({ title, icon: Icon, columns, rows }: {
  title: string;
  icon: any;
  columns: string[];
  rows: Array<Record<string, any>>;
}) {
  const [sortCol, setSortCol] = useState<string>(columns[0]);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol]);

  const sorted = useMemo(() => {
    if (!sortDir) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      const an = parseFloat(String(av).replace(/[^0-9.-]/g, ''));
      const bn = parseFloat(String(bv).replace(/[^0-9.-]/g, ''));
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortCol, sortDir]);

  const isScoreCol = (c: string) => c === 'Score' || c === 'Rating' || c === 'Grade' || c === 'Index';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{title}</h4>
        <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-wider">{rows.length} entries · sortable</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort(col)}
                  data-testid={`th-${col.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <span className="flex items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {col}
                    <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className={`border-t border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                {columns.map((col) => {
                  const val = String(row[col]);
                  const isScore = isScoreCol(col);
                  const scoreVal = isScore ? (typeof row[col] === 'number' ? row[col] : 0) : 0;
                  const pctStyle = val.endsWith('%') ? getPercentCellStyle(val) : '';
                  const isFirst = col === columns[0];

                  return (
                    <td key={col} className="px-4 py-2.5 font-medium text-slate-700">
                      {isScore ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getScoreColor(scoreVal)}`} style={{ width: `${scoreVal}%` }} />
                          </div>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getScoreTextColor(scoreVal)}`}>{val}</span>
                        </div>
                      ) : pctStyle ? (
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${pctStyle}`}>{val}</span>
                      ) : (
                        <span className={`text-[11px] ${isFirst ? 'font-bold text-slate-800' : ''}`}>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeatmapGrid({ sector }: { sector: string }) {
  const HEATMAP: Record<string, { rows: string[]; cols: string[]; data: number[][] }> = {
    ecommerce: {
      rows: ['Electronics', 'Apparel', 'Home', 'Sports', 'Accessories'],
      cols: ['Revenue', 'Conv %', 'Returns', 'Margin', 'Growth'],
      data: [
        [95, 72, 88, 78, 82],
        [62, 58, 42, 91, 74],
        [74, 65, 76, 81, 68],
        [81, 70, 84, 77, 88],
        [48, 52, 38, 94, 91],
      ],
    },
    logistics: {
      rows: ['West Hub', 'Central Hub', 'East Hub', 'South Hub', 'Express'],
      cols: ['OTD Rate', 'Capacity', 'Cost Eff.', 'Quality', 'Speed'],
      data: [
        [97, 78, 84, 92, 88],
        [93, 91, 78, 86, 82],
        [95, 84, 82, 90, 85],
        [92, 69, 76, 84, 78],
        [98, 96, 91, 94, 99],
      ],
    },
    manufacturing: {
      rows: ['Line A', 'Line B', 'Line C', 'Line D'],
      cols: ['OEE', 'Yield', 'Quality', 'Efficiency', 'Safety'],
      data: [
        [87, 99, 94, 91, 98],
        [84, 98, 92, 87, 96],
        [69, 91, 72, 74, 88],
        [77, 95, 83, 79, 94],
      ],
    },
    unified: {
      rows: ['N. America', 'Europe', 'Asia Pac.', 'LatAm'],
      cols: ['Revenue', 'OTD', 'Fill Rate', 'Cost Eff.', 'Satisfaction'],
      data: [
        [94, 96, 98, 88, 92],
        [84, 94, 95, 80, 88],
        [72, 91, 93, 74, 82],
        [64, 88, 90, 68, 75],
      ],
    },
  };

  const config = HEATMAP[sector] || HEATMAP['unified'];

  function getCellBg(val: number) {
    if (val >= 95) return 'bg-emerald-500 text-white';
    if (val >= 88) return 'bg-emerald-400 text-white';
    if (val >= 80) return 'bg-teal-400 text-white';
    if (val >= 70) return 'bg-amber-300 text-amber-900';
    if (val >= 60) return 'bg-amber-400 text-amber-900';
    return 'bg-rose-400 text-white';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div className="flex gap-1">
          {['bg-rose-400', 'bg-amber-400', 'bg-teal-400', 'bg-emerald-500'].map(c => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Performance Heatmap</h4>
        <div className="ml-auto flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Mid</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />High</span>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="pb-3 pr-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 w-28" />
              {config.cols.map((c) => (
                <th key={c} className="pb-3 px-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 min-w-[70px]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row, ri) => (
              <tr key={row}>
                <td className="py-1.5 pr-3 font-bold text-slate-700 text-[11px] whitespace-nowrap">{row}</td>
                {config.data[ri].map((val, ci) => (
                  <td key={ci} className="py-1 px-1">
                    <div className={`flex items-center justify-center h-9 rounded-lg text-[11px] font-black ${getCellBg(val)}`}>
                      {val}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PivotSection({ pivot }: { pivot: typeof SECTOR_TABLES['ecommerce']['pivot'] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <Package className="w-4 h-4 text-primary" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{pivot.title}</h4>
        <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-wider">Multi-level aggregation</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pivot.groups.map((group) => (
            <div key={group.name} className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{group.name}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {group.items.map((item) => (
                  <div key={item.label} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500">{item.value}</span>
                        <span className={`text-[10px] font-bold ${item.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{item.trend}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${item.share}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{item.share}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalystPanel({ sector }: { sector: string }) {
  const key = ['ecommerce', 'logistics', 'manufacturing', 'unified'].includes(sector) ? sector : 'unified';
  const data = SECTOR_TABLES[key];
  const insights = SECTOR_AI_INSIGHTS[key];

  const productIcon = sector === 'logistics' ? MapPin : Package;
  const productTitle = sector === 'logistics' ? 'Route Performance Analysis' : sector === 'manufacturing' ? 'Production Line Analysis' : 'Product Performance Table';
  const regionTitle = sector === 'logistics' ? 'Hub Performance Breakdown' : sector === 'manufacturing' ? 'Plant Performance Matrix' : 'Regional Performance Breakdown';

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Analyst Deep-Dive</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <section aria-label="Performance Overview">
        <SectionHeader icon={BarChart3} title="Performance Overview" subtitle="Key indicators vs. prior period with risk assessment" />
        <AIInsightBlurb text={insights.kpi} />
        <AdvancedKPISection kpis={data.advanced_kpis} />
      </section>

      <SectionDivider />

      <section aria-label="Operations Analysis">
        <SectionHeader icon={Layers} title="Operations Analysis" subtitle="Detailed breakdown by product, route, or production line" color="text-indigo-400" />
        <AIInsightBlurb text={insights.product} />
        <AnalysisTable title={productTitle} icon={productIcon} columns={data.product_table.columns} rows={data.product_table.rows} />
      </section>

      <SectionDivider />

      <section aria-label="Regional Distribution">
        <SectionHeader icon={Globe} title="Regional Distribution" subtitle="Performance by geography, hub, or plant" color="text-teal-400" />
        <AIInsightBlurb text={insights.region} />
        <AnalysisTable title={regionTitle} icon={MapPin} columns={data.region_table.columns} rows={data.region_table.rows} />
      </section>

      <SectionDivider />

      <section aria-label="Risk and Performance Matrix">
        <SectionHeader icon={ShieldAlert} title="Risk & Performance Matrix" subtitle="Multi-dimensional heatmap across key performance dimensions" color="text-rose-400" />
        <AIInsightBlurb text={insights.heatmap} />
        <HeatmapGrid sector={key} />
      </section>

      <SectionDivider />

      <section aria-label="Category Breakdown">
        <SectionHeader icon={Package} title="Category Breakdown" subtitle="Grouped aggregation by channel, mode, or shift" color="text-amber-400" />
        <AIInsightBlurb text={insights.pivot} />
        <PivotSection pivot={data.pivot} />
      </section>

      <div className="h-12" />
    </div>
  );
}
