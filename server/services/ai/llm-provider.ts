// Engine-agnostic LLM provider. The same prompts and validation run on Claude,
// ChatGPT or Gemini; only the adapter differs. Every method THROWS on a bad or
// empty answer so the router can move on to the next engine and, finally, to
// the rule-based engine.
import {
  type CommandCenterRequest,
  type CommandCenterResult,
  type OperationsIntelResult,
  type OperationsIntelItem,
  type TopPriority,
  type Severity,
  type AnalystChatRequest,
  type AnalystResponse,
  type AnalystBottleneck,
  type AnalystAction,
  computeHealth,
} from '@shared/intelligence';
import { type GrowthProfile, type GrowthPlan, describeProfile, sanitizeGrowthPlan } from '@shared/growth';
import { kpisForIndustry } from '@shared/kpi-industries';
import { buildAnalystSystemPrompt } from '@shared/analyst-framework';
import { type ConsultRequest, type ConsultResult, getTemplate, buildRuleBasedConsult, sanitizeConsult } from '@shared/consult';
import type { EngineAdapter } from './engines';

const SECTOR_LABELS: Record<string, string> = {
  ecommerce: 'E-commerce',
  logistics: 'Logistics / 3PL',
  manufacturing: 'Manufacturing',
  unified: 'Unified Supply Chain',
  custom: 'Custom Operations',
};

// The analyst's method lives in shared/analyst-framework.ts so the founder
// can "train" all three engines by editing one file.
const PERSONA = buildAnalystSystemPrompt();

function clampSeverity(value: unknown): Severity {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model output');
  return JSON.parse(text.slice(start, end + 1));
}

function metricsBlock(req: CommandCenterRequest): string {
  return req.metrics
    .map((m) => `- ${m.label}: ${m.value} (${m.trend}, ${m.isPositive ? 'favorable' : 'unfavorable'})`)
    .join('\n') || '- (no metrics provided)';
}

function contextBlock(req: CommandCenterRequest & { businessContext?: string }): string {
  return `Business context:
- Sector: ${SECTOR_LABELS[req.sector] || req.sector}
- Business structure: ${req.businessStructure || 'single'}${req.businessContext ? `\n- Owner profile and goal:\n${req.businessContext.split('\n').map((l) => '  ' + l).join('\n')}` : ''}`;
}

export class LLMIntelligenceProvider {
  constructor(private engine: EngineAdapter) {}

  get id() { return this.engine.id; }

  private async json(system: string, prompt: string, maxTokens: number): Promise<any> {
    const raw = await this.engine.complete(system, prompt, maxTokens);
    return extractJson(raw);
  }

  async generateCommandCenter(req: CommandCenterRequest): Promise<CommandCenterResult> {
    const health = computeHealth(req.metrics);
    const pillars = health.healthBreakdown.map((p) => `- ${p.pillar}: ${p.score}/100`).join('\n');
    const parsed = await this.json(PERSONA, `${contextBlock(req)}
- Computed Business Health Score: ${health.healthScore}/100 (grade: ${health.healthGrade})
- Health pillars:
${pillars || '- (none)'}

Current metrics:
${metricsBlock(req)}

Produce an executive briefing as JSON with this exact shape:
{
  "executiveSummary": "3-4 sentences: current condition, largest opportunity, largest risk, single recommended focus",
  "topPriorities": [
    { "title": "max 6 words", "severity": "high | medium | low", "whatHappened": "one sentence", "whyItMatters": "one sentence", "businessImpact": "one sentence", "recommendedAction": "one specific next step", "expectedOutcome": "one sentence" }
  ]
}
Return 3 to 4 priorities ordered by severity and impact. Ground everything in the metrics.`, 1500);

    const topPriorities: TopPriority[] = Array.isArray(parsed.topPriorities)
      ? parsed.topPriorities.slice(0, 4).map((p: any, i: number) => ({
          id: `prio-${i}`,
          title: String(p.title || 'Priority'),
          severity: clampSeverity(p.severity),
          whatHappened: String(p.whatHappened || ''),
          whyItMatters: String(p.whyItMatters || ''),
          businessImpact: String(p.businessImpact || ''),
          recommendedAction: String(p.recommendedAction || ''),
          expectedOutcome: String(p.expectedOutcome || ''),
        }))
      : [];
    if (!topPriorities.length || !parsed.executiveSummary) throw new Error('Incomplete command center');

    const weak = req.metrics.filter((m) => !m.isPositive);
    const alerts = (weak.length ? weak : req.metrics.slice(0, 2)).slice(0, 4).map((m) => ({
      label: `${m.label} ${m.trend}`,
      severity: clampSeverity(m.isPositive ? 'low' : 'medium'),
    }));
    return { ...health, executiveSummary: String(parsed.executiveSummary), topPriorities, alerts, generatedBy: this.engine.id };
  }

  async generateOperationsIntel(req: CommandCenterRequest): Promise<OperationsIntelResult> {
    const parsed = await this.json(PERSONA, `${contextBlock(req)}

Current metrics:
${metricsBlock(req)}

Identify the 4 most important bottlenecks and opportunities, including ones that sit BETWEEN companies (for example a seller's late orders caused by its carrier). Return JSON:
{
  "items": [
    { "type": "bottleneck | opportunity", "title": "max 6 words", "severity": "high | medium | low", "affectedWorkflow": "workflow", "currentState": "one sentence", "issueDetected": "one sentence", "rootCause": "one sentence", "reasoning": "one sentence", "recommendedAction": "one specific step", "actionPlanSteps": ["step 1", "step 2", "step 3"], "estimatedImpact": "one sentence", "expectedOutcome": "one sentence" }
  ]
}
Return exactly 4 items ordered by business impact.`, 2000);

    const items: OperationsIntelItem[] = Array.isArray(parsed.items)
      ? parsed.items.slice(0, 6).map((it: any, i: number) => ({
          id: `ops-${i}`,
          type: it.type === 'opportunity' ? 'opportunity' : 'bottleneck',
          title: String(it.title || 'Operational item'),
          severity: clampSeverity(it.severity),
          priorityRank: i + 1,
          affectedWorkflow: String(it.affectedWorkflow || 'Operations'),
          currentState: String(it.currentState || ''),
          issueDetected: String(it.issueDetected || ''),
          rootCause: String(it.rootCause || ''),
          reasoning: String(it.reasoning || ''),
          recommendedAction: String(it.recommendedAction || ''),
          actionPlanSteps: Array.isArray(it.actionPlanSteps) ? it.actionPlanSteps.slice(0, 6).map(String) : [],
          estimatedImpact: String(it.estimatedImpact || ''),
          expectedOutcome: String(it.expectedOutcome || ''),
        }))
      : [];
    if (!items.length) throw new Error('No operations items');
    return { items, generatedBy: this.engine.id };
  }

  async generateAnalystResponse(req: AnalystChatRequest & { businessContext?: string }): Promise<AnalystResponse> {
    const health = computeHealth(req.metrics);
    const parsed = await this.json(PERSONA, `${contextBlock(req)}
- Computed Business Health Score: ${health.healthScore}/100 (grade: ${health.healthGrade})

Current metrics:
${metricsBlock(req)}

The user asked: "${(req.message || 'Give me a read on my business.').replace(/"/g, "'")}"

Answer as JSON with this exact shape:
{
  "businessSummary": "2-3 sentences answering the question in context",
  "keyFindings": ["3-4 short, data-grounded findings"],
  "bottlenecks": [ { "title": "short", "severity": "high | medium | low", "detail": "one sentence" } ],
  "rootCause": "one sentence",
  "recommendedActions": [ { "action": "specific step", "impact": "short expected impact" } ],
  "expectedImpact": "one sentence",
  "nextSteps": ["2-4 concrete, sequenced steps"]
}
Return 1-3 bottlenecks and 3 recommendedActions ordered by impact.`, 1800);

    const bottlenecks: AnalystBottleneck[] = Array.isArray(parsed.bottlenecks)
      ? parsed.bottlenecks.slice(0, 3).map((b: any) => ({ title: String(b.title || 'Bottleneck'), severity: clampSeverity(b.severity), detail: String(b.detail || '') }))
      : [];
    const recommendedActions: AnalystAction[] = Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.slice(0, 4).map((a: any) => ({ action: String(a.action || ''), impact: String(a.impact || '') }))
      : [];
    const businessSummary = String(parsed.businessSummary || '');
    if (!businessSummary || !recommendedActions.length) throw new Error('Incomplete analyst response');
    return {
      question: String(req.message ?? ''),
      businessSummary,
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.slice(0, 4).map(String) : [],
      bottlenecks,
      rootCause: String(parsed.rootCause || ''),
      recommendedActions,
      expectedImpact: String(parsed.expectedImpact || ''),
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 5).map(String) : [],
      generatedBy: this.engine.id,
    };
  }

  async generateGrowthPlan(profile: GrowthProfile): Promise<GrowthPlan> {
    const kpiNames = kpisForIndustry(profile.industryId).slice(0, 24).map((k) => k.name).join(', ');
    const parsed = await this.json(PERSONA, `A business owner just finished our onboarding interview. Build them a step-by-step growth plan.

Owner profile:
${describeProfile(profile)}

Useful KPIs for this industry: ${kpiNames}

Rules:
- Match the plan to their size. A solo owner cannot run a 5-person project; an enterprise needs owners per function.
- Split the ${profile.timeframeDays} days into 3 phases with clear day windows.
- 2-4 concrete steps per phase. Each step says exactly what to do, who owns it and which KPI it moves.
- If they named partners, include steps that use shared data and joint reviews with those partners.
- Address every challenge they named somewhere in the plan.
- Make the first step about their data: if they uploaded a file, check it and fill the gaps; if they will import later, name exactly which numbers to export; if they have no data yet, start a weekly tracking habit with the numbers listed.

Return JSON with this exact shape:
{
  "headline": "max 8 words",
  "summary": "2-3 sentences",
  "northStar": { "name": "KPI", "target": "specific target", "why": "one sentence" },
  "kpis": [ { "name": "KPI", "target": "target", "why": "one sentence" } ],
  "phases": [
    { "title": "short", "window": "Days 1–30", "objective": "one sentence",
      "steps": [ { "title": "imperative, max 10 words", "detail": "1-2 sentences", "owner": "Owner | Operations | Sales & marketing | Finance | Partner | Team lead", "kpi": "KPI name", "effort": "low | medium | high" } ] }
  ],
  "quickWins": ["3 things they can do this week"],
  "risks": ["2-3 risks and how to avoid them"],
  "partnerPlays": ["1-3 ways to work with partners"]
}`, 3200);
    if (!Array.isArray(parsed?.phases) || !parsed.phases.length) throw new Error('No phases in plan');
    return sanitizeGrowthPlan(parsed, profile, this.engine.id);
  }

  async generateConsult(req: ConsultRequest): Promise<ConsultResult> {
    const tpl = getTemplate(req.kind);
    const answers = tpl.fields
      .map((f) => `- ${f.label}: ${req.answers[f.id] === undefined || req.answers[f.id] === '' ? '(not given)' : req.answers[f.id]}`)
      .join('\n');
    // The rule-based numbers are exact; give them to the engine so it builds on them instead of redoing arithmetic.
    const baseline = buildRuleBasedConsult(req);
    const parsed = await this.json(PERSONA, `You are running a "${tpl.title}" consulting session with a business owner.
Session purpose: ${tpl.blurb}

${req.businessContext ? `What we know about the business:\n${req.businessContext.slice(0, 2500)}\n\n` : ''}Their answers:
${answers}

Calculated figures (exact, reuse them, do not recalculate):
${baseline.findings.map((f) => `- ${f.label}${f.value ? `: ${f.value}` : ''}`).join('\n')}

Rules:
- Write for a busy owner. Plain language, no jargon without a short explanation.
- Never invent statistics, companies, benchmarks or sources. Only use their numbers and the figures above.
- Give 3 findings to 5 findings, then 2 or 3 genuinely different options with honest trade-offs.
- Recommend one option and say why in the headline or summary.
- Each option has 2 to 4 steps. The first step must be something they can do this week (weeks: 1).
- "weeks" is when the step should be done, counted from today.

Return JSON with this exact shape:
{
  "headline": "one sentence, max 20 words, with the main conclusion",
  "findings": [ { "label": "short", "value": "short figure or empty", "tone": "good | warn | bad | neutral", "detail": "1-2 sentences" } ],
  "options": [ { "id": "a", "title": "max 8 words", "summary": "1-2 sentences", "impact": "low | medium | high", "effort": "low | medium | high",
    "pros": ["max 3"], "cons": ["max 3"],
    "steps": [ { "title": "imperative, max 10 words", "detail": "1-2 sentences", "owner": "Owner | Operations | Sales & marketing | Finance | Partner | Team lead", "weeks": 1 } ] } ],
  "recommendedOptionId": "a",
  "followUp": "one question you would ask them next"
}`, 2600);
    return sanitizeConsult(parsed, this.engine.id);
  }
}
