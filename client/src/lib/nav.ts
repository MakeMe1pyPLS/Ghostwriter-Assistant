// One source of truth for app navigation: the sidebar, the phone/tablet tab
// bar and the quick-jump search (Ctrl/⌘ K) all read from here.
import {
  Target, BrainCircuit, BookOpen, LayoutDashboard, AlertOctagon, Lightbulb, Workflow,
  Handshake, MessageSquare, Wrench, Sparkles, Wand2, Database, Plug, Download,
  Users, Bell, Activity, KeyRound, Settings, Presentation, Briefcase, Warehouse, Megaphone, TrendingUp, Eye,
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
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Health score & live view", keywords: "health score overview" },
      { name: "Growth Plan", href: "/plan", icon: Target, description: "Goals & action board", tour: "plan", keywords: "goal steps actions board tasks" },
    ],
  },
  {
    label: "Business intelligence",
    items: [
      { name: "KPI Library", href: "/kpis", icon: BookOpen, description: "Metrics for every industry", tour: "kpis", keywords: "metrics measures north star ai automation" },
      { name: "Builder", href: "/builder", icon: Wrench, description: "Design your dashboard", keywords: "widgets layout edit" },
      { name: "Generate", href: "/generate", icon: Sparkles, description: "Start from scratch with AI", keywords: "new dashboard create" },
      { name: "Enhance", href: "/enhance", icon: Wand2, description: "Improve an existing dashboard", keywords: "upload improve existing" },
      { name: "Exports", href: "/exports", icon: Download, description: "Excel, CSV, JSON & more", keywords: "download excel power bi csv" },
    ],
  },
  {
    label: "Operational intelligence",
    items: [
      { name: "Bottlenecks", href: "/bottlenecks", icon: AlertOctagon, description: "Find what slows you down", feature: "bottlenecks", tour: "bottlenecks", keywords: "problems issues constraints" },
      { name: "Recommendations", href: "/recommendations", icon: Lightbulb, description: "Step-by-step fixes", feature: "recommendations", keywords: "fixes advice" },
      { name: "Pipeline", href: "/pipeline", icon: Workflow, description: "Signal to resolution", feature: "pipeline", keywords: "flow status" },
      { name: "Fulfillment", href: "/fulfillment", icon: Warehouse, description: "Orders, zones & client sharing", keywords: "3pl warehouse orders pick pack ship returns load truck vehicle apparel supplements" },
    ],
  },
  {
    label: "Go-to-market intelligence",
    items: [
      { name: "Go-to-market", href: "/gtm", icon: Megaphone, description: "Ads and sales pipeline from your files", keywords: "marketing ads campaigns roas cac funnel deals crm pipeline channels sales leads" },
    ],
  },
  {
    label: "AI intelligence",
    items: [
      { name: "AI Analyst", href: "/insights", icon: BrainCircuit, description: "Ask anything about your numbers", tour: "analyst", keywords: "chat ask question forecast" },
      { name: "AI Consultant", href: "/consult", icon: Presentation, description: "Pricing, cash, growth & more sessions", keywords: "consultant session swot pricing cash flow hiring strategy advice" },
    ],
  },
  {
    label: "Clients & partners",
    items: [
      { name: "Clients", href: "/clients", icon: Briefcase, description: "Workspaces for each client", feature: "client-workspaces", keywords: "consultant agency client workspace report engagement" },
      { name: "Shared with you", href: "/shared", icon: Eye, description: "Workspaces shared with you, view only", keywords: "client portal shared read only view invited" },
      { name: "Collabs", href: "/collabs", icon: Handshake, description: "Share data with partners", tour: "collabs", keywords: "partners suppliers share invite" },
      { name: "Hub", href: "/hub", icon: MessageSquare, description: "Discuss & resolve together", tour: "hub", keywords: "messages threads team teams chat" },
    ],
  },
  {
    label: "Data",
    items: [
      { name: "Data Sources", href: "/data", icon: Database, description: "Import CSV, Excel, Sheets, APIs", tour: "data", keywords: "import upload csv excel sheets api" },
      { name: "Connectors", href: "/connectors", icon: Plug, description: "Apps & integrations", keywords: "apps integrations shopify quickbooks" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { name: "Settings", href: "/settings", icon: Settings, description: "Account, AI engine & connected tools", keywords: "account engine teams webhook preferences" };

export const UPCOMING_ITEMS = [
  { name: "Team Management", icon: Users },
  { name: "Notifications", icon: Bell },
  { name: "Forecasting", icon: TrendingUp },
  { name: "Team audit trail", icon: Activity },
  { name: "API Access", icon: KeyRound },
];

/** The phone/tablet tab bar: the core loop in four taps, plus "More". */
const byHref = (href: string) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === href)!;
export const TAB_ITEMS: NavItem[] = ["/plan", "/insights", "/bottlenecks", "/hub"].map(byHref);

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

export function isActivePath(location: string, href: string): boolean {
  return location === href || (location === "/app" && href === "/plan") || ((href === "/consult" || href === "/clients" || href === "/shared") && location.startsWith(href + "/"));
}
