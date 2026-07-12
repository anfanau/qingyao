import type { ProviderAdapter, BuildUrlParams, BuildBodyParams } from './types';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly name = 'OpenAI Compatible';

  buildUrl({ baseUrl, model: _model }: BuildUrlParams): string {
    return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }

  buildHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    return headers;
  }

  buildRequestBody({ model, messages, overrides }: BuildBodyParams): object {
    return {
      model,
      messages,
      stream: true,
      temperature: overrides?.temperature ?? 0.7,
      max_tokens: overrides?.max_tokens ?? 1024,
      top_p: overrides?.top_p ?? 0.9,
    };
  }

  parseStreamChunk(data: unknown): string | null {
    if (typeof data !== 'object' || data === null) return null;
    const d = data as Record<string, unknown>;
    const choices = d['choices'] as Array<Record<string, unknown>> | undefined;
    if (!choices || choices.length === 0) return null;
    const delta = choices[0]['delta'] as Record<string, unknown> | undefined;
    if (!delta) return null;
    const content = delta['content'];
    return typeof content === 'string' ? content : null;
  }

  async listModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const url = `${baseUrl.replace(/\/+$/, '')}/models`;
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    try {
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return [];
      const json = await resp.json();
      const data = json['data'] as Array<Record<string, unknown>> | undefined;
      if (!data) return [];
      return data.map((m) => String(m['id'] ?? '')).filter(Boolean);
    } catch {
      return [];
    }
  }
}
