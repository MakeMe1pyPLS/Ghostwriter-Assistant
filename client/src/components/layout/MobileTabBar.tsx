// Bottom tab bar for phones and tablets (below 1024px): the core loop is one
// thumb-tap away. "More" opens the full menu.
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { TAB_ITEMS, isActivePath, ALL_NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = { "/plan": "Plan", "/insights": "Analyst", "/bottlenecks": "Bottlenecks", "/hub": "Hub" };

export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const [location] = useLocation();
  const onTab = TAB_ITEMS.some((t) => isActivePath(location, t.href));
  const moreActive = !onTab && ALL_NAV_ITEMS.some((n) => isActivePath(location, n.href));

  return (
    <nav
      aria-label="Quick navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-xl grid grid-cols-5 h-16 px-1">
        {TAB_ITEMS.map((item) => {
          const active = isActivePath(location, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour ? `tab-${item.tour}` : undefined}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-1 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
            >
              <TabIcon active={active} icon={item.icon} />
              <span className={cn("text-[10.5px] font-semibold leading-none transition-colors", active ? "text-slate-900" : "text-slate-400")}>{SHORT[item.href] ?? item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={onMore}
          className="relative flex flex-col items-center justify-center gap-1 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          aria-label="More pages"
        >
          <TabIcon active={moreActive} icon={LayoutGrid} />
          <span className={cn("text-[10.5px] font-semibold leading-none", moreActive ? "text-slate-900" : "text-slate-400")}>More</span>
        </button>
      </div>
    </nav>
  );
}

function TabIcon({ active, icon: Icon }: { active: boolean; icon: any }) {
  return (
    <span className="relative flex items-center justify-center w-12 h-8">
      {active && (
        <motion.span
          layoutId="tabPill"
          className="absolute inset-0 rounded-full bg-slate-900"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <motion.span whileTap={{ scale: 0.86 }} className="relative">
        <Icon className={cn("w-[19px] h-[19px] transition-colors", active ? "text-teal-300" : "text-slate-500")} />
      </motion.span>
    </span>
  );
}
