// Engine adapters: the only engine-specific code. Each adapter turns
// (system, prompt) into raw model text. Everything else (prompts, parsing,
// validation, fallback) is shared in llm-provider.ts.
//
// OpenAI and Gemini are called over plain HTTPS so no extra SDKs are needed.
// Model IDs are configurable because providers ship new models often:
//   ANTHROPIC_MODEL (default claude-sonnet-5)
//   OPENAI_MODEL    (default gpt-6-luna)
//   GEMINI_MODEL    (default gemini-3.8-flash)
import Anthropic from '@anthropic-ai/sdk';
import type { AIEngineId } from '@shared/ai-types';

export type LLMEngineId = Exclude<AIEngineId, 'rule-based'>;

export interface EngineAdapter {
  id: LLMEngineId;
  label: string;
  model: string;
  complete(system: string, prompt: string, maxTokens: number): Promise<string>;
}

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 45000);

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export const DEFAULT_MODELS: Record<LLMEngineId, string> = {
  claude: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
  openai: process.env.OPENAI_MODEL || 'gpt-6-luna',
  gemini: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
};

/** An adapter for any key: ours (from the environment) or one a customer connected. */
export function makeAdapter(id: LLMEngineId, key: string, model?: string): EngineAdapter {
  const m = model || DEFAULT_MODELS[id];
  return id === 'claude' ? claudeAdapter(key, m)! : id === 'openai' ? openaiAdapter(key, m)! : geminiAdapter(key, m)!;
}

function claudeAdapter(key = process.env.ANTHROPIC_API_KEY, model = DEFAULT_MODELS.claude): EngineAdapter | null {
  if (!key) return null;
  const client = new Anthropic({ apiKey: key, timeout: TIMEOUT_MS });
  return {
    id: 'claude', label: 'Claude', model,
    async complete(system, prompt, maxTokens) {
      const msg = await client.messages.create({
        model, max_tokens: maxTokens, system,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = msg.content.find((b) => b.type === 'text');
      return block && block.type === 'text' ? block.text : '';
    },
  };
}

function openaiAdapter(key = process.env.OPENAI_API_KEY, model = DEFAULT_MODELS.openai): EngineAdapter | null {
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  return {
    id: 'openai', label: 'ChatGPT', model,
    async complete(system, prompt, maxTokens) {
      const json = await postJson(`${base}/chat/completions`, { Authorization: `Bearer ${key}` }, {
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: maxTokens,
      });
      return json?.choices?.[0]?.message?.content ?? '';
    },
  };
}

function geminiAdapter(key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, model = DEFAULT_MODELS.gemini): EngineAdapter | null {
  if (!key) return null;
  return {
    id: 'gemini', label: 'Gemini', model,
    async complete(system, prompt, maxTokens) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const json = await postJson(url, { 'x-goog-api-key': key }, {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
      });
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      return parts.map((p: any) => p?.text ?? '').join('');
    },
  };
}

let cache: Record<LLMEngineId, EngineAdapter | null> | null = null;

/** Adapters for every engine with an API key configured. Built once per process. */
export function configuredEngines(): Record<LLMEngineId, EngineAdapter | null> {
  if (!cache) cache = { claude: claudeAdapter(), openai: openaiAdapter(), gemini: geminiAdapter() };
  return cache;
}

/** Public status for the settings screen: which engines are ready. Never exposes keys. */
export function engineStatus() {
  const e = configuredEngines();
  const order = defaultOrder();
  return {
    default: order.find((id) => e[id]) ?? 'rule-based',
    engines: (['claude', 'openai', 'gemini'] as LLMEngineId[]).map((id) => ({
      id,
      label: id === 'claude' ? 'Claude' : id === 'openai' ? 'ChatGPT' : 'Gemini',
      configured: !!e[id],
      model: e[id]?.model ?? null,
    })),
  };
}

/** Default engine order. AI_PROVIDER picks the first choice; the rest follow as fallbacks. */
export function defaultOrder(): LLMEngineId[] {
  const all: LLMEngineId[] = ['claude', 'openai', 'gemini'];
  const pref = (process.env.AI_PROVIDER || 'claude').toLowerCase().replace('chatgpt', 'openai') as LLMEngineId;
  return all.includes(pref) ? [pref, ...all.filter((x) => x !== pref)] : all;
}
