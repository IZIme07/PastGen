import Anthropic from "@anthropic-ai/sdk";

// Модель по умолчанию — самая способная Opus-модель (см. claude-api reference).
export const DEFAULT_MODEL = "claude-opus-4-8";

export const modelId = () => process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

export const isAiConfigured = () => !!process.env.ANTHROPIC_API_KEY;

/** Минимальный интерфейс клиента — для подмены в тестах. */
export interface AiClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      system?: string;
      thinking?: { type: "adaptive" };
      messages: { role: "user" | "assistant"; content: unknown }[];
    }): Promise<{ content: { type: string; text?: string }[]; stop_reason: string | null }>;
  };
}

let cached: Anthropic | null = null;

export function getClient(): AiClient {
  if (!isAiConfigured()) throw new Error("ANTHROPIC_API_KEY не задан");
  if (!cached) cached = new Anthropic();
  return cached as unknown as AiClient;
}

/** Текст первого text-блока ответа. */
export function textOf(response: { content: { type: string; text?: string }[] }): string {
  const block = response.content.find((b) => b.type === "text");
  return block?.text ?? "";
}
