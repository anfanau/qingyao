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
