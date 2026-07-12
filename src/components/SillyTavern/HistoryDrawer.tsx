import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import type { ChatMessage } from '../../sillytavern/types';

export function HistoryDrawer() {
  const { activeChat, deleteMessagesFrom, branchFromMessage } = useSillytavern();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeChat) return null;

  const messages = activeChat.messages;

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return '🧑';
      case 'assistant': return '🧙';
      case 'system': return '⚙';
      default: return '❓';
    }
  };

  const getPreview = (msg: ChatMessage) => {
    if (msg.role === 'user') return msg.content.slice(0, 60);
    if (msg.parsedTags?.maintext) return msg.parsedTags.maintext.slice(0, 60);
    return msg.content.slice(0, 60);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-2 top-1/2 -translate-y-1/2 z-30 rune-button px-2 py-4"
        title="天机录"
      >
        <span className="writing-mode-vertical text-xs">{isOpen ? 'Close' : '天机录'}</span>
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 z-20 scroll-panel overflow-y-auto">
          <div className="p-4">
            <h3 className="font-title text-sm text-celestial-gold mb-4">论道天机</h3>

            {messages.length === 0 ? (
              <p className="text-xs text-mist-gray/50 italic">No messages yet.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className="p-3 parchment-card rounded space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getRoleIcon(msg.role)}</span>
                        <span className="text-xs font-ui text-mist-gray uppercase">
                          {msg.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-mist-gray/50">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-scroll-white/80 truncate">
                      {getPreview(msg) || '(empty)'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => deleteMessagesFrom(msg.id)}
                        className="text-[10px] font-ui text-vermil-red hover:text-vermil-red/80 transition-colors"
                      >
                        从此重悟
                      </button>
                      <button
                        onClick={() => branchFromMessage(msg.id)}
                        className="text-[10px] font-ui text-celestial-gold hover:text-celestial-gold/80 transition-colors"
                      >
                        另辟蹊径
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline styles */}
      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  );
}
