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

const rules = new RuleBasedIntelligenceProvider();

function engine(): AIEnginePreference {
  try { return useGrowthStore.getState().aiEngine; } catch { return 'auto'; }
}

function context(): string | undefined {
  try { return useGrowthStore.getState().businessContext() || undefined; } catch { return undefined; }
}

export async function fetchCommandCenter(req: CommandCenterRequest): Promise<CommandCenterResult> {
  try {
    return await postJson<CommandCenterResult>('/api/ai/command-center', { ...req, engine: engine() });
  } catch {
    return rules.generateCommandCenter(req);
  }
}

export async function fetchOperationsIntel(req: CommandCenterRequest): Promise<OperationsIntelResult> {
  try {
    return await postJson<OperationsIntelResult>('/api/ai/operations-intel', { ...req, engine: engine() });
  } catch {
    return rules.generateOperationsIntel(req);
  }
}

export async function fetchAnalystAnswer(req: AnalystChatRequest): Promise<AnalystResponse> {
  try {
    return await postJson<AnalystResponse>('/api/ai/chat', { ...req, businessContext: context(), engine: engine() });
  } catch {
    return buildRuleBasedAnalystResponse(req);
  }
}

export async function fetchGrowthPlan(profile: GrowthProfile, engineOverride?: AIEnginePreference): Promise<GrowthPlan> {
  try {
    return await postJson<GrowthPlan>('/api/ai/growth-plan', { profile, engine: engineOverride ?? engine() }, 90_000);
  } catch {
    // Small delay so the "building your plan" moment reads as intentional.
    await new Promise((r) => setTimeout(r, 900));
    return buildRuleBasedGrowthPlan(profile);
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
    return await postJson<any>('/api/ai/generate-dashboard', answers);
  } catch {
    return dashboardGenerator.generateDashboard(answers);
  }
}

export async function enhanceDashboard(body: any): Promise<any> {
  try {
    return await postJson<any>('/api/ai/enhance-dashboard', body);
  } catch {
    return dashboardGenerator.enhanceDashboard(body);
  }
}
