import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Sparkles, TrendingUp, Calendar, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { ai } from "@/lib/ai-provider";
import { useDashboardStore } from "@/hooks/use-dashboard-store";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  structuredData?: {
    changed?: string;
    matters?: string;
    actions?: string[];
  };
}

const mockForecastData = [
  { day: 'D1', actual: 4000, forecast: 4100, min: 3800, max: 4400 },
  { day: 'D3', actual: 3000, forecast: 3200, min: 2900, max: 3500 },
  { day: 'D5', actual: 2000, forecast: 2500, min: 2100, max: 2900 },
  { day: 'D7', actual: 2780, forecast: 2900, min: 2400, max: 3400 },
  { day: 'D9', actual: null, forecast: 3100, min: 2600, max: 3600 },
  { day: 'D11', actual: null, forecast: 3400, min: 2800, max: 4000 },
  { day: 'D14', actual: null, forecast: 3800, min: 3100, max: 4500 },
];

export default function InsightsPage() {
  const { selectedSector } = useDashboardStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Initial greeting
    ai.chat("", { sector: selectedSector }).then(response => {
      setMessages([{
        id: "1",
        role: "ai",
        content: response,
        timestamp: new Date(),
      }]);
    });
  }, [selectedSector]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await ai.chat(userMessage.content, { sector: selectedSector });
      
      // If it's a risk query, also generate insights to attach structured data
      let structuredData = undefined;
      if (userMessage.content.toLowerCase().includes('risk') || userMessage.content.toLowerCase().includes('insight')) {
        const insights = await ai.generateInsights(selectedSector, {});
        structuredData = {
          changed: insights.what_changed,
          matters: insights.why_it_matters || "This requires immediate attention to prevent downstream supply chain disruptions.",
          actions: insights.actions
        };
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response,
        timestamp: new Date(),
        structuredData
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full p-8 gap-8 bg-[#F4F7FA]">
        
        {/* Chat Interface */}
        <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 tracking-tight">AI Supply Chain Analyst</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Intelligence</span>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-8" ref={scrollRef}>
            <div className="py-8 space-y-8 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-100' : 'bg-slate-900 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-slate-500" /> : <Zap className="w-5 h-5 text-primary" />}
                  </div>
                  <div className={`space-y-4 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white font-medium rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      {msg.content}
                    </div>

                    {msg.structuredData && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Impact Assessment</h4>
                            <p className="text-xs font-bold text-slate-800 leading-normal">{msg.structuredData.changed}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Operational Risk</h4>
                            <p className="text-xs font-bold text-slate-800 leading-normal">{msg.structuredData.matters}</p>
                          </div>
                        </div>

                          {msg.structuredData.actions && msg.structuredData.actions.length > 0 && (
                            <div className="pt-4 border-t border-slate-50">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 fill-primary" />
                                Priority Mitigations
                              </h4>
                              <div className="grid gap-2">
                                {msg.structuredData.actions.map((action, i) => (
                                  <div key={i} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
                                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-primary border border-slate-100">{i + 1}</span>
                                    <span className="text-xs font-bold text-slate-700">{action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto relative flex items-center">
              <Input 
                placeholder="Query network performance or ask for mitigation plans..." 
                className="pr-16 py-7 rounded-2xl border-slate-200 focus-visible:ring-primary shadow-sm text-sm font-medium"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                className="absolute right-2 h-11 w-11 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast Sidebar */}
        <div className="w-96 flex flex-col gap-8">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Demand Forecast</h3>
              <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-tighter">
                High Precision
              </div>
            </div>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockForecastData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                  <Area type="monotone" dataKey="forecast" stroke="#0F766E" strokeWidth={3} fill="url(#colorForecast)" />
                  <Area type="monotone" dataKey="max" stroke="transparent" fill="#0F766E" fillOpacity={0.03} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 mb-1">
                 <TrendingUp className="w-3.5 h-3.5 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Insight</span>
               </div>
               <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Network stabilization expected in 4 days. Inventory levels returning to baseline.</p>
            </div>
          </Card>

          <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-3 relative z-10">Advanced Simulation</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 relative z-10">
              Run Monte Carlo simulations on your logistics lanes to identify failure points before they occur.
            </p>
            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] h-11 relative z-10 rounded-xl">
              Launch Simulator
            </Button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
