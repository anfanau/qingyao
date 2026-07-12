import { useState, useEffect, useRef, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ArrowLeft, X } from 'lucide-react';

interface CultivationChatProps {
  sectName: string;
  subsectName: string;
  onClose: () => void;
}

export function CultivationChat({ sectName, subsectName, onClose }: CultivationChatProps) {
  const {
    activeChat,
    activeChatId,
    chats,
    isSending,
    sendMessage,
    createChat,
    setActiveChatId,
  } = useSillytavern();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const expectedChatName = `${subsectName} - ${sectName}`;

  // On mount: find or create a chat for this subsect
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initChat = async () => {
      // Check if a chat for this subsect already exists
      const existing = chats.find((c) => c.name === expectedChatName);
      if (existing) {
        setActiveChatId(existing.id);
        return;
      }

      // Create a new chat for this subsect
      const newChat = await createChat({
        name: expectedChatName,
        characterName: '天道意志',
      });
      setActiveChatId(newChat.id);
    };

    initChat();
  }, [chats, expectedChatName, setActiveChatId, createChat]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDivination = useCallback(() => {
    if (isSending) return;
    sendMessage(`[天机推演] 关于${subsectName}的近期传闻。`);
  }, [isSending, sendMessage, subsectName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-faded-gold/40 bg-mystic-azure/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded text-mist-gray hover:text-scroll-white hover:bg-faded-gold/30 transition-colors"
            title="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-title text-lg text-celestial-gold leading-tight">
              {subsectName}
            </h1>
            <p className="text-[11px] font-ui text-mist-gray/60">
              所属: {sectName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDivination}
            disabled={isSending}
            className="px-3 py-1.5 text-xs font-ui rounded border transition-colors
              border-celestial-gold/40 text-celestial-gold
              hover:bg-celestial-gold/10 hover:shadow-celestial-glow
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            推演天机
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-mist-gray hover:text-scroll-white hover:bg-faded-gold/30 transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {(!activeChat || activeChat.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="font-title text-2xl text-celestial-gold/40 mb-2">
              神识连接已建立
            </p>
            <p className="text-sm text-mist-gray/50 font-body">
              与{subsectName}的长老建立心神联系...
            </p>
          </div>
        )}

        {activeChat?.messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="inline-block text-xs italic text-mist-gray/50 font-body px-3 py-1">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`
                  max-w-[75%] px-4 py-2.5 rounded-lg
                  ${isUser
                    ? 'border-r-2 border-celestial-gold/30 bg-deep-ink/50'
                    : 'border-l-2 border-spirit-cyan/50 bg-mystic-azure/30'
                  }
                `}
              >
                <div
                  className={`text-[10px] font-ui uppercase tracking-wider mb-1 ${
                    isUser ? 'text-faded-ink text-right' : 'text-celestial-gold'
                  }`}
                >
                  {isUser ? '弟子' : '天道'}
                </div>
                <div className="text-sm font-body text-scroll-white whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start animate-fade-in">
            <div className="border-l-2 border-spirit-cyan/50 bg-mystic-azure/30 max-w-[75%] px-4 py-2.5 rounded-lg">
              <div className="text-[10px] font-ui uppercase tracking-wider mb-1 text-celestial-gold">
                天道
              </div>
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-faded-gold/40 bg-mystic-azure/60 p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="诉说心中疑惑..."
            disabled={isSending}
            className="flex-1 px-4 py-2.5 text-sm font-body text-scroll-white
              bg-deep-ink/80 border border-faded-gold/40 rounded-lg
              placeholder:text-mist-gray/40
              focus:outline-none focus:border-spirit-cyan/40 focus:shadow-spirit-glow
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="px-5 py-2.5 text-sm font-ui rounded-lg transition-all duration-200
              border border-celestial-gold/40 text-celestial-gold
              hover:bg-celestial-gold/10 hover:shadow-celestial-glow
              disabled:opacity-40 disabled:cursor-not-allowed
              whitespace-nowrap"
          >
            发送神识
          </button>
        </div>
      </div>
    </div>
  );
}
