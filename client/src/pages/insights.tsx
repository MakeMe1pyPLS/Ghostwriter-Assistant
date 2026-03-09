import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Sparkles, TrendingUp, Calendar, Zap, AlertTriangle, Lightbulb } from "lucide-react";
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
  const [initialInsights, setInitialInsights] = useState<any>(null);

  useEffect(() => {
    // Generate initial structured insights for the top panel
    ai.generateInsights(selectedSector, {}).then(setInitialInsights);

    // Initial greeting in chat
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

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await ai.chat(textToSend, { sector: selectedSector });
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response,
        timestamp: new Date()
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
    "Forecast the next 14 days",
    "Which supply chain node is creating delays?"
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            
            {/* 1. AI INSIGHT SUMMARY PANEL */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-primary/10 p-2 md:p-2.5 rounded-xl border border-primary/20 shadow-sm">
                       <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                     </div>
                     <div>
                       <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight uppercase">AI Impact Assessment</h2>
                       <div className="flex items-center gap-1.5 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Intelligence: {selectedSector}</span>
                       </div>
                     </div>
                  </div>
                  <div className="hidden sm:block bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-slate-200 shadow-sm">
                    Demo Mode
                  </div>
               </div>

               {initialInsights ? (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid lg:grid-cols-3 gap-6">
                    <div className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Detected</h4>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{initialInsights.summary}</h3>
                      <ul className="space-y-1.5 pt-2">
                        {initialInsights.what_changed?.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                            <span className="text-slate-300 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Why it matters</h4>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{initialInsights.why_it_matters}</p>
                      
                      {initialInsights.forecast_note && (
                        <div className="mt-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                           <div className="flex items-center gap-1.5 mb-1.5">
                             <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">Forecast Risk</span>
                           </div>
                           <p className="text-xs text-indigo-900/80 font-medium leading-relaxed">{initialInsights.forecast_note}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 lg:col-span-1">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recommended Actions</h4>
                      </div>
                      <div className="space-y-2.5 pt-1">
                        {initialInsights.actions?.map((action: string, i: number) => (
                           <div key={i} className="bg-[#F4F7FA] p-3 rounded-xl border border-slate-100 flex gap-3">
                             <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">{i+1}</span>
                             <span className="text-xs font-bold text-slate-700 leading-relaxed">{action}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
               ) : (
                 <div className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
               )}
            </div>

            {/* 2 & 3. CHAT INTERACTION AREA */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[600px]">
              
              {/* Scrollable Prompts Header */}
              <div className="bg-slate-50/80 border-b border-slate-100 p-4 shrink-0">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suggested Questions</span>
                  <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                    {demoPrompts.map((prompt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(prompt)}
                        className="text-[11px] font-bold text-slate-600 bg-white hover:text-primary hover:border-primary/30 border border-slate-200 px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollRef}>
                <div className="py-6 space-y-6">
                  {messages.map((msg) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id} 
                      className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-900 text-white'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5 text-slate-500" /> : <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                      </div>
                      <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white font-medium rounded-tr-none' : 'bg-[#F4F7FA] text-slate-800 rounded-tl-none border border-slate-100'}`}>
                          {/* Basic markdown-like rendering for bullets */}
                          {msg.content.split('\n').map((line, i) => {
                            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                              return <li key={i} className="ml-4 list-disc mt-1">{line.substring(1).trim()}</li>;
                            }
                            return <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>;
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3 md:gap-4">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border bg-slate-900 border-slate-900 text-white">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                       </div>
                       <div className="p-4 rounded-2xl bg-[#F4F7FA] rounded-tl-none border border-slate-100 flex items-center gap-2 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                       </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="relative flex items-center">
                  <Input 
                    placeholder="Ask the AI Supply Chain Analyst..." 
                    className="pr-14 py-7 rounded-2xl border-slate-200 focus-visible:ring-primary shadow-sm text-sm font-medium bg-slate-50 focus-visible:bg-white transition-colors"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    className="absolute right-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
