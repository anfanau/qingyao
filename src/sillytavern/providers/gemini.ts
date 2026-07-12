import type { ProviderAdapter, BuildUrlParams, BuildBodyParams } from './types';

const ROLE_MAP: Record<string, string> = {
  user: 'user',
  assistant: 'model',
  system: 'user', // systemInstruction handled separately
};

export class GeminiAdapter implements ProviderAdapter {
  readonly name = 'Google Gemini';

  buildUrl({ baseUrl, model }: BuildUrlParams): string {
    return `${baseUrl.replace(/\/+$/, '')}/models/${model}:streamGenerateContent?alt=sse`;
  }

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };
  }

  buildRequestBody({ model: _model, messages, overrides }: BuildBodyParams): object {
    // Extract system message for top-level systemInstruction
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: ROLE_MAP[m.role] || 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: overrides?.temperature ?? 0.7,
        maxOutputTokens: overrides?.max_tokens ?? 1024,
        topP: overrides?.top_p ?? 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    if (systemMsg) {
      body['systemInstruction'] = {
        role: 'user', // Gemini expects user role for system instruction
        parts: [{ text: systemMsg.content }],
      };
    }

    return body;
  }

  parseStreamChunk(data: unknown): string | null {
    if (typeof data !== 'object' || data === null) return null;
    const d = data as Record<string, unknown>;
    const candidates = d['candidates'] as Array<Record<string, unknown>> | undefined;
    if (!candidates || candidates.length === 0) return null;
    const content = candidates[0]['content'] as Record<string, unknown> | undefined;
    if (!content) return null;
    const parts = content['parts'] as Array<Record<string, unknown>> | undefined;
    if (!parts || parts.length === 0) return null;
    const text = parts[0]['text'];
    return typeof text === 'string' ? text : null;
  }

  async listModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const url = `${baseUrl.replace(/\/+$/, '')}/models?key=${encodeURIComponent(apiKey)}`;
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return [];
      const json = await resp.json();
      const models = json['models'] as Array<Record<string, unknown>> | undefined;
      if (!models) return [];
      return models
        .map((m) => {
          const name = String(m['name'] ?? '');
          // Strip "models/" prefix: "models/gemini-2.0-flash" → "gemini-2.0-flash"
          return name.replace(/^models\//, '');
        })
        .filter((id) => id && !id.includes('bidi-') && !id.includes('generateContent'));
    } catch {
      return [];
    }
  }
}
