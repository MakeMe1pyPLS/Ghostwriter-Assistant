import { useState } from "react";
import { useLocation } from "wouter";
import { GenerateWizard, WizardAnswers } from "@/components/GenerateWizard";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";

export default function GeneratePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setSector, setBusinessStructure, setConnectedSectors, completeSetup } = useDashboardStore();
  const [loading, setLoading] = useState(false);

  const handleComplete = async (answers: WizardAnswers) => {
    if (!answers.businessStructure || answers.sectors.length === 0) {
      toast({
        title: "Setup Incomplete",
        description: "Please complete business type and sector selection before generating.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (answers.businessStructure) {
        setBusinessStructure(answers.businessStructure as any);
        completeSetup();
      }
      if (answers.sectors.length > 0) {
        setConnectedSectors(answers.sectors as any[]);
      }

      const payload = {
        sector: answers.sector || answers.sectors[0] || 'ecommerce',
        businessStructure: answers.businessStructure,
        sectors: answers.sectors,
        goal: answers.goal || 'executive',
        tool: answers.tool || 'webapp',
        style: answers.style || 'auto',
        kpiPriorities: answers.kpiPriorities?.length ? answers.kpiPriorities : ['AI Recommendations'],
        dataContext: answers.dataContext || 'demo',
        density: answers.density || 'standard',
        aiHelpLevel: answers.aiHelpLevel || 'full',
        dataSharing: false,
      };

      const res = await fetch('/api/ai/generate-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Generation failed');
      }

      const result = await res.json();
      const sector = payload.sector;

      if (sector) setSector(sector as any);

      localStorage.setItem(`widgets_${sector}`, JSON.stringify(result.widgets));
      localStorage.setItem(`layout_${sector}`, JSON.stringify(result.layout));
      localStorage.setItem('generated_dashboard_meta', JSON.stringify({
        title: result.title,
        subtitle: result.subtitle,
        toolTarget: result.toolTarget,
        cardPreset: result.cardPreset,
        style: result.style,
        aiSummary: result.aiSummary,
        businessStructure: answers.businessStructure,
        connectedSectors: answers.sectors,
      }));

      if (answers.businessStructure === 'partnered' && answers.sectors.length === 2) {
        const secondSector = answers.sectors.find(s => s !== sector);
        if (secondSector) {
          const sectorRes = await fetch('/api/ai/generate-dashboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, sector: secondSector }),
          });
          if (sectorRes.ok) {
            const sectorResult = await sectorRes.json();
            localStorage.setItem(`widgets_${secondSector}`, JSON.stringify(sectorResult.widgets));
            localStorage.setItem(`layout_${secondSector}`, JSON.stringify(sectorResult.layout));
          }
        }
      }

      if (answers.businessStructure === 'unified-chain' && answers.sectors.length >= 2) {
        for (const s of answers.sectors) {
          if (s !== sector) {
            const sRes = await fetch('/api/ai/generate-dashboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, sector: s }),
            });
            if (sRes.ok) {
              const sResult = await sRes.json();
              localStorage.setItem(`widgets_${s}`, JSON.stringify(sResult.widgets));
              localStorage.setItem(`layout_${s}`, JSON.stringify(sResult.layout));
            }
          }
        }
      }

      toast({
        title: "Dashboard Generated",
        description: result.aiSummary || "Your dashboard is ready to view and edit.",
      });

      navigate('/builder');
    } catch (err: any) {
      console.error('Generation error:', err);
      toast({
        title: "Generation Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return <GenerateWizard onComplete={handleComplete} onCancel={() => navigate('/builder')} loading={loading} />;
}
