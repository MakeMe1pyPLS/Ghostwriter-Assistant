import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Table as TableIcon, 
  LayoutTemplate,
  MessageSquareQuote,
  BrainCircuit,
  Trash2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Demo Data
const demoTimeSeriesData = [
  { name: 'Mon', value: 4000, value2: 2400 },
  { name: 'Tue', value: 3000, value2: 1398 },
  { name: 'Wed', value: 2000, value2: 9800 },
  { name: 'Thu', value: 2780, value2: 3908 },
  { name: 'Fri', value: 1890, value2: 4800 },
  { name: 'Sat', value: 2390, value2: 3800 },
  { name: 'Sun', value: 3490, value2: 4300 },
];

const availableWidgets = [
  { id: 'kpi', name: 'KPI Card', icon: LayoutTemplate, w: 3, h: 2 },
  { id: 'trend', name: 'Trend Line', icon: TrendingUp, w: 6, h: 3 },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, w: 6, h: 3 },
  { id: 'donut', name: 'Donut Chart', icon: PieChart, w: 4, h: 3 },
  { id: 'table', name: 'Data Table', icon: TableIcon, w: 6, h: 4 },
  { id: 'insights', name: 'AI Insights', icon: BrainCircuit, w: 4, h: 4 },
  { id: 'chat', name: 'AI Chat', icon: MessageSquareQuote, w: 4, h: 4 },
];

export default function BuilderPage() {
  const [layout, setLayout] = useState<any[]>([
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
    { i: 'trend-1', x: 0, y: 2, w: 8, h: 4 },
    { i: 'insights-1', x: 8, y: 2, w: 4, h: 4 }
  ]);
  
  const [widgets, setWidgets] = useState<any[]>([
    { id: 'kpi-1', type: 'kpi', title: 'Perfect Order Rate', value: '98.4%', trend: '+1.2%' },
    { id: 'kpi-2', type: 'kpi', title: 'Cash-to-Cash Cycle', value: '14 Days', trend: '-2 Days' },
    { id: 'kpi-3', type: 'kpi', title: 'Available-to-Promise', value: '94.2%', trend: '+0.8%' },
    { id: 'kpi-4', type: 'kpi', title: 'Bullwhip Index', value: '1.12', trend: '-0.05' },
    { id: 'trend-1', type: 'trend', title: 'Supply Chain Efficiency' },
    { id: 'insights-1', type: 'insights', title: 'AI Analyst Recommendations' },
  ]);

  // Load from local storage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('chainInsideIQ_layout');
    const savedWidgets = localStorage.getItem('chainInsideIQ_widgets');
    if (savedLayout && savedWidgets) {
      try {
        setLayout(JSON.parse(savedLayout));
        setWidgets(JSON.parse(savedWidgets));
      } catch (e) {
        console.error("Failed to parse saved layout");
      }
    }
  }, []);

  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
    localStorage.setItem('chainInsideIQ_layout', JSON.stringify(newLayout));
    localStorage.setItem('chainInsideIQ_widgets', JSON.stringify(widgets));
  };

  const addWidget = (type: string, defaultW: number, defaultH: number) => {
    const newId = `${type}-${Date.now()}`;
    const newWidget = {
      id: newId,
      type: type,
      title: `New ${type} Widget`
    };
    
    // Find first available space (simplified)
    const newLayoutItem = {
      i: newId,
      x: 0,
      y: Infinity, // puts it at the bottom
      w: defaultW,
      h: defaultH
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
  };

  const removeWidget = (idToRemove: string) => {
    setWidgets(widgets.filter(w => w.id !== idToRemove));
    setLayout(layout.filter(l => l.i !== idToRemove));
  };

  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case 'kpi':
        return (
          <div className="flex flex-col h-full justify-center">
            <p className="text-sm font-medium text-muted-foreground">{widget.title}</p>
            <div className="flex items-end gap-2 mt-2">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">{widget.value || '100'}</h3>
              <span className={`text-sm font-medium mb-1 ${widget.trend?.startsWith('+') ? 'text-emerald-600' : 'text-emerald-600'}`}>
                {widget.trend || '+0%'}
              </span>
            </div>
          </div>
        );
      case 'trend':
        return (
          <div className="h-full w-full flex flex-col pt-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{widget.title}</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoTimeSeriesData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'bar':
        return (
          <div className="h-full w-full flex flex-col pt-2">
             <h3 className="text-sm font-medium text-muted-foreground mb-4">{widget.title}</h3>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoTimeSeriesData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                    <RechartsTooltip cursor={{fill: '#F8FAFC'}} />
                    <Bar dataKey="value" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        );
      case 'insights':
        return (
          <div className="h-full w-full flex flex-col pt-2">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-slate-900">{widget.title}</h3>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-slate-700 font-medium mb-1">Detected Delay</p>
                <p className="text-xs text-muted-foreground">Logistics bottleneck in Region West leading to a predicted 12% drop in On-Time Delivery.</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium mb-1">Recommended Action</p>
                <p className="text-xs text-slate-600">Reroute inventory from Central Hub to fulfill high-priority orders. Est. save: $42k.</p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {widget.title} Placeholder
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Builder</h1>
            <p className="text-muted-foreground text-sm">Drag, drop, and resize widgets to customize your view.</p>
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Main Canvas */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-border overflow-y-auto overflow-x-hidden p-4">
            {widgets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl">
                <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Dashboard is Empty</h3>
                <p className="text-muted-foreground max-w-sm mt-1 mb-4">Add widgets from the panel on the right to start building your custom dashboard view.</p>
              </div>
            ) : (
              <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={60}
                width={800} // This is managed by responsive wrapper ideally, using fixed for demo simplicity initially, will fix below
                onLayoutChange={onLayoutChange}
                isDraggable={true}
                isResizable={true}
                margin={[16, 16]}
                useCSSTransforms={true}
              >
                {layout.map((l) => {
                  const widget = widgets.find(w => w.id === l.i);
                  if (!widget) return null;
                  
                  return (
                    <div key={l.i} className="bg-white rounded-xl shadow-sm border border-border group overflow-hidden flex flex-col">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                           onClick={() => removeWidget(l.i)}
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                      </div>
                      <div className="p-4 h-full cursor-move">
                        {renderWidgetContent(widget)}
                      </div>
                    </div>
                  );
                })}
              </GridLayout>
            )}
            
            {/* Added style to make the grid responsive by expanding container */}
             <style>{`
              .react-grid-layout { width: 100% !important; }
              .react-grid-item.react-grid-placeholder { background: #14B8A6; opacity: 0.2; border-radius: 0.75rem; }
            `}</style>
          </div>

          {/* Widget Library Panel */}
          <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Widget Library</h3>
            <div className="space-y-3 overflow-y-auto pr-1 pb-4">
              {availableWidgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id, widget.w, widget.h)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <widget.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{widget.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
