import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

export function VariablePanel() {
  const { activeChat, updateVariables } = useSillytavern();
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const vars = activeChat?.variables;
  if (!vars) return null;

  const hpPercent = vars.maxHp > 0 ? (vars.hp / vars.maxHp) * 100 : 0;
  const mpPercent = vars.maxMp > 0 ? (vars.mp / vars.maxMp) * 100 : 0;

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setEditMode(false);
    }
  };

  const enterEditMode = () => {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value !== 'object') {
        values[key] = String(value);
      }
    }
    setEditValues(values);
    setEditMode(true);
  };

  const handleSaveEdits = async () => {
    const updates: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(editValues)) {
      const num = Number(value);
      updates[key] = Number.isNaN(num) ? value : num;
    }
    await updateVariables(updates);
    setEditMode(false);
  };

  const inventory = Array.isArray(vars.inventory) ? vars.inventory : [];
  const quests = vars.quests && typeof vars.quests === 'object' && !Array.isArray(vars.quests)
    ? (vars.quests as Record<string, 'active' | 'done'>)
    : {};
  const flags = vars.flags && typeof vars.flags === 'object' && !Array.isArray(vars.flags)
    ? (vars.flags as Record<string, boolean>)
    : {};

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={togglePanel}
        className="fixed left-2 top-1/2 -translate-y-1/2 z-30 rune-button px-2 py-4"
        title="Variables"
      >
        <span className="writing-mode-vertical text-xs">{isOpen ? 'Close' : 'Stats'}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-72 z-20 scroll-panel p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm text-arcane-gold">Character Sheet</h3>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button onClick={handleSaveEdits} className="rune-button text-xs px-2 py-1">Save</button>
                  <button onClick={() => setEditMode(false)} className="ember-button text-xs px-2 py-1">Cancel</button>
                </>
              ) : (
                <button onClick={enterEditMode} className="rune-button text-xs px-2 py-1">Edit</button>
              )}
            </div>
          </div>

          {/* HP / MP */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs font-ui text-faded-ink mb-1">
                <span>HP</span>
                <span>{vars.hp} / {vars.maxHp}</span>
              </div>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill hp" style={{ width: `${hpPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-ui text-faded-ink mb-1">
                <span>MP</span>
                <span>{vars.mp} / {vars.maxMp}</span>
              </div>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill mp" style={{ width: `${mpPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-ui">
            <div className="text-center">
              <div className="text-arcane-gold">Level</div>
              <div className="text-parchment">{vars.level}</div>
            </div>
            <div className="text-center">
              <div className="text-arcane-gold">EXP</div>
              <div className="text-parchment">{vars.exp}</div>
            </div>
            <div className="text-center">
              <div className="text-arcane-gold">Gold</div>
              <div className="text-parchment">{vars.gold}</div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4 text-xs font-ui">
            <span className="text-faded-ink">Location: </span>
            <span className="text-parchment capitalize">{vars.location}</span>
          </div>

          {/* Edit mode */}
          {editMode && (
            <div className="mb-4 space-y-2 border border-aged-leather/30 rounded p-3">
              <p className="text-xs font-ui text-arcane-gold mb-2">Edit Variables</p>
              {Object.entries(editValues).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs font-ui text-faded-ink w-20 shrink-0">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="input-field flex-1 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Inventory */}
          <div className="mb-4">
            <h4 className="text-xs font-ui text-arcane-gold mb-2">Inventory</h4>
            {inventory.length > 0 ? (
              <ul className="space-y-1">
                {inventory.map((item, i) => (
                  <li key={i} className="text-xs text-parchment flex items-center gap-2">
                    <span className="text-faded-ink">{'◆'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-faded-ink/50 italic">Empty</p>
            )}
          </div>

          {/* Quests */}
          <div className="mb-4">
            <h4 className="text-xs font-ui text-arcane-gold mb-2">Quests</h4>
            {Object.keys(quests).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(quests).map(([name, status]) => (
                  <li key={name} className="text-xs flex items-center gap-2">
                    <span className={status === 'done' ? 'text-arcane-gold' : 'text-ember'}>
                      {status === 'done' ? '✓' : '○'}
                    </span>
                    <span className={status === 'done' ? 'text-faded-ink/60 line-through' : 'text-parchment'}>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-faded-ink/50 italic">No active quests</p>
            )}
          </div>

          {/* Flags */}
          <div className="mb-4">
            <h4 className="text-xs font-ui text-arcane-gold mb-2">Story Flags</h4>
            {Object.keys(flags).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(flags).map(([name, value]) => (
                  <li key={name} className="text-xs flex items-center gap-2">
                    <span className={value ? 'text-arcane-gold' : 'text-faded-ink/50'}>
                      {value ? '⚑' : '⚐'}
                    </span>
                    <span className="text-parchment">{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-faded-ink/50 italic">No flags set</p>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for vertical text */}
      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  );
}
