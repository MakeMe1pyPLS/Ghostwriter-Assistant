import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Tag, 
  Clock, 
  Building2, 
  Truck, 
  ShoppingCart,
  Layers
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Sector = 'manufacturing' | 'logistics' | 'ecommerce' | 'unified';

interface Message {
  id: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: Date;
  sector: Sector;
  tags: string[];
}

const SECTOR_CONFIG = {
  manufacturing: { icon: Building2, color: 'bg-blue-100 text-blue-700', label: 'Manufacturing' },
  logistics: { icon: Truck, color: 'bg-orange-100 text-orange-700', label: 'Logistics' },
  ecommerce: { icon: ShoppingCart, color: 'bg-purple-100 text-purple-700', label: 'E-commerce' },
  unified: { icon: Layers, color: 'bg-slate-100 text-slate-700', label: 'Unified' },
};

const initialMessages: Message[] = [
  {
    id: "1",
    author: { name: "Sarah Chen", role: "Logistics Director", initials: "SC" },
    content: "Warehouse delay reported at West Coast Hub due to severe weather. Rerouting urgent pallets to Seattle.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    sector: "logistics",
    tags: ["Delay", "West Coast"]
  },
  {
    id: "2",
    author: { name: "Marcus Johnson", role: "E-comm Manager", initials: "MJ" },
    content: "E-commerce demand spike detected for SKU-492. We need to ensure we have enough buffer stock.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    sector: "ecommerce",
    tags: ["Demand Spike", "SKU-492"]
  },
  {
    id: "3",
    author: { name: "Elena Rodriguez", role: "Plant Supervisor", initials: "ER" },
    content: "Manufacturing capacity increase scheduled for next week. Line B will run 24/7 to cover the Q3 shortfall.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    sector: "manufacturing",
    tags: ["Capacity", "Q3"]
  }
];

export default function HubPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [selectedSector, setSelectedSector] = useState<Sector>('unified');
  const [activeFilter, setActiveFilter] = useState<Sector | 'all'>('all');

  const handlePost = () => {
    if (!newMessage.trim()) return;

    const post: Message = {
      id: Date.now().toString(),
      author: { name: "Current User", role: "Supply Chain Manager", initials: "CU" },
      content: newMessage,
      timestamp: new Date(),
      sector: selectedSector,
      tags: ["Update"]
    };

    setMessages([post, ...messages]);
    setNewMessage("");
  };

  const filteredMessages = activeFilter === 'all' 
    ? messages 
    : messages.filter(m => m.sector === activeFilter);

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Communication Hub</h1>
          <p className="text-muted-foreground text-sm">Cross-sector updates and alerts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Main Feed */}
          <div className="md:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            {/* Compose Area */}
            <div className="p-4 border-b border-border bg-slate-50/50">
              <Textarea 
                placeholder="Post an update to the network..." 
                className="resize-none border-slate-200 focus-visible:ring-primary mb-3 bg-white"
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(Object.keys(SECTOR_CONFIG) as Sector[]).map(sector => {
                    const config = SECTOR_CONFIG[sector];
                    const isSelected = selectedSector === sector;
                    const Icon = config.icon;
                    return (
                      <button
                        key={sector}
                        onClick={() => setSelectedSector(sector)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                          ${isSelected ? config.color + ' border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
                <Button size="sm" onClick={handlePost} className="gap-2">
                  <Send className="w-4 h-4" />
                  Post
                </Button>
              </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-0">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No messages found for this filter.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredMessages.map(msg => {
                    const sectorConfig = SECTOR_CONFIG[msg.sector];
                    const SectorIcon = sectorConfig.icon;
                    
                    return (
                      <div key={msg.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {msg.author.initials}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">{msg.author.name}</span>
                                <span className="text-xs text-muted-foreground">• {msg.author.role}</span>
                              </div>
                              <span className="text-xs flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            
                            <p className="text-slate-700 text-sm mt-2 mb-3 leading-relaxed">
                              {msg.content}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className={`text-xs flex gap-1 items-center px-2 py-0.5 rounded-sm bg-transparent border-0 ${sectorConfig.color.split(' ')[1]}`}>
                                <SectorIcon className="w-3 h-3" />
                                {sectorConfig.label}
                              </Badge>
                              
                              <div className="flex gap-2">
                                {msg.tags.map(tag => (
                                  <span key={tag} className="text-xs flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Filters */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-border p-5">
              <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Filter Feed</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                    ${activeFilter === 'all' ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    All Updates
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                    {messages.length}
                  </span>
                </button>
                
                {(Object.keys(SECTOR_CONFIG) as Sector[]).map(sector => {
                  const config = SECTOR_CONFIG[sector];
                  const Icon = config.icon;
                  const count = messages.filter(m => m.sector === sector).length;
                  
                  return (
                    <button
                      key={sector}
                      onClick={() => setActiveFilter(sector)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                        ${activeFilter === sector ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${activeFilter === sector ? config.color.split(' ')[1] : ''}`} />
                        {config.label}
                      </div>
                      <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl border border-primary/20 p-5">
              <h3 className="font-semibold text-primary mb-2 text-sm flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Hub Automation
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Connect your ERP to automatically post crucial delay or demand spike alerts directly to this feed.
              </p>
              <Button variant="outline" size="sm" className="w-full text-xs h-8 border-primary/20 text-primary hover:bg-primary/10">
                Configure Rules
              </Button>
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
