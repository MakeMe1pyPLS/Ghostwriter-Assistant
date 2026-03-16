import { useState } from "react";
import { useLocation } from "wouter";
import { EnhanceWizard, EnhanceAnswers } from "@/components/EnhanceWizard";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";

export default function EnhancePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selectedSector } = useDashboardStore();
  const [loading, setLoading] = useState(false);

  const handleComplete = async (answers: EnhanceAnswers) => {
    setLoading(true);
    try {
      const existingWidgets = JSON.parse(localStorage.getItem(`widgets_${selectedSector}`) || '[]');
      const existingLayout = JSON.parse(localStorage.getItem(`layout_${selectedSector}`) || '[]');

      const targetTool = answers.targetTool === 'same' ? answers.currentTool : answers.targetTool;

      const res = await fetch('/api/ai/enhance-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: selectedSector,
          currentTool: answers.currentTool,
          targetTool,
          improvements: answers.improvements,
          keepKpis: answers.keepKpis,
          designStyle: answers.designStyle,
          existingWidgets,
          existingLayout,
        }),
      });
      if (!res.ok) throw new Error('Enhancement failed');
      const result = await res.json();

      localStorage.setItem(`widgets_${selectedSector}`, JSON.stringify(result.widgets));
      localStorage.setItem(`layout_${selectedSector}`, JSON.stringify(result.layout));
      localStorage.setItem('generated_dashboard_meta', JSON.stringify({
        title: result.title,
        subtitle: result.subtitle,
        toolTarget: result.toolTarget,
        cardPreset: result.cardPreset,
        style: result.style,
        aiSummary: result.aiSummary,
      }));

      toast({
        title: "Dashboard Enhanced",
        description: result.aiSummary || "Your dashboard has been improved.",
      });

      navigate('/builder');
    } catch (err) {
      toast({ title: "Enhancement Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return <EnhanceWizard onComplete={handleComplete} onCancel={() => navigate('/builder')} loading={loading} />;
}
