import { useState } from 'react';

interface ThinkingFoldProps {
  thinking: string;
  think: string;
  isStreaming?: boolean;
}

export function ThinkingFold({ thinking, think, isStreaming }: ThinkingFoldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  if (!thinking && !think) return null;

  return (
    <div className="thinking-fold border border-aged-leather/30 rounded mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-ui text-faded-ink hover:text-parchment transition-colors"
      >
        <span className="transform transition-transform" style={{ rotate: isOpen ? '90deg' : '0deg' }}>{'▶'}</span>
        <span>AI Reasoning {isStreaming && <span className="text-arcane-gold animate-pulse">...</span>}</span>
        {think && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }}
            className="ml-auto text-[10px] text-faded-ink/50 hover:text-ember"
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-2 text-sm text-faded-ink italic border-t border-aged-leather/20">
          <p>{thinking || 'Thinking...'}</p>
          {showDebug && think && (
            <div className="mt-2 pt-2 border-t border-ember/20 text-ember/60 text-xs">
              <p className="font-ui uppercase text-[10px] mb-1">Debug Trace</p>
              <p>{think}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
