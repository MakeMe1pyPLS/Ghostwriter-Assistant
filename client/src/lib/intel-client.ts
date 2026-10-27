// Calls the AI endpoints and falls back to the built-in rule-based engine when
// the server is unreachable (frontend-only deploy, offline, rate-limited).
// Every screen therefore always has an answer to show.
import { postJson } from '@/lib/api';
import type {
  CommandCenterRequest,
  CommandCenterResult,
  OperationsIntelResult,
  AnalystChatRequest,
  AnalystResponse,
  AIEnginePreference,
} from '@shared/ai-types';
import { RuleBasedIntelligenceProvider, buildRuleBasedAnalystResponse } from '@shared/intelligence';
import { buildRuleBasedGrowthPlan, type GrowthProfile, type GrowthPlan } from '@shared/growth';
import { useGrowthStore } from '@/hooks/use-growth-store';
import { buildRuleBasedConsult, type ConsultRequest, type ConsultResult } from '@shared/consult';

const rules = new RuleBasedIntelligenceProvider();

// Tells the person once per visit when answers come from the built-in analyst
// because they're past their monthly AI answers.
let noticeShown = false;
function noticeOnce<T>(result: T): T {
  const n = (result as any)?.aiNotice;
  if (n === 'limit_reached' && !noticeShown) {
    noticeShown = true;
    import('@/hooks/use-toast').then(({ toast }) => toast({
      title: "You've used this month's AI answers",
      description: 'The built-in analyst is answering for now. Upgrade your plan or connect your own AI key in Settings → AI engine.',
    }));
  }
  return result;
}

function engine(): AIEnginePreference {
  try { return useGrowthStore.getState().aiEngine; } catch { return 'auto'; }
}

function context(): string | undefined {
  try { return useGrowthStore.getState().businessContext() || undefined; } catch { return undefined; }
}

export async function fetchCommandCenter(req: CommandCenterRequest): Promise<CommandCenterResult> {
  try {
    return noticeOnce(await postJson<CommandCenterResult>('/api/ai/command-center', { ...req, engine: engine() }));
  } catch {
    return rules.generateCommandCenter(req);
  }
}

export async function fetchOperationsIntel(req: CommandCenterRequest): Promise<OperationsIntelResult> {
  try {
    return noticeOnce(await postJson<OperationsIntelResult>('/api/ai/operations-intel', { ...req, engine: engine() }));
  } catch {
    return rules.generateOperationsIntel(req);
  }
}

export async function fetchAnalystAnswer(req: AnalystChatRequest): Promise<AnalystResponse> {
  try {
    return noticeOnce(await postJson<AnalystResponse>('/api/ai/chat', { ...req, businessContext: context(), engine: engine() }));
  } catch {
    return buildRuleBasedAnalystResponse(req);
  }
}

export async function fetchGrowthPlan(profile: GrowthProfile, engineOverride?: AIEnginePreference): Promise<GrowthPlan> {
  try {
    return noticeOnce(await postJson<GrowthPlan>('/api/ai/growth-plan', { profile, engine: engineOverride ?? engine() }, 90_000));
  } catch {
    // Small delay so the "building your plan" moment reads as intentional.
    await new Promise((r) => setTimeout(r, 900));
    return buildRuleBasedGrowthPlan(profile);
  }
}

export async function fetchConsult(req: ConsultRequest): Promise<ConsultResult> {
  const withContext = { ...req, businessContext: req.businessContext ?? context() };
  try {
    return noticeOnce(await postJson<ConsultResult>('/api/ai/consult', { ...withContext, engine: engine() }, 60_000));
  } catch {
    await new Promise((r) => setTimeout(r, 700));
    return buildRuleBasedConsult(withContext);
  }
}

export interface EngineStatus {
  default: string;
  engines: { id: 'claude' | 'openai' | 'gemini'; label: string; configured: boolean; model: string | null }[];
}

export async function fetchEngineStatus(): Promise<EngineStatus | null> {
  try {
    const res = await fetch('/api/ai/engines');
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return null;
    return (await res.json()) as EngineStatus;
  } catch {
    return null;
  }
}

export const ENGINE_LABELS: Record<string, string> = {
  claude: 'Claude',
  openai: 'ChatGPT',
  gemini: 'Gemini',
  'rule-based': 'Built-in analyst',
  auto: 'Auto',
};

// Dashboard generation (Generate For Me / Enhance) with the same fallback.
import { DemoAIProvider } from '@shared/dashboard-generator';
const dashboardGenerator = new DemoAIProvider();

export async function generateDashboard(answers: any): Promise<any> {
  try {
    return noticeOnce(await postJson<any>('/api/ai/generate-dashboard', answers));
  } catch {
    return dashboardGenerator.generateDashboard(answers);
  }
}

export async function enhanceDashboard(body: any): Promise<any> {
  try {
    return noticeOnce(await postJson<any>('/api/ai/enhance-dashboard', body));
  } catch {
    return dashboardGenerator.enhanceDashboard(body);
  }
}
