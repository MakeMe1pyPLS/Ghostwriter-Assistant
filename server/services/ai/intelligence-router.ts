// Modular AI router. Today: Claude first, rule-based fallback. Tomorrow: add
// OpenAI / Gemini providers behind the same OperationalIntelligenceProvider
// interface and switch on AI_PROVIDER without touching callers.
import {
  type OperationalIntelligenceProvider,
  RuleBasedIntelligenceProvider,
} from './operational-intelligence';
import { AnthropicIntelligenceProvider } from './anthropic-provider';

export function getIntelligenceProvider(): OperationalIntelligenceProvider {
  const preferred = (process.env.AI_PROVIDER || 'claude').toLowerCase();

  if (preferred === 'claude' && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicIntelligenceProvider();
  }

  // Future: if (preferred === 'openai' && process.env.OPENAI_API_KEY) ...
  // Future: if (preferred === 'gemini' && process.env.GEMINI_API_KEY) ...

  return new RuleBasedIntelligenceProvider();
}
