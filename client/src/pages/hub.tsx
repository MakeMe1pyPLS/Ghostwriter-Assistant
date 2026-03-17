import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Clock, 
  Building2, 
  Truck, 
  ShoppingCart,
  Layers,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Activity,
  Search,
  ArrowRight,
  Settings,
  MessageSquareOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardStore, Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';
type Status = 'Open' | 'In Progress' | 'Resolved';
type ItemType = 'message' | 'alert' | 'notification';
type TabType = 'all' | 'alerts' | 'notifications' | 'urgent' | 'resolved';

interface HubItem {
  id: string;
  type: ItemType;
  author?: {
    name: string;
    role: string;
    initials: string;
    avatar?: string;
  };
  title?: string;
  content: string;
  timestamp: Date;
  sector: Sector;
  tags: string[];
  urgency: Urgency;
  status: Status;
  kpi?: string;
  isRead: boolean;
}

const URGENCY_CONFIG = {
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-teal-50 text-teal-700 border-teal-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Critical: 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100 animate-pulse-slow',
};

const STATUS_CONFIG = {
  Open: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-50 text-blue-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
};

const SECTOR_CONFIG: Record<Sector, { icon: typeof Building2; color: string; label: string }> = {
  manufacturing: { icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'Manufacturing' },
  logistics: { icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'Logistics' },
  ecommerce: { icon: ShoppingCart, color: 'text-purple-600 bg-purple-50 border-purple-100', label: 'E-commerce' },
  unified: { icon: Layers, color: 'text-slate-600 bg-slate-50 border-slate-100', label: 'Unified' },
  custom: { icon: Layers, color: 'text-teal-600 bg-teal-50 border-teal-100', label: 'Custom' },
};

const MOCK_ITEMS: HubItem[] = [
  {
    id: "1",
    type: "alert",
    title: "On-Time Delivery Drop",
    content: "On-time delivery fell below the 92% threshold for the West Coast region. Immediate rerouting recommended to mitigate downstream impacts.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    sector: "logistics",
    tags: ["Threshold Breach"],
    urgency: "High",
    status: "Open",
    kpi: "On-Time Delivery",
    isRead: false
  },
  {
    id: "2",
    type: "message",
    author: { name: "Sarah Chen", role: "Logistics Lead", initials: "SC" },
    content: "Port congestion at Long Beach is worsening. Rerouting all priority E-comm shipments to Vancouver rail link.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    sector: "logistics",
    tags: ["Delay", "Reroute"],
    urgency: "Medium",
    status: "In Progress",
    isRead: true
  },
  {
    id: "3",
    type: "alert",
    title: "Defect Rate Spike",
    content: "Defect rate exceeded 3% on Line B in the past 4 hours. QA teams deployed for immediate inspection.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    sector: "manufacturing",
    tags: ["Quality Control"],
    urgency: "Critical",
    status: "Open",
    kpi: "Defect Rate",
    isRead: false
  },
  {
    id: "4",
    type: "notification",
    content: "AI Insights generated a new mitigation plan for Tier-2 supplier volatility.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    sector: "unified",
    tags: ["AI"],
    urgency: "Low",
    status: "Resolved",
    isRead: true
  }
];

function HubDisabledState() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#F4F7FA] px-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <MessageSquareOff className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3 uppercase">Hub is Disabled</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          The Ops Hub is currently turned off. Hub communication is most useful for businesses with multiple sectors or partnered operations. Enable it in Settings to start receiving cross-sector alerts, AI insights, and operational updates.
        </p>
        <Link href="/settings">
          <Button className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
            <Settings className="w-4 h-4 mr-2" />
            Go to Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function HubPage() {
  const { toast } = useToast();
  const { hubEnabled, businessStructure, connectedSectors } = useDashboardStore();
  const [items, setItems] = useState<HubItem[]>(MOCK_ITEMS);
  const [newMessage, setNewMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [postSector, setPostSector] = useState<Sector>('unified');
  const [postUrgency, setPostUrgency] = useState<Urgency>('Medium');
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const availableSectors = useMemo(() => {
    const base: Sector[] = [...connectedSectors];
    if (businessStructure !== 'single' && !base.includes('unified')) {
      base.push('unified');
    }
    return base;
  }, [connectedSectors, businessStructure]);

  const handlePost = () => {
    if (!newMessage.trim()) return;
    
    const post: HubItem = {
      id: Date.now().toString(),
      type: 'message',
      author: { name: "Executive User", role: "Chain Director", initials: "EX" },
      title: newTitle.trim() || undefined,
      content: newMessage,
      timestamp: new Date(),
      sector: postSector,
      tags: ["Update"],
      urgency: postUrgency,
      status: 'Open',
      isRead: true
    };
    
    setItems([post, ...items]);
    setNewMessage("");
    setNewTitle("");
    toast({ title: "Update Posted", description: "Your message has been broadcasted to the hub." });
  };

  const handleResolve = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, status: 'Resolved' } : item));
    toast({ title: "Marked as Resolved", description: "Item status updated." });
  };

  const handleMarkRead = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isRead: true } : item));
  };

  const filteredItems = useMemo(() => {
    let result = items;

    if (businessStructure === 'single') {
      result = result.filter(i => connectedSectors.includes(i.sector) || i.sector === 'unified');
    }
    
    if (activeTab === 'alerts') result = result.filter(i => i.type === 'alert');
    if (activeTab === 'notifications') result = result.filter(i => i.type === 'notification');
    if (activeTab === 'urgent') result = result.filter(i => i.urgency === 'High' || i.urgency === 'Critical');
    if (activeTab === 'resolved') result = result.filter(i => i.status === 'Resolved');
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.content.toLowerCase().includes(q) || 
        i.title?.toLowerCase().includes(q) ||
        i.kpi?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [items, activeTab, searchQuery, businessStructure, connectedSectors]);

  const stats = useMemo(() => {
    return {
      openAlerts: items.filter(i => i.type === 'alert' && i.status !== 'Resolved').length,
      critical: items.filter(i => i.urgency === 'Critical' && i.status !== 'Resolved').length,
      unread: items.filter(i => !i.isRead).length
    };
  }, [items]);

  if (!hubEnabled) {
    return (
      <AppLayout>
        <HubDisabledState />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F4F7FA]">
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 shadow-sm z-10 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Ops Hub</h1>
              {businessStructure !== 'single' && (
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-lg border-primary/20 bg-primary/5 text-primary">
                  {businessStructure === 'partnered' ? 'Partnered' : 'Unified Chain'}
                </Badge>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Open Alerts</div>
                  <div className="text-lg font-black text-slate-900 leading-none">{stats.openAlerts}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <Activity className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Critical</div>
                  <div className="text-lg font-black text-slate-900 leading-none">{stats.critical}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unread</div>
                  <div className="text-lg font-black text-slate-900 leading-none">{stats.unread}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto relative md:max-w-xs shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search updates, alerts, KPIs..." 
              className="pl-9 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-primary text-sm font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-[#F4F7FA]">
            <div className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 shadow-sm">
               {[
                 { id: 'all', label: 'All Updates' },
                 { id: 'alerts', label: 'Alerts' },
                 { id: 'urgent', label: 'Urgent' },
                 { id: 'notifications', label: 'Notifications' },
                 { id: 'resolved', label: 'Resolved' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as TabType)}
                   className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
              <AnimatePresence initial={false}>
                {filteredItems.length === 0 ? (
                  <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-20">
                    <CheckCircle2 className="w-16 h-16 text-slate-200" />
                    <p className="text-sm font-bold uppercase tracking-widest">No items found matching your criteria.</p>
                  </motion.div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {filteredItems.map(item => {
                      const sConfig = SECTOR_CONFIG[item.sector];
                      const Icon = sConfig.icon;
                      
                      return (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white rounded-3xl border ${!item.isRead ? 'border-primary/30 shadow-[0_8px_30px_rgb(15,118,110,0.12)] ring-1 ring-primary/10' : 'border-slate-200 shadow-sm'} p-6 lg:p-8 transition-all hover:shadow-md relative group overflow-hidden`}
                          onClick={() => !item.isRead && handleMarkRead(item.id)}
                        >
                          {!item.isRead && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary"></div>}
                          
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2.5 flex-wrap">
                               <Badge variant="outline" className={`rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none ${sConfig.color}`}>
                                 <Icon className="w-3.5 h-3.5 mr-1.5" /> {sConfig.label}
                               </Badge>
                               <Badge variant="outline" className={`rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-1 border ${URGENCY_CONFIG[item.urgency]}`}>
                                 {item.urgency}
                               </Badge>
                               <Badge variant="outline" className={`rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none ${STATUS_CONFIG[item.status]}`}>
                                 {item.status}
                               </Badge>
                               {item.type === 'alert' && (
                                 <Badge variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-red-50 text-red-600 border-none flex items-center gap-1.5">
                                   <AlertTriangle className="w-3.5 h-3.5" /> Alert
                                 </Badge>
                               )}
                            </div>
                            <div className="text-[10px] font-black text-slate-300 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-lg">
                              <Clock size={12} /> {formatDistanceToNow(item.timestamp)} ago
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="shrink-0 flex items-start">
                              {item.author ? (
                                <Avatar className="w-14 h-14 rounded-2xl shadow-sm ring-4 ring-slate-50">
                                  <AvatarFallback className="bg-slate-100 text-slate-700 font-black text-sm">{item.author.initials}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ring-4 ring-white shadow-sm ${item.type === 'alert' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                  {item.type === 'alert' ? <AlertTriangle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                  {item.title || (item.author ? item.author.name : "System Update")}
                                </h3>
                                {item.author && !item.title && (
                                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.author.role}</div>
                                )}
                              </div>

                              <p className="text-slate-600 font-medium leading-relaxed mb-6 text-[15px]">{item.content}</p>

                              {item.kpi && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl text-xs font-bold text-primary mb-6 hover:bg-primary/10 cursor-pointer transition-colors shadow-sm">
                                  <Activity className="w-4 h-4" />
                                  Impacts: {item.kpi}
                                  <ArrowRight className="w-3.5 h-3.5 text-primary/50 ml-1" />
                                </div>
                              )}
                              
                              {item.status !== 'Resolved' && (
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                  <Button onClick={(e) => { e.stopPropagation(); handleResolve(item.id); }} variant="outline" size="sm" className="h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-emerald-50/50 shadow-sm transition-all">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all">
                                    View Details
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <aside className="w-full lg:w-[420px] xl:w-[480px] bg-white flex flex-col shrink-0 border-l border-slate-200 z-10 shadow-[-10px_0_40px_rgb(0,0,0,0.03)] h-[50vh] lg:h-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
               <div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
                   <Send className="w-4 h-4 text-primary" /> Post Update
                 </h3>
                 <p className="text-[11px] text-slate-500 font-bold tracking-wide">Broadcast or escalate issue.</p>
               </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
               <div className="space-y-6">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Sector</label>
                   <div className="grid grid-cols-2 gap-3">
                     {availableSectors.map(key => {
                       const config = SECTOR_CONFIG[key];
                       if (!config) return null;
                       const SectorIcon = config.icon;
                       return (
                         <button 
                           key={key} 
                           onClick={() => setPostSector(key)} 
                           className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all shadow-sm ${postSector === key ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                         >
                           <SectorIcon className="w-4 h-4" /> {config.label}
                         </button>
                       )
                     })}
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Urgency Level</label>
                   <div className="grid grid-cols-4 gap-2">
                     {(['Low', 'Medium', 'High', 'Critical'] as Urgency[]).map(level => (
                       <button
                         key={level}
                         onClick={() => setPostUrgency(level)}
                         className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${postUrgency === level ? URGENCY_CONFIG[level] : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                       >
                         {level}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title (Optional)</label>
                   <Input 
                     placeholder="Brief summary..." 
                     className="rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus-visible:ring-primary h-12 shadow-inner"
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                   />
                 </div>

                 <div className="space-y-3 flex-1 flex flex-col">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Body</label>
                   <Textarea 
                     placeholder="Describe the situation, required actions, or operational update..." 
                     className="resize-none border-slate-200 bg-slate-50 rounded-xl p-4 text-sm font-medium focus-visible:ring-primary flex-1 min-h-[120px] shadow-inner"
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                   />
                 </div>
               </div>

               <div className="mt-auto pt-2 shrink-0">
                 <Button onClick={handlePost} className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-14 shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                   <Send className="w-4 h-4 mr-2" /> Post to Hub
                 </Button>
               </div>
            </div>
          </aside>
          
        </div>
      </div>
    </AppLayout>
  );
}
