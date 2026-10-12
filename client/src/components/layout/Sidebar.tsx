import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ShoppingCart, Truck, Building2, Layers, Puzzle, Users, Building,
  AlertCircle, Lock, ChevronDown, PanelLeftClose, PanelLeftOpen, Search, Briefcase, Check, ChevronsUpDown,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useClientsStore } from "@/hooks/use-clients-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { cn } from "@/lib/utils";
import { AccountDropdown } from "@/components/AccountDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardStore, type Sector, type BusinessStructure } from "@/hooks/use-dashboard-store";
import { hasPlan, getFeatureRequirement } from "@/lib/pricing";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_GROUPS, SETTINGS_ITEM, UPCOMING_ITEMS, isActivePath, type NavItem } from "@/lib/nav";
import { EASE_OUT } from "@/components/motion";
import { openCommandPalette } from "@/components/CommandPalette";
import { Logo } from "@/components/Logo";

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
  const map: Record<Sector, string> = { ecommerce: 'E-commerce', logistics: 'Logistics', manufacturing: 'Manufacturing', unified: 'Unified', custom: 'Custom' };
  return map[sector] ?? sector;
}

interface SidebarProps {
  onNavigate?: () => void;
  /** Icon-only rail (laptops). The phone/tablet sheet always shows the full sidebar. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function Sidebar({ onNavigate, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const [location] = useLocation();
  const {
    selectedSector, setSector, businessStructure, setBusinessStructure, connectedSectors, setupComplete,
  } = useDashboardStore();
  const currentUser = useDashboardStore((s) => s.currentUser);
  const [modeOpen, setModeOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Keep the current page visible in the nav on short screens.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [location, collapsed]);

  const activeModeSectors = connectedSectors.filter(s => s !== 'unified' && s !== 'custom');
  const mode = MODE_OPTIONS.find((m) => m.value === businessStructure) ?? MODE_OPTIONS[0];
  const modeSummary = businessStructure === 'single'
    ? getSectorLabel(selectedSector)
    : businessStructure === 'partnered'
      ? (activeModeSectors.length >= 2 ? `${getSectorLabel(activeModeSectors[0])} + ${getSectorLabel(activeModeSectors[1])}` : 'Set up sectors')
      : '3-sector view';

  return (
    <div
      className={cn(
        "border-r border-slate-200/80 bg-white flex flex-col h-full relative z-[60] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[76px]" : "w-full lg:w-64",
      )}
    >
      {/* Brand + collapse */}
      <div className={cn("h-16 flex items-center shrink-0 border-b border-slate-100", collapsed ? "justify-center px-0" : "px-5 gap-3")}>
        <Link href="/plan" onClick={onNavigate} className="flex items-center gap-3 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label="ChainInsideIQ home">
          <Logo size={34} compact={collapsed} />
        </Link>
        {!collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* Search + business mode */}
      <div className="px-3 pt-3 shrink-0 space-y-2">
        <RailTip label="Search & jump" hint="Ctrl K" enabled={collapsed}>
          <button
            onClick={() => { onNavigate?.(); openCommandPalette(); }}
            className={cn(
              "w-full flex items-center gap-2.5 h-10 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-white transition-colors",
              collapsed ? "justify-center" : "px-3",
            )}
            aria-label="Search and jump to a page"
          >
            <Search className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-[13px] font-medium">Search or jump to…</span>
                <kbd className="ml-auto hidden lg:inline-flex items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Ctrl K</kbd>
              </>
            )}
          </button>
        </RailTip>

        {!collapsed && <WorkspaceSwitcher onNavigate={onNavigate} />}

        {!collapsed && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setModeOpen((o) => !o)}
              className="w-full flex items-center gap-2.5 px-3 h-11 text-left hover:bg-slate-50 transition-colors"
              aria-expanded={modeOpen}
              data-testid="button-business-mode"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <mode.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-900 leading-tight truncate">{mode.label}</p>
                <p className="text-[11px] text-slate-400 leading-tight truncate">{modeSummary}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", modeOpen && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {modeOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg mt-2">
                      {MODE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBusinessStructure(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 py-2 rounded-md transition-all",
                            businessStructure === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                          data-testid={`mode-${opt.value}`}
                          title={opt.label}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold leading-none">{opt.short}</span>
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
                              "flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-all",
                              selectedSector === opt.value ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-500 hover:bg-slate-100 border border-transparent"
                            )}
                            data-testid={`sector-${opt.value}`}
                          >
                            <opt.icon className="w-3.5 h-3.5" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {businessStructure === 'partnered' && activeModeSectors.length < 2 && (
                      <Link href="/settings" onClick={onNavigate} className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100">
                        <AlertCircle className="w-3.5 h-3.5" /> Configure sectors in Settings
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar-hidden overscroll-contain" aria-label="Main">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="pb-1">
            {collapsed
              ? (gi > 0 && <div className="mx-auto my-2 h-px w-6 bg-slate-200" aria-hidden />)
              : <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActivePath(location, item.href)} collapsed={collapsed} onNavigate={onNavigate} locked={!!item.feature && !hasPlan(currentUser?.plan, item.feature)} />
              ))}
            </div>
          </div>
        ))}

        {!collapsed && (
          <div className="mt-3 mx-1 rounded-xl border border-dashed border-slate-200 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">Coming soon</p>
            <div className="flex flex-wrap gap-1">
              {UPCOMING_ITEMS.map((item) => (
                <span
                  key={item.name}
                  aria-disabled="true"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 rounded-md px-1.5 py-0.5"
                  data-testid={`nav-upcoming-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-3 h-3" /> {item.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 shrink-0 space-y-1">
        <NavLink item={SETTINGS_ITEM} active={isActivePath(location, SETTINGS_ITEM.href)} collapsed={collapsed} onNavigate={onNavigate} attention={!setupComplete} testId="link-settings-sidebar" />
        <RailTip label="Back to home page" enabled={collapsed}>
          <Link
            href="/"
            onClick={onNavigate}
            className={cn("flex items-center gap-3 h-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 transition-colors", collapsed ? "justify-center" : "px-3")}
            aria-label="Back to home page"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-[13px] font-semibold">Home page</span>}
          </Link>
        </RailTip>
        {collapsed && onToggleCollapsed && (
          <RailTip label="Expand sidebar" enabled>
            <button onClick={onToggleCollapsed} className="w-full flex items-center justify-center h-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 transition-colors" aria-label="Expand sidebar">
              <PanelLeftOpen className="w-[18px] h-[18px]" />
            </button>
          </RailTip>
        )}
        <div className="pt-1">
          <AccountDropdown compact={collapsed} />
        </div>
      </div>
    </div>
  );
}

/** Switch between your own business and client workspaces. Shown once a client exists. */
function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const clients = useClientsStore((s) => s.clients);
  const activeClientId = useClientsStore((s) => s.activeClientId);
  const switchTo = useClientsStore((s) => s.switchTo);
  const ownName = useGrowthStore((s) => s.profile?.businessName);
  const [, navigate] = useLocation();
  if (clients.length === 0) return null;
  const active = clients.find((c) => c.id === activeClientId);
  const pick = (id: string | null) => { switchTo(id); onNavigate?.(); navigate("/plan"); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "w-full flex items-center gap-2.5 px-3 h-11 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          active ? "border-violet-200 bg-violet-50 hover:bg-violet-100/70" : "border-slate-200 bg-white hover:bg-slate-50",
        )} data-testid="workspace-switcher">
          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", active ? "bg-violet-600 text-white" : "bg-slate-900 text-teal-300")}>
            {active ? <Briefcase className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-slate-900 leading-tight truncate">{active ? active.name : ownName || "My business"}</span>
            <span className="block text-[11px] text-slate-500 leading-tight truncate">{active ? "Client workspace" : "Your workspace"}</span>
          </span>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[248px] rounded-xl z-[300]">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspaces</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => pick(null)} className="gap-2 rounded-lg">
          <Building className="w-4 h-4 text-slate-500" /><span className="flex-1 truncate">{ownName || "My business"}</span>{!active && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
        {clients.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => pick(c.id)} className="gap-2 rounded-lg">
            <Briefcase className="w-4 h-4 text-violet-500" /><span className="flex-1 truncate">{c.name}</span>{c.id === activeClientId && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { onNavigate?.(); navigate("/clients"); }} className="rounded-lg font-semibold">Manage clients</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ item, active, collapsed, onNavigate, locked, attention, testId }: {
  item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void; locked?: boolean; attention?: boolean; testId?: string;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour={item.tour ? `nav-${item.tour}` : undefined}
      data-testid={testId}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.name : undefined}
      className={cn(
        "relative flex items-center h-10 rounded-xl transition-colors duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        collapsed ? "justify-center" : "px-3 gap-3",
        active ? "text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70",
      )}
    >
      {active && (
        <motion.span
          layoutId={collapsed ? "activeNavRail" : "activeNavBg"}
          className="absolute inset-0 rounded-xl bg-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.18)]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <item.icon className={cn("relative w-[18px] h-[18px] shrink-0 transition-colors", active ? "text-teal-300" : "text-slate-400 group-hover:text-primary")} />
      {!collapsed && <span className="relative text-[13.5px] font-semibold truncate">{item.name}</span>}
      {!collapsed && locked && !active && (
        <span className="relative ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md" data-testid={`lock-nav-${item.feature}`} title={`Included in ${getFeatureRequirement(item.feature!).label}`}>
          <Lock className="w-2.5 h-2.5" /> {getFeatureRequirement(item.feature!).label.slice(0, 3)}
        </span>
      )}
      {!collapsed && attention && (
        <span className="relative ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
          <AlertCircle className="w-2.5 h-2.5" /> Setup
        </span>
      )}
      {collapsed && (locked || attention) && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" aria-hidden />}
    </Link>
  );
  return <RailTip label={item.name} hint={item.description} enabled={collapsed}>{link}</RailTip>;
}

/** Tooltip shown only in the collapsed rail. */
function RailTip({ label, hint, enabled, children }: { label: string; hint?: string; enabled: boolean; children: React.ReactElement }) {
  if (!enabled) return children;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[12px] font-bold">{label}</p>
        {hint && <p className="text-[11px] text-slate-300">{hint}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

