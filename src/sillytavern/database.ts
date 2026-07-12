import Dexie, { type Table } from 'dexie';
import type { AppSettings, Lorebook, ChatPreset, ChatSession } from './types';
import { DEFAULT_SETTINGS } from './types';

const DEFAULT_PRESET_ID = 'default-preset';

const DEFAULT_PRESET: ChatPreset = {
  id: DEFAULT_PRESET_ID,
  name: '仙途默认',
  description: '仙途游戏默认对话预设',
  settings: {
    temp_openai: 0.8,
    openai_max_tokens: 1024,
    top_p_openai: 0.95,
    freq_pen_openai: 0,
    pres_pen_openai: 0,
    stream_openai: true,
    openai_model: 'local-model',
    system_prompt: '你是一个修仙世界的天道意志。你以古朴典雅的文言风格与修仙者对话。你知晓天下万事，掌管天道运转。',
    jailbreak_prompt: '',
    character_prompt: '你名为"天道意志"，掌管此方修仙世界的天道运转。你言语间透露着对天地大道的深刻理解，偶尔会给予修仙者启示和指引。',
    user_prompt_template: '{{user}}',
    assistant_prompt_template: '{{char}}',
    custom_prompts: [],
    prompt_order: [
      { id: 'system', name: '系统提示', enabled: true, sortOrder: 0, isCustom: false, templateKey: 'system_prompt' },
      { id: 'character', name: '角色设定', enabled: true, sortOrder: 1, isCustom: false, templateKey: 'character_prompt' },
      { id: 'history', name: '对话历史', enabled: true, sortOrder: 2, isCustom: false, templateKey: 'history' },
      { id: 'user-input', name: '用户输入', enabled: true, sortOrder: 3, isCustom: false, templateKey: 'user-input' },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

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
    await db.settings.put({
      ...DEFAULT_SETTINGS,
      activePresetId: DEFAULT_PRESET_ID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Ensure default preset exists
  const existingPreset = await db.presets.get(DEFAULT_PRESET_ID);
  if (!existingPreset) {
    await db.presets.put(DEFAULT_PRESET);
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
