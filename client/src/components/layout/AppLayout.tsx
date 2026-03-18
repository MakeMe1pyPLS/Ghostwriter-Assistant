import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OnboardingModal } from "@/components/OnboardingModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
           <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon" className="mr-2 touch-manipulation">
                 <Menu className="w-5 h-5" />
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="p-0 w-72 overflow-y-auto overscroll-contain">
               <Sidebar onNavigate={() => setSidebarOpen(false)} />
             </SheetContent>
           </Sheet>
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-slate-900 text-primary flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
             </div>
             <span className="font-black text-sm text-slate-900 tracking-tight">ChainInsideIQ</span>
           </div>
        </div>

        <div className="hidden lg:block shrink-0">
           <TopBar />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#F4F7FA] relative overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </main>
      </div>

      <OnboardingModal />
    </div>
  );
}
