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
  Puzzle,
  Users,
  Building,
  AlertCircle,
  AlertOctagon,
  Lightbulb,
  Workflow,
  Lock,
  Bell,
  Share2,
  Activity,
  KeyRound,
  Target,
  BookOpen,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountDropdown } from "@/components/AccountDropdown";
import { motion } from "framer-motion";
import { useDashboardStore, type Sector, type SectorMode, type BusinessStructure } from "@/hooks/use-dashboard-store";
import { hasPlan, getFeatureRequirement, type FeatureKey } from "@/lib/pricing";

type NavItem = { name: string; href: string; icon: any; description: string; feature?: FeatureKey; tour?: string };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Grow",
    items: [
      { name: "Growth Plan", href: "/plan", icon: Target, description: "Goals & action board", tour: "plan" },
      { name: "AI Analyst", href: "/insights", icon: BrainCircuit, description: "Ask anything about your numbers", tour: "analyst" },
      { name: "KPI Library", href: "/kpis", icon: BookOpen, description: "Metrics for every industry", tour: "kpis" },
    ],
  },
  {
    label: "Spot & fix",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Health score & live view" },
      { name: "Bottlenecks", href: "/bottlenecks", icon: AlertOctagon, description: "Find what slows you down", feature: "bottlenecks", tour: "bottlenecks" },
      { name: "Recommendations", href: "/recommendations", icon: Lightbulb, description: "Step-by-step fixes", feature: "recommendations" },
      { name: "Pipeline", href: "/pipeline", icon: Workflow, description: "Signal to resolution", feature: "pipeline" },
    ],
  },
  {
    label: "Collaborate",
    items: [
      { name: "Collabs", href: "/collabs", icon: Handshake, description: "Share data with partners", tour: "collabs" },
      { name: "Hub", href: "/hub", icon: MessageSquare, description: "Discuss & resolve together", tour: "hub" },
    ],
  },
  {
    label: "Build",
    items: [
      { name: "Builder", href: "/builder", icon: Wrench, description: "Design your dashboard" },
      { name: "Generate", href: "/generate", icon: Sparkles, description: "Start from scratch with AI" },
      { name: "Enhance", href: "/enhance", icon: Wand2, description: "Improve an existing dashboard" },
    ],
  },
  {
    label: "Data",
    items: [
      { name: "Data Sources", href: "/data", icon: Database, description: "Import CSV, Excel, Sheets, APIs", tour: "data" },
      { name: "Connectors", href: "/connectors", icon: Plug, description: "Apps & integrations" },
      { name: "Exports", href: "/exports", icon: Download, description: "Excel, CSV, JSON & more" },
    ],
  },
];

const upcomingNavItems = [
  { name: "Team Management", icon: Users, description: "Roles & Members" },
  { name: "Notifications", icon: Bell, description: "Alerts & Digest" },
  { name: "Audit Activity", icon: Activity, description: "Change History" },
  { name: "API Access", icon: KeyRound, description: "Developer Keys" },
];

const SECTOR_OPTIONS: { value: Sector; label: string; icon: any }[] = [
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'logistics', label: 'Logistics', icon: Truck },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
  { value: 'custom', label: 'Custom', icon: Puzzle },
];

const MODE_OPTIONS: { value: BusinessStructure; label: string; short: string; icon: any }[] = [
  { value: 'single', label: 'Single Business', short: 'Single', icon: Building },
  { value: 'partnered', label: 'Partnered', short: 'Partnered', icon: Users },
  { value: 'unified-chain', label: 'Unified Chain', short: 'Unified', icon: Layers },
];

function getSectorLabel(sector: Sector): string {
  const map: Record<Sector, string> = {
    ecommerce: 'E-comm',
    logistics: 'Logistics',
    manufacturing: 'Mfg',
    unified: 'Unified',
    custom: 'Custom',
  };
  return map[sector] ?? sector;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const {
    selectedSector, sectorMode, setSector, setSectorMode,
    businessStructure, setBusinessStructure, connectedSectors, setupComplete,
  } = useDashboardStore();
  const currentUser = useDashboardStore((s) => s.currentUser);

  const handleModeChange = (mode: BusinessStructure) => {
    setBusinessStructure(mode);
  };

  const activeModeSectors = connectedSectors.filter(s => s !== 'unified' && s !== 'custom');

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
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Business Mode</span>
            {businessStructure === 'partnered' && activeModeSectors.length >= 2 && (
              <span className="text-[8px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {getSectorLabel(activeModeSectors[0])} + {getSectorLabel(activeModeSectors[1])}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg">
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleModeChange(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 rounded-md transition-all",
                  businessStructure === opt.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
                data-testid={`mode-${opt.value}`}
                title={opt.label}
              >
                <opt.icon className="w-3 h-3" />
                <span className="text-[9px] font-bold leading-none">{opt.short}</span>
              </button>
            ))}
          </div>

          {businessStructure === 'single' && (
            <div className="grid grid-cols-2 gap-1">
              {SECTOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSector(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    selectedSector === opt.value
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-slate-500 hover:bg-slate-100 border border-transparent"
                  )}
                  data-testid={`sector-${opt.value}`}
                >
                  <opt.icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {businessStructure === 'partnered' && (
            <div className="flex flex-wrap gap-1">
              {activeModeSectors.length >= 2 ? (
                activeModeSectors.slice(0, 2).map(s => {
                  const opt = SECTOR_OPTIONS.find(o => o.value === s);
                  if (!opt) return null;
                  return (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      <opt.icon className="w-3 h-3" />
                      {opt.label}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 w-full">
                  <AlertCircle className="w-3 h-3" />
                  Configure sectors in Settings
                </div>
              )}
            </div>
          )}

          {businessStructure === 'unified-chain' && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Layers className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">3-Sector Unified View</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-2 px-3 lg:px-4 overflow-y-auto custom-scrollbar-hidden overscroll-contain">
        {navGroups.map((group) => (
          <div key={group.label} className="pb-2">
            <p className="px-4 pt-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href || (location === "/app" && item.href === "/plan");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    data-tour={item.tour ? `nav-${item.tour}` : undefined}
                    className={cn(
                      "flex items-center group relative px-3 py-2.5 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isActive
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeNavBg"
                        className="absolute inset-0 rounded-2xl bg-slate-900 shadow-[0_8px_20px_rgb(0,0,0,0.12)]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <div className={cn(
                      "relative p-2 rounded-xl transition-colors duration-200 mr-3 shrink-0",
                      isActive ? "bg-white/15 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-primary shadow-sm group-hover:shadow-md"
                    )}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="relative flex flex-col min-w-0">
                      <span className="text-[13px] font-black uppercase tracking-widest truncate">{item.name}</span>
                      <span className={cn("text-[10px] font-medium opacity-70 truncate", isActive ? "text-slate-300" : "text-slate-400")}>{item.description}</span>
                    </div>
                    {!isActive && item.feature && !hasPlan(currentUser?.plan, item.feature) && (
                      <span
                        className="relative ml-auto flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0"
                        data-testid={`lock-nav-${item.feature}`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        {getFeatureRequirement(item.feature).label.slice(0, 3)}
                      </span>
                    )}
                    {isActive && <ChevronRight className="relative ml-auto w-4 h-4 text-primary hidden lg:block" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 mt-3 border-t border-slate-100">
          <p className="px-4 mb-2 text-[9px] font-black uppercase tracking-widest text-slate-300">Coming Soon</p>
          {upcomingNavItems.map((item) => (
            <div
              key={item.name}
              aria-disabled="true"
              title={`${item.name} — coming soon`}
              className="flex items-center group relative px-4 py-3.5 rounded-2xl text-slate-300 cursor-not-allowed select-none"
              data-testid={`nav-upcoming-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="p-2 rounded-xl mr-4 shrink-0 bg-slate-50 text-slate-300 border border-dashed border-slate-200">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black uppercase tracking-widest truncate">{item.name}</span>
                <span className="text-[10px] font-medium opacity-70 truncate">{item.description}</span>
              </div>
              <span className="ml-auto flex items-center text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                Soon
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-5 border-t border-slate-50 shrink-0 space-y-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group relative"
          data-testid="link-settings-sidebar"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Settings</span>
          {!setupComplete && (
            <span className="ml-auto flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" />
              Setup
            </span>
          )}
        </Link>
        <AccountDropdown />
      </div>
    </div>
  );
}

function Zap({ size, fill, className }: { size: number, fill: string, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
