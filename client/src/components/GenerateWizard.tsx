import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Truck, Building2, Layers, Puzzle,
  TrendingUp, Package, Gauge, BarChart3, LineChart,
  Eye, Zap, BrainCircuit, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, Monitor, FileSpreadsheet,
  Table2, LayoutDashboard, ChevronRight,
  Building, Users, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExecutivePreview } from "@/components/analyst/ExecutivePreview";

export type WizardAnswers = {
  businessStructure: string;
  sectors: string[];
  dataSharing: boolean;
  sector: string;
  goal: string;
  tool: string;
  style: string;
  kpiPriorities: string[];
  dataContext: string;
  density: string;
  aiHelpLevel: string;
};

interface GenerateWizardProps {
  onComplete: (answers: WizardAnswers) => void;
  onCancel: () => void;
  loading?: boolean;
}

const STEPS = [
  { id: 'businessStructure', title: 'Business Structure', subtitle: 'How is your business organized?' },
  { id: 'sectors', title: 'Sector Selection', subtitle: 'Which sectors does your business operate in?' },
  { id: 'dataSharing', title: 'Data Sharing', subtitle: 'Do you want sectors to share operational data?' },
  { id: 'goal', title: 'Primary Goal', subtitle: 'What are you trying to track?' },
  { id: 'tool', title: 'Destination Tool', subtitle: 'Where will this dashboard mainly be used?' },
  { id: 'style', title: 'Dashboard Style', subtitle: 'Which layout feels best?' },
  { id: 'kpiPriorities', title: 'KPI Priorities', subtitle: 'Which KPI groups matter most?' },
  { id: 'dataContext', title: 'Data Context', subtitle: 'Do you have data already?' },
  { id: 'density', title: 'Dashboard Density', subtitle: 'How much information should we show?' },
  { id: 'aiHelpLevel', title: 'AI Help Level', subtitle: 'How much should AI assist?' },
];

function OptionCard({ selected, onClick, icon: Icon, label, description, recommended, disabled }: {
  selected: boolean; onClick: () => void; icon: any; label: string; description?: string; recommended?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`option-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        disabled ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' :
        selected
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {recommended && (
        <Badge className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
          AI Recommended
        </Badge>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${selected ? 'text-primary' : 'text-slate-800'}`}>{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
    </button>
  );
}

function SectorToggleCard({ selected, onClick, icon: Icon, label, disabled }: {
  selected: boolean; onClick: () => void; icon: any; label: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`sector-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        disabled ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' :
        selected
          ? 'border-primary bg-primary/5 text-primary shadow-md'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-bold">{label}</span>
      {selected && <CheckCircle2 className="w-4 h-4" />}
    </button>
  );
}

function MultiSelectCard({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      data-testid={`multi-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
      {label}
    </button>
  );
}

export function GenerateWizard({ onComplete, onCancel, loading }: GenerateWizardProps) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [answers, setAnswers] = useState<WizardAnswers>({
    businessStructure: '',
    sectors: [],
    dataSharing: false,
    sector: '',
    goal: '',
    tool: '',
    style: '',
    kpiPriorities: [],
    dataContext: '',
    density: '',
    aiHelpLevel: '',
  });

  const updateAnswer = (key: keyof WizardAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const toggleSector = (sector: string) => {
    const maxSectors = answers.businessStructure === 'single' ? 1 : answers.businessStructure === 'partnered' ? 2 : 3;
    setAnswers(prev => {
      if (prev.sectors.includes(sector)) {
        return { ...prev, sectors: prev.sectors.filter(s => s !== sector) };
      }
      if (prev.sectors.length >= maxSectors) {
        return { ...prev, sectors: [...prev.sectors.slice(1), sector] };
      }
      return { ...prev, sectors: [...prev.sectors, sector] };
    });
  };

  const togglePriority = (p: string) => {
    setAnswers(prev => ({
      ...prev,
      kpiPriorities: prev.kpiPriorities.includes(p)
        ? prev.kpiPriorities.filter(x => x !== p)
        : [...prev.kpiPriorities, p],
    }));
  };

  const canProceed = () => {
    const stepId = STEPS[step].id;
    switch (stepId) {
      case 'businessStructure': return !!answers.businessStructure;
      case 'sectors': {
        const min = answers.businessStructure === 'single' ? 1 : answers.businessStructure === 'partnered' ? 2 : 3;
        return answers.sectors.length >= min;
      }
      case 'dataSharing': return true;
      case 'kpiPriorities': return answers.kpiPriorities.length > 0;
      default: return !!(answers as any)[stepId];
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const primarySector = answers.businessStructure === 'unified-chain'
        ? 'unified'
        : answers.sectors[0] || 'ecommerce';
      updateAnswer('sector', primarySector);
    }

    if (step === 2 && answers.businessStructure === 'single') {
      setStep(step + 1);
      return;
    }

    if (step < STEPS.length - 1) setStep(step + 1);
    else setShowPreview(true);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-3">
            <OptionCard
              icon={Building}
              label="Single Business"
              description="One company operating in one sector. E.g. E-commerce brand, logistics warehouse, manufacturing company."
              selected={answers.businessStructure === 'single'}
              onClick={() => updateAnswer('businessStructure', 'single')}
            />
            <OptionCard
              icon={Users}
              label="Partnered Business (2 Sectors)"
              description="Two sectors working together or sharing operational data. E.g. E-commerce + Logistics, Manufacturer + 3PL partner."
              selected={answers.businessStructure === 'partnered'}
              onClick={() => updateAnswer('businessStructure', 'partnered')}
            />
            <OptionCard
              icon={Layers}
              label="Unified Supply Chain (3 Sectors)"
              description="Three sectors connected in a full supply chain. E.g. Manufacturer → E-commerce → Logistics. Unlocks cross-sector dashboards."
              selected={answers.businessStructure === 'unified-chain'}
              onClick={() => updateAnswer('businessStructure', 'unified-chain')}
              recommended
            />
          </div>
        );

      case 1: {
        const maxSectors = answers.businessStructure === 'single' ? 1 : answers.businessStructure === 'partnered' ? 2 : 3;
        const sectorOptions = [
          { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
          { value: 'logistics', label: 'Logistics', icon: Truck },
          { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
          { value: 'custom', label: 'Custom', icon: Puzzle },
        ];

        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Select {maxSectors === 1 ? 'one sector' : maxSectors === 2 ? 'two sectors' : 'up to three sectors'}:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sectorOptions.map(opt => {
                const isSelected = answers.sectors.includes(opt.value);
                const atMax = answers.sectors.length >= maxSectors;
                return (
                  <SectorToggleCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    selected={isSelected}
                    onClick={() => toggleSector(opt.value)}
                    disabled={!isSelected && atMax}
                  />
                );
              })}
            </div>
            {answers.sectors.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected:</span>
                {answers.sectors.map(s => (
                  <Badge key={s} className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold capitalize rounded-lg">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {answers.businessStructure === 'unified-chain' && answers.sectors.length === 3 && (
              <div className="flex items-center gap-2 bg-primary/5 p-3 rounded-xl border border-primary/10 mt-2">
                <Layers className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium">Full supply chain mode: Cross-sector dashboards and AI intelligence unlocked.</p>
              </div>
            )}
          </div>
        );
      }

      case 2:
        return (
          <div className="space-y-5">
            <div className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${answers.dataSharing ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300'}`} onClick={() => updateAnswer('dataSharing', true)} data-testid="option-enable-sharing">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${answers.dataSharing ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Enable Data Sharing</p>
                  <p className="text-xs text-slate-500">Sectors can exchange metrics, demand signals, and performance indicators.</p>
                </div>
              </div>
            </div>
            <div className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${!answers.dataSharing ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300'}`} onClick={() => updateAnswer('dataSharing', false)} data-testid="option-disable-sharing">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!answers.dataSharing ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Keep Sectors Independent</p>
                  <p className="text-xs text-slate-500">Each sector operates with its own isolated data.</p>
                </div>
              </div>
            </div>
            {answers.businessStructure === 'single' && (
              <p className="text-xs text-slate-400 italic">Data sharing is most useful with 2+ sectors. You can enable it later in Settings.</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={TrendingUp} label="Sales Performance" description="Revenue, orders, growth tracking" selected={answers.goal === 'sales'} onClick={() => updateAnswer('goal', 'sales')} />
            <OptionCard icon={Package} label="Fulfillment Performance" description="Delivery, shipping, order completion" selected={answers.goal === 'fulfillment'} onClick={() => updateAnswer('goal', 'fulfillment')} />
            <OptionCard icon={Gauge} label="Operational Efficiency" description="Throughput, utilization, quality" selected={answers.goal === 'efficiency'} onClick={() => updateAnswer('goal', 'efficiency')} />
            <OptionCard icon={BarChart3} label="Executive Summary" description="High-level overview for leadership" selected={answers.goal === 'executive'} onClick={() => updateAnswer('goal', 'executive')} recommended />
            <OptionCard icon={LineChart} label="Forecasting" description="Predictive analytics and planning" selected={answers.goal === 'forecasting'} onClick={() => updateAnswer('goal', 'forecasting')} />
            <OptionCard icon={Eye} label="End-to-End Visibility" description="Full supply chain transparency" selected={answers.goal === 'visibility'} onClick={() => updateAnswer('goal', 'visibility')} />
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={Monitor} label="ChainInsideIQ App" description="Richest layout with full interactivity" selected={answers.tool === 'webapp'} onClick={() => updateAnswer('tool', 'webapp')} recommended />
            <OptionCard icon={FileSpreadsheet} label="Excel" description="Readable, merged-cell-friendly layouts" selected={answers.tool === 'excel'} onClick={() => updateAnswer('tool', 'excel')} />
            <OptionCard icon={Table2} label="Google Sheets" description="Clean, spreadsheet-compatible sections" selected={answers.tool === 'google-sheets'} onClick={() => updateAnswer('tool', 'google-sheets')} />
            <OptionCard icon={BarChart3} label="Power BI" description="Strong KPI tiles with BI-style hierarchy" selected={answers.tool === 'power-bi'} onClick={() => updateAnswer('tool', 'power-bi')} />
            <OptionCard icon={LineChart} label="Tableau" description="Analysis-friendly visual structure" selected={answers.tool === 'tableau'} onClick={() => updateAnswer('tool', 'tableau')} />
            <OptionCard icon={Puzzle} label="JSON / Custom API" description="Structured output for integration" selected={answers.tool === 'json-api'} onClick={() => updateAnswer('tool', 'json-api')} />
          </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={BarChart3} label="Executive Overview" description="Leadership-ready, bold, spacious" selected={answers.style === 'executive'} onClick={() => updateAnswer('style', 'executive')} recommended />
            <OptionCard icon={Gauge} label="Operational Dashboard" description="Dense, real-time ops monitoring" selected={answers.style === 'operational'} onClick={() => updateAnswer('style', 'operational')} />
            <OptionCard icon={LineChart} label="Deep Analytics" description="Data-forward with sparklines and trends" selected={answers.style === 'analytics'} onClick={() => updateAnswer('style', 'analytics')} />
            <OptionCard icon={LayoutDashboard} label="Clean Minimal" description="Distraction-free, focused design" selected={answers.style === 'minimal'} onClick={() => updateAnswer('style', 'minimal')} />
            <OptionCard icon={TrendingUp} label="Board-Ready Report" description="Presentation-quality for stakeholders" selected={answers.style === 'board-ready'} onClick={() => updateAnswer('style', 'board-ready')} />
            <OptionCard icon={Sparkles} label="Auto Recommend" description="Let AI choose the best style" selected={answers.style === 'auto'} onClick={() => updateAnswer('style', 'auto')} />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">Select one or more priority areas:</p>
            <div className="flex flex-wrap gap-2">
              {['Revenue & Growth', 'Delivery & Fulfillment', 'Production & Efficiency', 'Cost & Margin', 'Forecasting', 'AI Recommendations'].map(p => (
                <MultiSelectCard key={p} label={p} selected={answers.kpiPriorities.includes(p)} onClick={() => togglePriority(p)} />
              ))}
            </div>
            <button
              onClick={() => updateAnswer('kpiPriorities', ['AI Recommendations'])}
              className="flex items-center gap-2 text-xs text-primary font-bold mt-2 hover:underline"
              data-testid="option-let-ai-choose"
            >
              <Sparkles className="w-3.5 h-3.5" /> Let AI choose the best KPIs
            </button>
          </div>
        );

      case 7:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={Package} label="Use Demo Data" description="Start with realistic sample data" selected={answers.dataContext === 'demo'} onClick={() => updateAnswer('dataContext', 'demo')} recommended />
            <OptionCard icon={LayoutDashboard} label="Generate Template" description="Create a starter dashboard structure" selected={answers.dataContext === 'template'} onClick={() => updateAnswer('dataContext', 'template')} />
          </div>
        );

      case 8:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={LayoutDashboard} label="Light" description="3-4 key metrics, clean and simple" selected={answers.density === 'light'} onClick={() => updateAnswer('density', 'light')} />
            <OptionCard icon={BarChart3} label="Standard" description="4-6 metrics with charts" selected={answers.density === 'standard'} onClick={() => updateAnswer('density', 'standard')} recommended />
            <OptionCard icon={Gauge} label="Dense" description="6-8 metrics, information-rich" selected={answers.density === 'dense'} onClick={() => updateAnswer('density', 'dense')} />
            <OptionCard icon={TrendingUp} label="Executive Concise" description="4 key metrics, bold presentation" selected={answers.density === 'executive'} onClick={() => updateAnswer('density', 'executive')} />
          </div>
        );

      case 9:
        return (
          <div className="grid grid-cols-1 gap-3">
            <OptionCard icon={Sparkles} label="Full AI-Driven Generation" description="AI selects everything: KPIs, charts, layout, styles, and insights" selected={answers.aiHelpLevel === 'full'} onClick={() => updateAnswer('aiHelpLevel', 'full')} recommended />
            <OptionCard icon={BrainCircuit} label="Auto-Generate with AI Suggestions" description="AI recommends structure, you can adjust after" selected={answers.aiHelpLevel === 'auto'} onClick={() => updateAnswer('aiHelpLevel', 'auto')} />
            <OptionCard icon={LayoutDashboard} label="Recommended Structure Only" description="Use standard layout templates without AI annotations" selected={answers.aiHelpLevel === 'structure'} onClick={() => updateAnswer('aiHelpLevel', 'structure')} />
          </div>
        );

      default:
        return null;
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">AI Executive Preview</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Review before we build it</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold text-xs uppercase tracking-widest" data-testid="button-cancel-wizard">
            Cancel
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2">Here's what we're seeing</h3>
            <p className="text-slate-500 font-medium mb-8">A consultant-grade read on your supply chain before we generate the dashboard.</p>
            <ExecutivePreview
              sector={answers.sector || 'ecommerce'}
              businessStructure={answers.businessStructure}
              variant="generate"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            disabled={loading}
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200"
            data-testid="button-preview-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={() => onComplete(answers)}
            disabled={loading}
            className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg shadow-primary/20"
            data-testid="button-preview-generate"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Generate Dashboard
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-1 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2">{STEPS[step].title}</h3>
              <p className="text-slate-500 font-medium mb-8">{STEPS[step].subtitle}</p>
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

        <div className="flex items-center gap-3">
          {step === STEPS.length - 1 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium mr-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Ready to generate
            </div>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg shadow-primary/20"
            data-testid="button-wizard-next"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Generate Dashboard
              </>
            ) : (
              <>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
