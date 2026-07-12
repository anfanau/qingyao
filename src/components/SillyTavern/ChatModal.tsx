import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface ChatModalProps {
  onClose: () => void;
  onLoad: (id: string) => void;
}

export function ChatModal({ onClose, onLoad }: ChatModalProps) {
  const { chats, createChat, renameChat, deleteChatById } = useSillytavern();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNewGame = async () => {
    const newChat = await createChat();
    onLoad(newChat.id);
  };

  const handleRename = async (id: string) => {
    if (renameValue.trim()) {
      await renameChat(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this chat session permanently?')) {
      await deleteChatById(id);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-arcane-gold">Chat Sessions</h2>
          <button onClick={onClose} className="text-faded-ink hover:text-parchment text-lg">{'✕'}</button>
        </div>

        {/* New Game */}
        <button onClick={handleNewGame} className="rune-button text-sm mb-4 w-full">
          + New Game
        </button>

        {/* Session List */}
        {chats.length === 0 ? (
          <p className="text-sm text-faded-ink/50 italic">No sessions yet. Start a new game!</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {chats.sort((a, b) => b.updatedAt - a.updatedAt).map((chat) => (
              <div key={chat.id} className="p-3 parchment-card rounded flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {renamingId === chat.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                        className="input-field flex-1 text-xs"
                        autoFocus
                      />
                      <button onClick={() => handleRename(chat.id)} className="rune-button text-xs px-2 py-1">Save</button>
                      <button onClick={() => setRenamingId(null)} className="ember-button text-xs px-2 py-1">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-ui text-sm text-parchment truncate">{chat.name}</h3>
                      <div className="flex gap-3 text-[10px] text-faded-ink mt-1">
                        <span>{chat.characterName}</span>
                        <span>{chat.messages.length} messages</span>
                        <span>{formatDate(chat.updatedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button onClick={() => onLoad(chat.id)} className="rune-button text-xs px-2 py-1">Load</button>
                  {renamingId !== chat.id && (
                    <>
                      <button
                        onClick={() => { setRenamingId(chat.id); setRenameValue(chat.name); }}
                        className="rune-button text-xs px-2 py-1"
                      >
                        Rename
                      </button>
                      <button onClick={() => handleDelete(chat.id)} className="ember-button text-xs px-2 py-1">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
