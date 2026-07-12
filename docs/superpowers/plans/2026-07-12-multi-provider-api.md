# Multi-Provider API Support (DeepSeek + Gemini) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DeepSeek, Google Gemini, and custom proxy API support with auto-detection, model list fetching, and transparent protocol adaptation.

**Architecture:** Extract protocol differences into `ProviderAdapter` interface (build URL/headers/body, parse stream chunks, list models). OpenAI and Gemini each implement the adapter. Downstream code (hook, UI) calls through the adapter registry without ever checking which provider is in use.

**Tech Stack:** TypeScript, React, IndexedDB (unchanged), OpenAI-compatible SSE, Gemini SSE

## Global Constraints

- `sillytavern/providers/` is a new directory — all provider code lives there
- Provider auto-detection: URL contains `generativelanguage.googleapis.com` → gemini; else → openai-compatible
- Gemini roles: user→user, assistant→model, system→systemInstruction (not in contents array)
- Existing ChatPanel/SettingsModal UI patterns must be followed
- No new npm dependencies

---

## File Map

```
NEW:
  src/sillytavern/providers/types.ts      — ProviderAdapter interface + common types
  src/sillytavern/providers/openai.ts     — OpenAICompatibleAdapter
  src/sillytavern/providers/gemini.ts     — GeminiAdapter
  src/sillytavern/providers/index.ts      — getAdapter(provider), fetchModels(config)

MODIFY:
  src/sillytavern/types.ts               — +ApiProvider, +provider field on ApiConfig
  src/sillytavern/api-router.ts          — use adapter for URL/headers/body
  src/sillytavern/stream-parser.ts       — streamFetch() takes adapter parameter
  src/sillytavern/index.ts               — export providers/*
  src/components/SillyTavern/SettingsModal.tsx — presets, model fetch UI
```

---

### Task 1: Update types — ApiProvider + provider field

**Files:**
- Modify: `src/sillytavern/types.ts`

**Produces:**
- `type ApiProvider = 'openai-compatible' | 'gemini'`
- `ApiConfig` gains `provider: ApiProvider` field
- `DEFAULT_SETTINGS` updated with `provider: 'openai-compatible'`
- `detectProvider(baseUrl: string): ApiProvider` helper

- [ ] **Step 1: Add type and update ApiConfig**

In `src/sillytavern/types.ts`, before the `ApiConfig` interface, add:

```ts
export type ApiProvider = 'openai-compatible' | 'gemini';

export function detectProvider(baseUrl: string): ApiProvider {
  if (baseUrl.includes('generativelanguage.googleapis.com')) return 'gemini';
  return 'openai-compatible';
}
```

Add `provider` to `ApiConfig`:

```ts
export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: ApiProvider;
}
```

Update `DEFAULT_SETTINGS.api`:

```ts
api: {
  primary: { baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'local-model', provider: 'openai-compatible' as ApiProvider },
  secondary: { enabled: false, baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'local-model', provider: 'openai-compatible' as ApiProvider },
},
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
```

Expected: no new errors from the types file.

- [ ] **Step 3: Commit**

```bash
git add src/sillytavern/types.ts
git commit -m "feat: add ApiProvider type and provider field to ApiConfig"
```

---

### Task 2: Create provider adapter interface and registry

**Files:**
- Create: `src/sillytavern/providers/types.ts`
- Create: `src/sillytavern/providers/index.ts`

**Produces:**
- `ProviderAdapter` interface
- `getAdapter(provider: ApiProvider): ProviderAdapter`
- `fetchModels(config: ApiConfig): Promise<string[]>`

- [ ] **Step 1: Create the adapter interface**

Create `src/sillytavern/providers/types.ts`:

```ts
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
```

- [ ] **Step 2: Create the registry**

Create `src/sillytavern/providers/index.ts`:

```ts
import type { ApiProvider } from '../types';
import type { ProviderAdapter } from './types';
import { OpenAICompatibleAdapter } from './openai';
import { GeminiAdapter } from './gemini';

const adapters: Record<ApiProvider, ProviderAdapter> = {
  'openai-compatible': new OpenAICompatibleAdapter(),
  gemini: new GeminiAdapter(),
};

export function getAdapter(provider: ApiProvider): ProviderAdapter {
  return adapters[provider];
}

export async function fetchModels(
  baseUrl: string,
  apiKey: string,
  provider: ApiProvider,
): Promise<string[]> {
  return getAdapter(provider).listModels(baseUrl, apiKey);
}
```

These reference `./openai` and `./gemini` which don't exist yet — that's fine, we create them in Tasks 3 and 4.

- [ ] **Step 3: Commit**

```bash
git add src/sillytavern/providers/types.ts src/sillytavern/providers/index.ts
git commit -m "feat: add ProviderAdapter interface and registry"
```

---

### Task 3: Create OpenAI adapter

**Files:**
- Create: `src/sillytavern/providers/openai.ts`

**Interfaces:**
- Consumes: `ProviderAdapter` from Task 2
- Produces: `OpenAICompatibleAdapter` class

- [ ] **Step 1: Create the adapter**

Create `src/sillytavern/providers/openai.ts`:

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/sillytavern/providers/openai.ts
git commit -m "feat: add OpenAI-compatible provider adapter"
```

---

### Task 4: Create Gemini adapter

**Files:**
- Create: `src/sillytavern/providers/gemini.ts`

**Interfaces:**
- Consumes: `ProviderAdapter` from Task 2
- Produces: `GeminiAdapter` class

- [ ] **Step 1: Create the adapter**

Create `src/sillytavern/providers/gemini.ts`:

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/sillytavern/providers/gemini.ts
git commit -m "feat: add Gemini provider adapter"
```

---

### Task 5: Update api-router and stream-parser to use adapters

**Files:**
- Modify: `src/sillytavern/api-router.ts`
- Modify: `src/sillytavern/stream-parser.ts`

**Interfaces:**
- Consumes: `ProviderAdapter` from Task 2, adapters from Tasks 3 & 4
- Produces: Updated `routeApi()` returns `RouteDecision` with adapter, updated `streamFetch()` uses adapter

- [ ] **Step 1: Update api-router to include adapter reference**

In `src/sillytavern/api-router.ts`, add import and update `RouteDecision`:

```ts
import type { AppSettings, ApiConfig } from './types';
import type { ProviderAdapter } from './providers/types';
import { getAdapter } from './providers/index';

export type RouteTarget = 'primary' | 'secondary';

export interface RouteDecision {
  target: RouteTarget;
  config: ApiConfig;
  adapter: ProviderAdapter;
}

export function routeApi(
  settings: AppSettings,
  content: { userInput: string; hasVarsTag?: boolean; isSummary?: boolean },
): RouteDecision {
  const useSecondary =
    settings.api.secondary.enabled &&
    (content.hasVarsTag || content.isSummary);

  if (useSecondary) {
    const config: ApiConfig = {
      baseUrl: settings.api.secondary.baseUrl,
      apiKey: settings.api.secondary.apiKey,
      model: settings.api.secondary.model,
      provider: settings.api.secondary.provider,
    };
    return { target: 'secondary', config, adapter: getAdapter(config.provider) };
  }

  const config: ApiConfig = {
    baseUrl: settings.api.primary.baseUrl,
    apiKey: settings.api.primary.apiKey,
    model: settings.api.primary.model,
    provider: settings.api.primary.provider,
  };
  return { target: 'primary', config, adapter: getAdapter(config.provider) };
}

export function buildRequestBody(
  route: RouteDecision,
  messages: Array<{ role: string; content: string }>,
  overrides?: { temperature?: number; max_tokens?: number; top_p?: number },
) {
  return route.adapter.buildRequestBody({
    model: route.config.model,
    messages,
    overrides,
  });
}
```

- [ ] **Step 2: Update streamFetch to use adapter for URL, headers, and chunk parsing**

In `src/sillytavern/stream-parser.ts`, update `streamFetch` signature and body:

```ts
import type { ProviderAdapter } from './providers/types';

// ... (keep createStreamParser unchanged)

export async function streamFetch(
  url: string,
  body: any,
  headers: Record<string, string>,
  callbacks: StreamCallbacks,
  adapter: ProviderAdapter,
  signal?: AbortSignal,
): Promise<ParsedTags> {
  const parser = createStreamParser(callbacks);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const json = JSON.parse(raw);
        const content = adapter.parseStreamChunk(json);
        if (content) parser.feed(content);
      } catch { /* skip unparseable chunks */ }
    }
  }

  return parser.flush();
}
```

- [ ] **Step 3: Update useSillytavern hook to pass adapter to streamFetch**

In `src/hooks/useSillytavern.tsx`, locate the two `streamFetch` calls (sendMessage at ~line 253, editMessage at ~line 359). Update each to:

Before (sendMessage ~line 252-253):
```ts
const apiUrl = route.config.baseUrl.replace(/\/+$/, '') + '/chat/completions';
const parsedTags: ParsedTags = await streamFetch(
  apiUrl,
  requestBody,
  { Authorization: `Bearer ${route.config.apiKey}` },
  { ... } as StreamCallbacks,
);
```

After:
```ts
const apiUrl = route.adapter.buildUrl({ baseUrl: route.config.baseUrl, model: route.config.model });
const headers = route.adapter.buildHeaders(route.config.apiKey);
const parsedTags: ParsedTags = await streamFetch(
  apiUrl,
  requestBody,
  headers,
  { ... } as StreamCallbacks,
  route.adapter,
);
```

Same pattern for editMessage's streamFetch call (~line 357-358) — replace URL and headers construction with adapter calls, and pass `route.adapter` as the 5th argument.

- [ ] **Step 4: Verify types compile**

```bash
npx tsc --noEmit --pretty 2>&1 | head -40
```

Fix any type errors before committing.

- [ ] **Step 5: Commit**

```bash
git add src/sillytavern/api-router.ts src/sillytavern/stream-parser.ts src/hooks/useSillytavern.tsx
git commit -m "feat: wire provider adapters into API routing and streaming"
```

---

### Task 6: Update SettingsModal UI

**Files:**
- Modify: `src/components/SillyTavern/SettingsModal.tsx`

**Interfaces:**
- Consumes: `fetchModels` from Task 2, `detectProvider` from Task 1
- Produces: New preset buttons, model list dropdown, auto-detect provider on URL change

- [ ] **Step 1: Update API_PRESETS and add model fetching**

In `SettingsModal.tsx`, update imports and constants:

```ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Copy, Check, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { useSillytavern } from '../../hooks/useSillytavern';
import type { AppSettings } from '../../sillytavern/types';
import { detectProvider } from '../../sillytavern/types';
import { fetchModels } from '../../sillytavern/providers';

// ...

const API_PRESETS = [
  { label: 'Ollama', url: 'http://localhost:11434/v1' },
  { label: 'LM Studio', url: 'http://localhost:1234/v1' },
  { label: 'OpenAI', url: 'https://api.openai.com/v1' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { label: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { label: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta' },
  { label: '自定义', url: '' },
];
```

Add model fetching state inside the component (after existing state declarations):

```ts
const [modelList, setModelList] = useState<string[]>([]);
const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
const [fetchingModels, setFetchingModels] = useState(false);
const modelDropdownRef = useRef<HTMLDivElement>(null);
const modelFetchTier = useRef<'primary' | 'secondary'>('primary');

// Close dropdown on outside click
useEffect(() => {
  function handleClick(e: MouseEvent) {
    if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
      setModelDropdownOpen(false);
    }
  }
  document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, []);
```

Update `handleApiChange` to also auto-detect provider when baseUrl changes:

```ts
const handleApiChange = async (
  tier: 'primary' | 'secondary',
  field: string,
  value: string | boolean
) => {
  const apiKey = tier === 'primary' ? 'primary' : 'secondary';
  const currentApi = settings.api[apiKey];
  const updates: Record<string, unknown> = { [field]: value };

  // Auto-detect provider when baseUrl changes
  if (field === 'baseUrl' && typeof value === 'string') {
    updates['provider'] = detectProvider(value);
  }

  await updateSettings({
    api: {
      ...settings.api,
      [apiKey]: { ...currentApi, ...updates },
    },
  });
  if (tier === 'primary') { setPrimaryStatus('untested'); setPrimaryError(null); }
  else { setSecondaryStatus('untested'); setSecondaryError(null); }
};
```

- [ ] **Step 2: Add model fetch handler and update model field**

Add a helper function above `renderApiSection`:

```ts
const handleFetchModels = async (tier: 'primary' | 'secondary') => {
  const config = settings.api[tier];
  modelFetchTier.current = tier;
  setFetchingModels(true);
  setModelDropdownOpen(true);
  try {
    const models = await fetchModels(config.baseUrl, config.apiKey, config.provider);
    setModelList(models);
  } catch {
    setModelList([]);
  } finally {
    setFetchingModels(false);
  }
};
```

Inside `renderApiSection`, replace the Model `TextField` with:

```tsx
{/* Model with fetch button */}
<div>
  <label className="block text-xs font-ui text-mist-gray mb-1">Model</label>
  <div className="flex gap-2 relative" ref={tier === modelFetchTier.current ? modelDropdownRef : undefined}>
    <input
      type="text"
      value={config.model}
      onChange={(e) => handleApiChange(tier, 'model', e.target.value)}
      className="input-field flex-1"
      placeholder="local-model"
    />
    <button
      type="button"
      onClick={() => handleFetchModels(tier)}
      disabled={fetchingModels}
      className="rune-button text-xs px-2 py-1 flex items-center gap-1 shrink-0"
      title="获取可用模型"
    >
      {fetchingModels ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      获取
    </button>

    {/* Dropdown */}
    {modelDropdownOpen && tier === modelFetchTier.current && modelList.length > 0 && (
      <div className="absolute top-full right-0 mt-1 w-64 max-h-48 overflow-y-auto bg-mystic-azure border border-faded-gold/30 rounded shadow-lg z-50">
        {modelList.map((m) => (
          <button
            key={m}
            type="button"
            className="w-full text-left text-xs font-mono text-mist-gray hover:text-scroll-white hover:bg-faded-gold/10 px-3 py-1.5 transition-colors"
            onClick={() => {
              handleApiChange(tier, 'model', m);
              setModelDropdownOpen(false);
            }}
          >
            {m}
          </button>
        ))}
      </div>
    )}
    {modelDropdownOpen && tier === modelFetchTier.current && modelList.length === 0 && !fetchingModels && (
      <div className="absolute top-full right-0 mt-1 w-64 bg-mystic-azure border border-faded-gold/30 rounded shadow-lg z-50 px-3 py-2">
        <p className="text-xs text-mist-gray/60">未找到模型，请检查 API Key 和地址。</p>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 3: Update connection test to use adapter**

In `testConnection`, replace the existing logic with adapter-aware version:

```ts
const testConnection = useCallback(async (tier: 'primary' | 'secondary') => {
  const config = settings.api[tier];
  const { getAdapter } = await import('../../sillytavern/providers');
  const adapter = getAdapter(config.provider);
  const setStatus = tier === 'primary' ? setPrimaryStatus : setSecondaryStatus;
  const setError = tier === 'primary' ? setPrimaryError : setSecondaryError;

  setStatus('testing');
  setError(null);

  try {
    const models = await adapter.listModels(config.baseUrl, config.apiKey);
    if (models.length > 0) {
      setStatus('success');
      return;
    }
    // Fallback: try a minimal chat ping
    const url = adapter.buildUrl({ baseUrl: config.baseUrl, model: config.model || 'ping' });
    const headers = adapter.buildHeaders(config.apiKey);
    const body = adapter.buildRequestBody({
      model: config.model || 'ping',
      messages: [{ role: 'user', content: 'ping' }],
      overrides: { max_tokens: 1 },
    });
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: false }),
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      setStatus('success');
    } else {
      const errText = await resp.text().catch(() => '');
      setStatus('failed');
      setError(`${resp.status}: ${errText.slice(0, 80)}`);
    }
  } catch (err: any) {
    setStatus('failed');
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      setError('连接超时');
    } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      setError('无法连接 — 请检查地址或网络');
    } else {
      setError(err.message?.slice(0, 80) || '未知错误');
    }
  }
}, [settings.api]);
```

Also remove the `handleCopyUrl` function (or update it to use adapter). Simplest: keep it as is since it just copies a URL.

- [ ] **Step 4: Verify types compile**

```bash
npx tsc --noEmit --pretty 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SillyTavern/SettingsModal.tsx
git commit -m "feat: add DeepSeek/Gemini presets, model fetching UI, auto-detect provider"
```

---

### Task 7: Export new modules and final wiring

**Files:**
- Modify: `src/sillytavern/index.ts`

- [ ] **Step 1: Add provider exports to barrel**

In `src/sillytavern/index.ts`, add:

```ts
export * from './providers/index';
export * from './providers/types';
```

- [ ] **Step 2: Verify full build compiles**

```bash
npx tsc --noEmit --pretty 2>&1 | head -40
```

Fix any remaining type errors.

- [ ] **Step 3: Commit**

```bash
git add src/sillytavern/index.ts
git commit -m "feat: export provider modules from sillytavern barrel"
```

---

### Task 8: Integration test — verify end to end

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test OpenAI-compatible flow** — Navigate to Settings, select "DeepSeek" preset, enter API key, click "获取模型" to verify model list populates, then run a test chat to confirm streaming works. Check browser console for errors.

- [ ] **Step 3: Test Gemini flow** — Select "Gemini" preset, enter API key, fetch models, verify model dropdown shows Gemini models (e.g. `gemini-2.0-flash`), run a test chat, confirm streaming works. Verify the provider was auto-detected (should show `gemini` in IndexedDB).

- [ ] **Step 4: Test custom proxy** — Enter a custom URL (e.g. a local proxy), verify it's treated as openai-compatible, fetch models works, streaming works.

- [ ] **Step 5: Regression test** — Verify existing Ollama/LM Studio presets still work with the new adapter pattern.
