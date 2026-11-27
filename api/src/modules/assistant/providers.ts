import type { AppConfig } from '../../config/env.js';

export interface EmbeddingProvider {
  readonly model: string;
  embed(texts: string[]): Promise<number[][]>;
}

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface LlmProvider {
  readonly model: string;
  complete(messages: ChatMessage[]): Promise<string>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Client for any OpenAI-compatible API (OpenAI, Azure OpenAI, OpenRouter, a local server).
 * Credentials come from environment variables on the server only and never reach the front end.
 */
export class OpenAiCompatibleProvider implements EmbeddingProvider, LlmProvider {
  public readonly model: string;
  private readonly embeddingModel: string;

  constructor(private readonly baseUrl: string, private readonly apiKey: string, chatModel: string, embeddingModel: string, private readonly timeoutMs = 20000) {
    this.model = chatModel;
    this.embeddingModel = embeddingModel;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new ProviderError(`Provider returned HTTP ${res.status}.`, res.status);
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError(e instanceof Error && e.name === 'AbortError' ? 'Provider request timed out.' : 'Provider request failed.');
    } finally {
      clearTimeout(timer);
    }
  }

  public async embed(texts: string[]): Promise<number[][]> {
    const out = await this.post<{ data: { index: number; embedding: number[] }[] }>('/embeddings', { model: this.embeddingModel, input: texts });
    return [...out.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  public async complete(messages: ChatMessage[]): Promise<string> {
    const out = await this.post<{ choices: { message?: { content?: string } }[] }>('/chat/completions', {
      model: this.model,
      messages,
      temperature: 0.1,
      max_tokens: 500,
    });
    return out.choices[0]?.message?.content?.trim() ?? '';
  }
}

export function createProviders(config: AppConfig): { embeddings: EmbeddingProvider | null; llm: LlmProvider | null } {
  if (!config.rag.apiKey) return { embeddings: null, llm: null };
  const p = new OpenAiCompatibleProvider(config.rag.baseUrl, config.rag.apiKey, config.rag.model, config.rag.embeddingModel);
  return { embeddings: p, llm: p };
}
