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
          <h2 className="font-title text-lg text-celestial-gold">论道纪要</h2>
          <button onClick={onClose} className="text-mist-gray hover:text-scroll-white text-lg">{'✕'}</button>
        </div>

        {/* New Game */}
        <button onClick={handleNewGame} className="rune-button text-sm mb-4 w-full">
          + 新会话
        </button>

        {/* Session List */}
        {chats.length === 0 ? (
          <p className="text-sm text-mist-gray/50 italic">尚无论道记录...</p>
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
                      <button onClick={() => handleRename(chat.id)} className="rune-button text-xs px-2 py-1">保存</button>
                      <button onClick={() => setRenamingId(null)} className="ember-button text-xs px-2 py-1">取消</button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-ui text-sm text-scroll-white truncate">{chat.name}</h3>
                      <div className="flex gap-3 text-[10px] text-mist-gray mt-1">
                        <span>{chat.characterName}</span>
                        <span>{chat.messages.length} messages</span>
                        <span>{formatDate(chat.updatedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button onClick={() => onLoad(chat.id)} className="rune-button text-xs px-2 py-1">进入</button>
                  {renamingId !== chat.id && (
                    <>
                      <button
                        onClick={() => { setRenamingId(chat.id); setRenameValue(chat.name); }}
                        className="rune-button text-xs px-2 py-1"
                      >
                        改名
                      </button>
                      <button onClick={() => handleDelete(chat.id)} className="ember-button text-xs px-2 py-1">删除</button>
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
