import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Truck, Building2,
  ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles,
  Building, Users, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type WizardAnswers = {
  businessStructure: string;
  sectors: string[];
  sector: string;
  goal: string;
  tool: string;
  style: string;
  kpiPriorities: string[];
  dataContext: string;
  density: string;
  aiHelpLevel: string;
  dataSharing: boolean;
};

interface GenerateWizardProps {
  onComplete: (answers: WizardAnswers) => void;
  onCancel: () => void;
  loading?: boolean;
}

const STEPS = [
  { id: 'businessStructure', title: 'Business Type', subtitle: 'How is your business organized?' },
  { id: 'sectors', title: 'Sector Selection', subtitle: 'Which sectors does your business operate in?' },
  { id: 'generate', title: 'Generate Dashboard', subtitle: 'Everything is ready. Create your AI-powered dashboard.' },
];

const SECTOR_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { value: 'logistics', label: 'Logistics', icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
];

const BUSINESS_OPTIONS = [
  {
    value: 'single',
    label: 'Single Business',
    desc: 'One company operating in one sector',
    icon: Building,
    example: 'E-commerce brand, logistics warehouse, or manufacturing company',
  },
  {
    value: 'partnered',
    label: 'Partnered Business',
    desc: 'Two sectors working together',
    icon: Users,
    example: 'E-commerce + Logistics, or Manufacturer + 3PL partner',
  },
  {
    value: 'unified-chain',
    label: 'Unified Supply Chain',
    desc: 'Three sectors in a full supply chain',
    icon: Layers,
    example: 'Manufacturer → E-commerce → Logistics',
  },
];

export function GenerateWizard({ onComplete, onCancel, loading }: GenerateWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    businessStructure: '',
    sectors: [],
    sector: '',
    goal: 'executive',
    tool: 'webapp',
    style: 'auto',
    kpiPriorities: ['AI Recommendations'],
    dataContext: 'demo',
    density: 'standard',
    aiHelpLevel: 'full',
    dataSharing: false,
  });

  const maxSectors = answers.businessStructure === 'single' ? 1 : answers.businessStructure === 'partnered' ? 2 : 3;
  const minSectors = answers.businessStructure === 'single' ? 1 : answers.businessStructure === 'partnered' ? 2 : 1;

  const setBusinessStructure = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      businessStructure: value,
      sectors: [],
      sector: '',
    }));
  };

  const toggleSector = (sector: string) => {
    setAnswers(prev => {
      if (prev.sectors.includes(sector)) {
        if (prev.sectors.length <= 1) return prev;
        return { ...prev, sectors: prev.sectors.filter(s => s !== sector) };
      }
      if (prev.sectors.length >= maxSectors) {
        return { ...prev, sectors: [...prev.sectors.slice(1), sector] };
      }
      return { ...prev, sectors: [...prev.sectors, sector] };
    });
  };

  const canProceed = (): boolean => {
    if (step === 0) return !!answers.businessStructure;
    if (step === 1) return answers.sectors.length >= minSectors;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const primarySector = answers.businessStructure === 'unified-chain'
        ? 'unified'
        : answers.sectors[0] || 'ecommerce';
      onComplete({ ...answers, sector: primarySector });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid gap-3">
            {BUSINESS_OPTIONS.map(opt => {
              const selected = answers.businessStructure === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setBusinessStructure(opt.value)}
                  data-testid={`option-${opt.value}`}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
                    selected
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      selected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <opt.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-bold ${selected ? 'text-primary' : 'text-slate-800'}`}>{opt.label}</p>
                        {selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{opt.desc}</p>
                      <p className="text-[11px] text-slate-400 mt-1 italic">{opt.example}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 1: {
        const sectorLabel = maxSectors === 1 ? 'one sector' : maxSectors === 2 ? 'two sectors' : 'up to three sectors';
        return (
          <div className="space-y-5">
            <p className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              Select <strong>{sectorLabel}</strong> for your {answers.businessStructure === 'unified-chain' ? 'unified supply chain' : answers.businessStructure === 'partnered' ? 'partnership' : 'business'}:
            </p>

            <div className="grid grid-cols-3 gap-3">
              {SECTOR_OPTIONS.map(opt => {
                const isSelected = answers.sectors.includes(opt.value);
                const atMax = answers.sectors.length >= maxSectors && !isSelected;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !atMax && toggleSector(opt.value)}
                    data-testid={`sector-select-${opt.value}`}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-md ring-2 ring-primary/20'
                        : atMax
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
                    }`}
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

            {answers.sectors.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Sectors</p>
                <div className="flex flex-wrap gap-2">
                  {answers.sectors.map(s => {
                    const opt = SECTOR_OPTIONS.find(o => o.value === s);
                    const Icon = opt?.icon ?? Building2;
                    return (
                      <span key={s} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1.5 rounded-lg capitalize">
                        <Icon className="w-3.5 h-3.5" />
                        {opt?.label ?? s}
                      </span>
                    );
                  })}
                </div>
                {maxSectors > 1 && answers.sectors.length < minSectors && (
                  <p className="text-[11px] text-amber-600 font-medium mt-2">
                    Select {minSectors - answers.sectors.length} more sector{minSectors - answers.sectors.length > 1 ? 's' : ''} to continue.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      case 2: {
        const structureLabel = BUSINESS_OPTIONS.find(o => o.value === answers.businessStructure)?.label ?? answers.businessStructure;
        return (
          <div className="space-y-5">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ready to Generate</p>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{structureLabel}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {answers.sectors.map(s => {
                      const opt = SECTOR_OPTIONS.find(o => o.value === s);
                      const Icon = opt?.icon ?? Building2;
                      return (
                        <span key={s} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg capitalize">
                          <Icon className="w-3 h-3" />
                          {opt?.label ?? s}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'KPI Cards', desc: 'Key performance metrics tailored to your sectors' },
                  { label: 'Trend Charts', desc: 'Performance over time visualizations' },
                  { label: 'AI Insights', desc: 'Smart recommendations and anomaly detection' },
                  { label: 'Sector Analysis', desc: 'Focused analytics for your business type' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              AI will generate your dashboard in seconds.
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Generate For Me</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold text-xs uppercase tracking-widest" data-testid="button-cancel-wizard">
          Cancel
        </Button>
      </div>

      <div className="px-4 md:px-8 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex gap-1.5 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-1">{STEPS[step].title}</h3>
              <p className="text-slate-500 font-medium mb-8 text-sm">{STEPS[step].subtitle}</p>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : onCancel()}
          className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200"
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 0 ? 'Back' : 'Cancel'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg shadow-primary/20 min-w-[160px]"
          data-testid="button-wizard-next"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : step === STEPS.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Dashboard
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
