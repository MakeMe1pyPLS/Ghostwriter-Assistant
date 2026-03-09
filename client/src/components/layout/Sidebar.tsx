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
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { name: "Builder", href: "/builder", icon: Wrench, description: "Command Center" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Live Monitoring" },
  { name: "AI Insights", href: "/insights", icon: BrainCircuit, description: "Smart Analysis" },
  { name: "Hub", href: "/hub", icon: MessageSquare, description: "Internal Comms" },
  { name: "Connectors", href: "/connectors", icon: Plug, description: "ERP Sync" },
  { name: "Exports", href: "/exports", icon: Download, description: "Report Engine" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

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
      
      <div className="px-4 lg:px-6 pt-6 shrink-0 mb-2">
        <Link 
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
      
      <div className="flex-1 py-4 lg:py-6 px-4 lg:px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
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
