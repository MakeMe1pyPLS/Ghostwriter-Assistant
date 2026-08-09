import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor, FileSpreadsheet, Table2, BarChart3, LineChart, Puzzle,
  Eye, Palette, LayoutDashboard, Sparkles, ArrowLeft, ArrowRight,
  CheckCircle2, ChevronRight, BrainCircuit, Building2, Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExecutivePreview } from "@/components/analyst/ExecutivePreview";

export type EnhanceAnswers = {
  currentTool: string;
  improvements: string[];
  keepKpis: boolean;
  recommendKpis: boolean;
  designStyle: string;
  targetTool: string;
};

interface EnhanceWizardProps {
  onComplete: (answers: EnhanceAnswers) => void;
  onCancel: () => void;
  loading?: boolean;
  hasExistingDashboard?: boolean;
  sector?: string;
}

const ENHANCE_STEPS = [
  { id: 'currentTool', title: 'Current Tool', subtitle: 'What tool are you using now?' },
  { id: 'improvements', title: 'Improvements', subtitle: 'What do you want to improve?' },
  { id: 'kpiStrategy', title: 'KPI Strategy', subtitle: 'How should we handle your KPIs?' },
  { id: 'designStyle', title: 'Design Style', subtitle: 'What should the design look like?' },
  { id: 'targetTool', title: 'Target Tool', subtitle: 'Where will the enhanced dashboard be used?' },
];

function OptionCard({ selected, onClick, icon: Icon, label, description }: {
  selected: boolean; onClick: () => void; icon: any; label: string; description?: string;
}) {
  return (
    <button onClick={onClick} data-testid={`enhance-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        selected ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
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

function CheckCard({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} data-testid={`check-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
        selected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}>
      {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
      {label}
    </button>
  );
}

export function EnhanceWizard({ onComplete, onCancel, loading, sector }: EnhanceWizardProps) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [answers, setAnswers] = useState<EnhanceAnswers>({
    currentTool: '', improvements: [], keepKpis: true, recommendKpis: false, designStyle: '', targetTool: '',
  });

  const toggleImprovement = (imp: string) => {
    setAnswers(prev => ({
      ...prev,
      improvements: prev.improvements.includes(imp) ? prev.improvements.filter(x => x !== imp) : [...prev.improvements, imp],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!answers.currentTool;
      case 1: return answers.improvements.length > 0;
      case 2: return true;
      case 3: return !!answers.designStyle;
      case 4: return !!answers.targetTool;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < ENHANCE_STEPS.length - 1) setStep(step + 1);
    else setShowPreview(true);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={Monitor} label="ChainInsideIQ" description="Already using this platform" selected={answers.currentTool === 'webapp'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'webapp' }))} />
            <OptionCard icon={FileSpreadsheet} label="Excel" selected={answers.currentTool === 'excel'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'excel' }))} />
            <OptionCard icon={Table2} label="Google Sheets" selected={answers.currentTool === 'google-sheets'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'google-sheets' }))} />
            <OptionCard icon={BarChart3} label="Power BI" selected={answers.currentTool === 'power-bi'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'power-bi' }))} />
            <OptionCard icon={LineChart} label="Tableau" selected={answers.currentTool === 'tableau'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'tableau' }))} />
            <OptionCard icon={Puzzle} label="Other" selected={answers.currentTool === 'other'} onClick={() => setAnswers(p => ({ ...p, currentTool: 'other' }))} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium mb-2">Select all that apply:</p>
            <div className="flex flex-wrap gap-2">
              {['Readability', 'KPI Card Design', 'Chart Clarity', 'Executive Storytelling', 'Operational Visibility', 'Layout Consistency', 'Visual Hierarchy', 'Tool Compatibility'].map(imp => (
                <CheckCard key={imp} label={imp} selected={answers.improvements.includes(imp.toLowerCase().replace(/\s+/g, '-'))} onClick={() => toggleImprovement(imp.toLowerCase().replace(/\s+/g, '-'))} />
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <OptionCard icon={CheckCircle2} label="Keep Current KPIs" description="Preserve existing metrics, improve presentation" selected={answers.keepKpis && !answers.recommendKpis} onClick={() => setAnswers(p => ({ ...p, keepKpis: true, recommendKpis: false }))} />
              <OptionCard icon={BrainCircuit} label="AI-Recommended KPIs" description="Let AI suggest better metrics for your goals" selected={answers.recommendKpis} onClick={() => setAnswers(p => ({ ...p, keepKpis: false, recommendKpis: true }))} />
              <OptionCard icon={Sparkles} label="Enhance & Expand" description="Keep current KPIs and add AI-recommended ones" selected={answers.keepKpis && answers.recommendKpis} onClick={() => setAnswers(p => ({ ...p, keepKpis: true, recommendKpis: true }))} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={BarChart3} label="Executive" description="Bold, spacious, leadership-ready" selected={answers.designStyle === 'executive'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'executive' }))} />
            <OptionCard icon={Gauge} label="Operations Center" description="Dense, real-time monitoring style" selected={answers.designStyle === 'operational'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'operational' }))} />
            <OptionCard icon={Building2} label="Clean Corporate" description="Professional, balanced, clear hierarchy" selected={answers.designStyle === 'corporate'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'corporate' }))} />
            <OptionCard icon={LineChart} label="BI Style" description="Analytics-forward with data depth" selected={answers.designStyle === 'analytics'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'analytics' }))} />
            <OptionCard icon={LayoutDashboard} label="Spreadsheet-Friendly" description="Compatible with Excel/Sheets output" selected={answers.designStyle === 'minimal'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'minimal' }))} />
            <OptionCard icon={Sparkles} label="Auto Recommend" description="Let AI choose the best design" selected={answers.designStyle === 'auto'} onClick={() => setAnswers(p => ({ ...p, designStyle: 'auto' }))} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionCard icon={Monitor} label="ChainInsideIQ App" description="Full interactive web experience" selected={answers.targetTool === 'webapp'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'webapp' }))} />
            <OptionCard icon={FileSpreadsheet} label="Excel" selected={answers.targetTool === 'excel'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'excel' }))} />
            <OptionCard icon={Table2} label="Google Sheets" selected={answers.targetTool === 'google-sheets'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'google-sheets' }))} />
            <OptionCard icon={BarChart3} label="Power BI" selected={answers.targetTool === 'power-bi'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'power-bi' }))} />
            <OptionCard icon={LineChart} label="Tableau" selected={answers.targetTool === 'tableau'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'tableau' }))} />
            <OptionCard icon={Puzzle} label="Same as Current" description="Keep using the same tool" selected={answers.targetTool === 'same'} onClick={() => setAnswers(p => ({ ...p, targetTool: 'same' }))} />
          </div>
        );
      default: return null;
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">AI Executive Preview</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Review before we enhance it</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold text-xs uppercase tracking-widest" data-testid="button-cancel-enhance">Cancel</Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2">Here's what we're seeing</h3>
            <p className="text-slate-500 font-medium mb-8">A consultant-grade read on your operations before we enhance the dashboard.</p>
            <ExecutivePreview sector={sector || 'ecommerce'} variant="enhance" />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            disabled={loading}
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200"
            data-testid="button-enhance-preview-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={() => onComplete(answers)}
            disabled={loading}
            className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            data-testid="button-enhance-preview-confirm"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Enhancing...</>
            ) : (
              <><BrainCircuit className="w-4 h-4 mr-2" /> Enhance Dashboard</>
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
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enhance My Dashboard</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Step {step + 1} of {ENHANCE_STEPS.length}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold text-xs uppercase tracking-widest" data-testid="button-cancel-enhance">Cancel</Button>
      </div>

      <div className="px-4 md:px-8 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex gap-1 max-w-2xl mx-auto">
          {ENHANCE_STEPS.map((_s, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2">{ENHANCE_STEPS[step].title}</h3>
              <p className="text-slate-500 font-medium mb-8">{ENHANCE_STEPS[step].subtitle}</p>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onCancel()}
          className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200" data-testid="button-enhance-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> {step > 0 ? 'Back' : 'Cancel'}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed() || loading}
          className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-8 shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" data-testid="button-enhance-next">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Enhancing...</>
          ) : step === ENHANCE_STEPS.length - 1 ? (
            <><BrainCircuit className="w-4 h-4 mr-2" /> Enhance Dashboard</>
          ) : (
            <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
