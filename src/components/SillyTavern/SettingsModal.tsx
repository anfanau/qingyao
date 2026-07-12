import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import type { AppSettings } from '../../sillytavern/types';

interface SettingsModalProps {
  onClose: () => void;
}

type TabName = 'character' | 'primary-api' | 'secondary-api' | 'ui' | 'defaults';

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSillytavern();
  const [activeTab, setActiveTab] = useState<TabName>('character');

  if (!settings) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel p-6">
          <p className="text-faded-ink">Settings not loaded.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabName; label: string }[] = [
    { key: 'character', label: 'Character' },
    { key: 'primary-api', label: 'Primary API' },
    { key: 'secondary-api', label: 'Secondary API' },
    { key: 'ui', label: 'UI' },
    { key: 'defaults', label: 'Defaults' },
  ];

  const handleChange = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await updateSettings({ [key]: value } as Partial<AppSettings>);
  };

  const handleApiChange = async (
    tier: 'primary' | 'secondary',
    field: string,
    value: string | boolean
  ) => {
    const apiKey = tier === 'primary' ? 'primary' : 'secondary';
    const currentApi = settings.api[apiKey];
    await updateSettings({
      api: {
        ...settings.api,
        [apiKey]: { ...currentApi, [field]: value },
      },
    });
  };

  const handleDefaultsChange = async (field: string, value: number) => {
    await updateSettings({
      defaultGameVariables: {
        ...settings.defaultGameVariables,
        [field]: value,
      },
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel p-0 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-aged-leather/30">
          <h2 className="font-display text-lg text-arcane-gold">Settings</h2>
          <button onClick={onClose} className="text-faded-ink hover:text-parchment text-lg">{'✕'}</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-aged-leather/30 px-4 overflow-x-auto">
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
          {/* Character Tab */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              <TextField
                label="Character Name"
                value={settings.characterName}
                onChange={(v) => handleChange('characterName', v)}
              />
              <TextField
                label="User Name"
                value={settings.userName}
                onChange={(v) => handleChange('userName', v)}
              />
            </div>
          )}

          {/* Primary API Tab */}
          {activeTab === 'primary-api' && (
            <div className="space-y-4">
              <TextField
                label="Base URL"
                value={settings.api.primary.baseUrl}
                onChange={(v) => handleApiChange('primary', 'baseUrl', v)}
                placeholder="http://localhost:1234/v1"
              />
              <PasswordField
                label="API Key"
                value={settings.api.primary.apiKey}
                onChange={(v) => handleApiChange('primary', 'apiKey', v)}
              />
              <TextField
                label="Model"
                value={settings.api.primary.model}
                onChange={(v) => handleApiChange('primary', 'model', v)}
                placeholder="local-model"
              />
            </div>
          )}

          {/* Secondary API Tab */}
          {activeTab === 'secondary-api' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-ui text-faded-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.api.secondary.enabled}
                  onChange={(e) => handleApiChange('secondary', 'enabled', e.target.checked)}
                  className="accent-arcane-gold"
                />
                Enable Secondary API
              </label>
              {settings.api.secondary.enabled && (
                <>
                  <TextField
                    label="Base URL"
                    value={settings.api.secondary.baseUrl}
                    onChange={(v) => handleApiChange('secondary', 'baseUrl', v)}
                    placeholder="http://localhost:1234/v1"
                  />
                  <PasswordField
                    label="API Key"
                    value={settings.api.secondary.apiKey}
                    onChange={(v) => handleApiChange('secondary', 'apiKey', v)}
                  />
                  <TextField
                    label="Model"
                    value={settings.api.secondary.model}
                    onChange={(v) => handleApiChange('secondary', 'model', v)}
                    placeholder="local-model"
                  />
                </>
              )}
            </div>
          )}

          {/* UI Tab */}
          {activeTab === 'ui' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-ui text-faded-ink mb-2">UI Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChange('uiMode', 'chat')}
                    className={`rune-button text-xs px-3 py-1 ${settings.uiMode === 'chat' ? 'opacity-100' : 'opacity-60'}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => handleChange('uiMode', 'game')}
                    className={`rune-button text-xs px-3 py-1 ${settings.uiMode === 'game' ? 'opacity-100' : 'opacity-60'}`}
                  >
                    Game
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Defaults Tab */}
          {activeTab === 'defaults' && (
            <div className="space-y-4">
              <p className="text-xs font-ui text-faded-ink">Default starting values for new game sessions.</p>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Default HP"
                  value={settings.defaultGameVariables.maxHp}
                  min={1}
                  max={9999}
                  onChange={(v) => handleDefaultsChange('maxHp', v)}
                />
                <NumberField
                  label="Default MP"
                  value={settings.defaultGameVariables.maxMp}
                  min={0}
                  max={9999}
                  onChange={(v) => handleDefaultsChange('maxMp', v)}
                />
                <NumberField
                  label="Default Level"
                  value={settings.defaultGameVariables.level}
                  min={1}
                  max={999}
                  onChange={(v) => handleDefaultsChange('level', v)}
                />
                <NumberField
                  label="Default Gold"
                  value={settings.defaultGameVariables.gold}
                  min={0}
                  max={999999}
                  onChange={(v) => handleDefaultsChange('gold', v)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Field helpers

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-ui text-faded-ink mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field w-full"
        placeholder={placeholder}
      />
    </div>
  );
}

function PasswordField({
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
      <label className="block text-xs font-ui text-faded-ink mb-1">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field w-full"
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
      <label className="block text-xs font-ui text-faded-ink mb-1">{label}</label>
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
