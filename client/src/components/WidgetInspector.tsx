import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles } from "lucide-react";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto z-[100]">
        <SheetHeader className="mb-6 mt-4 md:mt-0 pb-4 border-b border-slate-100">
          <SheetTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Widget Inspector</SheetTitle>
          <SheetDescription className="text-xs font-medium text-slate-500">Configure widget properties and data sources</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title Override</Label>
            <Input 
              placeholder="e.g. Q3 Performance" 
              value={widget.title || ''} 
              onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Subtitle / Description</Label>
            <Input 
              placeholder="Optional brief description" 
              value={widget.description || ''} 
              onChange={(e) => onUpdate(widget.id, { description: e.target.value })}
            />
          </div>

          {widget.type !== 'summary' && widget.type !== 'insights' && widget.type !== 'chat' && widget.type !== 'forecast' && (
            <>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  Visualization Type
                  {getRecommendedVisualization(widget.customMetricId || metrics[widget.metricIndex % metrics.length]?.label || '').type === widget.type && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles className="w-3 h-3" /> Recommended</span>
                  )}
                </Label>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select visualization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kpi">KPI Card</SelectItem>
                    <SelectItem value="trend">Trend Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="donut">Donut Chart</SelectItem>
                    <SelectItem value="table">Data Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bound Metric (Data Source)</Label>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a specific metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(metricsByCategory).map(([category, catMetrics]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="capitalize text-primary font-black bg-slate-50/50">{category}</SelectLabel>
                        {catMetrics.map((m, i) => (
                          <SelectItem key={`${category}-${i}`} value={m.label}>{m.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">Selecting a KPI will automatically apply its recommended visualization.</p>
              </div>
            </>
          )}

          {layoutItem && onUpdateLayout && (
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Size Preset</Label>
              <Select 
                value={`${layoutItem.w}x${layoutItem.h}`} 
                onValueChange={(val) => {
                  const [w, h] = val.split('x').map(Number);
                  onUpdateLayout(widget.id, { w, h });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3x2">Small Card (3x2)</SelectItem>
                  <SelectItem value="4x3">Medium Square (4x3)</SelectItem>
                  <SelectItem value="6x3">Wide Panel (6x3)</SelectItem>
                  <SelectItem value="6x4">Large Panel (6x4)</SelectItem>
                  <SelectItem value="8x4">Hero Panel (8x4)</SelectItem>
                  <SelectItem value="12x2">Thin Strip (12x2)</SelectItem>
                  <SelectItem value="12x4">Full Width (12x4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(widget.type === 'trend' || widget.type === 'bar' || widget.type === 'donut') && (
            <>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Chart Type</Label>
                <Select 
                  value={widget.chartType || "area"} 
                  onValueChange={(val) => onUpdate(widget.id, { chartType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="donut">Donut Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Aggregation</Label>
                <Select 
                  value={widget.aggregation || "sum"} 
                  onValueChange={(val) => onUpdate(widget.id, { aggregation: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aggregation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Badge Color</Label>
            <Select 
              value={widget.badgeColor || "default"} 
              onValueChange={(val) => onUpdate(widget.id, { badgeColor: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="teal">Teal</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="indigo">Indigo</SelectItem>
                <SelectItem value="rose">Rose</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold">Display Options</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-delta" className="cursor-pointer">Show Period Delta</Label>
              <Switch 
                id="show-delta" 
                checked={widget.showDelta !== false} 
                onCheckedChange={(c) => onUpdate(widget.id, { showDelta: c })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-sparkline" className="cursor-pointer">Show Sparkline</Label>
              <Switch 
                id="show-sparkline" 
                checked={widget.showSparkline !== false} 
                onCheckedChange={(c) => onUpdate(widget.id, { showSparkline: c })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-target" className="cursor-pointer">Show Target Line</Label>
              <Switch 
                id="show-target" 
                checked={widget.showTarget === true} 
                onCheckedChange={(c) => onUpdate(widget.id, { showTarget: c })}
              />
            </div>
          </div>

          <div className="pt-8">
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => {
                onDelete(widget.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Widget
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
