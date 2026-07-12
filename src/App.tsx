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
