import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Tag, 
  Clock, 
  Building2, 
  Truck, 
  ShoppingCart,
  Layers,
  Search,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Sector, SECTOR_CONFIG } from "@/hooks/use-sector-data";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  author: {
    name: string;
    role: string;
    initials: string;
  };
  content: string;
  timestamp: Date;
  sector: Sector;
  tags: string[];
}

const CONFIG = {
  manufacturing: { icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'Manufacturing' },
  logistics: { icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'Logistics' },
  ecommerce: { icon: ShoppingCart, color: 'text-purple-600 bg-purple-50 border-purple-100', label: 'E-commerce' },
  unified: { icon: Layers, color: 'text-slate-600 bg-slate-50 border-slate-100', label: 'Unified' },
};

export default function HubPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      author: { name: "Sarah Chen", role: "Logistics Lead", initials: "SC" },
      content: "Port congestion at Long Beach is worsening. Rerouting all priority E-comm shipments to Vancouver rail link.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      sector: "logistics",
      tags: ["Delay", "Critical"]
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [postSector, setPostSector] = useState<Sector>('unified');
  const [filter, setFilter] = useState<Sector | 'all'>('all');

  const handlePost = () => {
    if (!newMessage.trim()) return;
    const post: Message = {
      id: Date.now().toString(),
      author: { name: "Executive User", role: "Chain Director", initials: "EX" },
      content: newMessage,
      timestamp: new Date(),
      sector: postSector,
      tags: ["Update"]
    };
    setMessages([post, ...messages]);
    setNewMessage("");
    toast({ title: "Posted", description: "Message added to the communication hub." });
  };

  const filtered = filter === 'all' ? messages : messages.filter(m => m.sector === filter);

  return (
    <AppLayout>
      <div className="p-10 max-w-6xl mx-auto h-full flex flex-col gap-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Communication Hub</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Real-time cross-sector coordination</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['all', 'ecommerce', 'logistics', 'manufacturing'].map(s => (
              <button 
                key={s} 
                onClick={() => setFilter(s as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-8">
              <Textarea 
                placeholder="Broadcast operational update..." 
                className="resize-none border-none bg-slate-50 rounded-2xl p-6 text-sm font-medium focus-visible:ring-primary h-32"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex items-center justify-between mt-6">
                 <div className="flex gap-2">
                   {Object.keys(CONFIG).map(s => {
                     const c = CONFIG[s as Sector];
                     return (
                       <button key={s} onClick={() => setPostSector(s as Sector)} className={`p-2 rounded-xl border transition-all ${postSector === s ? c.color : 'bg-white border-slate-100 text-slate-300'}`}>
                         <c.icon size={18} />
                       </button>
                     )
                   })}
                 </div>
                 <Button onClick={handlePost} className="rounded-xl px-8 font-black text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20">
                   <Send className="w-4 h-4 mr-2" /> Post Update
                 </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <AnimatePresence initial={false}>
                {filtered.map(m => {
                  const c = CONFIG[m.sector];
                  return (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-3xl border border-slate-50 shadow-sm p-8 mb-6 group hover:border-primary/10 transition-colors"
                    >
                      <div className="flex items-start gap-6">
                        <Avatar className="w-12 h-12 rounded-2xl shadow-sm ring-4 ring-slate-50">
                          <AvatarFallback className="bg-slate-900 text-primary font-black text-xs">{m.author.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex flex-col">
                               <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{m.author.name}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.author.role}</span>
                             </div>
                             <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                               <Clock size={12} /> {formatDistanceToNow(m.timestamp)} ago
                             </div>
                          </div>
                          <p className="text-slate-600 text-sm font-medium leading-relaxed mt-4">{m.content}</p>
                          <div className="flex gap-2 mt-6">
                             <Badge variant="outline" className={`rounded-lg font-black text-[9px] uppercase tracking-widest px-3 py-1 border-none ${c.color}`}>
                               {c.label}
                             </Badge>
                             {m.tags.map(t => (
                               <Badge key={t} variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-400 border-none">
                                 {t}
                               </Badge>
                             ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          <aside className="flex flex-col gap-8">
            <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />
               <MessageSquare className="text-primary mb-6" size={32} />
               <h3 className="text-xl font-black tracking-tighter uppercase mb-2">Internal Ops Hub</h3>
               <p className="text-slate-400 text-xs font-medium leading-relaxed">Your secure multi-sector communication layer. All updates are encrypted and visible to authorized stakeholders only.</p>
               <Button variant="outline" className="w-full mt-10 rounded-2xl border-white/10 text-white hover:bg-white hover:text-slate-900 font-black text-[10px] uppercase tracking-widest h-14">
                 Audit Hub Logs
               </Button>
            </div>
          </aside>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </AppLayout>
  );
}
