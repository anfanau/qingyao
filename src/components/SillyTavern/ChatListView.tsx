import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ChatModal } from './ChatModal';
import { Chat } from './Chat';

interface ChatListViewProps {
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenPresets: () => void;
}

export function ChatListView({ onOpenSettings, onOpenLorebooks, onOpenPresets }: ChatListViewProps) {
  const { activeChatId, setActiveChatId, settings } = useSillytavern();
  const [showSessionList, setShowSessionList] = useState(false);

  const uiMode = settings?.uiMode ?? 'game';

  const handleLoadChat = (id: string) => {
    setActiveChatId(id);
    setShowSessionList(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-aged-leather/30">
        <h1 className="font-display text-xl text-arcane-gold">AI Dungeon RPG</h1>
        <div className="flex items-center gap-2">
          {uiMode === 'chat' && (
            <button onClick={() => setShowSessionList(!showSessionList)} className="rune-button text-xs">
              {showSessionList ? 'Hide Sessions' : 'Sessions'}
            </button>
          )}
          <button onClick={onOpenLorebooks} className="rune-button text-xs">World Books</button>
          <button onClick={onOpenPresets} className="rune-button text-xs">Presets</button>
          <button onClick={onOpenSettings} className="rune-button text-xs">Settings</button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Session sidebar (when visible) */}
        {showSessionList && (
          <div className="w-72 border-r border-aged-leather/30 overflow-y-auto p-3">
            <ChatModal
              onClose={() => setShowSessionList(false)}
              onLoad={handleLoadChat}
            />
          </div>
        )}

        {/* Chat area */}
        <Chat />
      </div>

      {/* Enter Game button for chat mode */}
      {uiMode === 'chat' && activeChatId && (
        <div className="border-t border-aged-leather/30 p-2 text-center">
          <button
            onClick={() => onOpenSettings()} // This would switch to game mode
            className="rune-button text-xs"
          >
            Switch to Game View
          </button>
        </div>
      )}
    </div>
  );
}
