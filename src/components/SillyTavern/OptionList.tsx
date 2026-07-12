import { useState } from 'react';

interface Option {
  name: string;
  description: string;
}

interface OptionListProps {
  options: Option[];
  onSelect: (option: Option) => void;
  onCustomInput: (text: string) => void;
  disabled?: boolean;
}

export function OptionList({ options, onSelect, onCustomInput, disabled }: OptionListProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    onCustomInput(customInput);
    setCustomInput('');
    setShowCustom(false);
  };

  return (
    <div className="option-list px-4 py-3 border-t border-aged-leather/30">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onSelect(opt)}
              disabled={disabled}
              className="rune-button animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}

      {showCustom ? (
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="What do you do?"
            disabled={disabled}
            className="input-field flex-1"
            autoFocus
          />
          <button onClick={handleCustomSubmit} disabled={disabled} className="rune-button">Act</button>
          <button onClick={() => setShowCustom(false)} className="ember-button">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          disabled={disabled}
          className="text-sm font-ui text-faded-ink hover:text-parchment transition-colors"
        >
          + Custom action...
        </button>
      )}
    </div>
  );
}
