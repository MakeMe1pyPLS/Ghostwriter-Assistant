// Three-engine AI router.
// Tries the requested engine first, then the other configured engines, then the
// rule-based engine, so a request always gets an answer. Callers pass an
// engine preference ("auto" | "claude" | "openai" | "gemini").
import type { AIEnginePreference } from '@shared/ai-types';
import {
  type OperationalIntelligenceProvider,
  type CommandCenterRequest,
  type AnalystChatRequest,
  RuleBasedIntelligenceProvider,
  buildRuleBasedAnalystResponse,
} from '@shared/intelligence';
import { type GrowthProfile, type GrowthPlan, buildRuleBasedGrowthPlan } from '@shared/growth';
import { type ConsultRequest, type ConsultResult, buildRuleBasedConsult } from '@shared/consult';
import { configuredEngines, defaultOrder, type LLMEngineId, type EngineAdapter } from './engines';
import { LLMIntelligenceProvider } from './llm-provider';

export interface GrowthCapableProvider extends OperationalIntelligenceProvider {
  generateGrowthPlan(profile: GrowthProfile): Promise<GrowthPlan>;
  generateConsult(req: ConsultRequest): Promise<ConsultResult>;
  generateAnalystResponse(req: AnalystChatRequest & { businessContext?: string }): ReturnType<OperationalIntelligenceProvider['generateAnalystResponse']>;
}

export type EngineSet = Record<LLMEngineId, EngineAdapter | null>;

function engineChain(pref: AIEnginePreference = 'auto', override?: EngineSet): LLMIntelligenceProvider[] {
  const engines = override ?? configuredEngines();
  const order: LLMEngineId[] = pref !== 'auto' && engines[pref]
    ? [pref, ...defaultOrder().filter((e) => e !== pref)]
    : defaultOrder();
  return order.map((id) => engines[id]).filter(Boolean).map((e) => new LLMIntelligenceProvider(e!));
}

async function firstSuccess<T>(chain: LLMIntelligenceProvider[], run: (p: LLMIntelligenceProvider) => Promise<T>, fallback: () => Promise<T> | T, label: string): Promise<T> {
  for (const p of chain) {
    try {
      return await run(p);
    } catch (err: any) {
      console.warn(`[ai:${label}] ${p.id} failed, trying next engine: ${err?.message ?? err}`);
    }
  }
  return fallback();
}

/**
 * `engines` lets a request run on a specific set of adapters (a customer's own
 * keys, or none when they're over their monthly limit). Without it the
 * server's own keys are used.
 */
export function getIntelligenceProvider(pref: AIEnginePreference = 'auto', engines?: EngineSet): GrowthCapableProvider {
  const chain = engineChain(pref, engines);
  const rules = new RuleBasedIntelligenceProvider();
  return {
    generateCommandCenter: (req: CommandCenterRequest) =>
      firstSuccess(chain, (p) => p.generateCommandCenter(req), () => rules.generateCommandCenter(req), 'command-center'),
    generateOperationsIntel: (req: CommandCenterRequest) =>
      firstSuccess(chain, (p) => p.generateOperationsIntel(req), () => rules.generateOperationsIntel(req), 'operations-intel'),
    generateAnalystResponse: (req: AnalystChatRequest & { businessContext?: string }) =>
      firstSuccess(chain, (p) => p.generateAnalystResponse(req), () => buildRuleBasedAnalystResponse(req), 'chat'),
    generateGrowthPlan: (profile: GrowthProfile) =>
      firstSuccess(chain, (p) => p.generateGrowthPlan(profile), () => buildRuleBasedGrowthPlan(profile), 'growth-plan'),
    generateConsult: (req: ConsultRequest) =>
      firstSuccess(chain, (p) => p.generateConsult(req), () => buildRuleBasedConsult(req), 'consult'),
  };
}
