import { Link } from "wouter";
import { useState } from "react";
import { useUserAccess } from "@/hooks/use-dashboard-store";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, X, Eye } from "lucide-react";

export function DemoBanner() {
  const { isDemoUser } = useUserAccess();
  const [dismissed, setDismissed] = useState(false);

  // Only show for true demo users (explicitly in demo mode AND not signed in)
  if (!isDemoUser || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Demo mode notice"
      className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 text-white border-b border-slate-800 shrink-0 relative z-40"
      data-testid="demo-banner"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Demo Mode
            </span>
            <span className="text-xs text-slate-200 font-medium leading-snug">
              You&apos;re exploring the demo workspace.{" "}
              <span className="hidden sm:inline text-slate-400">
                Create an account to save dashboards and unlock your private workspace.
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/sign-in">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold uppercase tracking-widest text-[10px] h-8 px-3 text-slate-300 hover:text-white hover:bg-white/10"
              data-testid="button-demo-sign-in"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="font-black uppercase tracking-widest text-[10px] h-8 px-3 rounded-lg shadow-lg shadow-primary/30"
              data-testid="button-demo-create-account"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Start Free Trial
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss demo banner"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            data-testid="button-demo-dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
