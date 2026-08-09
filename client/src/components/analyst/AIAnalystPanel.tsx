import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Send,
  User,
  Zap,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  GitBranch,
  Target,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllMetrics } from "@/hooks/use-sector-data";
import {
  SeverityBadge,
  GeneratedByBadge,
  type AnalystResponse,
} from "@/components/analyst/operations-shared";
import type { AnalystChatRequest } from "@shared/ai-types";

interface Message {
  id: string;
  role: "user" | "ai";
  ts: number;
  text?: string;
  analysis?: AnalystResponse;
}

const SECTOR_PROMPTS: Record<string, string[]> = {
  ecommerce: [
    "What's driving cart abandonment?",
    "Which product category has the best margin?",
    "How can I improve conversion rate?",
    "What are my top revenue risks?",
  ],
  logistics: [
    "Which route has the worst on-time rate?",
    "What's causing cost per shipment to rise?",
    "How can I reduce transit time?",
    "Which hub is underperforming?",
  ],
  manufacturing: [
    "What's causing Line C's OEE drop?",
    "How can I reduce the defect rate?",
    "Which shift produces the most output?",
    "What are my biggest bottlenecks?",
  ],
  unified: [
    "What's impacting perfect order rate?",
    "How can I improve inventory turns?",
    "Which region has the best supply chain performance?",
    "What's driving supply chain cost increases?",
  ],
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  accent,
  children,
}: {
  icon: any;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <span className={`text-[9px] font-black uppercase tracking-widest ${accent}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function AnalysisCard({ a }: { a: AnalystResponse }) {
  return (
    <div
      className="w-full max-w-[92%] bg-white border border-slate-100 rounded-2xl rounded-bl-sm shadow-sm p-4 space-y-3.5"
      data-testid="analyst-structured-response"
    >
      {/* Business Summary */}
      <div className="rounded-xl bg-slate-900 text-white p-3">
        <span className="text-[8px] font-black uppercase tracking-widest text-teal-300 block mb-1">
          Business Summary
        </span>
        <p className="text-[12px] leading-relaxed font-medium text-slate-100">{a.businessSummary}</p>
      </div>

      {/* Key Findings */}
      {a.keyFindings.length > 0 && (
        <Section icon={TrendingUp} label="Key Findings" accent="text-primary">
          <ul className="space-y-1">
            {a.keyFindings.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-relaxed"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Bottlenecks */}
      {a.bottlenecks.length > 0 && (
        <Section icon={AlertTriangle} label="Bottlenecks" accent="text-red-600">
          <div className="space-y-1.5">
            {a.bottlenecks.map((b, i) => (
              <div key={i} className="rounded-xl border border-red-100 bg-red-50/70 p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-black text-slate-900 flex-1 min-w-0">{b.title}</span>
                  <SeverityBadge severity={b.severity} />
                </div>
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{b.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Root Cause */}
      {a.rootCause && (
        <Section icon={GitBranch} label="Root Cause" accent="text-amber-600">
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed rounded-xl border border-amber-100 bg-amber-50/70 p-2.5">
            {a.rootCause}
          </p>
        </Section>
      )}

      {/* Recommended Actions */}
      {a.recommendedActions.length > 0 && (
        <Section icon={Target} label="Recommended Actions" accent="text-teal-700">
          <ol className="space-y-1.5">
            {a.recommendedActions.map((act, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 shrink-0 rounded-md bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 leading-relaxed">{act.action}</p>
                  {act.impact && (
                    <p className="text-[10px] font-semibold text-teal-700 leading-relaxed">{act.impact}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Expected Impact */}
      {a.expectedImpact && (
        <Section icon={CheckCircle2} label="Expected Impact" accent="text-emerald-600">
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
            {a.expectedImpact}
          </p>
        </Section>
      )}

      {/* Next Steps */}
      {a.nextSteps.length > 0 && (
        <Section icon={ListChecks} label="Next Steps" accent="text-slate-500">
          <ol className="space-y-1">
            {a.nextSteps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-relaxed"
              >
                <span className="mt-0.5 w-4 h-4 shrink-0 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center text-[8px] font-black">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </Section>
      )}

      <div className="pt-1 border-t border-slate-100 flex justify-end">
        <GeneratedByBadge generatedBy={a.generatedBy} />
      </div>
    </div>
  );
}

export function AIAnalystPanel({
  open,
  onOpenChange,
  sector,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sector: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: `Hello! I'm your AI Operations Analyst for the **${sector}** sector. Ask me about a KPI, a bottleneck, or what to prioritize — I'll give you a structured operational read: findings, root cause, and actions ordered by impact.`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prompts = SECTOR_PROMPTS[sector] || SECTOR_PROMPTS["unified"];

  // Ground the analyst in the same sector metrics the dashboards use, mirroring
  // the ExecutivePreview derivation (unified-chain → unified, empty → unified).
  const metrics = useMemo(() => {
    const all = getAllMetrics(1);
    const key = sector === "unified-chain" ? "unified" : sector;
    let m = all.filter((x) => x.category === key);
    if (!m.length) m = all.filter((x) => x.category === "unified");
    return m;
  }, [sector]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const payload: AnalystChatRequest = {
          message: text.trim(),
          sector,
          metrics: metrics.map((m) => ({
            label: m.label,
            value: m.value,
            trend: m.trend,
            isPositive: m.isPositive,
          })),
        };
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as AnalystResponse;
        const aiMsg: Message = { id: `a-${Date.now()}`, role: "ai", analysis: data, ts: Date.now() };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, role: "ai", text: "Something went wrong. Please try again.", ts: Date.now() },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sector, metrics]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="w-full sm:max-w-[460px] p-0 flex flex-col bg-[#F4F7FA] border-l border-slate-200 shadow-2xl z-[100]"
      >
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Analyst</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {sector} data context
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-400"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-ai-analyst"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "ai" ? "bg-primary/10" : "bg-slate-200"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                {msg.analysis ? (
                  <AnalysisCard a={msg.analysis} />
                ) : (
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-sm font-medium"
                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <span dangerouslySetInnerHTML={{ __html: formatContent(msg.text || "") }} />
                    ) : (
                      msg.text || ""
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="px-4 pb-3 pt-2 shrink-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
            Suggested questions
          </p>
          <div className="flex flex-col gap-1.5 mb-3">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isTyping}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50 group"
                data-testid={`prompt-${p.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
              >
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-primary shrink-0 transition-colors" />
                <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900">{p}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 pr-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data..."
              disabled={isTyping}
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
              data-testid="input-ai-analyst"
            />
            <Button
              size="icon"
              className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              data-testid="button-send-ai-message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
