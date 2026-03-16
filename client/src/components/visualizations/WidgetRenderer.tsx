import { BrainCircuit, ChevronUp, ChevronDown, Info, Bot, Table as TableIcon, Target, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { getAllMetrics } from "@/hooks/use-sector-data";
import { CARD_PRESETS, type CardPresetId } from "@/lib/kpi-card-presets";

function InsightsWidgetContent({ sector, title }: { sector: string, title?: string }) {
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
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <BrainCircuit className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title || 'AI Recommendations'}</h3>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2">Impact Assessment</p>
          <ul className="text-[11px] text-slate-500 leading-relaxed list-disc pl-3 space-y-1">
            {insights.what_changed?.map((c: string, i: number) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100">
          <p className="text-xs font-bold text-teal-700 mb-2">Recommended Actions</p>
          <ul className="text-[11px] text-teal-700/80 leading-relaxed list-disc pl-3 space-y-1">
            {insights.actions?.slice(0, 2).map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        {insights.forecast_note && (
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-1">Forecast Note</p>
            <p className="text-[11px] text-indigo-700/80 leading-relaxed">{insights.forecast_note}</p>
          </div>
        )}
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

export function WidgetRenderer({ widget, data, sector, loading, presentationMode = false }: { widget: any, data: any, sector: string, loading: boolean, presentationMode?: boolean }) {
  if (loading) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />;

  const { metrics, chartData, donutData, allMetrics } = data;
  
  let metric = metrics[widget.metricIndex % metrics.length];
  if (widget.customMetricId) {
     const found = allMetrics.find((m: any) => m.label === widget.customMetricId);
     if (found) metric = found;
  }

  // Determine actual chart type taking user override into account
  const actualType = widget.chartType && ['line', 'area', 'bar', 'donut', 'pie', 'progress'].includes(widget.chartType) 
    ? widget.chartType 
    : widget.type;

  const chartColor = getChartColor(widget.badgeColor);

  const containerPadding = presentationMode ? "" : "p-1";

  switch (actualType) {
    case 'kpi': {
      const presetId = (widget.cardPreset || 'clean-corporate') as CardPresetId;
      const preset = CARD_PRESETS[presetId] || CARD_PRESETS['clean-corporate'];
      const isExecutive = presetId === 'executive-tile' || presetId === 'minimal-readout';
      const isOps = presetId === 'ops-scorecard' || presetId === 'comparative-kpi';
      const isInsight = presetId === 'insight-kpi';
      const isCompact = presetId === 'compact-grid';

      const valueSizeClass = preset.valueEmphasis === 'xl' ? (presentationMode ? 'text-5xl' : 'text-3xl')
        : preset.valueEmphasis === 'lg' ? (presentationMode ? 'text-4xl' : 'text-2xl')
        : preset.valueEmphasis === 'md' ? (presentationMode ? 'text-3xl' : 'text-xl')
        : (presentationMode ? 'text-2xl' : 'text-lg');

      const accentColor = metric?.isPositive ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)';

      return (
        <div className={`flex flex-col h-full justify-between ${containerPadding} relative ${preset.alignment === 'center' ? 'items-center text-center' : ''}`}>
          {preset.accentStrip && preset.accentPosition === 'left' && (
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: accentColor }} />
          )}
          {preset.accentStrip && preset.accentPosition === 'top' && (
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ backgroundColor: accentColor }} />
          )}

          <div className={`flex items-center justify-between ${preset.accentStrip && preset.accentPosition === 'left' ? 'pl-2' : ''}`}>
            <div className="flex flex-col">
              <span className={`${isCompact ? 'text-[10px]' : presentationMode ? 'text-[11px]' : 'text-xs'} font-bold text-slate-400 uppercase tracking-wider`}>{widget.title || metric?.label || 'Metric'}</span>
              {preset.subtitlePlacement !== 'hidden' && widget.description && (
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">{widget.description}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {preset.statusBadgeVisible && metric?.isPositive !== undefined && (
                <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {metric.isPositive ? 'On Track' : 'At Risk'}
                </div>
              )}
              {preset.iconVisible && preset.iconPosition === 'top-right' && (
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>{metric?.helpText || 'Key Performance Indicator'}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className={`${isCompact ? 'mt-1' : 'mt-2'} flex-1 flex flex-col justify-center ${preset.accentStrip && preset.accentPosition === 'left' ? 'pl-2' : ''}`}>
            <h3 className={`${valueSizeClass} font-bold text-slate-900 tracking-tight`}>{metric?.value || '0'}</h3>
            {(widget.showDelta !== false || preset.deltaPosition !== 'hidden') && metric?.trend && (
              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isCompact ? 'mt-0.5' : 'mt-1'} w-fit ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {metric.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.trend}
                {preset.comparisonLabelVisible && <span className="text-slate-400 ml-1">vs prev</span>}
              </div>
            )}
            {preset.benchmarkVisible && widget.showTarget && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-medium">
                <Target className="w-3 h-3" />
                <span>Target: {metric?.value || '—'}</span>
              </div>
            )}
          </div>

          {(widget.showSparkline !== false && preset.sparklineVisible) && (
            <div className={`w-full mt-2 opacity-40 relative shrink-0 ${presentationMode ? 'h-12' : 'h-8'}`}>
               {widget.showTarget && (
                 <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-400 z-10" />
               )}
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData.slice(0, 5)}>
                   <Area type="monotone" dataKey="value" stroke={metric?.isPositive ? "#10b981" : "#f43f5e"} fill="transparent" strokeWidth={presentationMode ? 3 : 2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }
    
    case 'progress': {
      const value = parseInt((metric?.value || '0').replace(/[^0-9]/g, '')) % 100 || 75;
      return (
        <div className={`h-full flex flex-col ${containerPadding} items-center justify-center relative`}>
          <div className="absolute top-1 left-1">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{widget.title || metric?.label}</h3>
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
             <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getBadgeColors(widget.badgeColor)}`}>Real-time</div>
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
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
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
                     <div className="text-[9px] font-medium text-slate-400">${(item.absolute / 1000).toFixed(0)}k</div>
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
                     <td className={`p-2 font-bold ${m.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{m.trend}</td>
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
          <p className={`${presentationMode ? 'text-[15px]' : 'text-sm'} text-slate-600 leading-relaxed`}>Overall performance in {sector} is showing a <strong className={metrics[0]?.isPositive ? 'text-emerald-600 bg-emerald-50 px-1 rounded' : 'text-rose-600 bg-rose-50 px-1 rounded'}>{metrics[0]?.trend || 'stable'}</strong> trend. Key indicators suggest strong operational health despite minor localized disruptions. Focus should remain on sustaining current throughput and mitigating identified supply chain risks.</p>
        </div>
      );
      
    case 'forecast':
      return (
        <div className={`h-full flex flex-col ${containerPadding}`}>
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{widget.title || 'Demand Forecast'}</h3>
             <div className="flex gap-2">
               <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getBadgeColors(widget.badgeColor)} bg-indigo-50 text-indigo-700 border-indigo-200`}>Predictive</div>
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
      
    default: return (
      <div className="h-full flex flex-col">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{widget.title || widget.type}</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Widget view ready
        </div>
      </div>
    );
  }
}
