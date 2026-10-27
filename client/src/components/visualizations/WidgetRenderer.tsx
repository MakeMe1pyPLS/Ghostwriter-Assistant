import { BrainCircuit, ChevronUp, ChevronDown, Info, Bot, Table as TableIcon, Target, TrendingUp, TrendingDown, AlertTriangle, Zap, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useRef, useState, memo } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { getAllMetrics } from "@/hooks/use-sector-data";
import { CARD_PRESETS, type CardPresetId } from "@/lib/kpi-card-presets";
import { getHighlights, type OpportunityRiskHighlight } from "@/lib/opportunity-risk-engine";
import { kpiDetail, type KpiDetail } from "@shared/kpi-detail";
import { ALL_INDUSTRY_KPIS } from "@shared/kpi-industries";
import { kpiKey } from "@shared/kpi-viz";

const KPI_BY_ID = new Map(ALL_INDUSTRY_KPIS.map((k) => [k.id, k]));
const UNIT_LABEL: Record<string, string> = { '%': '%', '$': '$', '#': 'count', days: 'days', hrs: 'hours', min: 'minutes', x: '×', score: 'score' };

/** A library KPI with no numbers yet: its name, the visual it will use, and how it's measured. */
function KpiNoData({ title, kind, unit, formula }: { title: string; kind: string; unit?: string; formula?: string }) {
  const ghost = kind === 'progress'
    ? <div className="w-16 h-16 rounded-full border-[7px] border-slate-100 border-t-slate-200" aria-hidden />
    : kind === 'bar'
      ? <div className="flex items-end gap-1.5 h-12" aria-hidden>{[40, 65, 50, 80, 60, 90].map((h, i) => <div key={i} className="w-3 rounded-t bg-slate-100" style={{ height: `${h}%` }} />)}</div>
      : ['trend', 'area', 'line'].includes(kind)
        ? <svg viewBox="0 0 120 40" className="w-full max-w-[220px] h-12 text-slate-200" aria-hidden><path d="M2 32 C 22 30, 30 12, 48 18 S 80 34, 96 14 S 112 8, 118 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        : <span className="text-3xl font-black text-slate-200 leading-none" aria-hidden>—</span>;
  return (
    <div className="h-full flex flex-col p-1 min-h-0" data-testid="kpi-no-data">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight line-clamp-2">{title}</span>
        {unit && <span className="shrink-0 text-[11px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">{UNIT_LABEL[unit] ?? unit}</span>}
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center py-2">{ghost}</div>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-slate-600">No data yet</p>
        {formula && <p className="hidden [@container(min-height:150px)]:block text-[11px] leading-snug text-slate-500 line-clamp-2">How it's measured: {formula}</p>}
      </div>
    </div>
  );
}

const InsightsWidgetContent = memo(function InsightsWidgetContent({ sector, title }: { sector: string, title?: string }) {
  const [insights, setInsights] = useState<any>(null);
  
  useEffect(() => {
    import('@/lib/ai-provider').then(({ ai }) => {
      ai.generateInsights(sector, {}).then(setInsights);
    });
  }, [sector]);

  if (!insights) {
    return (
      <div className="h-full flex flex-col p-1 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-primary opacity-50" />
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      <div className="flex items-center gap-2 mb-2.5 shrink-0">
        <BrainCircuit className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider truncate">{title || 'AI Recommendations'}</h3>
      </div>
      {/* Fits the card: sections sit side by side when the card is wide, and lines are clamped instead of scrolling. */}
      <div className="grid gap-2 flex-1 min-h-0 content-start @[560px]:grid-cols-3">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 min-w-0">
          <p className="text-[11px] font-bold text-slate-700 mb-1">What changed</p>
          <ul className="text-[11px] text-slate-500 leading-snug list-disc pl-3 space-y-0.5">
            {insights.what_changed?.slice(0, 3).map((c: string, i: number) => <li key={i} className="line-clamp-2">{c}</li>)}
          </ul>
        </div>
        <div className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-100 min-w-0">
          <p className="text-[11px] font-bold text-teal-700 mb-1">Recommended actions</p>
          <ul className="text-[11px] text-teal-700/80 leading-snug list-disc pl-3 space-y-0.5">
            {insights.actions?.slice(0, 2).map((a: string, i: number) => <li key={i} className="line-clamp-2">{a}</li>)}
          </ul>
        </div>
        {insights.forecast_note && (
          <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 min-w-0">
            <p className="text-[11px] font-bold text-indigo-700 mb-0.5">Forecast</p>
            <p className="text-[11px] text-indigo-700/80 leading-snug line-clamp-3">{insights.forecast_note}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  risk: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600' },
  opportunity: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-700' },
  urgent: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-700' },
  action: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-700' },
  forecast: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
};

function OpportunityRiskWidget({ sector, title, presentationMode }: { sector: string; title?: string; presentationMode: boolean }) {
  const highlights = getHighlights(sector);

  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className={`${presentationMode ? 'text-xs' : 'text-[11px]'} font-black text-slate-900 uppercase tracking-widest`}>{title || 'Opportunity & Risk Highlights'}</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {highlights.map((h, i) => {
          const style = SEVERITY_STYLES[h.type] || SEVERITY_STYLES.risk;
          return (
            <div key={i} className={`${style.bg} ${style.border} border rounded-xl p-3 transition-all hover:shadow-sm`} data-testid={`highlight-${h.type}-${i}`}>
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5 shrink-0">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${style.icon}`}>{h.type}</span>
                    {h.severity === 'high' && (
                      <span className="text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">High</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">{h.title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{h.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getBadgeColors = (color: string) => {
  switch(color) {
    case 'teal': return 'bg-teal-50 border-teal-200 text-teal-700';
    case 'blue': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'indigo': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    case 'rose': return 'bg-rose-50 border-rose-200 text-rose-700';
    default: return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

const getChartColor = (color: string) => {
  switch(color) {
    case 'blue': return '#3b82f6';
    case 'indigo': return '#6366f1';
    case 'rose': return '#f43f5e';
    case 'teal': 
    default: return '#0F766E';
  }
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  'none': 'rounded-none',
  'sm': 'rounded',
  'md': 'rounded-lg',
  'lg': 'rounded-xl',
  'xl': 'rounded-2xl',
  '2xl': 'rounded-3xl',
  'full': 'rounded-[2rem]',
};

const SHADOW_MAP: Record<string, string> = {
  'none': 'shadow-none',
  'sm': 'shadow-sm',
  'md': 'shadow',
  'lg': 'shadow-lg',
  'xl': 'shadow-xl',
};

type KpiIntel = {
  comparison: string;
  contributor: string;
  risk: 'low' | 'medium' | 'high';
  whatChanged: string;
  why: string;
  impact: string;
  action: string;
};

const SECTOR_KPI_INTEL: Record<string, Record<string, KpiIntel>> = {
  ecommerce: {
    'Revenue':          { comparison: 'vs $110.5K prior period', contributor: 'Electronics', risk: 'low', whatChanged: 'Revenue grew 12.5%, led by Electronics and a stronger mobile mix.', why: 'A successful paid-search push and higher repeat-purchase rate lifted topline.', impact: 'On pace to beat the quarterly target if momentum holds two more weeks.', action: 'Reallocate budget toward Electronics campaigns while ROAS stays above 4x.' },
    'Orders':           { comparison: 'vs 1,340 prior period', contributor: 'Mobile channel', risk: 'low', whatChanged: 'Order count rose 8.2% with mobile now the leading channel.', why: 'Checkout friction dropped after the mobile flow was simplified.', impact: 'Higher volume increases fulfillment load on peak afternoon windows.', action: 'Confirm warehouse staffing can absorb the added afternoon order surge.' },
    'AOV':              { comparison: 'vs $86.10 prior period', contributor: 'Accessories', risk: 'medium', whatChanged: 'Average order value slipped 2.1% as low-priced accessories grew.', why: 'Promotions skewed the basket toward cheaper add-on items.', impact: 'Margin per order compresses even as order count climbs.', action: 'Introduce bundle offers to lift basket value without deep discounts.' },
    'Conversion Rate':  { comparison: 'vs 2.8% prior period', contributor: 'Email channel', risk: 'low', whatChanged: 'Conversion improved 0.4pts, strongest on email-sourced traffic.', why: 'Segmented email flows are landing more purchase-ready visitors.', impact: 'Email is now the most efficient channel by conversion.', action: 'Expand the highest-converting email segments before scaling paid spend.' },
    'ROAS':             { comparison: 'vs 4.3x prior period', contributor: 'Paid Search', risk: 'low', whatChanged: 'Return on ad spend rose to 4.5x, led by paid search.', why: 'Tighter keyword targeting cut wasted spend.', impact: 'Each ad dollar is returning more, leaving room to scale.', action: 'Increase paid-search budget incrementally while monitoring ROAS weekly.' },
    'Returns Rate':     { comparison: 'vs 4.6% prior period', contributor: 'Apparel', risk: 'medium', whatChanged: 'Returns fell to 4.1% but apparel remains the top driver.', why: 'Sizing inconsistency in apparel continues to generate returns.', impact: 'Apparel returns erode margin and add reverse-logistics cost.', action: 'Add detailed sizing guidance on the top-returned apparel SKUs.' },
  },
  logistics: {
    'On-Time Delivery':      { comparison: 'vs 92.4% prior period', contributor: 'West Hub', risk: 'low', whatChanged: 'On-time delivery improved 1.8pts, led by the West Hub.', why: 'Route optimization reduced handoff delays on key lanes.', impact: 'Higher reliability protects customer SLAs and repeat orders.', action: 'Replicate the West Hub routing playbook across underperforming hubs.' },
    'Late Shipments':        { comparison: 'vs 55 prior period', contributor: 'South route', risk: 'medium', whatChanged: 'Late shipments dropped 12% but the South route still lags.', why: 'Carrier capacity on the South route tightens during peak windows.', impact: 'Concentrated lateness on one route risks regional SLA breaches.', action: 'Secure backup carrier capacity for the South route at peak hours.' },
    'Cost per Shipment':     { comparison: 'vs $13.20 prior period', contributor: 'Fuel costs', risk: 'medium', whatChanged: 'Cost per shipment fell $0.80, partly offset by fuel volatility.', why: 'Better load consolidation lowered per-unit cost.', impact: 'Savings are fragile if fuel prices rebound.', action: 'Lock fuel surcharge terms while consolidation gains are holding.' },
    'Transit Time':          { comparison: 'vs 2.6d prior period', contributor: 'Air freight', risk: 'low', whatChanged: 'Average transit time improved by 0.2 days.', why: 'Selective air freight on priority lanes shortened delivery.', impact: 'Faster transit improves the customer promise window.', action: 'Reserve air freight for high-value lanes to control cost.' },
    'Warehouse Utilization': { comparison: 'vs 86% prior period', contributor: 'Central hub', risk: 'medium', whatChanged: 'Utilization rose to 88%, nearing capacity at the Central hub.', why: 'Inbound volume is outpacing outbound throughput.', impact: 'Above 90% utilization, pick-pack slows and errors rise.', action: 'Rebalance inventory to satellite sites before peak demand.' },
    'Shipment Volume':       { comparison: 'vs 8,010 prior period', contributor: 'Express lane', risk: 'low', whatChanged: 'Shipment volume grew 5.2%, driven by the express lane.', why: 'Demand shifted toward faster delivery options.', impact: 'Express growth raises cost-to-serve per shipment.', action: 'Price express tiers to cover the higher handling cost.' },
  },
  manufacturing: {
    'Units Produced':        { comparison: 'vs 38,720 prior period', contributor: 'Line B', risk: 'low', whatChanged: 'Output rose 8.4%, led by Line B.', why: 'Reduced changeover time freed up production hours.', impact: 'Higher output supports the order backlog drawdown.', action: 'Apply Line B changeover practices to Lines A and C.' },
    'Throughput':            { comparison: 'vs 1,705/day prior period', contributor: 'Morning shift', risk: 'low', whatChanged: 'Throughput climbed to 1,750/day, best on the morning shift.', why: 'Better staffing balance reduced idle stations.', impact: 'Sustained throughput shortens lead times.', action: 'Carry the morning-shift staffing model into other shifts.' },
    'Defect Rate':           { comparison: 'vs 1.0% prior period', contributor: 'Line C issues', risk: 'high', whatChanged: 'Defect rate improved to 0.8% but Line C remains a hotspot.', why: 'Tooling wear on Line C is driving recurring defects.', impact: 'Line C defects threaten yield and rework cost.', action: 'Schedule preventive tooling maintenance on Line C immediately.' },
    'Downtime':              { comparison: 'vs 18h prior period', contributor: 'Line C', risk: 'medium', whatChanged: 'Downtime fell to 14h, concentrated on Line C.', why: 'Unplanned stoppages on Line C dominate the total.', impact: 'Line C downtime caps overall capacity utilization.', action: 'Root-cause Line C stoppages and add condition monitoring.' },
    'Yield':                 { comparison: 'vs 97.7% prior period', contributor: 'Material quality', risk: 'low', whatChanged: 'Yield improved to 98.2%.', why: 'Tighter incoming material inspection cut scrap.', impact: 'Higher yield directly improves cost per unit.', action: 'Maintain supplier quality scorecards on key materials.' },
    'Capacity Utilization':  { comparison: 'vs 80.5% prior period', contributor: 'Night shift', risk: 'low', whatChanged: 'Capacity utilization rose 1.5pts.', why: 'Night-shift uptime improved after maintenance changes.', impact: 'Spare capacity is shrinking as demand grows.', action: 'Plan capacity additions before utilization exceeds 90%.' },
  },
  unified: {
    'Perfect Order Rate':  { comparison: 'vs 97.2% prior period', contributor: 'East region', risk: 'low', whatChanged: 'Perfect order rate rose to 98.4%, led by the East region.', why: 'Tighter coordination between fulfillment and delivery reduced errors.', impact: 'Higher perfect-order rate strengthens customer retention.', action: 'Standardize the East region cross-team handoff across all regions.' },
    'Cash-to-Cash Cycle':  { comparison: 'vs 16d prior period', contributor: 'Payables opt.', risk: 'low', whatChanged: 'Cash-to-cash cycle shortened by 2 days to 14.', why: 'Payables optimization freed up working capital.', impact: 'Faster cycle improves liquidity for reinvestment.', action: 'Extend payables terms with remaining key suppliers.' },
    'ATP Accuracy':        { comparison: 'vs 93.4% prior period', contributor: 'Forecast model', risk: 'low', whatChanged: 'Available-to-promise accuracy improved 0.8pts.', why: 'A refreshed forecast model better captured demand shifts.', impact: 'More reliable promises reduce stockouts and overstock.', action: 'Retrain the forecast model monthly to hold accuracy gains.' },
    'Bullwhip Index':      { comparison: 'vs 1.17 prior period', contributor: 'Demand smoothing', risk: 'low', whatChanged: 'Bullwhip index fell to 1.12, signaling steadier demand signals.', why: 'Demand smoothing reduced order amplification upstream.', impact: 'Lower amplification cuts excess safety stock across the chain.', action: 'Share point-of-sale signals upstream to keep amplification low.' },
  },
};

function getRiskBadge(risk: 'low' | 'medium' | 'high') {
  if (risk === 'high') return 'bg-rose-50 text-rose-600 border border-rose-200';
  if (risk === 'medium') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}
function getRiskLabel(risk: 'low' | 'medium' | 'high') {
  if (risk === 'high') return 'High Risk';
  if (risk === 'medium') return 'Watch';
  return 'On Track';
}

function KpiIntelRow({ label, text, tone }: { label: string; text: string; tone: 'slate' | 'indigo' | 'amber' }) {
  const toneMap = { slate: 'text-slate-500', indigo: 'text-indigo-600', amber: 'text-amber-700' } as const;
  return (
    <div>
      <span className={`text-[11px] font-black uppercase tracking-widest ${toneMap[tone]}`}>{label}</span>
      <p className="text-xs font-medium text-slate-600 leading-relaxed mt-0.5">{text}</p>
    </div>
  );
}

/** Last period vs this period as two slim bars, from the card's own numbers. */
function KpiCompareBars({ detail, className = '' }: { detail: KpiDetail; className?: string }) {
  const a = Math.abs(detail.prev ?? 0), b = Math.abs(detail.now ?? 0);
  const max = Math.max(a, b) || 1;
  // Start the scale below the smaller value so small changes stay visible.
  const floor = Math.max(0, Math.min(a, b) - (max - Math.min(a, b)) * 1.5 - max * 0.05);
  const pct = (v: number) => `${Math.max(6, ((v - floor) / (max - floor)) * 100)}%`;
  const good = detail.status === 'good';
  return (
    <div className={className} aria-hidden>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span>Last</span>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-slate-300" style={{ width: pct(a) }} /></div>
        <span>Now</span>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${good ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: pct(b) }} /></div>
      </div>
    </div>
  );
}

function WidgetRendererInner({ widget, data, sector, loading, presentationMode = false }: { widget: any, data: any, sector: string, loading: boolean, presentationMode?: boolean }) {
  if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />;

  const { metrics, chartData, donutData, allMetrics } = data;
  
  let metric = metrics[widget.metricIndex % metrics.length];
  if (widget.customMetricId) {
     const found = allMetrics.find((m: any) => m.label === widget.customMetricId);
     if (found) metric = found;
  }

  const actualType = widget.chartType && ['line', 'area', 'bar', 'donut', 'pie', 'progress'].includes(widget.chartType) 
    ? widget.chartType 
    : widget.type;

  // A KPI from the KPI library shows its own numbers, or an honest "no data yet"
  // card with its formula; never another KPI's sample values.
  if (widget.libraryKpiId) {
    const libKpi = KPI_BY_ID.get(widget.libraryKpiId);
    const found = libKpi && allMetrics.find((m: any) => kpiKey(m.label) === kpiKey(libKpi.name));
    if (!found) return <KpiNoData title={widget.title || libKpi?.name || 'KPI'} kind={actualType} unit={libKpi?.unit} formula={libKpi?.formula} />;
    metric = found;
  }

  const chartColor = getChartColor(widget.badgeColor);
  const containerPadding = presentationMode ? "" : "p-1";

  switch (actualType) {
    case 'kpi': {
      const presetId = (widget.cardPreset || 'clean-corporate') as CardPresetId;
      const preset = CARD_PRESETS[presetId] || CARD_PRESETS['clean-corporate'];
      const isCompact = presetId === 'compact-grid';
      const dataDensity = widget.dataDensity || 'standard';

      // Sizes follow the card's own width, so a narrow card never clips its number.
      const valueSizeClass = preset.valueEmphasis === 'xl' ? (presentationMode ? 'text-2xl @[200px]:text-4xl @[300px]:text-5xl' : 'text-xl @[200px]:text-3xl')
        : preset.valueEmphasis === 'lg' ? (presentationMode ? 'text-2xl @[220px]:text-4xl' : 'text-xl @[200px]:text-2xl')
        : preset.valueEmphasis === 'md' ? (presentationMode ? 'text-xl @[220px]:text-3xl' : 'text-lg @[200px]:text-xl')
        : (presentationMode ? 'text-lg @[220px]:text-2xl' : 'text-base @[200px]:text-lg');

      const accentColor = metric?.isPositive ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)';
      const borderRadius = BORDER_RADIUS_MAP[widget.borderRadius || 'lg'] || '';
      const shadow = SHADOW_MAP[widget.shadowIntensity || 'none'] || '';
      const customPadding = widget.cardPadding === 'compact' ? 'p-2' : widget.cardPadding === 'spacious' ? 'p-6' : '';
      const detail = kpiDetail({ label: metric?.label || '', value: String(metric?.value ?? ''), trend: metric?.trend, isPositive: metric?.isPositive });
      const intel = SECTOR_KPI_INTEL[sector]?.[metric?.label || ''];
      // One plain sentence: why it moved (sample data) or what the KPI measures.
      const explain = intel?.why || (metric?.helpText ? `${metric.helpText.replace(/\.$/, '')}. ${detail.status === 'good' ? 'On track.' : 'Needs attention.'}` : detail.summary);

      return (
        <div className={`flex flex-col h-full justify-between ${containerPadding} ${borderRadius} ${shadow} ${customPadding} relative ${preset.alignment === 'center' ? 'items-center text-center' : ''}`}>
          {preset.accentStrip && preset.accentPosition === 'left' && (
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: accentColor }} />
          )}
          {preset.accentStrip && preset.accentPosition === 'top' && (
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ backgroundColor: accentColor }} />
          )}

          <div className={`flex items-center justify-between ${preset.accentStrip && preset.accentPosition === 'left' ? 'pl-2' : ''}`}>
            <div className="flex flex-col min-w-0">
              <span className={`${isCompact ? 'text-[11px]' : presentationMode ? 'text-[11px]' : 'text-xs'} font-bold text-slate-400 uppercase tracking-wider leading-tight line-clamp-2 break-words`}>{widget.title || metric?.label || 'Metric'}</span>
              {preset.subtitlePlacement !== 'hidden' && widget.description && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{widget.description}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {presentationMode && (() => {
                const intel = SECTOR_KPI_INTEL[sector]?.[metric?.label || ''];
                if (!intel) return null;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 transition-colors"
                        data-testid={`button-kpi-intel-${(metric?.label || 'metric').toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <BrainCircuit className="w-3 h-3" />
                        <span className="text-[11px] font-black uppercase tracking-wider hidden @[200px]:inline">AI</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-0 rounded-2xl border-slate-200 shadow-xl overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-white">{metric?.label} Intelligence</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <KpiIntelRow label="What Changed" text={intel.whatChanged} tone="slate" />
                        <KpiIntelRow label="Why" text={intel.why} tone="indigo" />
                        <KpiIntelRow label="Impact" text={intel.impact} tone="amber" />
                        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
                          <span className="text-[11px] font-black uppercase tracking-widest text-teal-700">Recommended Action</span>
                          <p className="text-xs font-semibold text-slate-800 leading-relaxed mt-1">{intel.action}</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
              {preset.statusBadgeVisible && widget.showBadge !== false && metric?.isPositive !== undefined && (
                <div className={`hidden @[170px]:block px-1.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${metric.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {metric.isPositive ? 'On Track' : 'At Risk'}
                </div>
              )}
              {(widget.showIcon !== false) && preset.iconVisible && preset.iconPosition === 'top-right' && (
                <Tooltip>
                  <TooltipTrigger className="hidden @[200px]:inline-flex" aria-label={metric?.helpText || 'About this KPI'}>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>{metric?.helpText || 'Key Performance Indicator'}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className={`${isCompact ? 'mt-1' : 'mt-2'} flex-1 min-h-0 flex flex-col ${preset.alignment === 'center' ? 'items-center' : ''} ${preset.accentStrip && preset.accentPosition === 'left' ? 'pl-2' : ''}`}>
            <h3 className={`${valueSizeClass} font-bold text-slate-900 tracking-tight leading-none`}><AnimatedMetric value={String(metric?.value || '0')} /></h3>
            {(widget.showDelta !== false || preset.deltaPosition !== 'hidden') && metric?.trend && (
              <div className={`flex items-center gap-1.5 ${isCompact ? 'mt-1' : 'mt-2'} min-w-0 max-w-full`}>
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${detail.status === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {detail.direction === 'up' ? <TrendingUp className="w-3 h-3" aria-hidden /> : detail.direction === 'down' ? <TrendingDown className="w-3 h-3" aria-hidden /> : null}
                  {metric.trend}
                  <span className="sr-only">{detail.status === 'good' ? '(good)' : '(needs attention)'}</span>
                </span>
                {preset.comparisonLabelVisible && widget.showComparison !== false && detail.previous && (
                  <span className="text-[11px] font-medium text-slate-400 truncate hidden @[190px]:inline">vs {detail.previous} last period</span>
                )}
              </div>
            )}

            {/* Details appear only when the card has room for them. */}
            {!isCompact && (
              <div className={`mt-auto pt-2 w-full min-h-0 overflow-hidden space-y-2 ${preset.alignment === 'center' ? 'text-center' : ''}`}>
                {explain && (
                  <div className="hidden [@container(min-height:112px)]:block"><p className="text-[11px] leading-snug text-slate-500 font-medium line-clamp-2" data-testid="kpi-explain">{explain}</p></div>
                )}
                {presentationMode && intel && (
                  <div className="hidden @[230px]:block"><div className="hidden [@container(min-height:150px)]:flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Top driver: <span className="font-bold text-slate-700">{intel.contributor}</span></span>
                    <span className={`text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${getRiskBadge(intel.risk)}`}>{getRiskLabel(intel.risk)}</span>
                  </div></div>
                )}
                {detail.prev !== null && detail.now !== null && (
                  <div className="hidden @[180px]:block"><KpiCompareBars detail={detail} className="hidden [@container(min-height:168px)]:block" /></div>
                )}
                {intel?.action && (
                  <div className="hidden @[220px]:block"><p className="hidden [@container(min-height:236px)]:flex items-start gap-1.5 rounded-lg bg-teal-50/70 border border-teal-100 px-2 py-1.5 text-[11px] leading-snug text-slate-700 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 mt-px text-teal-700 shrink-0" aria-hidden />
                    <span className="line-clamp-2"><span className="text-teal-700">Next step: </span>{intel.action}</span>
                  </p></div>
                )}
              </div>
            )}

            {preset.benchmarkVisible && widget.showTarget && widget.target && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400 font-medium">
                <Target className="w-3 h-3" />
                <span>Target: {widget.target}</span>
              </div>
            )}

            {dataDensity === 'detailed' && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Last period</span>
                  <span className="text-slate-600 font-bold">{detail.previous ?? '—'}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Change</span>
                  <span className="text-slate-600 font-bold">{metric?.trend || '—'}</span>
                </div>
              </div>
            )}

            {dataDensity === 'grid' && (
              <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium block">Target</span>
                  <span className="text-slate-700 font-bold">{widget.target || 'Not set'}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium block">Last period</span>
                  <span className="text-slate-700 font-bold">{detail.previous ?? '—'}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium block">Change</span>
                  <span className="text-slate-700 font-bold">{metric?.trend || '—'}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium block">Status</span>
                  <span className={`font-bold ${metric?.isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>{metric?.isPositive ? 'On Track' : 'At Risk'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    case 'progress': {
      // A rate shown as a share of 100%.
      const parsed = parseFloat(String(metric?.value ?? '').replace(/[^0-9.\-]/g, ''));
      const value = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed * 10) / 10)) : 0;
      return (
        <div className={`h-full flex flex-col ${containerPadding} items-center justify-center relative`}>
          <div className="absolute top-1 left-1">
             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{widget.title || metric?.label}</h3>
          </div>
          <div className="w-full h-full flex items-center justify-center relative mt-4">
             <ResponsiveContainer width="100%" height="100%" minHeight={100}>
               <RadialBarChart 
                 cx="50%" cy="50%" 
                 innerRadius="70%" outerRadius="100%" 
                 barSize={15} data={[{ name: 'metric', value, fill: chartColor }]}
                 startAngle={90} endAngle={-270}
               >
                 <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                 <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} />
               </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-xl font-black text-slate-900 tracking-tighter">{value}%</span>
             </div>
          </div>
        </div>
      );
    }

    case 'trend':
    case 'area':
    case 'line':
    case 'bar': {
      const historicalData = chartData.filter((d: any) => d.value !== null);
      const isBar = actualType === 'bar';
      const isLine = actualType === 'line';
      
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || 'Performance Trend'}</h3>
             <div className={`px-1.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-widest ${getBadgeColors(widget.badgeColor)}`}>Real-time</div>
          </div>
          <div className="flex-1 relative min-h-0">
            {widget.showTarget && (
               <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-slate-300 z-10 w-full" />
            )}
            <ResponsiveContainer width="100%" height="100%">
              {isBar ? (
                <BarChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <RechartsTooltip cursor={{ fill: 'rgba(15, 118, 110, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : isLine ? (
                <LineChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} dot={{r: 4, fill: chartColor, strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, fill: chartColor, stroke: '#fff', strokeWidth: 2}} />
                </LineChart>
              ) : (
                <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`colorPrimary-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} fill={`url(#colorPrimary-${widget.id})`} activeDot={{r: 6, fill: chartColor, stroke: '#fff', strokeWidth: 2}} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    
    case 'donut':
    case 'pie':
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{widget.title || 'Distribution'}</h3>
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center relative">
            <div className="w-full sm:w-1/2 h-full min-h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={actualType === 'pie' ? "0%" : "65%"} outerRadius="85%" stroke="none" paddingAngle={actualType === 'pie' ? 0 : 2}>
                    {donutData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.name}</span>
                            <div className="flex items-end gap-2">
                              <span className="text-lg font-black text-slate-900">{data.value}%</span>
                              <span className="text-xs font-medium text-slate-400 mb-0.5">(${data.absolute.toLocaleString()})</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              {actualType === 'donut' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">100%</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-1/2 flex flex-col gap-2 p-2 justify-center">
              {donutData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                     <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                   </div>
                   <div className="text-right">
                     <div className="text-xs font-black text-slate-900">{item.value}%</div>
                     <div className="text-[11px] font-medium text-slate-400">${(item.absolute / 1000).toFixed(0)}k</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      
    case 'table':
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{widget.title || 'Data Table'}</h3>
              </div>
           </div>
           <div className="flex-1 overflow-auto border border-slate-100 rounded-lg shadow-sm">
             <table className="w-full text-left text-xs">
               <thead className="bg-slate-50 sticky top-0 z-10">
                 <tr><th className="p-2 font-bold text-slate-500">Metric</th><th className="p-2 font-bold text-slate-500">Value</th><th className="p-2 font-bold text-slate-500">Trend</th></tr>
               </thead>
               <tbody>
                 {metrics.slice(0,4).map((m: any, i: number) => (
                   <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                     <td className="p-2 text-slate-700 font-medium">{m.label}</td>
                     <td className="p-2 font-bold text-slate-900">{m.value}</td>
                     <td className={`p-2 font-bold ${m.isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>{m.trend}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      );
      
    case 'chat':
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
           <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{widget.title || 'AI Assistant'}</h3>
           </div>
           <div className="flex-1 flex flex-col gap-3 overflow-auto mb-3 px-1">
             <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 text-xs text-slate-700 self-start max-w-[85%] shadow-sm">
               How can I help you analyze the {sector} data today?
             </div>
             <div className="bg-primary/10 rounded-lg rounded-tr-none p-3 text-xs text-primary font-bold self-end max-w-[85%] shadow-sm">
               What's our biggest risk?
             </div>
             <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 text-xs text-slate-700 self-start max-w-[85%] shadow-sm">
               The biggest risk currently is a potential bottleneck at the Central Hub.
             </div>
           </div>
           <div className="h-9 border border-slate-200 rounded-lg flex items-center px-3 text-xs text-slate-400 bg-slate-50">Ask a question...</div>
        </div>
      );
      
    case 'summary':
      return (
        <div className={`h-full flex flex-col justify-center ${containerPadding}`}>
          <h3 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">{widget.title || 'Executive Summary'}</h3>
          <p className={`${presentationMode ? 'text-[15px]' : 'text-sm'} text-slate-600 leading-relaxed`}>Overall performance in {sector} is showing a <strong className={metrics[0]?.isPositive ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-rose-600 bg-rose-50 px-1 rounded'}>{metrics[0]?.trend || 'stable'}</strong> trend. Key indicators suggest strong operational health despite minor localized disruptions. Focus should remain on sustaining current throughput and mitigating identified supply chain risks.</p>
        </div>
      );
      
    case 'forecast':
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || 'Demand Forecast'}</h3>
             <div className="flex gap-2">
               <div className={`px-1.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-widest ${getBadgeColors(widget.badgeColor)} bg-indigo-50 text-indigo-700 border-indigo-200`}>Predictive</div>
             </div>
           </div>
           {widget.showForecastNote !== false && (
              <div className="mb-4 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                AI projects a 12% upside over the next 7 days based on current {sector} trends.
              </div>
           )}
           <div className="flex-1 relative min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                 <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}
                 />
                 <Line type="monotone" dataKey="value" name="Actual" stroke={chartColor} strokeWidth={3} dot={{r: 4, fill: chartColor}} connectNulls />
                 <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={false} connectNulls />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      );
      
    case 'insights':
      return <InsightsWidgetContent sector={sector} title={widget.title} />;
      
    case 'opportunity-risk':
      return <OpportunityRiskWidget sector={sector} title={widget.title} presentationMode={presentationMode} />;
      
    default: return (
      <div className="h-full flex flex-col">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{widget.title || widget.type}</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Widget view ready
        </div>
      </div>
    );
  }
}


/**
 * Counts a KPI value up to its number once (e.g. "98.4%", "14 Days", "$1,240"),
 * keeping its prefix, suffix, decimals and thousands separators.
 */
function AnimatedMetric({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const m = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(value);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : NaN;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const commas = !!m && m[2].includes(",");
  const [n, setN] = useState(reduce || !isFinite(target) ? target : 0);
  const prev = useRef(reduce ? target : 0);
  useEffect(() => {
    if (!isFinite(target)) return;
    if (reduce) { setN(target); return; }
    const c = animate(prev.current, target, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: setN });
    prev.current = target;
    return () => c.stop();
  }, [target, reduce]);
  if (!m || !isFinite(target)) return <>{value}</>;
  const num = commas ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals);
  return <span className="tabular-nums">{m[1]}{num}{m[3]}</span>;
}

export const WidgetRenderer = memo(WidgetRendererInner);
