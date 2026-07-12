import { useState, useEffect, useRef, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { useToast } from '../Cultivation/Toast';
import { Send, AlertTriangle, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  sectName: string;
  subsectName: string;
}

export function ChatPanel({ sectName, subsectName }: ChatPanelProps) {
  const { activeChat, isSending, sendMessage, lastError, settings } = useSillytavern();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (lastError) addToast(lastError, 'error');
  }, [lastError, addToast]);

  const hasApiConfig = settings?.api?.primary?.baseUrl && settings.api.primary.baseUrl !== 'http://localhost:1234/v1';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDivination = useCallback(() => {
    if (isSending) return;
    sendMessage(`[天机推演] 关于${subsectName}的近期传闻。`);
  }, [isSending, sendMessage, subsectName]);

  return (
    <div className="flex flex-col h-full bg-ink-black/30">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-faded-gold/20 bg-mystic-azure/40 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-spirit-cyan/20 to-mystic-purple/20 border border-spirit-cyan/30 flex items-center justify-center">
          <Sparkles size={18} className="text-spirit-cyan" />
        </div>
        <div>
          <h2 className="font-title text-sm text-scroll-white leading-tight">天道意志</h2>
          <p className="text-[10px] font-ui text-mist-gray/60">{subsectName} · {sectName}</p>
        </div>
        {!hasApiConfig && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-fire-vein/30 bg-fire-vein/5">
            <AlertTriangle size={11} className="text-fire-vein" />
            <span className="text-[10px] font-ui text-fire-vein/80">未连接</span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {(!activeChat || activeChat.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-mystic-azure/40 border border-faded-gold/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-celestial-gold/5 to-spirit-cyan/5 animate-aether-pulse" />
            </div>
            <div>
              <p className="font-title text-lg text-celestial-gold/50 mb-1">神识已连接</p>
              <p className="text-xs text-mist-gray/50 font-body">与天道意志的心神联系已建立</p>
              <p className="text-xs text-mist-gray/40 font-body mt-0.5">诉说你的疑惑，天道将给予指引</p>
            </div>
            {!hasApiConfig && (
              <div className="mt-2 px-4 py-3 rounded-lg border border-fire-vein/20 bg-fire-vein/3 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={13} className="text-fire-vein" />
                  <span className="text-xs font-ui text-fire-vein">API 未配置</span>
                </div>
                <p className="text-[11px] font-body text-mist-gray/50 leading-relaxed">
                  点击右上角齿轮图标进入设置，配置 API 地址与密钥后方可与天道沟通。
                </p>
              </div>
            )}
          </div>
        )}

        {activeChat?.messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="inline-block text-[11px] italic text-mist-gray/40 font-body px-4 py-1 rounded-full bg-mystic-azure/20 border border-faded-gold/10">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-ui mt-0.5 ${
                isUser
                  ? 'bg-celestial-gold/15 border border-celestial-gold/30 text-celestial-gold'
                  : 'bg-spirit-cyan/10 border border-spirit-cyan/20 text-spirit-cyan'
              }`}>
                {isUser ? '修' : '道'}
              </div>

              {/* Bubble */}
              <div className={`max-w-[65%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`text-[10px] font-ui tracking-wider mb-1 ${isUser ? 'text-right text-celestial-gold/60' : 'text-left text-spirit-cyan/60'}`}>
                  {isUser ? '修仙者' : '天道意志'}
                </div>
                <div className={`px-4 py-2.5 rounded-lg ${
                  isUser
                    ? 'bg-deep-ink/60 border border-celestial-gold/15 rounded-tr-sm'
                    : 'bg-mystic-azure/50 border border-spirit-cyan/10 rounded-tl-sm'
                }`}>
                  <div className="text-sm font-body text-scroll-white/90 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-spirit-cyan/10 border border-spirit-cyan/20 text-spirit-cyan text-[10px] font-ui mt-0.5">道</div>
            <div className="max-w-[65%]">
              <div className="text-[10px] font-ui tracking-wider mb-1 text-spirit-cyan/60">天道意志</div>
              <div className="px-4 py-3 rounded-lg rounded-tl-sm bg-mystic-azure/50 border border-spirit-cyan/10">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-spirit-cyan/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-spirit-cyan/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-spirit-cyan/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-faded-gold/20 bg-mystic-azure/50 p-3 shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <button
            onClick={handleDivination}
            disabled={isSending}
            className="shrink-0 px-3 py-2 text-xs font-ui rounded-lg transition-all duration-200 border border-celestial-gold/20 text-celestial-gold/70 hover:bg-celestial-gold/10 hover:border-celestial-gold/40 disabled:opacity-30 disabled:cursor-not-allowed"
            title="推演天机"
          >
            天机
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的话语..."
            disabled={isSending}
            className="flex-1 px-4 py-2 text-sm font-body text-scroll-white bg-deep-ink/60 border border-faded-gold/20 rounded-lg placeholder:text-mist-gray/40 focus:outline-none focus:border-spirit-cyan/30 focus:bg-deep-ink/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="shrink-0 px-4 py-2 text-sm font-ui rounded-lg transition-all duration-200 bg-celestial-gold/15 border border-celestial-gold/30 text-celestial-gold hover:bg-celestial-gold/25 hover:shadow-celestial-glow disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send size={13} />
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
