import { useState } from 'react';
import { useSillytavern } from './hooks/useSillytavern';
import { SectMapView } from './components/Cultivation/SectMapView';
import { CultivationChat } from './components/Cultivation/CultivationChat';
import { ToastProvider, ToastContainer, useToast } from './components/Cultivation/Toast';
import { ChatListView } from './components/SillyTavern/ChatListView';
import { SettingsModal } from './components/SillyTavern/SettingsModal';
import { LorebookModal } from './components/SillyTavern/LorebookModal';
import { LorebookEditorModal } from './components/SillyTavern/LorebookEditorModal';
import { PresetModal } from './components/SillyTavern/PresetModal';
import { ChatModal } from './components/SillyTavern/ChatModal';

type ModalType = 'settings' | 'lorebooks' | 'presets' | 'sessions' | null;

function AppContent() {
  const { settings, isLoading, createChat, setActiveChatId } = useSillytavern();
  const [modal, setModal] = useState<ModalType>(null);
  const [editingLorebookId, setEditingLorebookId] = useState<string | null>(null);
  const [cultivationChat, setCultivationChat] = useState<{
    sectName: string;
    subsectName: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-black">
        <div className="font-title text-2xl text-celestial-gold animate-pulse">
          天道运转中...
        </div>
      </div>
    );
  }

  const handleEnterSubsect = async (sectName: string, subsectName: string) => {
    const chat = await createChat({
      name: `${subsectName} - ${sectName}`,
      characterName: '天道意志',
    });
    setActiveChatId(chat.id);
    setCultivationChat({ sectName, subsectName });
  };

  return (
    <div className="min-h-screen bg-ink-black">
      <SectMapView
        onOpenSettings={() => setModal('settings')}
        onOpenLorebooks={() => setModal('lorebooks')}
        onOpenPresets={() => setModal('presets')}
        onOpenSessions={() => setModal('sessions')}
        onEnterSubsect={handleEnterSubsect}
      />

      {cultivationChat && (
        <CultivationChat
          sectName={cultivationChat.sectName}
          subsectName={cultivationChat.subsectName}
          onClose={() => setCultivationChat(null)}
        />
      )}

      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'lorebooks' && (
        editingLorebookId ? (
          <LorebookEditorModal lorebookId={editingLorebookId} onBack={() => setEditingLorebookId(null)} />
        ) : (
          <LorebookModal onClose={() => setModal(null)} onEdit={(id) => setEditingLorebookId(id)} />
        )
      )}
      {modal === 'presets' && <PresetModal onClose={() => setModal(null)} />}
      {modal === 'sessions' && <ChatModal onClose={() => setModal(null)} onLoad={(id) => setActiveChatId(id)} />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastContainer />
    </ToastProvider>
  );
}
