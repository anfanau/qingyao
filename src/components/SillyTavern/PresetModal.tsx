import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { PromptOrderEditor } from './PromptOrderEditor';
import type { ChatPreset, PresetSettings } from '../../sillytavern/types';

interface PresetModalProps {
  onClose: () => void;
}

type TabName = 'sampling' | 'prompts' | 'custom' | 'order';

const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  temp_openai: 0.7,
  openai_max_tokens: 1024,
  top_p_openai: 0.9,
  freq_pen_openai: 0,
  pres_pen_openai: 0,
  stream_openai: true,
  openai_model: 'local-model',
  system_prompt: '',
  jailbreak_prompt: '',
  character_prompt: '',
  user_prompt_template: '',
  assistant_prompt_template: '',
  custom_prompts: [],
  prompt_order: [],
};

export function PresetModal({ onClose }: PresetModalProps) {
  const { presets, activeChat, savePresetById, deletePresetById } = useSillytavern();
  const [activeTab, setActiveTab] = useState<TabName>('sampling');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    activeChat?.presetId ?? (presets[0]?.id ?? null)
  );

  const selectedPreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? null,
    [presets, selectedPresetId]
  );

  const settings = useMemo(
    () => selectedPreset?.settings ?? DEFAULT_PRESET_SETTINGS,
    [selectedPreset]
  );

  const updateSettings = async (updates: Partial<PresetSettings>) => {
    if (!selectedPreset) return;
    const updated: ChatPreset = {
      ...selectedPreset,
      settings: { ...selectedPreset.settings, ...updates },
      updatedAt: Date.now(),
    };
    await savePresetById(updated);
  };

  const handleNewPreset = async () => {
    const now = Date.now();
    const newPreset: ChatPreset = {
      id: crypto.randomUUID(),
      name: `New Preset ${presets.length + 1}`,
      description: '',
      settings: { ...DEFAULT_PRESET_SETTINGS, prompt_order: [] },
      createdAt: now,
      updatedAt: now,
    };
    await savePresetById(newPreset);
    setSelectedPresetId(newPreset.id);
  };

  const handleDeletePreset = async () => {
    if (!selectedPresetId) return;
    if (!window.confirm('Delete this preset?')) return;
    await deletePresetById(selectedPresetId);
    setSelectedPresetId(null);
    onClose();
  };

  const tabs: { key: TabName; label: string }[] = [
    { key: 'sampling', label: '采样' },
    { key: 'prompts', label: '提示词' },
    { key: 'custom', label: '自定义' },
    { key: 'order', label: '顺序' },
  ];

  // Custom prompt state
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomContent, setNewCustomContent] = useState('');

  const addCustomPrompt = async () => {
    if (!newCustomName.trim()) return;
    const customPrompts = [...(settings.custom_prompts || [])];
    customPrompts.push({ name: newCustomName.trim(), content: newCustomContent });
    await updateSettings({ custom_prompts: customPrompts });
    setNewCustomName('');
    setNewCustomContent('');
  };

  const removeCustomPrompt = async (index: number) => {
    const customPrompts = [...(settings.custom_prompts || [])];
    customPrompts.splice(index, 1);
    await updateSettings({ custom_prompts: customPrompts });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel p-0 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-faded-gold/30">
          <div className="flex items-center gap-3">
            <h2 className="font-title text-lg text-celestial-gold">Presets</h2>
            {/* Preset selector */}
            <select
              value={selectedPresetId ?? ''}
              onChange={(e) => setSelectedPresetId(e.target.value || null)}
              className="input-field text-xs py-1"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={handleNewPreset} className="rune-button text-xs px-2 py-1">+ New</button>
          </div>
          <button onClick={onClose} className="text-mist-gray hover:text-scroll-white text-lg">{'✕'}</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-faded-gold/30 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sampling Tab */}
          {activeTab === 'sampling' && (
            <div className="space-y-4">
              <SliderField
                label="Temperature"
                value={settings.temp_openai}
                min={0}
                max={2}
                step={0.01}
                onChange={(v) => updateSettings({ temp_openai: v })}
              />
              <SliderField
                label="Top P"
                value={settings.top_p_openai}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateSettings({ top_p_openai: v })}
              />
              <NumberField
                label="Max Tokens"
                value={settings.openai_max_tokens}
                min={1}
                max={8192}
                onChange={(v) => updateSettings({ openai_max_tokens: v })}
              />
              <SliderField
                label="Frequency Penalty"
                value={settings.freq_pen_openai}
                min={-2}
                max={2}
                step={0.01}
                onChange={(v) => updateSettings({ freq_pen_openai: v })}
              />
              <SliderField
                label="Presence Penalty"
                value={settings.pres_pen_openai}
                min={-2}
                max={2}
                step={0.01}
                onChange={(v) => updateSettings({ pres_pen_openai: v })}
              />
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <TextareaField
                label="System Prompt"
                value={settings.system_prompt ?? ''}
                onChange={(v) => updateSettings({ system_prompt: v })}
              />
              <TextareaField
                label="Jailbreak Prompt"
                value={settings.jailbreak_prompt ?? ''}
                onChange={(v) => updateSettings({ jailbreak_prompt: v })}
              />
              <TextareaField
                label="Character Prompt"
                value={settings.character_prompt ?? ''}
                onChange={(v) => updateSettings({ character_prompt: v })}
              />
              <TextareaField
                label="User Prompt Template"
                value={settings.user_prompt_template ?? ''}
                onChange={(v) => updateSettings({ user_prompt_template: v })}
              />
              <TextareaField
                label="Assistant Prompt Template"
                value={settings.assistant_prompt_template ?? ''}
                onChange={(v) => updateSettings({ assistant_prompt_template: v })}
              />
            </div>
          )}

          {/* Custom Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <p className="text-xs font-ui text-mist-gray">Custom name-content pairs for prompt injection.</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="Prompt name"
                  className="input-field flex-1 text-xs"
                />
                <input
                  type="text"
                  value={newCustomContent}
                  onChange={(e) => setNewCustomContent(e.target.value)}
                  placeholder="Prompt content"
                  className="input-field flex-[2] text-xs"
                />
                <button onClick={addCustomPrompt} className="rune-button text-xs px-2 py-1">Add</button>
              </div>

              {(!settings.custom_prompts || settings.custom_prompts.length === 0) ? (
                <p className="text-xs text-mist-gray/50 italic">No custom prompts configured.</p>
              ) : (
                <div className="space-y-2">
                  {settings.custom_prompts.map((cp, i) => (
                    <div key={i} className="flex items-center justify-between p-2 parchment-card rounded">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-ui text-scroll-white">{cp.name}</span>
                        <span className="text-xs text-mist-gray/70 ml-2">{cp.content}</span>
                      </div>
                      <button
                        onClick={() => removeCustomPrompt(i)}
                        className="text-vermil-red hover:text-vermil-red/80 text-xs ml-2 shrink-0"
                      >
                        {'✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Tab */}
          {activeTab === 'order' && (
            <div>
              <p className="text-xs font-ui text-mist-gray mb-3">Arrange prompt blocks in the order they appear.</p>
              <PromptOrderEditor
                items={settings.prompt_order || []}
                onChange={(items) => updateSettings({ prompt_order: items })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Field helpers

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-ui text-mist-gray mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-celestial-gold"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-ui text-mist-gray mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-field w-full"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-ui text-mist-gray mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field w-full min-h-[80px] resize-y"
      />
    </div>
  );
}
