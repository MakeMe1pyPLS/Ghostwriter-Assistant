import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Building, Users, Layers, X, Sparkles } from "lucide-react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useLocation } from "wouter";

export function OnboardingModal() {
  const { setupComplete, completeSetup, dismissSetup } = useDashboardStore();
  const [, setLocation] = useLocation();

  if (setupComplete) return null;

  const handleGoToSettings = () => {
    completeSetup();
    setLocation("/settings");
  };

  const handleRemindLater = () => {
    dismissSetup();
  };

  return (
    <Dialog open={!setupComplete} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 p-0 gap-0 shadow-2xl shadow-slate-900/20"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Set Up Your Business Structure</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your business type and sectors so ChainInsideIQ can generate accurate dashboards and insights.
        </DialogDescription>

        <div className="bg-slate-900 px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Set Up Your Business Structure</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              To generate accurate dashboards and insights, configure your business type and sectors.
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4 bg-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Choose your structure type</p>

          <div className="grid gap-3">
            {[
              {
                icon: Building,
                label: "Single Business",
                desc: "One company operating in one sector",
                color: "text-blue-600 bg-blue-50 border-blue-100",
              },
              {
                icon: Users,
                label: "Partnered Business",
                desc: "Two sectors working together or sharing data",
                color: "text-violet-600 bg-violet-50 border-violet-100",
              },
              {
                icon: Layers,
                label: "Unified Supply Chain",
                desc: "Three sectors connected in a full supply chain",
                color: "text-primary bg-primary/5 border-primary/20",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2.5">
            <Button
              onClick={handleGoToSettings}
              className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
              data-testid="button-go-to-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
            <button
              onClick={handleRemindLater}
              className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-50"
              data-testid="button-remind-later"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
