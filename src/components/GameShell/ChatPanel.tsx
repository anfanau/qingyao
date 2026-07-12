import { useState, useEffect, useRef, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { useToast } from '../Cultivation/Toast';
import { Send, AlertTriangle } from 'lucide-react';

interface ChatPanelProps {
  sectName: string;
  subsectName: string;
}

export function ChatPanel({ sectName, subsectName }: ChatPanelProps) {
  const { activeChat, isSending, sendMessage, lastError, settings } = useSillytavern();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Show error as toast when lastError changes
  useEffect(() => {
    if (lastError) {
      addToast(lastError, 'error');
    }
  }, [lastError, addToast]);

  // Check if API is configured
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {(!activeChat || activeChat.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-mystic-azure/50 border border-faded-gold/30 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-celestial-gold/10 animate-aether-pulse" />
            </div>
            <p className="font-title text-xl text-celestial-gold/40 mb-2">神识连接已建立</p>
            <p className="text-sm text-mist-gray/50 font-body">与{subsectName}的长老建立心神联系...</p>
            {!hasApiConfig && (
              <div className="mt-4 px-4 py-3 rounded-lg border border-fire-vein/30 bg-fire-vein/5 max-w-sm">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-fire-vein" />
                  <span className="text-xs font-ui text-fire-vein">API 未配置</span>
                </div>
                <p className="text-xs font-body text-mist-gray/60 leading-relaxed">
                  请在设置中配置 API 连接地址和密钥，方可与天道沟通。
                </p>
              </div>
            )}
          </div>
        )}
        {activeChat?.messages.map((msg) => {
          if (msg.role === 'system') return (
            <div key={msg.id} className="text-center">
              <span className="inline-block text-xs italic text-mist-gray/50 font-body px-3 py-1">{msg.content}</span>
            </div>
          );
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-lg ${isUser ? 'border-r-2 border-celestial-gold/30 bg-deep-ink/50' : 'border-l-2 border-spirit-cyan/50 bg-mystic-azure/30'}`}>
                <div className={`text-[10px] font-ui tracking-wider mb-1 ${isUser ? 'text-faded-ink text-right' : 'text-celestial-gold'}`}>
                  {isUser ? '弟子' : '天道'}
                </div>
                <div className="text-sm font-body text-scroll-white whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start animate-fade-in">
            <div className="border-l-2 border-spirit-cyan/50 bg-mystic-azure/30 max-w-[70%] px-4 py-3 rounded-lg">
              <div className="text-[10px] font-ui tracking-wider mb-1 text-celestial-gold">天道</div>
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
      <div className="border-t border-faded-gold/40 bg-mystic-azure/60 p-4 shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <button onClick={handleDivination} disabled={isSending} className="px-3 py-2.5 text-xs font-ui rounded-lg transition-all duration-200 border border-celestial-gold/40 text-celestial-gold hover:bg-celestial-gold/10 hover:shadow-celestial-glow disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">推演天机</button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="诉说心中疑惑..." disabled={isSending} className="flex-1 px-4 py-2.5 text-sm font-body text-scroll-white bg-deep-ink/80 border border-faded-gold/40 rounded-lg placeholder:text-mist-gray/40 focus:outline-none focus:border-spirit-cyan/40 focus:shadow-spirit-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200" />
          <button onClick={handleSend} disabled={isSending || !input.trim()} className="px-4 py-2.5 text-sm font-ui rounded-lg transition-all duration-200 border border-celestial-gold/40 text-celestial-gold hover:bg-celestial-gold/10 hover:shadow-celestial-glow disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"><Send size={14} />发送神识</button>
        </div>
      </div>
    </div>
  );
}
