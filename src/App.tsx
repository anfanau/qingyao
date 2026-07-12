import { useState, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { useSillytavern } from './hooks/useSillytavern';
import type { PlayerData } from './types/game';

// Views
import { SplashScreen } from './components/Splash/SplashScreen';
import { SectOrbitView } from './components/SectMap/SectOrbitView';
import { SectDetailView } from './components/SectDetail/SectDetailView';
import { GameShell } from './components/GameShell/GameShell';
import { CharacterCreation } from './components/Character/CharacterCreation';

// Modals
import { SettingsModal } from './components/SillyTavern/SettingsModal';
import { LorebookModal } from './components/SillyTavern/LorebookModal';
import { LorebookEditorModal } from './components/SillyTavern/LorebookEditorModal';
import { PresetModal } from './components/SillyTavern/PresetModal';
import { ChatModal } from './components/SillyTavern/ChatModal';

// Toast
import { ToastProvider, ToastContainer } from './components/Cultivation/Toast';

function AppContent() {
  const { state, actions } = useGameState();
  const {
    isLoading,
    createChat,
    setActiveChatId,
  } = useSillytavern();

  const [editingLorebookId, setEditingLorebookId] = useState<string | null>(null);
  const [pendingEntry, setPendingEntry] = useState<{
    sectId: string;
    sectName: string;
    subsectName: string;
  } | null>(null);

  // ---- Splash completion ----
  const handleSplashComplete = useCallback(() => {
    actions.completeSplash();
  }, [actions]);

  // ---- Sect selection ----
  const handleSelectSect = useCallback((sectId: string) => {
    actions.selectSect(sectId);
  }, [actions]);

  const handleBackToOrbit = useCallback(() => {
    actions.selectSect(null);
  }, [actions]);

  // ---- Enter subsect flow ----
  const handleEnterSubsect = useCallback(async (sectName: string, subsectName: string) => {
    if (!state.player) {
      setPendingEntry({
        sectId: state.selectedSectId ?? '',
        sectName,
        subsectName,
      });
      actions.showCharCreation();
      return;
    }
    const chat = await createChat({
      name: `${subsectName} - ${sectName}`,
      characterName: '天道意志',
    });
    setActiveChatId(chat.id);
    actions.startGame(sectName, subsectName);
  }, [actions, state.player, state.selectedSectId, createChat, setActiveChatId]);

  const handleCharComplete = useCallback(async (player: PlayerData) => {
    actions.setPlayer(player);
    if (pendingEntry) {
      const { sectName, subsectName } = pendingEntry;
      setPendingEntry(null);
      const chat = await createChat({
        name: `${subsectName} - ${sectName}`,
        characterName: '天道意志',
      });
      setActiveChatId(chat.id);
      actions.startGame(sectName, subsectName);
    }
  }, [actions, pendingEntry, createChat, setActiveChatId]);

  const handleCharCancel = useCallback(() => {
    setPendingEntry(null);
    actions.hideCharCreation();
  }, [actions]);

  // ---- Game exit ----
  const handleExitGame = useCallback(() => {
    actions.exitGame();
  }, [actions]);

  // ---- Modal close ----
  const handleCloseModal = useCallback(() => {
    actions.setModal(null);
  }, [actions]);

  // ---- Derive preselected sect ID for character creation ----
  const preselectedSectId = pendingEntry?.sectId ?? null;

  // ---- Loading screen ----
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-black">
        <div className="font-title text-2xl text-celestial-gold animate-pulse">
          天道运转中...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Splash Screen */}
      {state.view === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Sect Orbit View */}
      {state.view === 'sect-orbit' && (
        <SectOrbitView
          onOpenSettings={() => actions.setModal('settings')}
          onOpenLorebooks={() => actions.setModal('lorebooks')}
          onOpenPresets={() => actions.setModal('presets')}
          onOpenSessions={() => actions.setModal('sessions')}
          onSelectSect={handleSelectSect}
        />
      )}

      {/* Sect Detail View */}
      {state.view === 'sect-detail' && state.selectedSectId && (
        <SectDetailView
          sectId={state.selectedSectId}
          onBack={handleBackToOrbit}
          onEnterSubsect={handleEnterSubsect}
        />
      )}

      {/* Game Shell */}
      {state.view === 'game-shell' && state.activeGame && (
        <GameShell
          sectName={state.activeGame.sectName}
          subsectName={state.activeGame.subsectName}
          activeTab={state.sidebarTab}
          player={state.player}
          onTabChange={actions.setSidebarTab}
          onExit={handleExitGame}
          onOpenSettings={() => actions.setModal('settings')}
        />
      )}

      {/* Character Creation Overlay */}
      {state.showCharacterCreation && (
        <CharacterCreation
          onComplete={handleCharComplete}
          onCancel={handleCharCancel}
          preselectedSectId={preselectedSectId}
        />
      )}

      {/* Modals */}
      {state.modal === 'settings' && (
        <SettingsModal onClose={handleCloseModal} />
      )}
      {state.modal === 'lorebooks' && (
        editingLorebookId ? (
          <LorebookEditorModal
            lorebookId={editingLorebookId}
            onBack={() => setEditingLorebookId(null)}
          />
        ) : (
          <LorebookModal
            onClose={handleCloseModal}
            onEdit={(id) => setEditingLorebookId(id)}
          />
        )
      )}
      {state.modal === 'presets' && (
        <PresetModal onClose={handleCloseModal} />
      )}
      {state.modal === 'sessions' && (
        <ChatModal
          onClose={handleCloseModal}
          onLoad={(id) => setActiveChatId(id)}
        />
      )}

      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
