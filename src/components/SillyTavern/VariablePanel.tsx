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
        title="属性"
      >
        <span className="writing-mode-vertical text-xs">{isOpen ? 'Close' : '属性'}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-72 z-20 scroll-panel p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title text-sm text-celestial-gold">人物属性</h3>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button onClick={handleSaveEdits} className="rune-button text-xs px-2 py-1">保存</button>
                  <button onClick={() => setEditMode(false)} className="ember-button text-xs px-2 py-1">取消</button>
                </>
              ) : (
                <button onClick={enterEditMode} className="rune-button text-xs px-2 py-1">Edit</button>
              )}
            </div>
          </div>

          {/* HP / MP */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs font-ui text-mist-gray mb-1">
                <span>气血</span>
                <span>{vars.hp} / {vars.maxHp}</span>
              </div>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill hp" style={{ width: `${hpPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-ui text-mist-gray mb-1">
                <span>灵力</span>
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
              <div className="text-celestial-gold">境界</div>
              <div className="text-scroll-white">{vars.level}</div>
            </div>
            <div className="text-center">
              <div className="text-celestial-gold">修为</div>
              <div className="text-scroll-white">{vars.exp}</div>
            </div>
            <div className="text-center">
              <div className="text-celestial-gold">灵石</div>
              <div className="text-scroll-white">{vars.gold}</div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4 text-xs font-ui">
            <span className="text-mist-gray">洞府：</span>
            <span className="text-scroll-white capitalize">{vars.location}</span>
          </div>

          {/* Edit mode */}
          {editMode && (
            <div className="mb-4 space-y-2 border border-faded-gold/30 rounded p-3">
              <p className="text-xs font-ui text-celestial-gold mb-2">Edit Variables</p>
              {Object.entries(editValues).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-xs font-ui text-mist-gray w-20 shrink-0">{key}</label>
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
            <h4 className="text-xs font-ui text-celestial-gold mb-2">法宝</h4>
            {inventory.length > 0 ? (
              <ul className="space-y-1">
                {inventory.map((item, i) => (
                  <li key={i} className="text-xs text-scroll-white flex items-center gap-2">
                    <span className="text-mist-gray">{'◆'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-mist-gray/50 italic">Empty</p>
            )}
          </div>

          {/* Quests */}
          <div className="mb-4">
            <h4 className="text-xs font-ui text-celestial-gold mb-2">任务</h4>
            {Object.keys(quests).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(quests).map(([name, status]) => (
                  <li key={name} className="text-xs flex items-center gap-2">
                    <span className={status === 'done' ? 'text-celestial-gold' : 'text-vermil-red'}>
                      {status === 'done' ? '✓' : '○'}
                    </span>
                    <span className={status === 'done' ? 'text-mist-gray/60 line-through' : 'text-scroll-white'}>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-mist-gray/50 italic">No active quests</p>
            )}
          </div>

          {/* Flags */}
          <div className="mb-4">
            <h4 className="text-xs font-ui text-celestial-gold mb-2">因果</h4>
            {Object.keys(flags).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(flags).map(([name, value]) => (
                  <li key={name} className="text-xs flex items-center gap-2">
                    <span className={value ? 'text-celestial-gold' : 'text-mist-gray/50'}>
                      {value ? '⚑' : '⚐'}
                    </span>
                    <span className="text-scroll-white">{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-mist-gray/50 italic">No flags set</p>
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
