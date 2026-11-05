import { useSectorData } from "@/hooks/use-sector-data";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { fetchAnalystAnswer, ENGINE_LABELS } from "@/lib/intel-client";
import { flattenAnalystResponse } from "@/lib/ai-provider";
import { Link, useLocation } from "wouter";
import { getKpisForSector } from "@/lib/kpi-library";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Send, User, TrendingUp, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "@/hooks/use-dashboard-store";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function InsightsPage() {
  const { selectedSector } = useDashboardStore();
  const { metrics } = useSectorData();
  const profile = useGrowthStore((s) => s.profile);
  const plan = useGrowthStore((s) => s.plan);
  const aiEngine = useGrowthStore((s) => s.aiEngine);
  const [location] = useLocation();
  const askedRef = useRef(false);

  // Structured analyst answers (engine router + fallback), flattened for this chat view.
  const askAnalyst = async (text: string): Promise<string> => {
    const res = await fetchAnalystAnswer({
      message: text,
      sector: selectedSector,
      metrics: metrics.map((m) => ({ label: m.label, value: String(m.value), trend: m.trend, isPositive: m.isPositive })),
    });
    return flattenAnalystResponse(res) + `\n\n— ${ENGINE_LABELS[res.generatedBy] ?? res.generatedBy}`;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const guideKpis = getKpisForSector(selectedSector as any).filter((k) => k.priority === 'high' || k.priority === 'critical').slice(0, 8);
  const [activeTab, setActiveTab] = useState<'chat' | 'forecast' | 'kpis'>('chat');

  useEffect(() => {
    const greeting = profile && plan
      ? `Hi${profile.businessName ? ' ' + profile.businessName : ''} team. I know your goal (${plan.northStar.name} → ${plan.northStar.target}) and the numbers on your dashboard. Ask me why something moved, what to do next, or how to handle any step in your plan.`
      : `Hi, I'm your AI Business Analyst. Ask me why a number moved, what to fix first, or how to grow. For advice tailored to your goal, answer the 2-minute interview under Growth Plan.`;
    setMessages([{ id: "1", role: "ai", content: greeting, timestamp: new Date() }]);
  }, [selectedSector, profile, plan]);

  // Questions passed from other screens, e.g. /insights?ask=...
  useEffect(() => {
    if (askedRef.current) return;
    const q = new URLSearchParams(window.location.search).get('ask');
    if (q) {
      askedRef.current = true;
      setTimeout(() => handleSend(q), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

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
      const response = await askAnalyst(textToSend);
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
    ...(plan ? [`How do I hit ${plan.northStar.target} on ${plan.northStar.name}?`, "What should I do first this week?"] : []),
    "Why did on-time delivery drop?",
    "What should we do next?",
    "Which KPI needs urgent attention?",
    "Summarize this dashboard for leadership",
    "What is Perfect Order Rate?",
    "What does Bullwhip Effect mean?"
  ];

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#F4F7FA]">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                      <span className="text-[9px] md:text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active: {selectedSector}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="analyst-intro">
                <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight">Ask about your own numbers</h3>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed max-w-3xl">
                  The analyst answers from the numbers in your workspace and the plan you built. Nothing is shown here until you ask, so nothing on this page is a made-up finding.
                  {" "}Upload a file in Data Sources to give it your real numbers; until then it works from built-in sample numbers and says so.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="h-11 rounded-xl font-bold"><Link href="/data">Add your data</Link></Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl font-bold"><Link href="/bottlenecks">See what we found</Link></Button>
                </div>
              </div>
            </div>

            <div className="flex gap-1 sm:gap-2 border-b border-slate-200 pb-0" role="tablist" aria-label="AI Analyst views">
              {[
                { key: 'chat' as const, label: 'AI Chat', icon: Zap },
                { key: 'forecast' as const, label: 'Forecast', icon: TrendingUp },
                { key: 'kpis' as const, label: 'KPI Guide', icon: Target }
              ].map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-3 min-h-11 text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  data-testid={`tab-${tab.key}`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[70dvh] min-h-[440px] max-h-[640px]">
                <div className="bg-slate-50/80 border-b border-slate-100 p-4 shrink-0">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suggested Questions</span>
                    <div className="flex flex-wrap gap-2">
                      {demoPrompts.slice(0, 6).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(prompt)}
                          className={`text-[11px] font-bold text-slate-600 bg-white hover:text-primary hover:border-primary/30 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow-md text-left ${i >= 3 ? 'hidden md:inline-flex' : 'inline-flex'}`}
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
                      aria-label="Send message"
                      data-testid="button-send-chat"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forecast' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-3" data-testid="forecast-coming-soon">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900">Forecast</h3>
                  <Badge className="text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border-slate-200">Coming soon</Badge>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                  Forecasting from your own history is not built yet, so this page does not show one. An earlier version drew a projected line and a confidence label that were not based on your data, and we removed it.
                </p>
                <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                  What works today: before-and-after on each fix you track (Growth Plan), and the trend between your latest two stretches of dated rows (Dashboard, Clients).
                </p>
              </div>
            )}

            {activeTab === 'kpis' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5" data-testid="kpi-guide">
                <div>
                  <h3 className="text-lg font-black text-slate-900">KPI guide</h3>
                  <p className="text-sm text-slate-700 mt-1">Metrics worth tracking for {selectedSector}, from our KPI library. These are definitions, not your results: add a file in Data Sources to see your own numbers.</p>
                </div>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {guideKpis.map((k) => (
                    <li key={k.id} className="bg-[#F4F7FA] rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-900">{k.label}</h4>
                        <Badge className="shrink-0 text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border-slate-200">{k.category}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">{k.description}</p>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="h-11 rounded-xl font-bold"><Link href="/kpis">Open the full KPI Library</Link></Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}