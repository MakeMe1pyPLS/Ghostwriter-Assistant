import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { BrainCircuit } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
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

export default function DashboardPage() {
  const [layout, setLayout] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);

  useEffect(() => {
    // Load saved dashboard configuration
    const savedLayout = localStorage.getItem('chainInsideIQ_layout');
    const savedWidgets = localStorage.getItem('chainInsideIQ_widgets');
    
    if (savedLayout && savedWidgets) {
      try {
        setLayout(JSON.parse(savedLayout));
        setWidgets(JSON.parse(savedWidgets));
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    } else {
      // Default dummy data if nothing is saved
      setLayout([
        { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2, static: true },
        { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2, static: true },
        { i: 'trend-1', x: 0, y: 2, w: 8, h: 4, static: true },
        { i: 'insights-1', x: 8, y: 2, w: 4, h: 4, static: true }
      ]);
      setWidgets([
        { id: 'kpi-1', type: 'kpi', title: 'Perfect Order Rate', value: '98.4%', trend: '+1.2%' },
        { id: 'kpi-2', type: 'kpi', title: 'Cash-to-Cash Cycle', value: '14 Days', trend: '-2 Days' },
        { id: 'kpi-3', type: 'kpi', title: 'Available-to-Promise', value: '94.2%', trend: '+0.8%' },
        { id: 'kpi-4', type: 'kpi', title: 'Bullwhip Index', value: '1.12', trend: '-0.05' },
        { id: 'trend-1', type: 'trend', title: 'Supply Chain Efficiency' },
        { id: 'insights-1', type: 'insights', title: 'AI Analyst Recommendations' },
      ]);
    }
  }, []);

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
            {widget.title}
          </div>
        );
    }
  };

  if (widgets.length === 0) return null;

  // Make all layouts static for the dashboard presentation view
  const staticLayout = layout.map(l => ({ ...l, static: true }));

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Presentation</h1>
            <p className="text-muted-foreground text-sm">Real-time supply chain overview.</p>
          </div>
        </div>

        <div className="flex-1 bg-transparent overflow-y-auto overflow-x-hidden p-1">
          <GridLayout
            className="layout"
            layout={staticLayout}
            cols={12}
            rowHeight={60}
            width={1200} // Ideally responsive
            isDraggable={false}
            isResizable={false}
            margin={[24, 24]}
            useCSSTransforms={true}
          >
            {staticLayout.map((l) => {
              const widget = widgets.find(w => w.id === l.i);
              if (!widget) return null;
              
              return (
                <div key={l.i} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-5 h-full">
                    {renderWidgetContent(widget)}
                  </div>
                </div>
              );
            })}
          </GridLayout>
          
          <style>{`
            .react-grid-layout { width: 100% !important; }
          `}</style>
        </div>
      </div>
    </AppLayout>
  );
}
