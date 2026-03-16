import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Type, Database, Palette, Settings, Copy, CheckCircle2 } from "lucide-react";
import { useSectorData } from "@/hooks/use-sector-data";
import { getRecommendedVisualization } from "@/lib/visualization-map";
import { useState, useEffect } from "react";

export function WidgetInspector({ 
  widget, 
  layoutItem,
  open, 
  onOpenChange, 
  onUpdate, 
  onUpdateLayout,
  onDelete,
  onDuplicate
}: { 
  widget: any;
  layoutItem?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: any) => void;
  onUpdateLayout?: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}) {
  const { metrics, allMetrics } = useSectorData();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // We wrap onUpdate to provide auto-save visual feedback
  const handleUpdate = (updates: any) => {
    setSaveStatus('saving');
    onUpdate(widget.id, updates);
    setTimeout(() => setSaveStatus('saved'), 600);
  };

  const handleLayoutUpdate = (updates: any) => {
    if (!onUpdateLayout) return;
    setSaveStatus('saving');
    onUpdateLayout(widget.id, updates);
    setTimeout(() => setSaveStatus('saved'), 600);
  };

  if (!widget) return null;

  // Group all metrics by category for the custom picker
  const metricsByCategory = allMetrics.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof allMetrics>);

  const isAIWidget = ['summary', 'insights', 'chat', 'forecast'].includes(widget.type);
  const isChartWidget = ['trend', 'bar', 'donut', 'kpi', 'table', 'progress'].includes(widget.type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col z-[100] bg-slate-50 border-l-0 sm:border-l sm:border-slate-200 shadow-2xl">
        <div className="px-5 py-5 sm:px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm relative z-10">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Widget Settings
              </div>
              {saveStatus === 'saved' ? (
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1 transition-all"><CheckCircle2 className="w-3 h-3" /> Auto-saved</span>
              ) : (
                <span className="text-[9px] text-slate-500 bg-slate-100 px-2 py-1 rounded-full transition-all">Saving...</span>
              )}
            </SheetTitle>
            <SheetDescription className="text-xs font-medium text-slate-500">
              Customize data sources and visual properties
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-5 sm:space-y-6">
          {/* Basic Details Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Basic Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Title Override</Label>
                <Input 
                  placeholder={widget.type === 'kpi' ? "e.g. Total Revenue" : "Custom Title"} 
                  className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white focus-visible:ring-primary/20"
                  value={widget.title || ''} 
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subtitle / Description</Label>
                <Input 
                  placeholder="Optional context" 
                  className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white focus-visible:ring-primary/20"
                  value={widget.description || ''} 
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Data & Type Section */}
          {!isAIWidget && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Data & Config</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data Source</Label>
                  <Select 
                    value={widget.dataSource || "demo"} 
                    onValueChange={(val) => handleUpdate({ dataSource: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105]">
                      <SelectItem value="demo" className="text-xs">Demo Dataset</SelectItem>
                      <SelectItem value="live" className="text-xs">Live API Connection</SelectItem>
                      <SelectItem value="imported" className="text-xs">Imported Dataset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sector Context</Label>
                  <Select 
                    value={widget.sectorContext || "unified"} 
                    onValueChange={(val) => handleUpdate({ sectorContext: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105]">
                      <SelectItem value="unified" className="text-xs">Unified Supply Chain</SelectItem>
                      <SelectItem value="ecommerce" className="text-xs">E-Commerce</SelectItem>
                      <SelectItem value="manufacturing" className="text-xs">Manufacturing</SelectItem>
                      <SelectItem value="logistics" className="text-xs">Logistics Firm</SelectItem>
                      <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date Range Override</Label>
                  <Select 
                    value={widget.dateRange || "global"} 
                    onValueChange={(val) => handleUpdate({ dateRange: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Global Default" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105]">
                      <SelectItem value="global" className="text-xs">Global Default</SelectItem>
                      <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                      <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                      <SelectItem value="90d" className="text-xs">Last 90 Days</SelectItem>
                      <SelectItem value="ytd" className="text-xs">Year to Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visualization Type</Label>
                      {getRecommendedVisualization(widget.customMetricId || metrics[widget.metricIndex % metrics.length]?.label || '').type === widget.type && (
                        <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black flex items-center gap-1 uppercase tracking-wider"><Sparkles className="w-2.5 h-2.5" /> Recommended</span>
                      )}
                    </div>
                    <Select 
                      value={widget.type} 
                      onValueChange={(val) => {
                         handleUpdate({ type: val });
                         if (onUpdateLayout) {
                             if (val === 'kpi') handleLayoutUpdate({ w: 3, h: 2 });
                             else if (val === 'trend' || val === 'bar') handleLayoutUpdate({ w: 6, h: 3 });
                             else if (val === 'table') handleLayoutUpdate({ w: 6, h: 4 });
                         }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select visualization" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105] max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase">Summary Cards</SelectLabel>
                          <SelectItem value="kpi" className="text-xs">KPI Card</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Charts & Graphs</SelectLabel>
                          <SelectItem value="trend" className="text-xs">Trend / Time Series</SelectItem>
                          <SelectItem value="bar" className="text-xs">Bar / Comparison</SelectItem>
                          <SelectItem value="donut" className="text-xs">Donut / Distribution</SelectItem>
                          <SelectItem value="progress" className="text-xs">Progress Ring</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Data & Lists</SelectLabel>
                          <SelectItem value="table" className="text-xs">Data Table</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Metric Binding</Label>
                  <Select 
                    value={widget.customMetricId || metrics[widget.metricIndex % metrics.length]?.label} 
                    onValueChange={(val) => {
                        const rec = getRecommendedVisualization(val);
                        handleUpdate({ 
                            customMetricId: val, 
                            type: rec.type, 
                            chartType: rec.chartType,
                            title: val
                        });
                        if (onUpdateLayout) {
                            if (rec.type === 'kpi') handleLayoutUpdate({ w: 3, h: 2 });
                            else handleLayoutUpdate({ w: 6, h: 3 });
                        }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Select a specific metric" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105] max-h-[300px]">
                      {Object.entries(metricsByCategory).map(([category, catMetrics]) => (
                        <SelectGroup key={category}>
                          <SelectLabel className="capitalize text-primary font-black bg-slate-50/50 text-[10px] uppercase tracking-widest py-2 px-3 border-b border-slate-100">{category}</SelectLabel>
                          {catMetrics.map((m, i) => (
                            <SelectItem key={`${category}-${i}`} value={m.label} className="text-xs py-2">{m.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings Section */}
          {isAIWidget && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">AI Configuration</h3>
              </div>
              <div className="p-4 space-y-4">
                {widget.type === 'summary' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Summary Style</Label>
                    <Select 
                      value={widget.summaryStyle || "standard"} 
                      onValueChange={(val) => handleUpdate({ summaryStyle: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105]">
                        <SelectItem value="brief" className="text-xs">Brief (Bullet Points)</SelectItem>
                        <SelectItem value="standard" className="text-xs">Standard Paragraph</SelectItem>
                        <SelectItem value="detailed" className="text-xs">Detailed Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {widget.type === 'insights' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Insight Density</Label>
                    <Select 
                      value={widget.insightDensity || "standard"} 
                      onValueChange={(val) => handleUpdate({ insightDensity: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select density" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105]">
                        <SelectItem value="brief" className="text-xs">Top 2 Only</SelectItem>
                        <SelectItem value="standard" className="text-xs">Standard (Up to 4)</SelectItem>
                        <SelectItem value="detailed" className="text-xs">Detailed (All available)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {widget.type === 'chat' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Placeholder Prompt</Label>
                    <Input 
                      placeholder="Ask a question..." 
                      className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white"
                      value={widget.placeholderPrompt || ''} 
                      onChange={(e) => handleUpdate({ placeholderPrompt: e.target.value })}
                    />
                  </div>
                )}

                {(widget.type === 'insights' || widget.type === 'summary') && (
                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-actions" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Suggested Actions</Label>
                    <Switch 
                      id="show-actions" 
                      checked={widget.showActions !== false} 
                      onCheckedChange={(c) => handleUpdate({ showActions: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                )}

                {widget.type === 'forecast' && (
                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-forecast-note" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show AI Forecast Note</Label>
                    <Switch 
                      id="show-forecast-note" 
                      checked={widget.showForecastNote !== false} 
                      onCheckedChange={(c) => handleUpdate({ showForecastNote: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appearance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Appearance</h3>
            </div>
            <div className="p-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Card Style Preset</Label>
                <Select 
                  value={widget.cardPreset || widget.stylePreset || "clean-corporate"} 
                  onValueChange={(val) => handleUpdate({ cardPreset: val, stylePreset: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[105]">
                    <SelectItem value="clean-corporate" className="text-xs">Clean Corporate</SelectItem>
                    <SelectItem value="executive-tile" className="text-xs">Executive Tile</SelectItem>
                    <SelectItem value="modern-analytics" className="text-xs">Modern Analytics</SelectItem>
                    <SelectItem value="compact-grid" className="text-xs">Compact Grid</SelectItem>
                    <SelectItem value="ops-scorecard" className="text-xs">Ops Scorecard</SelectItem>
                    <SelectItem value="minimal-readout" className="text-xs">Minimal Readout</SelectItem>
                    <SelectItem value="insight-kpi" className="text-xs">Insight KPI Card</SelectItem>
                    <SelectItem value="comparative-kpi" className="text-xs">Comparative KPI Card</SelectItem>
                    <SelectItem value="soft" className="text-xs">Soft Modern (Legacy)</SelectItem>
                    <SelectItem value="elevated" className="text-xs">Elevated Insight (Legacy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {layoutItem && onUpdateLayout && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Size Preset</Label>
                  <Select 
                    value={`${layoutItem.w}x${layoutItem.h}`} 
                    onValueChange={(val) => {
                      const [w, h] = val.split('x').map(Number);
                      handleLayoutUpdate({ w, h });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105]">
                      <SelectItem value="3x2" className="text-xs">Small Card (3x2)</SelectItem>
                      <SelectItem value="4x3" className="text-xs">Medium Square (4x3)</SelectItem>
                      <SelectItem value="6x3" className="text-xs">Wide Panel (6x3)</SelectItem>
                      <SelectItem value="6x4" className="text-xs">Large Panel (6x4)</SelectItem>
                      <SelectItem value="8x4" className="text-xs">Hero Panel (8x4)</SelectItem>
                      <SelectItem value="12x2" className="text-xs">Thin Strip (12x2)</SelectItem>
                      <SelectItem value="12x4" className="text-xs">Full Width (12x4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isChartWidget && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chart Style</Label>
                    <Select 
                      value={widget.chartType || "area"} 
                      onValueChange={(val) => handleUpdate({ chartType: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105]">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase">Trend</SelectLabel>
                          <SelectItem value="area" className="text-xs">Area</SelectItem>
                          <SelectItem value="bar" className="text-xs">Bar</SelectItem>
                          <SelectItem value="line" className="text-xs">Line</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Distribution</SelectLabel>
                          <SelectItem value="donut" className="text-xs">Donut</SelectItem>
                          <SelectItem value="pie" className="text-xs">Pie</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Part-to-Whole</SelectLabel>
                          <SelectItem value="progress" className="text-xs">Progress Ring</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aggregation Method</Label>
                    <Select 
                      value={widget.aggregation || "sum"} 
                      onValueChange={(val) => handleUpdate({ aggregation: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select aggregation" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105]">
                        <SelectItem value="sum" className="text-xs">Sum</SelectItem>
                        <SelectItem value="avg" className="text-xs">Average</SelectItem>
                        <SelectItem value="max" className="text-xs">Maximum</SelectItem>
                        <SelectItem value="min" className="text-xs">Minimum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Theme Color</Label>
                <Select 
                  value={widget.badgeColor || "default"} 
                  onValueChange={(val) => handleUpdate({ badgeColor: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[105]">
                    <SelectItem value="default" className="text-xs">Default Slate</SelectItem>
                    <SelectItem value="teal" className="text-xs">Primary Teal</SelectItem>
                    <SelectItem value="blue" className="text-xs">Ocean Blue</SelectItem>
                    <SelectItem value="indigo" className="text-xs">Deep Indigo</SelectItem>
                    <SelectItem value="rose" className="text-xs">Alert Rose</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isAIWidget && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Display Options</Label>
                  
                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-delta" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Period Delta</Label>
                    <Switch 
                      id="show-delta" 
                      checked={widget.showDelta !== false} 
                      onCheckedChange={(c) => handleUpdate({ showDelta: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-sparkline" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Sparkline</Label>
                    <Switch 
                      id="show-sparkline" 
                      checked={widget.showSparkline !== false} 
                      onCheckedChange={(c) => handleUpdate({ showSparkline: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-target" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Target Line</Label>
                    <Switch 
                      id="show-target" 
                      checked={widget.showTarget === true} 
                      onCheckedChange={(c) => handleUpdate({ showTarget: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex gap-3">
          {onDuplicate && (
            <Button 
              variant="outline" 
              className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm hover:shadow-md transition-shadow border-slate-200 text-slate-600 hover:text-slate-900" 
              onClick={() => onDuplicate(widget.id)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          )}
          <Button 
            variant="destructive" 
            className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm hover:shadow-md transition-shadow" 
            onClick={() => {
              onDelete(widget.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
