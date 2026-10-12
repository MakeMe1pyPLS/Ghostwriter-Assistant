// One source of truth for app navigation: the sidebar, the phone/tablet tab
// bar and the quick-jump search (Ctrl/⌘ K) all read from here.
import {
  Target, BrainCircuit, BookOpen, LayoutDashboard, AlertOctagon, Lightbulb, Workflow,
  Handshake, MessageSquare, Wrench, Sparkles, Wand2, Database, Plug, Download,
  Users, Bell, Activity, KeyRound, Settings, Presentation, Briefcase,
} from "lucide-react";
import type { FeatureKey } from "@/lib/pricing";

export type NavItem = {
  name: string;
  href: string;
  icon: any;
  description: string;
  feature?: FeatureKey;
  tour?: string;
  keywords?: string;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Grow",
    items: [
      { name: "Growth Plan", href: "/plan", icon: Target, description: "Goals & action board", tour: "plan", keywords: "goal steps actions board tasks" },
      { name: "AI Analyst", href: "/insights", icon: BrainCircuit, description: "Ask anything about your numbers", tour: "analyst", keywords: "chat ask question forecast" },
      { name: "KPI Library", href: "/kpis", icon: BookOpen, description: "Metrics for every industry", tour: "kpis", keywords: "metrics measures north star ai automation" },
    ],
  },
  {
    label: "Consult",
    items: [
      { name: "AI Consultant", href: "/consult", icon: Presentation, description: "Pricing, cash, growth & more sessions", keywords: "consultant session swot pricing cash flow hiring strategy advice" },
      { name: "Clients", href: "/clients", icon: Briefcase, description: "Workspaces for each client", feature: "client-workspaces", keywords: "consultant agency client workspace report engagement" },
    ],
  },
  {
    label: "Spot & fix",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Health score & live view", keywords: "health score overview" },
      { name: "Bottlenecks", href: "/bottlenecks", icon: AlertOctagon, description: "Find what slows you down", feature: "bottlenecks", tour: "bottlenecks", keywords: "problems issues constraints" },
      { name: "Recommendations", href: "/recommendations", icon: Lightbulb, description: "Step-by-step fixes", feature: "recommendations", keywords: "fixes advice" },
      { name: "Pipeline", href: "/pipeline", icon: Workflow, description: "Signal to resolution", feature: "pipeline", keywords: "flow status" },
    ],
  },
  {
    label: "Collaborate",
    items: [
      { name: "Collabs", href: "/collabs", icon: Handshake, description: "Share data with partners", tour: "collabs", keywords: "partners suppliers share invite" },
      { name: "Hub", href: "/hub", icon: MessageSquare, description: "Discuss & resolve together", tour: "hub", keywords: "messages threads team teams chat" },
    ],
  },
  {
    label: "Build",
    items: [
      { name: "Builder", href: "/builder", icon: Wrench, description: "Design your dashboard", keywords: "widgets layout edit" },
      { name: "Generate", href: "/generate", icon: Sparkles, description: "Start from scratch with AI", keywords: "new dashboard create" },
      { name: "Enhance", href: "/enhance", icon: Wand2, description: "Improve an existing dashboard", keywords: "upload improve existing" },
    ],
  },
  {
    label: "Data",
    items: [
      { name: "Data Sources", href: "/data", icon: Database, description: "Import CSV, Excel, Sheets, APIs", tour: "data", keywords: "import upload csv excel sheets api" },
      { name: "Connectors", href: "/connectors", icon: Plug, description: "Apps & integrations", keywords: "apps integrations shopify quickbooks" },
      { name: "Exports", href: "/exports", icon: Download, description: "Excel, CSV, JSON & more", keywords: "download excel power bi csv" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { name: "Settings", href: "/settings", icon: Settings, description: "Account, AI engine & connected tools", keywords: "account engine teams webhook preferences" };

export const UPCOMING_ITEMS = [
  { name: "Team Management", icon: Users },
  { name: "Notifications", icon: Bell },
  { name: "Audit Activity", icon: Activity },
  { name: "API Access", icon: KeyRound },
];

/** The phone/tablet tab bar: the core loop in four taps, plus "More". */
const byHref = (href: string) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === href)!;
export const TAB_ITEMS: NavItem[] = ["/plan", "/insights", "/bottlenecks", "/hub"].map(byHref);

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

export function isActivePath(location: string, href: string): boolean {
  return location === href || (location === "/app" && href === "/plan") || ((href === "/consult" || href === "/clients") && location.startsWith(href + "/"));
}
