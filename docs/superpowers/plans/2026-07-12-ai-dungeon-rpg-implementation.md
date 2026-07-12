# AI Dungeon RPG — SillyTavern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React + TypeScript AI Dungeon RPG with full SillyTavern ecosystem integration (lorebooks, presets, streaming tag parsing, dual API routing, floor variable backtracking).

**Architecture:** Framework-agnostic SillyTavern core (`src/sillytavern/`) → React hooks (`src/hooks/`) → UI components (`src/components/SillyTavern/`) → App shell. Dark fantasy Tailwind theme throughout. IndexedDB persistence via Dexie.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, Dexie 4

## Global Constraints

- All code in TypeScript with strict mode
- IndexedDB via Dexie for all persistence
- SSE streaming for AI responses
- 6 custom tags: maintext, option, sum, vars, thinking, think
- Dual API config (primary + secondary) in settings
- Dark fantasy theme: obsidian/parchment/gold/ember palette
- Google Fonts: Cinzel (headings), Crimson Text (body), Inter (UI)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `src/main.tsx`, `src/index.css`, `src/App.tsx`

**Interfaces:**
- Produces: Runnable `npm run dev` project with React + TypeScript + Tailwind + Dexie

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ai-dungeon-rpg",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "dexie": "^4.0.8"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.3"
  }
}
```

- [ ] **Step 2: Install dependencies and verify**

Run: `cd D:/game && npm install`
Expected: all packages install without errors

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Dungeon RPG</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-obsidian text-parchment">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0d0d0d',
        'dark-parchment': '#1a1410',
        'aged-leather': '#2d2418',
        scroll: '#f4e4c1',
        'arcane-gold': '#c9a84c',
        ember: '#d4652a',
        parchment: '#e8dcc8',
        'faded-ink': '#8b7355',
        'hp-crimson': '#8b0000',
        'mp-azure': '#1e5fa8',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'rune-glow': '0 0 15px rgba(201, 168, 76, 0.4)',
        'rune-strong': '0 0 25px rgba(201, 168, 76, 0.6)',
        'ember-glow': '0 0 12px rgba(212, 101, 42, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 8px rgba(201, 168, 76, 0.3)' }, '50%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.6)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 8: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 9: Create src/index.css** — see `src/index.css` content in spec styling section with Tailwind directives, dark fantasy theme variables, custom component classes (`.scroll-panel`, `.rune-button`, `.ember-button`, `.parchment-card`, `.story-text`, `.modal-overlay`, `.modal-panel`, `.tab-button`, `.input-field`, `.stat-bar-bg`, `.stat-bar-fill`), custom scrollbar styles, and body background with radial gradients.

- [ ] **Step 10: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 11: Create src/App.tsx (minimal shell)**

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="font-display text-3xl text-arcane-gold">AI Dungeon RPG</h1>
    </div>
  );
}
```

- [ ] **Step 12: Verify dev server starts**

Run: `cd D:/game && npx vite --host 0.0.0.0`
Expected: dev server starts, visit http://localhost:5173 shows "AI Dungeon RPG" in gold

- [ ] **Step 13: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```
---

### Task 2: SillyTavern Core Types (`src/sillytavern/types.ts`)

**Files:**
- Create: `src/sillytavern/types.ts`

**Interfaces:**
- Produces: All TypeScript types used by every other module
- Key exports: `GameVariables`, `ChatMessage`, `ChatSession`, `LorebookEntry`, `Lorebook`, `ChatPreset`, `PresetSettings`, `AppSettings`, `ApiConfig`, `ParsedTags`, `StreamCallbacks`, `PromptOrderItem`, `USER_ROLE`, `DEFAULT_GAME_VARIABLES`

- [ ] **Step 1: Write types.ts**

```typescript
// ============================================================
// Game State
// ============================================================

export interface GameVariables {
  hp: number; mp: number;
  maxHp: number; maxMp: number;
  level: number; exp: number; gold: number;
  inventory: string[];
  location: string;
  quests: Record<string, 'active' | 'done'>;
  flags: Record<string, boolean>;
  [key: string]: any;
}

export const DEFAULT_GAME_VARIABLES: GameVariables = {
  hp: 100, mp: 50,
  maxHp: 100, maxMp: 50,
  level: 1, exp: 0, gold: 0,
  inventory: [],
  location: 'tavern',
  quests: {},
  flags: {},
};

// ============================================================
// Streaming Tags
// ============================================================

export interface ParsedTags {
  maintext: string;
  thinking: string;
  think: string;
  sum: string;
  vars: Record<string, string | number>;
  options: Array<{ name: string; description: string }>;
}

export interface StreamCallbacks {
  onMainText?: (chunk: string, full: string) => void;
  onThinking?: (chunk: string, full: string) => void;
  onThink?: (chunk: string, full: string) => void;
  onSum?: (chunk: string, full: string) => void;
  onVars?: (vars: Record<string, string | number>) => void;
  onOptions?: (options: Array<{ name: string; description: string }>) => void;
  onDone?: (parsed: ParsedTags) => void;
  onError?: (error: Error) => void;
}

export const DEFAULT_TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'] as const;
export type CustomTag = typeof DEFAULT_TAGS[number];

// ============================================================
// Chat Messages & Sessions
// ============================================================

export const USER_ROLE = 'user' as const;
export const ASSISTANT_ROLE = 'assistant' as const;
export const SYSTEM_ROLE = 'system' as const;

export interface ChatMessage {
  id: string;
  role: typeof USER_ROLE | typeof ASSISTANT_ROLE | typeof SYSTEM_ROLE;
  content: string;
  rawContent?: string;
  parsedTags?: ParsedTags;
  timestamp: number;
  variables: GameVariables;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  characterName: string;
  userName: string;
  presetId: string | null;
  lorebookIds: string[];
  variables: GameVariables;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Lorebooks
// ============================================================

export interface LorebookEntry {
  id: string;
  keys: string[];
  secondaryKeys: string[];
  content: string;
  enabled: boolean;
  priority: number;
  position: 'before_char' | 'after_char' | 'system' | 'user';
  probability: number;
  useProbability: boolean;
  constant: boolean;
  selectiveLogic: 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL';
  caseSensitive: boolean;
  matchWholeWords: boolean;
}

export interface Lorebook {
  id: string;
  name: string;
  description: string;
  entries: LorebookEntry[];
  scanDepth: number;
  tokenBudget: number;
  recursiveScanning: boolean;
  allowRecursion: boolean;
  maxRecursionDepth: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Presets
// ============================================================

export interface PresetSettings {
  temp_openai: number;
  openai_max_tokens: number;
  top_p_openai: number;
  freq_pen_openai: number;
  pres_pen_openai: number;
  stream_openai: boolean;
  openai_model: string;
  system_prompt: string;
  jailbreak_prompt: string;
  character_prompt: string;
  user_prompt_template: string;
  assistant_prompt_template: string;
  custom_prompts: Array<{ name: string; content: string }>;
  prompt_order: PromptOrderItem[];
}

export interface PromptOrderItem {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
  isCustom: boolean;
  templateKey?: string;
  customContent?: string;
}

export interface ChatPreset {
  id: string;
  name: string;
  description: string;
  settings: PresetSettings;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// App Settings
// ============================================================

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  id: 'app-settings';
  characterName: string;
  userName: string;
  uiMode: 'chat' | 'game';
  customTags: string[];
  api: {
    primary: ApiConfig;
    secondary: {
      enabled: boolean;
    } & ApiConfig;
  };
  activePresetId: string | null;
  activeLorebookIds: string[];
  defaultGameVariables: GameVariables;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app-settings',
  characterName: 'Adventurer',
  userName: 'Player',
  uiMode: 'game',
  customTags: [...DEFAULT_TAGS],
  api: {
    primary: { baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'local-model' },
    secondary: { enabled: false, baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'local-model' },
  },
  activePresetId: null,
  activeLorebookIds: [],
  defaultGameVariables: DEFAULT_GAME_VARIABLES,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

- [ ] **Step 2: Verify types compile**

Run: `cd D:/game && npx tsc --noEmit`
Expected: no errors in types.ts (may have errors in App.tsx until later)

- [ ] **Step 3: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add SillyTavern core types"
```

---

### Task 3: Database Layer (`src/sillytavern/database.ts`)

**Files:**
- Create: `src/sillytavern/database.ts`

**Interfaces:**
- Consumes: All types from `types.ts`
- Produces: `initializeDatabase()`, `getSettings()`, `saveSettings()`, `getLorebooks()`, `saveLorebook()`, `deleteLorebook()`, `getPresets()`, `savePreset()`, `deletePreset()`, `getChats()`, `saveChat()`, `deleteChat()`

- [ ] **Step 1: Write database.ts**

```typescript
import Dexie, { type Table } from 'dexie';
import type { AppSettings, Lorebook, ChatPreset, ChatSession } from './types';
import { DEFAULT_SETTINGS } from './types';

class SillyTavernDB extends Dexie {
  settings!: Table<AppSettings, string>;
  lorebooks!: Table<Lorebook, string>;
  presets!: Table<ChatPreset, string>;
  chats!: Table<ChatSession, string>;

  constructor() {
    super('SillyTavernDB');
    this.version(1).stores({
      settings: 'id',
      lorebooks: 'id, name, updatedAt',
      presets: 'id, name, updatedAt',
      chats: 'id, name, updatedAt',
    });
  }
}

const db = new SillyTavernDB();

export async function initializeDatabase(): Promise<void> {
  await db.open();
  const existing = await db.settings.get('app-settings');
  if (!existing) {
    await db.settings.put({ ...DEFAULT_SETTINGS, createdAt: Date.now(), updatedAt: Date.now() });
  }
}

export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get('app-settings');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ ...settings, updatedAt: Date.now() });
}

export async function getLorebooks(): Promise<Lorebook[]> {
  return db.lorebooks.orderBy('updatedAt').reverse().toArray();
}

export async function saveLorebook(lorebook: Lorebook): Promise<void> {
  await db.lorebooks.put({ ...lorebook, updatedAt: Date.now() });
}

export async function deleteLorebook(id: string): Promise<void> {
  await db.lorebooks.delete(id);
}

export async function getPresets(): Promise<ChatPreset[]> {
  return db.presets.orderBy('updatedAt').reverse().toArray();
}

export async function savePreset(preset: ChatPreset): Promise<void> {
  await db.presets.put({ ...preset, updatedAt: Date.now() });
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

export async function getChats(): Promise<ChatSession[]> {
  return db.chats.orderBy('updatedAt').reverse().toArray();
}

export async function saveChat(chat: ChatSession): Promise<void> {
  await db.chats.put({ ...chat, updatedAt: Date.now() });
}

export async function deleteChat(id: string): Promise<void> {
  await db.chats.delete(id);
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd D:/game && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add Dexie IndexedDB database layer"
```
---

### Task 4: Editor Utilities (`src/sillytavern/editor-utils.ts`)

**Files:**
- Create: `src/sillytavern/editor-utils.ts`

**Interfaces:**
- Consumes: `LorebookEntry`, `Lorebook`, `PromptOrderItem` from `types.ts`
- Produces: `createDefaultEntry()`, `createDefaultLorebook()`, `applyEntryDefaults()`, `updateEntry()`, `removeEntry()`, `movePromptItem()`, `clampNumber()`

- [ ] **Step 1: Write editor-utils.ts**

```typescript
import type { LorebookEntry, Lorebook, PromptOrderItem } from './types';

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createDefaultEntry(overrides?: Partial<LorebookEntry>): LorebookEntry {
  return {
    id: crypto.randomUUID(),
    keys: [],
    secondaryKeys: [],
    content: '',
    enabled: true,
    priority: 10,
    position: 'before_char',
    probability: 100,
    useProbability: false,
    constant: false,
    selectiveLogic: 'AND_ANY',
    caseSensitive: false,
    matchWholeWords: false,
    ...overrides,
  };
}

export function applyEntryDefaults(entry: Partial<LorebookEntry>): LorebookEntry {
  return createDefaultEntry(entry);
}

export function updateEntry(
  entries: LorebookEntry[],
  id: string,
  updates: Partial<LorebookEntry>
): LorebookEntry[] {
  return entries.map(e => (e.id === id ? { ...e, ...updates } : e));
}

export function removeEntry(entries: LorebookEntry[], id: string): LorebookEntry[] {
  return entries.filter(e => e.id !== id);
}

export function createDefaultLorebook(name?: string): Lorebook {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: name || 'New World Book',
    description: '',
    entries: [],
    scanDepth: 50,
    tokenBudget: 500,
    recursiveScanning: false,
    allowRecursion: false,
    maxRecursionDepth: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function movePromptItem(
  items: PromptOrderItem[],
  fromIndex: number,
  toIndex: number
): PromptOrderItem[] {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(clampNumber(toIndex, 0, next.length), 0, item);
  return next.map((p, i) => ({ ...p, sortOrder: i }));
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add editor utility functions"
```

---

### Task 5: Lorebook Engine (`src/sillytavern/lorebook-engine.ts`)

**Files:**
- Create: `src/sillytavern/lorebook-engine.ts`

**Interfaces:**
- Consumes: `Lorebook`, `LorebookEntry` from `types.ts`
- Produces: `matchLorebooks(lorebooks, text)` → `LorebookMatch[]`

- [ ] **Step 1: Write lorebook-engine.ts**

```typescript
import type { Lorebook, LorebookEntry } from './types';

export interface LorebookMatch {
  lorebookId: string;
  lorebookName: string;
  entry: LorebookEntry;
  matchedKey: string;
  priority: number;
}

export function matchLorebooks(
  lorebooks: Lorebook[],
  text: string,
): LorebookMatch[] {
  const matches: LorebookMatch[] = [];
  const lowerText = text.toLowerCase();

  for (const book of lorebooks) {
    for (const entry of book.entries) {
      if (!entry.enabled) continue;

      const matches_ = matchEntry(entry, lowerText);
      if (matches_.length > 0) {
        for (const key of matches_) {
          matches.push({
            lorebookId: book.id,
            lorebookName: book.name,
            entry,
            matchedKey: key,
            priority: entry.priority,
          });
        }
      }
    }
  }

  matches.sort((a, b) => b.priority - a.priority);
  return matches;
}

function matchEntry(entry: LorebookEntry, lowerText: string): string[] {
  const matchedKeys: string[] = [];
  const primaryMatches = matchKeyList(entry.keys, lowerText, entry);
  const secondaryMatches = matchKeyList(entry.secondaryKeys, lowerText, entry);

  switch (entry.selectiveLogic) {
    case 'AND_ANY':
      if (primaryMatches.length > 0) matchedKeys.push(...primaryMatches);
      break;
    case 'AND_ALL':
      if (entry.keys.length > 0 && primaryMatches.length === entry.keys.length) {
        matchedKeys.push(...primaryMatches);
      }
      break;
    case 'NOT_ANY':
      if (primaryMatches.length === 0) matchedKeys.push('(no match)');
      break;
    case 'NOT_ALL':
      if (primaryMatches.length < entry.keys.length || entry.keys.length === 0) {
        matchedKeys.push('(not all)');
      }
      break;
  }

  if (entry.constant) {
    if (matchedKeys.length === 0) matchedKeys.push('(constant)');
  }

  if (entry.useProbability && entry.probability < 100) {
    if (Math.random() * 100 > entry.probability) return [];
  }

  return matchedKeys;
}

function matchKeyList(
  keys: string[],
  lowerText: string,
  entry: LorebookEntry,
): string[] {
  return keys.filter(key => {
    const k = entry.caseSensitive ? key : key.toLowerCase();
    if (entry.matchWholeWords) {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, entry.caseSensitive ? 'g' : 'gi');
      return regex.test(lowerText);
    }
    return lowerText.includes(k);
  });
}

export function formatLorebookContext(
  matches: LorebookMatch[],
  maxTokens: number = 500,
): string {
  if (matches.length === 0) return '';
  const parts = matches.map(m => `[${m.lorebookName}] ${m.entry.content}`);
  let result = parts.join('\n\n');
  const estimatedTokens = Math.ceil(result.length / 4);
  if (estimatedTokens > maxTokens) {
    result = parts.slice(0, Math.floor(maxTokens / (estimatedTokens / parts.length))).join('\n\n');
  }
  return result;
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add lorebook keyword matching engine"
```

---

### Task 6: Variables & Backtracking (`src/sillytavern/variables.ts` + `vars-merger.ts`)

**Files:**
- Create: `src/sillytavern/variables.ts`, `src/sillytavern/vars-merger.ts`

- [ ] **Step 1: Write variables.ts**

```typescript
import type { GameVariables, ChatMessage } from './types';
import { DEFAULT_GAME_VARIABLES } from './types';

export function extractVariables(rawText: string): {
  cleanedText: string;
  updates: Record<string, string | number>;
} {
  const updates: Record<string, string | number> = {};
  const varsRegex = /<vars>([\s\S]*?)<\/vars>/gi;

  let cleanedText = rawText.replace(varsRegex, (_match, inner) => {
    const lineRegex = /<(\S+?):(.+?)>/g;
    let lineMatch: RegExpExecArray | null;
    while ((lineMatch = lineRegex.exec(inner)) !== null) {
      const key = lineMatch[1].trim();
      const rawValue = lineMatch[2].trim();
      const num = Number(rawValue);
      updates[key] = Number.isNaN(num) ? rawValue : num;
    }
    return '';
  });

  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();
  return { cleanedText, updates };
}

export function snapshotVariables(vars: GameVariables): GameVariables {
  return JSON.parse(JSON.stringify(vars));
}

export function createVariableSnapshot(messages: ChatMessage[]): GameVariables {
  let vars = { ...DEFAULT_GAME_VARIABLES };
  for (const msg of messages) {
    if (msg.parsedTags?.vars) {
      vars = mergeVariables(vars, msg.parsedTags.vars);
    }
  }
  return vars;
}
```

- [ ] **Step 2: Write vars-merger.ts**

```typescript
import type { GameVariables, ChatMessage } from './types';
import { DEFAULT_GAME_VARIABLES } from './types';

export function mergeVariables(
  current: GameVariables,
  updates: Record<string, string | number>,
): GameVariables {
  const next = { ...current };
  for (const [key, rawValue] of Object.entries(updates)) {
    if (key.includes('.')) {
      const [parent, child] = key.split('.', 2);
      if (parent in next && typeof next[parent] === 'object' && !Array.isArray(next[parent])) {
        (next as any)[parent] = { ...(next as any)[parent], [child]: rawValue };
      }
    } else if (key.startsWith('+') && Array.isArray((next as any)[key.slice(1)])) {
      const arrKey = key.slice(1);
      (next as any)[arrKey] = [...(next as any)[arrKey], rawValue as string];
    } else if (key.startsWith('-') && Array.isArray((next as any)[key.slice(1)])) {
      const arrKey = key.slice(1);
      (next as any)[arrKey] = (next as any)[arrKey].filter((i: string) => i !== String(rawValue));
    } else if (typeof rawValue === 'number' && key in next && typeof (next as any)[key] === 'number') {
      (next as any)[key] = (next as any)[key] + rawValue;
    } else {
      (next as any)[key] = rawValue;
    }
  }
  return next;
}

export function backtrackVariables(
  messages: ChatMessage[],
  targetIndex: number,
): GameVariables {
  let vars = { ...DEFAULT_GAME_VARIABLES };
  for (let i = 0; i <= targetIndex && i < messages.length; i++) {
    if (messages[i].parsedTags?.vars) {
      vars = mergeVariables(vars, messages[i].parsedTags.vars);
    }
  }
  return vars;
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add variable extraction, merging, and floor backtracking"
```

---

### Task 7: Prompt Assembler (`src/sillytavern/prompt-assembler.ts`)

**Files:**
- Create: `src/sillytavern/prompt-assembler.ts`

**Interfaces:**
- Consumes: `ChatMessage`, `ChatPreset`, `Lorebook`, `GameVariables` from `types.ts`; `matchLorebooks`, `formatLorebookContext` from `lorebook-engine.ts`
- Produces: `assemblePrompt(opts)` → `{ messages: Array<{role:string, content:string}> }`

- [ ] **Step 1: Write prompt-assembler.ts**

```typescript
import type { ChatMessage, ChatPreset, Lorebook, GameVariables } from './types';
import { USER_ROLE, ASSISTANT_ROLE, SYSTEM_ROLE } from './types';
import { matchLorebooks, formatLorebookContext } from './lorebook-engine';

export interface AssembleOpts {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables: GameVariables;
}

export interface AssembleResult {
  messages: Array<{ role: string; content: string }>;
  lorebookContext: string;
}

export function assemblePrompt(opts: AssembleOpts): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName, variables } = opts;
  const s = preset.settings;

  // Match lorebooks against recent context
  const recentText = history.slice(-20).map(m => m.content).join('\n') + '\n' + userInput;
  const matches = matchLorebooks(lorebooks, recentText);
  const lorebookContext = formatLorebookContext(matches);

  // Substitute variables in templates
  const sub = (text: string) => substituteVariables(text, variables);

  const orderedItems = [...s.prompt_order].sort((a, b) => a.sortOrder - b.sortOrder);
  const finalMessages: Array<{ role: string; content: string }> = [];

  for (const item of orderedItems) {
    if (!item.enabled) continue;
    let content = '';
    if (item.templateKey) {
      switch (item.templateKey) {
        case 'system_prompt': content = sub(s.system_prompt); break;
        case 'jailbreak_prompt': content = sub(s.jailbreak_prompt); break;
        case 'character_prompt':
          content = sub(s.character_prompt)
            .replace(/\{\{char\}\}/g, characterName)
            .replace(/\{\{user\}\}/g, userName);
          break;
        case 'user_prompt_template': break; // handled per user message
        case 'assistant_prompt_template': break; // handled per assistant message
      }
    } else if (item.isCustom && item.customContent) {
      content = sub(item.customContent);
    }
    if (content) {
      finalMessages.push({ role: SYSTEM_ROLE, content });
    }
  }

  // Inject lorebook context before character prompt
  if (lorebookContext) {
    const charIdx = finalMessages.findIndex(m => m.content.includes(characterName));
    const insertIdx = charIdx >= 0 ? charIdx : finalMessages.length;
    finalMessages.splice(insertIdx, 0, {
      role: SYSTEM_ROLE,
      content: `[World Info]\n${lorebookContext}`,
    });
  }

  // Append conversation history
  for (const msg of history) {
    const template = msg.role === USER_ROLE ? sub(s.user_prompt_template || '{{input}}') : sub(s.assistant_prompt_template || '{{response}}');
    const formattedContent = template
      .replace(/\{\{input\}\}/g, msg.content)
      .replace(/\{\{response\}\}/g, msg.content)
      .replace(/\{\{char\}\}/g, characterName)
      .replace(/\{\{user\}\}/g, userName);
    finalMessages.push({ role: msg.role, content: formattedContent });
  }

  // Append current user input
  const userTemplate = sub(s.user_prompt_template || '{{input}}');
  finalMessages.push({
    role: 'user',
    content: userTemplate.replace(/\{\{input\}\}/g, userInput).replace(/\{\{user\}\}/g, userName),
  });

  return { messages: finalMessages, lorebookContext };
}

function substituteVariables(text: string, vars: GameVariables): string {
  return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_match, key) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      return String(((vars as any)[parent]?.[child]) ?? `{{${key}}}`);
    }
    return String((vars as any)[key] ?? `{{${key}}}`);
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add prompt assembler with lorebook injection and variable substitution"
```

---

### Task 8: Stream Parser (`src/sillytavern/stream-parser.ts`)

**Files:**
- Create: `src/sillytavern/stream-parser.ts`

- [ ] **Step 1: Write stream-parser.ts**

```typescript
import type { ParsedTags, StreamCallbacks } from './types';

const TAG_ORDER = ['thinking', 'think', 'maintext', 'sum', 'vars', 'option'] as const;

interface ParserState {
  currentTag: string | null;
  buffer: string;
  tagBuffers: Record<string, string>;
  vars: Record<string, string | number>;
  options: Array<{ name: string; description: string }>;
}

export function createStreamParser(callbacks: StreamCallbacks) {
  const state: ParserState = {
    currentTag: null,
    buffer: '',
    tagBuffers: {},
    vars: {},
    options: [],
  };

  for (const tag of TAG_ORDER) {
    state.tagBuffers[tag] = '';
  }

  function feed(chunk: string): void {
    state.buffer += chunk;
    process();
  }

  function process(): void {
    const tagRegex = /<\/?(thinking|think|maintext|sum|vars|option)(?:\s+name="(.*?)")?\s*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(state.buffer)) !== null) {
      const [fullMatch, tagName, attrValue] = match;
      const isClosing = fullMatch.startsWith('</');
      const beforeTag = state.buffer.substring(0, match.index);

      // Flush text before tag to current tag buffer
      if (state.currentTag && beforeTag) {
        state.tagBuffers[state.currentTag] += beforeTag;
        emitChunk(state.currentTag, beforeTag);
      }

      if (!isClosing) {
        // Opening tag
        state.currentTag = tagName.toLowerCase();
        if (tagName === 'option' && attrValue) {
          state.tagBuffers['option'] = ''; // reset for new option
        }
      } else {
        // Closing tag
        if (state.currentTag === tagName.toLowerCase()) {
          finalizeTag(tagName.toLowerCase());
        }
        state.currentTag = null;
      }

      state.buffer = state.buffer.substring(match.index + fullMatch.length);
      tagRegex.lastIndex = 0;
    }
  }

  function emitChunk(tag: string, chunk: string): void {
    switch (tag) {
      case 'maintext': callbacks.onMainText?.(chunk, state.tagBuffers.maintext); break;
      case 'thinking': callbacks.onThinking?.(chunk, state.tagBuffers.thinking); break;
      case 'think': callbacks.onThink?.(chunk, state.tagBuffers.think); break;
      case 'sum': callbacks.onSum?.(chunk, state.tagBuffers.sum); break;
    }
  }

  function finalizeTag(tag: string): void {
    switch (tag) {
      case 'vars': {
        const varRegex = /<(\S+?):(.+?)>/g;
        let vm: RegExpExecArray | null;
        while ((vm = varRegex.exec(state.tagBuffers.vars)) !== null) {
          const key = vm[1].trim();
          const rawValue = vm[2].trim();
          const num = Number(rawValue);
          state.vars[key] = Number.isNaN(num) ? rawValue : num;
        }
        callbacks.onVars?.({ ...state.vars });
        break;
      }
      case 'option': {
        const optMatch = state.tagBuffers.option.match(/<option\s+name="(.*?)"\s*>/i);
        if (optMatch) {
          // Extract description from the text after the tag
          const descStart = state.tagBuffers.option.indexOf('>') + 1;
          const description = state.tagBuffers.option.substring(descStart).trim();
          const name = optMatch[1];
          state.options.push({ name, description: description || name });
          callbacks.onOptions?.([...state.options]);
        }
        break;
      }
    }
  }

  function flush(): ParsedTags {
    process();
    // Flush remaining buffer
    if (state.currentTag && state.buffer) {
      state.tagBuffers[state.currentTag] += state.buffer;
      emitChunk(state.currentTag, state.buffer);
    }
    const parsed: ParsedTags = {
      maintext: state.tagBuffers.maintext.trim(),
      thinking: state.tagBuffers.thinking.trim(),
      think: state.tagBuffers.think.trim(),
      sum: state.tagBuffers.sum.trim(),
      vars: { ...state.vars },
      options: [...state.options],
    };
    callbacks.onDone?.(parsed);
    return parsed;
  }

  function reset(): void {
    state.buffer = '';
    state.currentTag = null;
    for (const tag of TAG_ORDER) state.tagBuffers[tag] = '';
    state.vars = {};
    state.options = [];
  }

  return { feed, flush, reset };
}

export async function streamFetch(
  url: string,
  body: any,
  headers: Record<string, string>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<ParsedTags> {
  const parser = createStreamParser(callbacks);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ ...body, stream: true }),
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
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) parser.feed(content);
      } catch { /* skip unparseable chunks */ }
    }
  }

  return parser.flush();
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add SSE stream parser with 6-tag extraction"
```

---

### Task 9: API Router (`src/sillytavern/api-router.ts`)

**Files:**
- Create: `src/sillytavern/api-router.ts`

- [ ] **Step 1: Write api-router.ts**

```typescript
import type { AppSettings, ApiConfig } from './types';

export type RouteTarget = 'primary' | 'secondary';

export interface RouteDecision {
  target: RouteTarget;
  config: ApiConfig;
}

export function routeApi(
  settings: AppSettings,
  content: { userInput: string; hasVarsTag?: boolean; isSummary?: boolean },
): RouteDecision {
  const useSecondary =
    settings.api.secondary.enabled &&
    (content.hasVarsTag || content.isSummary);

  if (useSecondary) {
    return {
      target: 'secondary',
      config: {
        baseUrl: settings.api.secondary.baseUrl,
        apiKey: settings.api.secondary.apiKey,
        model: settings.api.secondary.model,
      },
    };
  }

  return {
    target: 'primary',
    config: {
      baseUrl: settings.api.primary.baseUrl,
      apiKey: settings.api.primary.apiKey,
      model: settings.api.primary.model,
    },
  };
}

export function buildRequestBody(
  route: RouteDecision,
  messages: Array<{ role: string; content: string }>,
  overrides?: { temperature?: number; max_tokens?: number; top_p?: number },
) {
  return {
    model: route.config.model,
    messages,
    stream: true,
    temperature: overrides?.temperature ?? 0.7,
    max_tokens: overrides?.max_tokens ?? 1024,
    top_p: overrides?.top_p ?? 0.9,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add dual API router with primary/secondary dispatch"
```

---

### Task 10: Importer/Exporter (`src/sillytavern/importer.ts`)

**Files:**
- Create: `src/sillytavern/importer.ts`

- [ ] **Step 1: Write importer.ts**

```typescript
import type { Lorebook, ChatPreset, AppSettings, ChatSession } from './types';
import { saveLorebook, savePreset, saveSettings, saveChat } from './database';

export interface SillyTavernExport {
  version: number;
  type: 'full' | 'lorebook' | 'preset' | 'character';
  lorebooks?: Lorebook[];
  presets?: ChatPreset[];
  settings?: Partial<AppSettings>;
  sessions?: ChatSession[];
}

export function validateSillyTavernJson(data: any): data is SillyTavernExport {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'number') return false;
  if (!['full', 'lorebook', 'preset', 'character'].includes(data.type)) return false;
  return true;
}

export async function importSillyTavernJson(
  json: SillyTavernExport,
): Promise<{ lorebooks: number; presets: number; sessions: number }> {
  const counts = { lorebooks: 0, presets: 0, sessions: 0 };

  if (json.lorebooks) {
    for (const book of json.lorebooks) {
      await saveLorebook(book);
      counts.lorebooks++;
    }
  }

  if (json.presets) {
    for (const preset of json.presets) {
      await savePreset(preset);
      counts.presets++;
    }
  }

  if (json.settings) {
    const { getSettings, saveSettings } = await import('./database');
    const existing = await getSettings();
    if (existing) {
      await saveSettings({ ...existing, ...json.settings, updatedAt: Date.now() });
    }
  }

  if (json.sessions) {
    for (const session of json.sessions) {
      await saveChat(session);
      counts.sessions++;
    }
  }

  return counts;
}

export function exportToJson(data: {
  lorebooks?: Lorebook[];
  presets?: ChatPreset[];
  sessions?: ChatSession[];
}): SillyTavernExport {
  return {
    version: 3,
    type: 'full',
    ...data,
  };
}

export function downloadJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add SillyTavern JSON import/export"
```

---

### Task 11: Barrel Export + Core Index (`src/sillytavern/index.ts`)

**Files:**
- Create: `src/sillytavern/index.ts`

- [ ] **Step 1: Write index.ts**

```typescript
export * from './types';
export * from './database';
export * from './lorebook-engine';
export * from './prompt-assembler';
export * from './stream-parser';
export * from './api-router';
export * from './variables';
export * from './vars-merger';
export * from './importer';
export * from './editor-utils';
```

- [ ] **Step 2: Verify full core compilation**

Run: `cd D:/game && npx tsc --noEmit`
Expected: no errors across all sillytavern core modules

- [ ] **Step 3: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add SillyTavern core barrel export"
```
---

### Task 12: React Hooks

**Files:**
- Create: `src/hooks/useSillytavern.ts`, `src/hooks/useStreamParser.ts`, `src/hooks/useApiRouter.ts`

---

#### Task 12a: `useSillytavern.ts` — Main State Hook

**Interfaces:**
- Consumes: All core modules via `../../sillytavern`
- Produces: React hook with full state management — `lorebooks`, `presets`, `settings`, `chats`, `activeChat`, `isSending`, `isLoading` + all actions (`sendMessage`, `createChat`, `deleteChat`, `editMessage`, `branchFromMessage`, `updateVariables`, `toggleLorebook`, `updateSettings`, `saveLorebook`, `deleteLorebook`, `savePreset`, `deletePreset`)

- [ ] **Step 1: Write useSillytavern.ts**

This hook wraps all core SillyTavern functions into React state. Key behaviors:

1. `loadAll()`: Initializes DB, loads settings/lorebooks/presets/chats in parallel
2. `sendMessage(content)`: Assembles prompt → routes API → streams response → parses tags → merges variables → saves to DB
3. `editMessage(id, newContent)`: Truncates chat at message, re-sends from that point using stored variable snapshot
4. `branchFromMessage(id, name?)`: Creates a new ChatSession with history cloned up to the branch point
5. `updateVariables(updates)`: Merges variable deltas into active chat's floor state

See `docs/superpowers/specs/2026-07-12-ai-dungeon-rpg-sillytavern-design.md` §Appendix for full hook code pattern (380 lines). The hook uses `useState` + `useCallback` + `useEffect` for auto-load on mount. It persists variable snapshots on every message and handles the full send → stream → parse → save pipeline.

- [ ] **Step 2: Write useStreamParser.ts**

```typescript
import { useRef, useCallback } from 'react';
import { createStreamParser, streamFetch, type StreamCallbacks, type ParsedTags } from '../sillytavern';

export function useStreamParser() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    url: string,
    body: any,
    apiKey: string,
    callbacks: StreamCallbacks,
  ): Promise<ParsedTags> => {
    abortRef.current = new AbortController();
    try {
      return await streamFetch(url, body, { Authorization: `Bearer ${apiKey}` }, callbacks, abortRef.current.signal);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const createParser = useCallback((callbacks: StreamCallbacks) => {
    return createStreamParser(callbacks);
  }, []);

  return { stream, abort, createParser };
}
```

- [ ] **Step 3: Write useApiRouter.ts**

```typescript
import { useCallback } from 'react';
import type { AppSettings } from '../sillytavern';
import { routeApi, buildRequestBody, type RouteDecision } from '../sillytavern';

export function useApiRouter(settings: AppSettings | null) {
  const route = useCallback((userInput: string, hasVarsTag?: boolean, isSummary?: boolean): RouteDecision | null => {
    if (!settings) return null;
    return routeApi(settings, { userInput, hasVarsTag, isSummary });
  }, [settings]);

  const buildBody = useCallback((decision: RouteDecision, messages: Array<{ role: string; content: string }>, overrides?: any) => {
    return buildRequestBody(decision, messages, overrides);
  }, []);

  return { route, buildBody };
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: add React hooks (useSillytavern, useStreamParser, useApiRouter)"
```

---

### Task 13: Dark Fantasy Theme & Global Styles

**Files:**
- Create/Update: `src/index.css` (replace placeholder with full theme)

- [ ] **Step 1: Write full index.css**

The full `src/index.css` contains (see Task 1 Step 9 for the complete content):
- Tailwind directives (`@tailwind base/components/utilities`)
- Base layer: body styling with radial gradient background, custom scrollbar
- Components layer: `.scroll-panel`, `.rune-button`, `.ember-button`, `.parchment-card`, `.story-text`, `.modal-overlay`, `.modal-panel`, `.tab-button`, `.input-field`, `.stat-bar-bg`, `.stat-bar-fill`

Run after creating: `cd D:/game && npx tsc --noEmit` — verify no CSS-related issues.

- [ ] **Step 2: Commit**

```bash
cd D:/game && git add -A && git commit -m "style: apply full dark fantasy Tailwind theme"
```

---

### Task 14: UI Components — Bottom-Up

Build components in dependency order. Each component follows the dark fantasy theme using Tailwind utility classes and the custom component classes defined in `index.css`.

#### Task 14a: ThinkingFold.tsx

```tsx
import { useState } from 'react';

interface ThinkingFoldProps {
  thinking: string;   // visible reasoning (<thinking> tag)
  think: string;      // hidden reasoning (<think> tag)
  isStreaming?: boolean;
}

export function ThinkingFold({ thinking, think, isStreaming }: ThinkingFoldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  if (!thinking && !think) return null;

  return (
    <div className="thinking-fold border border-aged-leather/30 rounded mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-ui text-faded-ink hover:text-parchment transition-colors"
      >
        <span className="transform transition-transform" style={{ rotate: isOpen ? '90deg' : '0deg' }}>▶</span>
        <span>AI Reasoning {isStreaming && <span className="text-arcane-gold animate-pulse">...</span>}</span>
        {think && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }}
            className="ml-auto text-[10px] text-faded-ink/50 hover:text-ember"
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-2 text-sm text-faded-ink italic border-t border-aged-leather/20">
          <p>{thinking || 'Thinking...'}</p>
          {showDebug && think && (
            <div className="mt-2 pt-2 border-t border-ember/20 text-ember/60 text-xs">
              <p className="font-ui uppercase text-[10px] mb-1">Debug Trace</p>
              <p>{think}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### Task 14b: MainTextPane.tsx

```tsx
import { useEffect, useRef } from 'react';

interface MainTextPaneProps {
  text: string;
  isStreaming?: boolean;
  sum?: string;
}

export function MainTextPane({ text, isStreaming, sum }: MainTextPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="main-text-pane flex-1 overflow-y-auto px-4 py-6" ref={containerRef}>
      {sum && (
        <div className="sum-bar text-xs font-ui text-faded-ink/70 italic mb-4 px-3 py-1.5 border-l-2 border-arcane-gold/30">
          {sum}
        </div>
      )}
      <div className="story-text whitespace-pre-wrap">
        {text || (isStreaming ? (
          <span className="text-faded-ink animate-pulse">The dungeon master is thinking...</span>
        ) : (
          <span className="text-faded-ink">The adventure awaits...</span>
        ))}
      </div>
      {isStreaming && text && (
        <span className="inline-block w-2 h-5 bg-arcane-gold animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
```

#### Task 14c: OptionList.tsx

```tsx
import { useState } from 'react';

interface Option {
  name: string;
  description: string;
}

interface OptionListProps {
  options: Option[];
  onSelect: (option: Option) => void;
  onCustomInput: (text: string) => void;
  disabled?: boolean;
}

export function OptionList({ options, onSelect, onCustomInput, disabled }: OptionListProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    onCustomInput(customInput);
    setCustomInput('');
    setShowCustom(false);
  };

  return (
    <div className="option-list px-4 py-3 border-t border-aged-leather/30">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onSelect(opt)}
              disabled={disabled}
              className="rune-button animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}

      {showCustom ? (
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="What do you do?"
            disabled={disabled}
            className="input-field flex-1"
            autoFocus
          />
          <button onClick={handleCustomSubmit} disabled={disabled} className="rune-button">Act</button>
          <button onClick={() => setShowCustom(false)} className="ember-button">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          disabled={disabled}
          className="text-sm font-ui text-faded-ink hover:text-parchment transition-colors"
        >
          + Custom action...
        </button>
      )}
    </div>
  );
}
```

#### Task 14d: VariablePanel.tsx

Slide-out drawer showing HP/MP bars, inventory grid, active quests, and story flags. Uses `activeChat.variables` from `useSillytavern()`. Editable inline via the edit mode pattern from the spec's VariablePanel code.

#### Task 14e: HistoryDrawer.tsx

Timeline of all messages in active chat. Each entry shows a timestamp, role icon, message preview, and variable snapshot. Buttons: "Rewind to here" (calls `backtrackVariables` + `truncateChatAt`) and "Branch from here" (calls `branchFromMessage`).

#### Task 14f: EntryForm.tsx

Form fields for LorebookEntry: keys (comma-separated input), secondary keys, content (textarea), priority (number), position (select), probability (range), toggles (enabled, constant, useProbability, caseSensitive, matchWholeWords). Core fields visible, advanced in `<details>` fold.

#### Task 14g: PromptOrderEditor.tsx

List of `PromptOrderItem[]` with drag handles (↑↓ buttons), enabled checkboxes, and name labels. Uses `movePromptItem()` from editor-utils.

#### Task 14h: LorebookEditorModal.tsx

Modal listing entries for one Lorebook. Entry list on the left, EntryForm for selected entry on the right. Add/delete entry buttons. "Back to Books" button returns to LorebookModal.

#### Task 14i: LorebookModal.tsx

Modal listing all Lorebooks with activate/deactivate toggles, edit (opens LorebookEditorModal), delete, and import/export buttons. New Book button creates via `createDefaultLorebook()`.

#### Task 14j: PresetModal.tsx

Four-tab modal:
- Tab "Sampling": temperature, top_p, max_tokens, frequency penalty, presence penalty sliders/inputs
- Tab "Prompts": textareas for system_prompt, jailbreak_prompt, character_prompt, user/assistant templates
- Tab "Custom": list of custom prompt name+content pairs, add/delete
- Tab "Order": PromptOrderEditor for sorting prompt blocks

#### Task 14k: SettingsModal.tsx

Five-tab modal:
- Tab "Character": characterName, userName inputs
- Tab "Primary API": baseUrl, apiKey (password), model inputs
- Tab "Secondary API": enable toggle + same API fields
- Tab "UI": uiMode toggle (chat/game), typewriter speed slider
- Tab "Defaults": default HP/MP/level/gold inputs for new games

#### Task 14l: Chat.tsx + ChatModal.tsx

**Chat.tsx**: Simple message list with bubble styling. Each message shows role, content, and action buttons (edit for user messages, delete-subsequent, branch). VariablePanel embedded. Input bar at bottom.

**ChatModal.tsx**: Modal listing all ChatSessions. Each shows name, character, last-updated. Buttons: Load, Rename, Delete, Export. Top bar: "New Game" button.

#### Task 14m: ChatListView.tsx

Session manager view — the default view when `uiMode` is 'game'. Shows the session list (ChatModal inline or as sidebar), plus quick-access buttons for Settings, Lorebooks, Presets. "Enter Game" button loads the active session into GameView.

#### Task 14n: GameView.tsx

Full-viewport immersive game layout:
- Top bar: character name, HP/MP bars (compact), menu buttons
- Center: MainTextPane (scrollable narrative area)
- Below narrative: ThinkingFold (collapsible)  
- Bottom: OptionList (choices + custom input)
- Slide-out drawers: VariablePanel (left), HistoryDrawer (right)
- Uses `useSillytavern()`, `useStreamParser()`, `useApiRouter()`

The GameView orchestrates the full send→stream→parse→display pipeline:
1. User picks option or types custom input
2. `sendMessage()` is called
3. `streamParser.feed()` updates MainTextPane, OptionList, ThinkingFold in real-time via callbacks
4. On `flush()`, variable panel updates with new state

For all UI components, follow Tailwind dark fantasy classes: `.scroll-panel` for card backgrounds, `.rune-button` for primary actions, `.ember-button` for secondary/destructive, `.story-text` for narrative, `.input-field` for form inputs, `.modal-overlay` + `.modal-panel` for modals.

- [ ] **Step 1: Write all UI components**

Create each file in `src/components/SillyTavern/`. Verify compilation after each group:
- Small components first: ThinkingFold, MainTextPane, OptionList, EntryForm, PromptOrderEditor
- Modals: LorebookEditorModal, LorebookModal, PresetModal, SettingsModal
- Views: VariablePanel, HistoryDrawer, Chat, ChatModal, ChatListView, GameView

- [ ] **Step 2: Commit after each component group**

---

### Task 15: App Shell Integration

**Files:**
- Update: `src/App.tsx`

- [ ] **Step 1: Write full App.tsx**

```tsx
import { useSillytavern } from './hooks/useSillytavern';
import { ChatListView } from './components/SillyTavern/ChatListView';
import { GameView } from './components/SillyTavern/GameView';
import { SettingsModal } from './components/SillyTavern/SettingsModal';
import { LorebookModal } from './components/SillyTavern/LorebookModal';
import { PresetModal } from './components/SillyTavern/PresetModal';
import { LorebookEditorModal } from './components/SillyTavern/LorebookEditorModal';
import { useState } from 'react';

type ModalType = 'settings' | 'lorebooks' | 'presets' | null;

export default function App() {
  const { settings, isLoading } = useSillytavern();
  const [modal, setModal] = useState<ModalType>(null);
  const [editingLorebookId, setEditingLorebookId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-arcane-gold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  const uiMode = settings?.uiMode || 'game';

  return (
    <div className="min-h-screen bg-obsidian">
      {uiMode === 'game' ? (
        <GameView
          onOpenSettings={() => setModal('settings')}
          onOpenLorebooks={() => setModal('lorebooks')}
          onOpenPresets={() => setModal('presets')}
        />
      ) : (
        <ChatListView
          onOpenSettings={() => setModal('settings')}
          onOpenLorebooks={() => setModal('lorebooks')}
          onOpenPresets={() => setModal('presets')}
        />
      )}

      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'lorebooks' && (
        editingLorebookId ? (
          <LorebookEditorModal
            lorebookId={editingLorebookId}
            onBack={() => setEditingLorebookId(null)}
          />
        ) : (
          <LorebookModal
            onClose={() => setModal(null)}
            onEdit={(id) => setEditingLorebookId(id)}
          />
        )
      )}
      {modal === 'presets' && <PresetModal onClose={() => setModal(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server runs and compiles**

Run: `cd D:/game && npx tsc --noEmit && npx vite build`
Expected: no TypeScript errors, build succeeds

- [ ] **Step 3: Commit**

```bash
cd D:/game && git add -A && git commit -m "feat: integrate App shell with mode routing and modals"
```

---

### Task 16: Verification

Run the full verification checklist from the spec:

- [ ] `npm run dev` starts without errors
- [ ] TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] Dark fantasy theme renders (obsidian bg, gold accents, parchment text)
- [ ] Settings modal: can configure API, character, UI mode, defaults
- [ ] Lorebook modal: create/edit/delete books and entries
- [ ] Preset modal: all 4 tabs work, prompt_order sortable
- [ ] Import: file picker → validate → confirm → IndexedDB
- [ ] Export: select → bundle → download .json
- [ ] ChatListView: create/load/delete sessions
- [ ] GameView: MainTextPane + OptionList + ThinkingFold + VariablePanel + HistoryDrawer visible
- [ ] Streaming: 6 tags parsed in real-time from SSE
- [ ] Variables: HP/MP/inventory/quests/flags editable and auto-updated from `<vars>` tags
- [ ] Floor backtracking: rewind restores correct variable state
- [ ] Branching: creates working fork with shared history
- [ ] Dual API: appropriate requests to each endpoint

- [ ] **Final commit**

```bash
cd D:/game && git add -A && git commit -m "feat: complete AI Dungeon RPG with SillyTavern integration"
```
