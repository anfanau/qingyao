# Multi-Provider API Support: DeepSeek + Gemini + Custom

## Overview

Add DeepSeek, Google Gemini, and custom proxy support to the existing OpenAI-compatible API layer. Auto-detect API protocol from URL, fetch model lists, and adapt Gemini's non-OpenAI format transparently.

## Current State

- Single protocol: OpenAI-compatible only (`/chat/completions`, Bearer token, SSE `data:` stream)
- `ApiConfig` has `{ baseUrl, apiKey, model }` — no provider distinction
- Preset buttons: Ollama, LM Studio, OpenAI, OpenRouter
- Stream parser hardcodes OpenAI SSE format
- Model name is manually typed

## Target State

### Type Changes (`sillytavern/types.ts`)

```ts
type ApiProvider = 'openai-compatible' | 'gemini';

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: ApiProvider; // NEW — auto-detected
}
```

**Provider auto-detection**: Inspect `baseUrl` on save:
- Contains `generativelanguage.googleapis.com` → `gemini`
- Everything else → `openai-compatible`

### New Provider Adapters

| File | Purpose |
|---|---|
| `sillytavern/providers/types.ts` | Shared provider interface |
| `sillytavern/providers/openai.ts` | Extract existing logic into adapter |
| `sillytavern/providers/gemini.ts` | Gemini protocol adapter |
| `sillytavern/providers/index.ts` | Registry + `fetchModels()` + `streamChat()` |

**Provider interface:**

```ts
interface ProviderAdapter {
  listModels(baseUrl: string, apiKey: string): Promise<string[]>;
  buildUrl(baseUrl: string, model: string): string;
  buildHeaders(apiKey: string): Record<string, string>;
  buildRequestBody(model: string, messages: Array<{role:string,content:string}>, overrides?: {...}): object;
  parseStreamChunk(data: string): string | null; // extract text delta from SSE line
}
```

### Gemini Format Conversion

Gemini API format differs significantly from OpenAI:

| Aspect | OpenAI | Gemini |
|---|---|---|
| Chat endpoint | `POST {base}/chat/completions` | `POST {base}/models/{model}:streamGenerateContent?alt=sse` |
| Models endpoint | `GET {base}/models` | `GET {base}/models?key={apiKey}` |
| Auth header | `Authorization: Bearer <key>` | `x-goog-api-key: <key>` |
| Request body | `{ model, messages: [{role,content}], stream: true }` | `{ contents: [{role, parts:[{text}]}], generationConfig: {...} }` |
| Stream event | `data: {"choices":[{"delta":{"content":"text"}}]}` | `data: {"candidates":[{"content":{"parts":[{"text":"text"}]}}]}` |
| Role mapping | user/assistant/system | user/model (system → systemInstruction top-level) |

Conversion happens inside the gemini adapter — downstream code is unchanged.

### Model List Fetching

`fetchModels(config: ApiConfig): Promise<string[]>`
- OpenAI: `GET {base}/models` → extract `data[].id`
- Gemini: `GET {base}/models?key={apiKey}` → extract `models[].name`, strip `models/` prefix

### UI Changes (`SettingsModal.tsx`)

- `API_PRESETS` array expanded:
  - `{ label: 'DeepSeek', url: 'https://api.deepseek.com/v1' }`
  - `{ label: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta' }`
  - `{ label: '自定义', url: '' }` — clears URL for manual entry
- Model input field gains a **"获取模型"** button that:
  1. Calls `fetchModels` for the configured provider
  2. Shows a dropdown/popover with available models
  3. Clicking a model fills the input

### Connection Test Update

The existing `testConnection()` uses OpenAI-specific endpoints. Update to use provider adapter:
- OpenAI-compatible: try `/models`, fallback to `/chat/completions` with ping
- Gemini: try `GET {base}/models?key={apiKey}`

### Stream Parser Update

`streamFetch()` in `stream-parser.ts` currently assumes OpenAI SSE format. Update to accept a `provider` parameter and dispatch chunk parsing through the adapter.

### Files Changed

| File | Change |
|---|---|
| `sillytavern/types.ts` | Add `ApiProvider`, add `provider` to `ApiConfig`, update `DEFAULT_SETTINGS` |
| `sillytavern/providers/types.ts` | NEW — `ProviderAdapter` interface |
| `sillytavern/providers/openai.ts` | NEW — extract existing logic |
| `sillytavern/providers/gemini.ts` | NEW — Gemini protocol adapter |
| `sillytavern/providers/index.ts` | NEW — registry, `getAdapter()`, `fetchModels()` |
| `sillytavern/stream-parser.ts` | Accept provider adapter for chunk parsing |
| `sillytavern/api-router.ts` | Use provider adapter for URL/headers/body building |
| `sillytavern/index.ts` | Export new provider modules |
| `hooks/useSillytavern.tsx` | Pass config through to stream calls |
| `components/SillyTavern/SettingsModal.tsx` | New presets, fetch models UI, auto-detect provider |

### Non-Goals

- Vertex AI (GCP service account) auth — Gemini API key only
- Provider-specific preset settings (temperature etc. already handled by preset system)
- Multi-modal (images) — text only
