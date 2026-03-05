import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Sparkles } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  structuredData?: {
    changed: string;
    matters: string;
    actions: string[];
    forecastData?: any[];
  };
}

const mockForecastData = [
  { day: 'Day 1', actual: 4000, forecast: 4100, min: 3800, max: 4400 },
  { day: 'Day 3', actual: 3000, forecast: 3200, min: 2900, max: 3500 },
  { day: 'Day 5', actual: 2000, forecast: 2500, min: 2100, max: 2900 },
  { day: 'Day 7', actual: 2780, forecast: 2900, min: 2400, max: 3400 },
  { day: 'Day 9', actual: null, forecast: 3100, min: 2600, max: 3600 },
  { day: 'Day 11', actual: null, forecast: 3400, min: 2800, max: 4000 },
  { day: 'Day 14', actual: null, forecast: 3800, min: 3100, max: 4500 },
];

export default function InsightsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello. I'm your Supply Chain AI Analyst. I've detected some anomalies in your logistics network today. Would you like a breakdown?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Here is my analysis of the situation based on real-time multi-sector data:",
        timestamp: new Date(),
        structuredData: {
          changed: "Detected a 15% drop in manufacturing yield in the Asia-Pacific sector, likely due to reported raw material shortages.",
          matters: "This will create a bottleneck, causing a projected 12-day delay in our Q3 consumer electronics fulfillment.",
          actions: [
            "Initiate immediate raw material re-orders from secondary European suppliers.",
            "Reallocate 20% of current inventory to fulfill high-priority tier-1 client orders.",
            "Notify logistics partners to delay container ship bookings by 1 week to avoid docking fees."
          ],
          forecastData: mockForecastData
        }
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full p-6 gap-6">
        
        {/* Chat Interface */}
        <div className="flex flex-col flex-1 bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">AI Supply Chain Analyst</h2>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Online & Analyzing
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-primary text-white'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <BrainCircuit className="w-4 h-4" />}
                  </div>
                  <div className={`space-y-4 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/40 text-slate-800 rounded-tl-sm border border-border'}`}>
                      {msg.content}
                    </div>

                    {msg.structuredData && (
                      <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">What Changed</h4>
                          <p className="text-sm text-slate-800">{msg.structuredData.changed}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Why It Matters</h4>
                          <p className="text-sm text-slate-800">{msg.structuredData.matters}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Top 3 Recommended Actions
                          </h4>
                          <ul className="space-y-2">
                            {msg.structuredData.actions.map((action, i) => (
                              <li key={i} className="flex gap-2 text-sm bg-primary/5 p-2 rounded border border-primary/10 text-slate-700">
                                <span className="font-medium text-primary">{i + 1}.</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-white">
            <div className="max-w-4xl mx-auto relative flex items-center">
              <Input 
                placeholder="Ask about inventory, delays, or forecast predictions..." 
                className="pr-12 py-6 rounded-xl border-slate-300 focus-visible:ring-primary shadow-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                size="icon" 
                className="absolute right-2 h-9 w-9 rounded-lg"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast Panel (Right Side) */}
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">14-Day Forecast</h3>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                High Confidence
              </span>
            </div>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockForecastData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="forecast" stroke="#0F766E" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                  {/* Confidence band mockup */}
                  <Area type="monotone" dataKey="max" stroke="transparent" fill="#0F766E" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="min" stroke="transparent" fill="#FFFFFF" fillOpacity={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Projected inventory levels based on current throughput and supplier delays.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-24 h-24" />
            </div>
            <h3 className="font-semibold text-lg mb-2 relative z-10">Pro Insights</h3>
            <p className="text-slate-300 text-sm mb-4 relative z-10">
              Upgrade to connect real OpenAI models to your proprietary supply chain data.
            </p>
            <Button variant="secondary" className="w-full relative z-10 bg-white text-slate-900 hover:bg-slate-100">
              Unlock Advanced AI
            </Button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
