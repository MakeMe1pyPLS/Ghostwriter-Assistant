import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Send, User, Sparkles, TrendingUp, Calendar, Zap, AlertTriangle, Lightbulb, Target, Info, BarChart3, Clock } from "lucide-react";
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
}

export default function InsightsPage() {
  const { selectedSector } = useDashboardStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [initialInsights, setInitialInsights] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [recommendedKpis, setRecommendedKpis] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'forecast' | 'kpis'>('chat');

  useEffect(() => {
    ai.generateInsights(selectedSector, {}).then(setInitialInsights);
    ai.generateForecast('', { sector: selectedSector }).then(setForecastData);
    ai.recommendKpis(selectedSector).then(setRecommendedKpis);

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
      await new Promise(resolve => setTimeout(resolve, 600));
      const response = await ai.chat(textToSend, { sector: selectedSector });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response,
        timestamp: new Date()
      }]);
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
    "What is Perfect Order Rate?",
    "What does Bullwhip Effect mean?"
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 md:p-2.5 rounded-xl border border-primary/20 shadow-sm">
                    <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight uppercase">AI Supply Chain Analyst</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active: {selectedSector}</span>
                    </div>
                  </div>
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
                          <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">{i + 1}</span>
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

            <div className="flex gap-2 border-b border-slate-200 pb-0">
              {[
                { key: 'chat' as const, label: 'AI Chat', icon: Zap },
                { key: 'forecast' as const, label: 'Forecast', icon: TrendingUp },
                { key: 'kpis' as const, label: 'KPI Guide', icon: Target }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  data-testid={`tab-${tab.key}`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[600px]">
                <div className="bg-slate-50/80 border-b border-slate-100 p-4 shrink-0">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suggested Questions</span>
                    <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                      {demoPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(prompt)}
                          className="text-[11px] font-bold text-slate-600 bg-white hover:text-primary hover:border-primary/30 border border-slate-200 px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md shrink-0"
                          data-testid={`prompt-${i}`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <div className="relative flex items-center">
                    <Input
                      placeholder="Ask the AI Supply Chain Analyst..."
                      className="pr-14 py-7 rounded-2xl border-slate-200 focus-visible:ring-primary shadow-sm text-sm font-medium bg-slate-50 focus-visible:bg-white transition-colors"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      data-testid="input-ai-chat"
                    />
                    <Button
                      className="absolute right-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isTyping}
                      data-testid="button-send-chat"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forecast' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Demand Forecast</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">AI-generated projection based on current trends</p>
                  </div>
                  {forecastData && (
                    <Badge className={`text-xs font-black uppercase tracking-widest ${forecastData.confidence === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {forecastData.confidence} Confidence
                    </Badge>
                  )}
                </div>
                {forecastData?.data_points && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData.data_points}>
                        <defs>
                          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F766E" stopOpacity={0.08} />
                            <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Day ${v}`} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="white" />
                        <Area type="monotone" dataKey="projected" stroke="#0F766E" strokeWidth={2} fill="url(#forecastGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {forecastData?.summary && (
                  <div className="bg-[#F4F7FA] rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Analysis</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{forecastData.summary}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kpis' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recommended KPIs</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">AI-recommended key performance indicators for {selectedSector}</p>
                </div>
                {recommendedKpis.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedKpis.map((kpi, i) => (
                      <div key={i} className="bg-[#F4F7FA] rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                              <Target className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">{kpi.name}</h4>
                              <Badge className={`mt-1 text-[9px] font-black uppercase tracking-widest ${kpi.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : kpi.priority === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {kpi.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current</div>
                            <div className="text-lg font-black text-slate-900">{kpi.current}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Target: {kpi.target}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-200/60">
                          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 leading-relaxed">{kpi.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading KPI recommendations...</div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </AppLayout>
  );
}