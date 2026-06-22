import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Building, Users, Layers, Sparkles, ArrowRight, Check, Info } from "lucide-react";
import { useDashboardStore, type BusinessStructure } from "@/hooks/use-dashboard-store";
import { useLocation } from "wouter";

const STRUCTURES: {
  value: BusinessStructure;
  icon: any;
  label: string;
  desc: string;
  color: string;
  ring: string;
  guidance: string;
  needsSettings: boolean;
}[] = [
  {
    value: "single",
    icon: Building,
    label: "Single Business",
    desc: "One company operating in one sector",
    color: "text-blue-600 bg-blue-50 border-blue-100",
    ring: "ring-blue-500 border-blue-300",
    guidance: "Pick your sector and you're ready to build — no extra setup needed.",
    needsSettings: false,
  },
  {
    value: "partnered",
    icon: Users,
    label: "Partnered Business",
    desc: "Two sectors working together or sharing data",
    color: "text-violet-600 bg-violet-50 border-violet-100",
    ring: "ring-violet-500 border-violet-300",
    guidance:
      "You'll connect two sectors (e.g. E-commerce + Logistics) that share data. Choose both sectors next in Settings, then enable data sharing and the Hub.",
    needsSettings: true,
  },
  {
    value: "unified-chain",
    icon: Layers,
    label: "Unified Supply Chain",
    desc: "Three sectors connected in a full supply chain",
    color: "text-primary bg-primary/5 border-primary/20",
    ring: "ring-primary border-primary/40",
    guidance:
      "You'll link all three sectors end-to-end to unlock cross-sector bridge KPIs. Configure the connected sectors next in Settings.",
    needsSettings: true,
  },
];

export function OnboardingModal() {
  const { setupComplete, completeSetup, dismissSetup, setBusinessStructure } = useDashboardStore();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<BusinessStructure>("single");

  if (setupComplete) return null;

  const current = STRUCTURES.find((s) => s.value === selected)!;

  const handleContinue = () => {
    setBusinessStructure(selected);
    completeSetup();
    setLocation(current.needsSettings ? "/settings" : "/builder");
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
              This shapes your sectors, KPIs, AI generation, and data sharing. Pick the option that matches your operation.
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4 bg-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Choose your structure type</p>

          <div className="grid gap-3">
            {STRUCTURES.map((item) => {
              const isSelected = selected === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setSelected(item.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `bg-white ring-2 ${item.ring} shadow-sm`
                      : "border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200"
                  }`}
                  data-testid={`onboarding-structure-${item.value}`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5" data-testid="onboarding-guidance">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-slate-600 leading-relaxed">{current.guidance}</p>
          </div>

          <div className="pt-1 space-y-2.5">
            <Button
              onClick={handleContinue}
              className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
              data-testid="button-go-to-settings"
            >
              {current.needsSettings ? <Settings className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              {current.needsSettings ? "Configure Sectors in Settings" : "Continue to Builder"}
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
