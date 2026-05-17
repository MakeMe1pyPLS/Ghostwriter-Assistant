import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings, Building, Users, Share2, MessageSquare, ShoppingCart, Truck, Building2,
  Layers, CheckCircle2, Puzzle, ArrowRight, AlertCircle, User, LogOut, ShieldCheck,
  Mail, Sparkles, CreditCard
} from "lucide-react";
import { useDashboardStore, getTrialStatus, type BusinessStructure, type Sector } from "@/hooks/use-dashboard-store";
import { DataShareRequestsPanel, DataShareModal } from "@/components/DataShareModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

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
    setupComplete, completeSetup, currentUser, signOut,
  } = useDashboardStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const trial = getTrialStatus(currentUser);

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
            {setupComplete && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Setup Complete
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Configure your business structure, sectors, and data sharing preferences.</p>

          {!setupComplete && (
            <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Business structure not configured</p>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Select your business type below to enable accurate AI analysis, dashboard generation, and sector-specific features.</p>
              </div>
            </div>
          )}
        </header>

        <div className="space-y-8">
          {/* ACCOUNT SECTION */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="section-account">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Account</h2>
            </div>
            {currentUser ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-primary flex items-center justify-center font-black text-lg uppercase tracking-tighter">
                    {currentUser.fullName.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-slate-900" data-testid="text-account-fullname">{currentUser.fullName}</p>
                      {currentUser.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <Link href="/verify-email" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100" data-testid="link-verify-email-settings">
                          <Mail className="w-3 h-3" /> Verify Email
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{currentUser.email}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Plan</p>
                    <p className="text-sm font-black text-slate-900 capitalize" data-testid="text-account-plan">
                      {currentUser.plan === 'trial' ? 'Free Trial' : currentUser.plan}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Trial Status</p>
                    {trial.active ? (
                      <p className="text-sm font-black text-amber-700" data-testid="text-trial-status">
                        {trial.daysRemaining} of {trial.totalDays} days left
                      </p>
                    ) : currentUser.plan === 'trial' ? (
                      <p className="text-sm font-black text-rose-600">Trial ended</p>
                    ) : (
                      <p className="text-sm font-black text-emerald-700">On paid plan</p>
                    )}
                  </div>
                </div>

                {trial.active && (
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-amber-700">Trial Progress</span>
                      <span className="text-xs font-black text-amber-700">{trial.daysRemaining} days left</span>
                    </div>
                    <div className="h-2 bg-amber-200/50 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${(trial.daysRemaining / trial.totalDays) * 100}%` }}
                      />
                    </div>
                    <Link href="/pricing">
                      <Button className="w-full font-black uppercase tracking-widest text-xs h-10 rounded-lg" data-testid="button-upgrade-plan">
                        <Sparkles className="w-3.5 h-3.5 mr-2" /> Upgrade to a Paid Plan
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <Link href="/pricing">
                    <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] rounded-lg" data-testid="button-billing">
                      <CreditCard className="w-3.5 h-3.5 mr-2" /> Billing & Plan
                    </Button>
                  </Link>
                  <Link href="/welcome">
                    <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] rounded-lg" data-testid="button-restart-tour">
                      <Sparkles className="w-3.5 h-3.5 mr-2" /> Restart Tutorial
                    </Button>
                  </Link>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { signOut(); toast({ title: "Signed out", description: "You've been signed out of your account." }); setLocation('/'); }}
                    className="font-bold uppercase tracking-widest text-[10px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    data-testid="button-sign-out"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">You're not signed in</p>
                  <p className="text-xs text-slate-500 mt-1">Create an account to save your dashboards and start your free trial.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/sign-in">
                    <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] rounded-lg" data-testid="button-settings-sign-in">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm" className="font-bold uppercase tracking-widest text-[10px] rounded-lg" data-testid="button-settings-sign-up">
                      Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

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
                      completeSetup();
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
