import { useState } from "react";
import { useLocation } from "wouter";
import { GenerateWizard, WizardAnswers } from "@/components/GenerateWizard";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";

export default function GeneratePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setSector, setBusinessStructure, setConnectedSectors, setDataSharingEnabled, setHubEnabled, saveDashboard } = useDashboardStore();
  const [loading, setLoading] = useState(false);

  const handleComplete = async (answers: WizardAnswers) => {
    setLoading(true);
    try {
      if (answers.businessStructure) {
        setBusinessStructure(answers.businessStructure as any);
      }
      if (answers.sectors?.length > 0) {
        setConnectedSectors(answers.sectors as any[]);
      }
      setDataSharingEnabled(answers.dataSharing);
      if (answers.businessStructure !== 'single') {
        setHubEnabled(true);
      }

      const res = await fetch('/api/ai/generate-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error('Generation failed');
      const result = await res.json();

      const sector = (answers.sector as any) || 'ecommerce';
      setSector(sector === 'custom' ? 'custom' : sector);

      saveDashboard(sector, result.layout, result.widgets);
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

      if (answers.businessStructure === 'partnered' && answers.sectors?.length === 2) {
        for (const s of answers.sectors) {
          if (s !== sector) {
            const sectorRes = await fetch('/api/ai/generate-dashboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...answers, sector: s }),
            });
            if (sectorRes.ok) {
              const sectorResult = await sectorRes.json();
              saveDashboard(s as any, sectorResult.layout, sectorResult.widgets);
            }
          }
        }
      }

      toast({
        title: "Dashboard Generated",
        description: result.aiSummary || "Your dashboard is ready to edit.",
      });

      navigate('/builder');
    } catch (err) {
      toast({ title: "Generation Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return <GenerateWizard onComplete={handleComplete} onCancel={() => navigate('/builder')} loading={loading} />;
}
