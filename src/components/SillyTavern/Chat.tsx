import { useState, useRef, useEffect } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { VariablePanel } from './VariablePanel';

export function Chat() {
  const { activeChat, isSending, sendMessage } = useSillytavern();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-mist-gray font-ui text-sm">请选择或创建一个论道会话...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {activeChat.messages.length === 0 && (
          <p className="text-center text-mist-gray/50 italic text-sm font-ui mt-8">
            No messages yet. Start the adventure!
          </p>
        )}
        {activeChat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 parchment-card rounded ${
                msg.role === 'user'
                  ? 'border-celestial-gold/20'
                  : 'border-faded-gold/40'
              }`}
            >
              <div className="text-xs font-ui text-mist-gray mb-1 uppercase">
                {msg.role === 'user' ? '弟子' : msg.role === 'assistant' ? '天道' : '天机'}
              </div>
              <div className="story-text text-sm">
                {msg.role === 'assistant' && msg.parsedTags?.maintext
                  ? msg.parsedTags.maintext
                  : msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-faded-gold/30 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="诉说心中疑惑..."
            disabled={isSending}
            className="input-field flex-1"
          />
          <button onClick={handleSend} disabled={isSending || !input.trim()} className="rune-button">
            {isSending ? '...' : '发送神识'}
          </button>
        </div>
      </div>
    </div>
  );
}
