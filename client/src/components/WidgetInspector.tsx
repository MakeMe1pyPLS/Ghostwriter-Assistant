import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Type, Database, Palette, Settings } from "lucide-react";
import { useSectorData } from "@/hooks/use-sector-data";
import { getRecommendedVisualization } from "@/lib/visualization-map";

export function WidgetInspector({ 
  widget, 
  layoutItem,
  open, 
  onOpenChange, 
  onUpdate, 
  onUpdateLayout,
  onDelete 
}: { 
  widget: any;
  layoutItem?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: any) => void;
  onUpdateLayout?: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}) {
  const { metrics, allMetrics } = useSectorData();

  if (!widget) return null;

  // Group all metrics by category for the custom picker
  const metricsByCategory = allMetrics.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof allMetrics>);

  const isAIWidget = ['summary', 'insights', 'chat', 'forecast'].includes(widget.type);
  const isChartWidget = ['trend', 'bar', 'donut'].includes(widget.type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col z-[100] bg-slate-50 border-l-0 sm:border-l sm:border-slate-200 shadow-2xl">
        <div className="px-5 py-5 sm:px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm relative z-10">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Widget Settings
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
                  onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subtitle / Description</Label>
                <Input 
                  placeholder="Optional context" 
                  className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white focus-visible:ring-primary/20"
                  value={widget.description || ''} 
                  onChange={(e) => onUpdate(widget.id, { description: e.target.value })}
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
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visualization Type</Label>
                    {getRecommendedVisualization(widget.customMetricId || metrics[widget.metricIndex % metrics.length]?.label || '').type === widget.type && (
                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black flex items-center gap-1 uppercase tracking-wider"><Sparkles className="w-2.5 h-2.5" /> Recommended</span>
                    )}
                  </div>
                  <Select 
                    value={widget.type} 
                    onValueChange={(val) => {
                       onUpdate(widget.id, { type: val });
                       if (onUpdateLayout) {
                           if (val === 'kpi') onUpdateLayout(widget.id, { w: 3, h: 2 });
                           else if (val === 'trend' || val === 'bar') onUpdateLayout(widget.id, { w: 6, h: 3 });
                           else if (val === 'table') onUpdateLayout(widget.id, { w: 6, h: 4 });
                       }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                      <SelectValue placeholder="Select visualization" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[105]">
                      <SelectItem value="kpi" className="text-xs">KPI Card</SelectItem>
                      <SelectItem value="trend" className="text-xs">Trend Chart</SelectItem>
                      <SelectItem value="bar" className="text-xs">Bar Chart</SelectItem>
                      <SelectItem value="donut" className="text-xs">Donut Chart</SelectItem>
                      <SelectItem value="table" className="text-xs">Data Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Metric Binding</Label>
                  <Select 
                    value={widget.customMetricId || metrics[widget.metricIndex % metrics.length]?.label} 
                    onValueChange={(val) => {
                        const rec = getRecommendedVisualization(val);
                        onUpdate(widget.id, { 
                            customMetricId: val, 
                            type: rec.type, 
                            chartType: rec.chartType,
                            title: val
                        });
                        if (onUpdateLayout) {
                            if (rec.type === 'kpi') onUpdateLayout(widget.id, { w: 3, h: 2 });
                            else onUpdateLayout(widget.id, { w: 6, h: 3 });
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

          {/* Appearance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Appearance</h3>
            </div>
            <div className="p-4 space-y-5">
              {layoutItem && onUpdateLayout && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Size Preset</Label>
                  <Select 
                    value={`${layoutItem.w}x${layoutItem.h}`} 
                    onValueChange={(val) => {
                      const [w, h] = val.split('x').map(Number);
                      onUpdateLayout(widget.id, { w, h });
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
                      onValueChange={(val) => onUpdate(widget.id, { chartType: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-[105]">
                        <SelectItem value="area" className="text-xs">Area</SelectItem>
                        <SelectItem value="bar" className="text-xs">Bar</SelectItem>
                        <SelectItem value="line" className="text-xs">Line</SelectItem>
                        <SelectItem value="donut" className="text-xs">Donut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aggregation Method</Label>
                    <Select 
                      value={widget.aggregation || "sum"} 
                      onValueChange={(val) => onUpdate(widget.id, { aggregation: val })}
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
                  onValueChange={(val) => onUpdate(widget.id, { badgeColor: val })}
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
                      onCheckedChange={(c) => onUpdate(widget.id, { showDelta: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-sparkline" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Sparkline</Label>
                    <Switch 
                      id="show-sparkline" 
                      checked={widget.showSparkline !== false} 
                      onCheckedChange={(c) => onUpdate(widget.id, { showSparkline: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between group bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
                    <Label htmlFor="show-target" className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-slate-900">Show Target Line</Label>
                    <Switch 
                      id="show-target" 
                      checked={widget.showTarget === true} 
                      onCheckedChange={(c) => onUpdate(widget.id, { showTarget: c })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <Button 
            variant="destructive" 
            className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm hover:shadow-md transition-shadow" 
            onClick={() => {
              onDelete(widget.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Widget
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
