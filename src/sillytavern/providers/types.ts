import type { ApiProvider } from '../types';

export interface BuildUrlParams {
  baseUrl: string;
  model: string;
}

export interface BuildBodyParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  overrides?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  };
}

export interface ProviderAdapter {
  readonly name: string;

  /** Build the full streaming chat endpoint URL */
  buildUrl(params: BuildUrlParams): string;

  /** Build HTTP headers including auth */
  buildHeaders(apiKey: string): Record<string, string>;

  /** Build the request body (JSON-serializable) */
  buildRequestBody(params: BuildBodyParams): object;

  /** Parse one SSE data line, return text delta or null */
  parseStreamChunk(data: unknown): string | null;

  /** Fetch available model IDs from the API */
  listModels(baseUrl: string, apiKey: string): Promise<string[]>;
}
