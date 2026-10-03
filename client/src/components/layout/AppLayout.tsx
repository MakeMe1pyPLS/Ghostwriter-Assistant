import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { OnboardingModal } from "@/components/OnboardingModal";
import { DemoBanner } from "@/components/DemoBanner";
import { PageTransition } from "@/components/motion";
import { ProductTour } from "@/components/ProductTour";
import { CommandPalette, openCommandPalette } from "@/components/CommandPalette";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_PREF_KEY = "ciq_sidebar";
type SidebarPref = "auto" | "expanded" | "collapsed";

function readPref(): SidebarPref {
  try { return (localStorage.getItem(SIDEBAR_PREF_KEY) as SidebarPref) || "auto"; } catch { return "auto"; }
}

/** True on wide screens (≥1280px), where the full sidebar fits comfortably. */
function useWide() {
  const query = "(min-width: 1280px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [location] = useLocation();
  const wide = useWide();
  const [pref, setPref] = useState<SidebarPref>(readPref);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Laptops and landscape tablets (1024–1279px) get the icon rail by default so
  // content has room; wide screens get the full sidebar. Either can be toggled.
  const collapsed = pref === "auto" ? !wide : pref === "collapsed";
  const toggleCollapsed = useCallback(() => {
    const next: SidebarPref = collapsed ? "expanded" : "collapsed";
    setPref(next);
    try { localStorage.setItem(SIDEBAR_PREF_KEY, next); } catch { /* private mode */ }
  }, [collapsed]);

  // Reset scroll and the header shadow on page change.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
    setSheetOpen(false);
  }, [location]);

  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    const s = e.currentTarget.scrollTop > 4;
    if (s !== scrolled) setScrolled(s);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      <DemoBanner />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="hidden lg:block shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </div>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Phone & tablet header */}
          <header
            className={cn(
              "lg:hidden flex items-center gap-1 h-14 px-2 sm:px-4 bg-white/85 backdrop-blur-xl sticky top-0 z-40 shrink-0 border-b transition-[border-color,box-shadow] duration-200",
              scrolled ? "border-slate-200 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.18)]" : "border-transparent",
            )}
          >
            <button
              onClick={() => setSheetOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/plan" className="flex items-center px-1 min-w-0" aria-label="Growth Plan">
              <Logo size={30} />
            </Link>
            <ThemeToggle className="ml-auto" />
            <button
              onClick={openCommandPalette}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 touch-manipulation"
              aria-label="Search and jump to a page"
            >
              <Search className="w-5 h-5" />
            </button>
          </header>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="left" className="p-0 w-[300px] max-w-[85vw] overflow-y-auto overscroll-contain">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Sidebar onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block shrink-0">
            <TopBar scrolled={scrolled} />
          </div>

          <main
            ref={mainRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto bg-[#F4F7FA] relative overscroll-contain pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
          >
            <PageTransition key={location} className="min-h-full lg:h-full">
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      <MobileTabBar onMore={() => setSheetOpen(true)} />
      <CommandPalette />
      <OnboardingModal />
      <ProductTour />
    </div>
  );
}
