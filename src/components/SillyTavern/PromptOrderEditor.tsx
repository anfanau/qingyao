import type { PromptOrderItem } from '../../sillytavern/types';
import { movePromptItem } from '../../sillytavern/editor-utils';

interface PromptOrderEditorProps {
  items: PromptOrderItem[];
  onChange: (items: PromptOrderItem[]) => void;
}

export function PromptOrderEditor({ items, onChange }: PromptOrderEditorProps) {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    onChange(movePromptItem(items, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    onChange(movePromptItem(items, index, index + 1));
  };

  const handleToggle = (index: number) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item
    );
    onChange(next);
  };

  return (
    <div className="prompt-order-editor space-y-1">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 px-3 py-2 parchment-card"
        >
          <button
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
            className="text-xs text-mist-gray hover:text-scroll-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            {'↑'}
          </button>
          <button
            onClick={() => handleMoveDown(index)}
            disabled={index === items.length - 1}
            className="text-xs text-mist-gray hover:text-scroll-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            {'↓'}
          </button>
          <label className="flex items-center gap-2 text-xs font-ui text-mist-gray cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => handleToggle(index)}
              className="accent-celestial-gold"
            />
            <span className={item.enabled ? 'text-scroll-white' : 'text-mist-gray/60'}>
              {item.name}
            </span>
          </label>
          {item.isCustom && item.customContent && (
            <span className="text-[10px] text-mist-gray/50 truncate max-w-[120px]">
              {item.customContent}
            </span>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-mist-gray/50 italic px-3 py-2">No prompt items configured.</p>
      )}
    </div>
  );
}
