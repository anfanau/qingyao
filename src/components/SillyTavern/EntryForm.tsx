import type { LorebookEntry } from '../../sillytavern/types';

interface EntryFormProps {
  entry: LorebookEntry;
  onChange: (entry: LorebookEntry) => void;
}

export function EntryForm({ entry, onChange }: EntryFormProps) {
  const updateField = <K extends keyof LorebookEntry>(key: K, value: LorebookEntry[K]) => {
    onChange({ ...entry, [key]: value });
  };

  return (
    <div className="entry-form space-y-4">
      {/* Keys */}
      <div>
        <label className="block text-xs font-ui text-faded-ink mb-1">Keys (comma-separated)</label>
        <input
          type="text"
          value={entry.keys.join(', ')}
          onChange={(e) => updateField('keys', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="input-field w-full"
          placeholder="sword, blade, longsword"
        />
      </div>

      {/* Secondary Keys */}
      <div>
        <label className="block text-xs font-ui text-faded-ink mb-1">Secondary Keys (comma-separated)</label>
        <input
          type="text"
          value={entry.secondaryKeys.join(', ')}
          onChange={(e) => updateField('secondaryKeys', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="input-field w-full"
          placeholder="weapon, steel"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-ui text-faded-ink mb-1">Content</label>
        <textarea
          value={entry.content}
          onChange={(e) => updateField('content', e.target.value)}
          className="input-field w-full min-h-[100px] resize-y"
          placeholder="The ancient blade gleams with an inner fire..."
        />
      </div>

      {/* Core fields row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-ui text-faded-ink mb-1">Priority</label>
          <input
            type="number"
            value={entry.priority}
            onChange={(e) => updateField('priority', Number(e.target.value))}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-ui text-faded-ink mb-1">Position</label>
          <select
            value={entry.position}
            onChange={(e) => updateField('position', e.target.value as LorebookEntry['position'])}
            className="input-field w-full"
          >
            <option value="before_char">Before Character</option>
            <option value="after_char">After Character</option>
            <option value="system">System</option>
            <option value="user">User</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-ui text-faded-ink mb-1">Probability (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={entry.probability}
            onChange={(e) => updateField('probability', Number(e.target.value))}
            disabled={!entry.useProbability}
            className="w-full accent-arcane-gold"
          />
          <span className="text-xs text-faded-ink">{entry.probability}%</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="accent-arcane-gold"
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
          <input
            type="checkbox"
            checked={entry.constant}
            onChange={(e) => updateField('constant', e.target.checked)}
            className="accent-arcane-gold"
          />
          Constant
        </label>
        <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
          <input
            type="checkbox"
            checked={entry.useProbability}
            onChange={(e) => updateField('useProbability', e.target.checked)}
            className="accent-arcane-gold"
          />
          Use Probability
        </label>
      </div>

      {/* Advanced fields */}
      <details className="border border-aged-leather/30 rounded p-3">
        <summary className="text-xs font-ui text-faded-ink cursor-pointer hover:text-parchment">
          Advanced Settings
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-ui text-faded-ink mb-1">Selective Logic</label>
            <select
              value={entry.selectiveLogic}
              onChange={(e) => updateField('selectiveLogic', e.target.value as LorebookEntry['selectiveLogic'])}
              className="input-field w-full"
            >
              <option value="AND_ANY">AND_ANY</option>
              <option value="AND_ALL">AND_ALL</option>
              <option value="NOT_ANY">NOT_ANY</option>
              <option value="NOT_ALL">NOT_ALL</option>
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
              <input
                type="checkbox"
                checked={entry.caseSensitive}
                onChange={(e) => updateField('caseSensitive', e.target.checked)}
                className="accent-arcane-gold"
              />
              Case Sensitive
            </label>
            <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
              <input
                type="checkbox"
                checked={entry.matchWholeWords}
                onChange={(e) => updateField('matchWholeWords', e.target.checked)}
                className="accent-arcane-gold"
              />
              Match Whole Words
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}
