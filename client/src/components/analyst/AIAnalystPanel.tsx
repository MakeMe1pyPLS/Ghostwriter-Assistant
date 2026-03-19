import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Send, User, Zap, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  ts: number;
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
          {[0, 1, 2].map(i => (
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

export function AIAnalystPanel({ open, onOpenChange, sector }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sector: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Hello! I'm your AI Data Analyst for the **${sector}** sector. I can help you interpret KPIs, identify trends, explain anomalies, and suggest actions. What would you like to explore?`,
      ts: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prompts = SECTOR_PROMPTS[sector] || SECTOR_PROMPTS['unified'];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sector }),
      });
      const data = await res.json();
      const aiMsg: Message = { id: `a-${Date.now()}`, role: 'ai', content: data.response || 'I couldn\'t generate a response. Please try again.', ts: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'ai', content: 'Something went wrong. Please try again.', ts: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, sector]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col bg-[#F4F7FA] border-l border-slate-200 shadow-2xl z-[100]">
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
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400" onClick={() => onOpenChange(false)}>
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
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-primary/10' : 'bg-slate-200'}`}>
                  {msg.role === 'ai' ? <Zap className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm font-medium'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
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
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Suggested questions</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isTyping}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50 group"
                data-testid={`prompt-${p.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}
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
              onChange={e => setInput(e.target.value)}
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
