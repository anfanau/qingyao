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
