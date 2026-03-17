import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Plug,
  Download,
  Settings,
  BrainCircuit,
  Wrench,
  ChevronRight,
  ArrowLeft,
  Database,
  Sparkles,
  Wand2,
  ShoppingCart,
  Truck,
  Building2,
  Layers,
  Puzzle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDashboardStore, type Sector, type SectorMode } from "@/hooks/use-dashboard-store";

const navItems = [
  { name: "Builder", href: "/builder", icon: Wrench, description: "Command Center" },
  { name: "Generate", href: "/generate", icon: Sparkles, description: "Generate For Me" },
  { name: "Enhance", href: "/enhance", icon: Wand2, description: "Enhance Dashboard" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Live Monitoring" },
  { name: "AI Insights", href: "/insights", icon: BrainCircuit, description: "Smart Analysis" },
  { name: "Hub", href: "/hub", icon: MessageSquare, description: "Internal Comms" },
  { name: "Data Sources", href: "/data", icon: Database, description: "Import & Connect" },
  { name: "Connectors", href: "/connectors", icon: Plug, description: "ERP Sync" },
  { name: "Exports", href: "/exports", icon: Download, description: "Report Engine" },
];

const SECTOR_OPTIONS: { value: Sector; label: string; icon: any }[] = [
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'logistics', label: 'Logistics', icon: Truck },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
  { value: 'custom', label: 'Custom', icon: Puzzle },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { selectedSector, sectorMode, setSector, setSectorMode } = useDashboardStore();

  return (
    <div className="w-full lg:w-72 border-r border-slate-200 bg-white flex flex-col h-full relative z-[60] shadow-[1px_0_10px_rgb(0,0,0,0.02)]">
      <div className="hidden lg:flex h-16 items-center px-8 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-primary flex items-center justify-center shadow-lg shrink-0">
             <Zap size={22} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[15px] text-slate-900 uppercase tracking-tighter leading-none">ChainInside</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Intelligence IQ</span>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-4 shrink-0">
        <Link 
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="px-4 lg:px-6 pt-4 shrink-0">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setSectorMode('single')}
              className={cn("text-[10px] py-1.5 rounded-md font-bold transition-all",
                sectorMode === 'single' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              data-testid="mode-single"
            >
              Single
            </button>
            <button
              onClick={() => setSectorMode('unified')}
              className={cn("text-[10px] py-1.5 rounded-md font-bold transition-all",
                sectorMode === 'unified' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              data-testid="mode-unified"
            >
              Unified
            </button>
          </div>

          {sectorMode === 'single' ? (
            <div className="grid grid-cols-2 gap-1">
              {SECTOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSector(opt.value)}
                  className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    selectedSector === opt.value ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-500 hover:bg-slate-100 border border-transparent"
                  )}
                  data-testid={`sector-${opt.value}`}
                >
                  <opt.icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Layers className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">3-Sector Unified View</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 py-4 lg:py-4 px-4 lg:px-6 space-y-1.5 overflow-y-auto custom-scrollbar overscroll-contain">
        {navItems.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/builder");
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center group relative px-4 py-3.5 rounded-2xl transition-all duration-200",
                isActive 
                  ? "bg-slate-900 text-white shadow-[0_8px_20px_rgb(0,0,0,0.12)]" 
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors duration-200 mr-4 shrink-0",
                isActive ? "bg-white/15 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-primary shadow-sm group-hover:shadow-md"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black uppercase tracking-widest truncate">{item.name}</span>
                <span className={cn("text-[10px] font-medium opacity-60 truncate", isActive ? "text-slate-300" : "text-slate-400")}>{item.description}</span>
              </div>
              {isActive && (
                 <motion.div layoutId="activeNav" className="absolute right-4 hidden lg:block">
                   <ChevronRight className="w-4 h-4 text-primary" />
                 </motion.div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-6 lg:p-8 border-t border-slate-50 shrink-0">
        <Link 
          href="/settings"
          onClick={onNavigate} 
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
        </Link>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function Zap({ size, fill, className }: { size: number, fill: string, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
