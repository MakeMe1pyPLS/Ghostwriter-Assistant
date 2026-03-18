import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Building, Users, ShoppingCart, Truck, Building2,
  Layers, CheckCircle2, AlertCircle
} from "lucide-react";
import { useDashboardStore, type BusinessStructure, type Sector } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";

const STRUCTURE_OPTIONS: { value: BusinessStructure; label: string; desc: string; icon: any; example: string }[] = [
  { value: 'single', label: 'Single Business', desc: 'One company, one sector', icon: Building, example: 'E-commerce brand, warehouse, or factory' },
  { value: 'partnered', label: 'Partnered Business', desc: 'Two sectors working together', icon: Users, example: 'E-commerce + Logistics, Manufacturer + 3PL' },
  { value: 'unified-chain', label: 'Unified Supply Chain', desc: 'Three sectors fully connected', icon: Layers, example: 'Manufacturer → E-commerce → Logistics' },
];

const SECTOR_OPTIONS: { value: Sector; label: string; icon: any }[] = [
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'logistics', label: 'Logistics', icon: Truck },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
];

export default function SettingsPage() {
  const {
    businessStructure, connectedSectors,
    setBusinessStructure, setConnectedSectors,
    setupComplete, completeSetup,
  } = useDashboardStore();
  const { toast } = useToast();

  const maxSectors = businessStructure === 'single' ? 1 : businessStructure === 'partnered' ? 2 : 3;

  const toggleSector = (sector: Sector) => {
    if (connectedSectors.includes(sector)) {
      if (connectedSectors.length <= 1) return;
      setConnectedSectors(connectedSectors.filter(s => s !== sector));
    } else {
      if (connectedSectors.length >= maxSectors) return;
      setConnectedSectors([...connectedSectors, sector]);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Settings</h1>
            {setupComplete && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Setup Complete
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Configure your business type and sector selection.</p>

          {!setupComplete && (
            <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Business structure not configured</p>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Select your business type below to enable AI dashboard generation and sector-specific features.</p>
              </div>
            </div>
          )}
        </header>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Business Type</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500">Select how your business is organized. This drives your dashboard generation and sector setup.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {STRUCTURE_OPTIONS.map(opt => {
                  const selected = businessStructure === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setBusinessStructure(opt.value);
                        completeSetup();
                        toast({ title: "Business Type Updated", description: `Switched to ${opt.label}.` });
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all group ${
                        selected
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                      data-testid={`structure-${opt.value}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                        selected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}>
                        <opt.icon className="w-5 h-5" />
                      </div>
                      <p className={`text-sm font-bold mb-0.5 ${selected ? 'text-primary' : 'text-slate-800'}`}>{opt.label}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{opt.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 italic">{opt.example}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Selected Sectors</h2>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-lg border-slate-200">
                {connectedSectors.length} / {maxSectors}
              </Badge>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">
                {businessStructure === 'single' && 'Select the sector your business operates in.'}
                {businessStructure === 'partnered' && 'Select the two sectors that form your partnership.'}
                {businessStructure === 'unified-chain' && 'Select up to three sectors for your supply chain.'}
                {!businessStructure && 'Select a business type above first.'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SECTOR_OPTIONS.map(opt => {
                  const isSelected = connectedSectors.includes(opt.value);
                  const isDisabled = !businessStructure || (!isSelected && connectedSectors.length >= maxSectors);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !isDisabled && toggleSector(opt.value)}
                      disabled={isDisabled}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-md ring-2 ring-primary/20'
                          : isDisabled
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
                      }`}
                      data-testid={`sector-toggle-${opt.value}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-primary/10' : 'bg-slate-100'
                      }`}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
