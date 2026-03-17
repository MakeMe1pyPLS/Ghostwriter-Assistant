import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings, Building, Users, Share2, MessageSquare, ShoppingCart, Truck, Building2,
  Layers, CheckCircle2, Puzzle, ArrowRight
} from "lucide-react";
import { useDashboardStore, type BusinessStructure, type Sector } from "@/hooks/use-dashboard-store";
import { DataShareRequestsPanel, DataShareModal } from "@/components/DataShareModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STRUCTURE_OPTIONS: { value: BusinessStructure; label: string; desc: string; icon: any }[] = [
  { value: 'single', label: 'Single Business', desc: 'One company, one sector', icon: Building },
  { value: 'partnered', label: 'Partnered Business', desc: 'Two sectors / co-op', icon: Users },
  { value: 'unified-chain', label: 'Unified Supply Chain', desc: 'Three sectors connected', icon: Layers },
];

const SECTOR_OPTIONS: { value: Sector; label: string; icon: any }[] = [
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'logistics', label: 'Logistics', icon: Truck },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
  { value: 'custom', label: 'Custom', icon: Puzzle },
];

export default function SettingsPage() {
  const {
    businessStructure, connectedSectors, dataSharingEnabled, hubEnabled,
    setBusinessStructure, setConnectedSectors, setDataSharingEnabled, setHubEnabled,
  } = useDashboardStore();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Settings</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Configure your business structure, sectors, and data sharing preferences.</p>
        </header>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Business Structure</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 mb-4">Select how your business is organized. This affects dashboard generation, AI analysis, and hub behavior.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {STRUCTURE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBusinessStructure(opt.value);
                      toast({ title: "Structure Updated", description: `Switched to ${opt.label} mode.` });
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      businessStructure === opt.value
                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    data-testid={`structure-${opt.value}`}
                  >
                    <opt.icon className={`w-6 h-6 mb-2 ${businessStructure === opt.value ? 'text-primary' : 'text-slate-400'}`} />
                    <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Connected Sectors</h2>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-lg border-slate-200">
                {connectedSectors.length} / {maxSectors} selected
              </Badge>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">
                {businessStructure === 'single' && 'Select the single sector your business operates in.'}
                {businessStructure === 'partnered' && 'Select the two sectors that form your partnership or co-op.'}
                {businessStructure === 'unified-chain' && 'Select up to three sectors for your unified supply chain.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SECTOR_OPTIONS.map(opt => {
                  const isSelected = connectedSectors.includes(opt.value);
                  const isDisabled = !isSelected && connectedSectors.length >= maxSectors;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !isDisabled && toggleSector(opt.value)}
                      disabled={isDisabled}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : isDisabled
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                      data-testid={`sector-toggle-${opt.value}`}
                    >
                      <opt.icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Data Sharing</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <Label className="text-sm font-bold text-slate-800">Enable Data Sharing</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Allow sectors to exchange metrics, demand signals, fulfillment data, and performance indicators. This unlocks cross-sector insights and AI intelligence.</p>
                </div>
                <Switch
                  checked={dataSharingEnabled}
                  onCheckedChange={setDataSharingEnabled}
                  className="data-[state=checked]:bg-primary ml-4 shrink-0"
                  data-testid="toggle-data-sharing"
                />
              </div>

              {dataSharingEnabled && businessStructure !== 'single' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Shared Data Requests</h3>
                    <Button
                      size="sm"
                      onClick={() => setShareModalOpen(true)}
                      className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4"
                      data-testid="button-request-share"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" /> Request to Share
                    </Button>
                  </div>
                  <DataShareRequestsPanel />
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Hub Communication</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <Label className="text-sm font-bold text-slate-800">Enable Ops Hub</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {businessStructure === 'single' && 'Hub is optional for single businesses. Enables internal alerts and AI insights.'}
                    {businessStructure === 'partnered' && 'Hub is recommended for partnered businesses. Used for sector communication and shared metrics.'}
                    {businessStructure === 'unified-chain' && 'Hub is strongly recommended for unified supply chains. Supports sector alerts, shared KPIs, AI insights, and operational updates.'}
                  </p>
                </div>
                <Switch
                  checked={hubEnabled}
                  onCheckedChange={setHubEnabled}
                  className="data-[state=checked]:bg-primary ml-4 shrink-0"
                  data-testid="toggle-hub"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <DataShareModal open={shareModalOpen} onOpenChange={setShareModalOpen} />
    </AppLayout>
  );
}
