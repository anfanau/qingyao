import { useEffect, useRef } from 'react';

interface MainTextPaneProps {
  text: string;
  isStreaming?: boolean;
  sum?: string;
}

export function MainTextPane({ text, isStreaming, sum }: MainTextPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="main-text-pane flex-1 overflow-y-auto px-4 py-6" ref={containerRef}>
      {sum && (
        <div className="sum-bar text-xs font-ui text-mist-gray/70 italic mb-4 px-3 py-1.5 border-l-2 border-celestial-gold/30">
          {sum}
        </div>
      )}
      <div className="story-text whitespace-pre-wrap">
        {text || (isStreaming ? (
          <span className="text-mist-gray animate-pulse">天道运转中...</span>
        ) : (
          <span className="text-mist-gray">静待天机...</span>
        ))}
      </div>
      {isStreaming && text && (
        <span className="inline-block w-2 h-5 bg-celestial-gold animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
