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
    summary?: string;
    changed?: string[];
    matters?: string;
    actions?: string[];
    forecast_note?: string;
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
      if (userMessage.content.toLowerCase().includes('risk') || userMessage.content.toLowerCase().includes('insight') || userMessage.content.toLowerCase().includes('late') || userMessage.content.toLowerCase().includes('drop')) {
        const insights = await ai.generateInsights(selectedSector, {});
        structuredData = {
          summary: insights.summary,
          changed: insights.what_changed,
          matters: insights.why_it_matters || "This requires immediate attention to prevent downstream supply chain disruptions.",
          actions: insights.actions,
          forecast_note: insights.forecast_note
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

  const demoPrompts = [
    "Why did on-time delivery drop?",
    "What should we do next?",
    "Which KPI needs urgent attention?",
    "Summarize this dashboard for leadership",
    "Forecast the next 14 days"
  ];

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-full p-4 md:p-6 lg:p-8 gap-6 md:gap-8 bg-[#F4F7FA]">
        
        {/* Chat Interface */}
        <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px]">
          <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 md:p-2.5 rounded-xl">
                <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">AI Supply Chain Analyst</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Intelligence: {selectedSector}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
              Demo Mode
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 md:px-8" ref={scrollRef}>
            <div className="py-6 md:py-8 space-y-6 md:space-y-8 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex gap-3 md:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-100' : 'bg-slate-900 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5 text-slate-500" /> : <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                  </div>
                  <div className={`space-y-3 md:space-y-4 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white font-medium rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      {msg.content}
                    </div>

                    {msg.structuredData && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-md space-y-4 md:space-y-6 w-full"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 md:mb-3">Impact Assessment</h4>
                            {msg.structuredData.changed && msg.structuredData.changed.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-1 text-[11px] md:text-xs font-bold text-slate-800 leading-relaxed">
                                {msg.structuredData.changed.map((item, idx) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <p className="text-[11px] md:text-xs font-bold text-slate-800 leading-normal">No changes detected.</p>
                            )}
                          </div>
                          <div className="bg-rose-50 p-3 md:p-4 rounded-xl border border-rose-100">
                            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 md:mb-3">Operational Risk</h4>
                            <p className="text-[11px] md:text-xs font-bold text-rose-900 leading-relaxed">{msg.structuredData.matters}</p>
                          </div>
                        </div>

                          {msg.structuredData.actions && msg.structuredData.actions.length > 0 && (
                            <div className="pt-3 md:pt-4 border-t border-slate-50">
                              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 fill-primary" />
                                Priority Mitigations
                              </h4>
                              <div className="grid gap-2">
                                {msg.structuredData.actions.map((action, i) => (
                                  <div key={i} className="flex gap-3 md:gap-4 items-center bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
                                    <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-[9px] md:text-[10px] font-black text-primary border border-slate-100 shrink-0">{i + 1}</span>
                                    <span className="text-[11px] md:text-xs font-bold text-slate-700">{action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.structuredData.forecast_note && (
                            <div className="pt-3 md:pt-4 border-t border-slate-50">
                              <div className="bg-indigo-50/50 p-3 md:p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                                <TrendingUp className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-1">Forecast Simulation</h4>
                                  <p className="text-[11px] md:text-xs font-medium text-indigo-900 leading-relaxed">{msg.structuredData.forecast_note}</p>
                                </div>
                              </div>
                            </div>
                          )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-3 md:gap-5">
                   <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-slate-900 text-white">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                   </div>
                   <div className="p-4 md:p-5 rounded-2xl bg-slate-50 rounded-tl-none border border-slate-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                   </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-6 bg-white border-t border-slate-100 shrink-0">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {demoPrompts.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="relative flex items-center">
                <Input 
                  placeholder="Ask a question or try a demo prompt..." 
                  className="pr-14 md:pr-16 py-6 md:py-7 rounded-2xl border-slate-200 focus-visible:ring-primary shadow-sm text-xs md:text-sm font-medium"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button 
                  className="absolute right-2 h-9 w-9 md:h-11 md:w-11 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6 md:gap-8 shrink-0">
          <Card className="rounded-2xl border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-5 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Demand Forecast</h3>
              <div className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-tighter border border-slate-200 shadow-sm">
                Confidence: Medium
              </div>
            </div>
            
            <div className="h-48 md:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockForecastData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#0F766E" strokeWidth={3} fill="url(#colorForecast)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                 <TrendingUp className="w-3.5 h-3.5 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">AI Insight</span>
               </div>
               <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">Forecast simulation indicates a 14-day trend continuation with a potential seasonal bump. Network capacity should remain closely monitored across {selectedSector} operations.</p>
            </div>
          </Card>

          <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <BrainCircuit className="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <h3 className="text-base md:text-lg font-black tracking-tight mb-2 md:mb-3 relative z-10">Advanced Simulation</h3>
            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed mb-5 md:mb-6 relative z-10">
              Run Monte Carlo simulations on your operations to identify failure points before they occur.
            </p>
            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] h-10 md:h-11 relative z-10 rounded-xl shadow-sm">
              Launch Simulator
            </Button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
