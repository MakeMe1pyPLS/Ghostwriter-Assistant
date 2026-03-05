import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Plug,
  Download,
  Settings,
  BrainCircuit,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Builder", href: "/builder", icon: Wrench },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Insights", href: "/insights", icon: BrainCircuit },
  { name: "Hub", href: "/hub", icon: MessageSquare },
  { name: "Connectors", href: "/connectors", icon: Plug },
  { name: "Exports", href: "/exports", icon: Download },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            C
          </div>
          <span className="font-bold text-lg text-foreground">ChainInsideIQ</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/builder");
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </a>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <Link href="/settings">
          <a className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </Link>
      </div>
    </div>
  );
}
