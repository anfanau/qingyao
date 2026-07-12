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
