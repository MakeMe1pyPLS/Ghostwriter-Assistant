// "Discuss with partner" and "Track as actions" for any bottleneck or
// recommendation, so every insight turns into a conversation or a to-do.
import { useLocation } from "wouter";
import { MessageSquare, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { addDays } from "@/lib/calendar";
import { ShareMenu } from "@/components/ShareMenu";
import { InsightTrust } from "@/components/analyst/InsightTrust";
import { useKpiRun } from "@/hooks/use-kpi-run";
import { standardiseInsight } from "@shared/insight";
import { appLink } from "@/lib/share";
import type { OperationsIntelItem } from "@shared/ai-types";

const URGENCY = { high: 'High', medium: 'Medium', low: 'Low' } as const;

export function IssueActions({ item, sector }: { item: OperationsIntelItem; sector: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addHubPost, addAction, actions } = useGrowthStore();
  const { run, totalRows } = useKpiRun();
  const alreadyTracked = actions.some((a) => a.source === 'bottleneck' && a.sourceRef === item.title);

  const discuss = () => {
    const post = addHubPost({
      type: 'discussion',
      title: `Let’s fix: ${item.title}`,
      content: `${item.issueDetected} Possible reason: ${item.rootCause} Recommended: ${item.recommendedAction}`,
      sector,
      tags: ['Bottleneck'],
      urgency: URGENCY[item.severity],
      status: 'Open',
      kpi: item.affectedWorkflow,
      bottleneckRef: item.title,
      author: { name: 'AI Analyst', role: 'Flagged a bottleneck', initials: 'AI' },
    });
    navigate(`/hub?thread=${post.id}`);
  };

  const track = () => {
    const steps = item.actionPlanSteps.length ? item.actionPlanSteps : [item.recommendedAction];
    // Only a number calculated from the person's own data is kept as the "before".
    const baseline = standardiseInsight(item, { run, totalRows }).baseline;
    steps.forEach((step, i) => addAction({
      title: step,
      detail: `${item.title}: ${item.recommendedAction}`,
      owner: 'Operations',
      source: 'bottleneck',
      sourceRef: item.title,
      dueDate: addDays(7 * (i + 1)),
      // The first step carries the baseline so the Plan shows one before/after per finding.
      baseline: i === 0 ? baseline : undefined,
    }));
    toast({
      title: `${steps.length} action${steps.length > 1 ? 's' : ''} added`,
      description: baseline
        ? `On your Growth Plan board with weekly due dates. We saved your current ${baseline.label.toLowerCase()} (${baseline.display}) so you can see before and after.`
        : 'They’re on your action board under Growth Plan, with weekly due dates.',
    });
  };

  return (
    <div className="space-y-3 pt-1">
      <InsightTrust item={item} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl font-bold" onClick={discuss}>
          <MessageSquare className="w-4 h-4 mr-1.5" /> Discuss with partner
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={track} disabled={alreadyTracked}>
          <ListPlus className="w-4 h-4 mr-1.5" /> {alreadyTracked ? 'On your board' : 'Track as actions'}
        </Button>
        <ShareMenu size="sm" message={() => ({
          title: `Bottleneck: ${item.title}`,
          text: `${item.issueDetected}\nPossible reason: ${item.rootCause}\nRecommended: ${item.recommendedAction}`,
          link: appLink('/bottlenecks'),
          facts: [{ name: 'Severity', value: URGENCY[item.severity] }, { name: 'Impact', value: item.estimatedImpact }],
        })} />
      </div>
    </div>
  );
}
