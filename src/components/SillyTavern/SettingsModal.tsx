import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Copy, Check, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { useSillytavern } from '../../hooks/useSillytavern';
import type { AppSettings } from '../../sillytavern/types';
import { detectProvider } from '../../sillytavern/types';
import { fetchModels, getAdapter } from '../../sillytavern/providers';

interface SettingsModalProps {
  onClose: () => void;
}

type TabName = 'character' | 'primary-api' | 'secondary-api' | 'ui' | 'defaults';
type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

const API_PRESETS = [
  { label: 'Ollama', url: 'http://localhost:11434/v1' },
  { label: 'LM Studio', url: 'http://localhost:1234/v1' },
  { label: 'OpenAI', url: 'https://api.openai.com/v1' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { label: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { label: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta' },
  { label: '自定义', url: '' },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSillytavern();
  const [activeTab, setActiveTab] = useState<TabName>('character');
  const [primaryStatus, setPrimaryStatus] = useState<ConnectionStatus>('untested');
  const [secondaryStatus, setSecondaryStatus] = useState<ConnectionStatus>('untested');
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modelList, setModelList] = useState<string[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelFetchTier = useRef<'primary' | 'secondary'>('primary');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!settings) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel p-6">
          <p className="text-mist-gray">Settings not loaded.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabName; label: string }[] = [
    { key: 'character', label: '角色' },
    { key: 'primary-api', label: 'Primary API' },
    { key: 'secondary-api', label: 'Secondary API' },
    { key: 'ui', label: 'UI' },
    { key: 'defaults', label: '初始' },
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
    const updates: Record<string, unknown> = { [field]: value };

    // Auto-detect provider when baseUrl changes
    if (field === 'baseUrl' && typeof value === 'string') {
      updates['provider'] = detectProvider(value);
    }

    await updateSettings({
      api: {
        ...settings.api,
        [apiKey]: { ...currentApi, ...updates },
      },
    });
    if (tier === 'primary') { setPrimaryStatus('untested'); setPrimaryError(null); }
    else { setSecondaryStatus('untested'); setSecondaryError(null); }
  };

  const handleDefaultsChange = async (field: string, value: number) => {
    await updateSettings({
      defaultGameVariables: {
        ...settings.defaultGameVariables,
        [field]: value,
      },
    });
  };

  const handleFetchModels = async (tier: 'primary' | 'secondary') => {
    const config = settings.api[tier];
    modelFetchTier.current = tier;
    setFetchingModels(true);
    setModelDropdownOpen(true);
    try {
      const models = await fetchModels(config.baseUrl, config.apiKey, config.provider);
      setModelList(models);
    } catch {
      setModelList([]);
    } finally {
      setFetchingModels(false);
    }
  };

  const testConnection = useCallback(async (tier: 'primary' | 'secondary') => {
    const config = settings.api[tier];
    const adapter = getAdapter(config.provider);
    const setStatus = tier === 'primary' ? setPrimaryStatus : setSecondaryStatus;
    const setError = tier === 'primary' ? setPrimaryError : setSecondaryError;

    setStatus('testing');
    setError(null);

    try {
      const models = await adapter.listModels(config.baseUrl, config.apiKey);
      if (models.length > 0) {
        setStatus('success');
        return;
      }
      // Fallback: try a minimal chat ping
      const url = adapter.buildUrl({ baseUrl: config.baseUrl, model: config.model || 'ping' });
      const headers = adapter.buildHeaders(config.apiKey);
      const body = adapter.buildRequestBody({
        model: config.model || 'ping',
        messages: [{ role: 'user', content: 'ping' }],
        overrides: { max_tokens: 1 },
      });
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, stream: false }),
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        setStatus('success');
      } else {
        const errText = await resp.text().catch(() => '');
        setStatus('failed');
        setError(`${resp.status}: ${errText.slice(0, 80)}`);
      }
    } catch (err: any) {
      setStatus('failed');
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        setError('连接超时');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('无法连接 — 请检查地址或网络');
      } else {
        setError(err.message?.slice(0, 80) || '未知错误');
      }
    }
  }, [settings.api]);

  const handleCopyUrl = async (tier: 'primary' | 'secondary') => {
    const config = settings.api[tier];
    const url = getAdapter(config.provider).buildUrl({
      baseUrl: config.baseUrl,
      model: config.model || 'local-model',
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderApiSection = (tier: 'primary' | 'secondary') => {
    const apiKey = tier === 'primary' ? 'primary' : 'secondary';
    const config = settings.api[apiKey];
    const status = tier === 'primary' ? primaryStatus : secondaryStatus;
    const error = tier === 'primary' ? primaryError : secondaryError;
    const tierLabel = tier === 'primary' ? 'Primary' : 'Secondary';
    const endpointUrl = getAdapter(config.provider).buildUrl({
      baseUrl: config.baseUrl,
      model: config.model || 'local-model',
    });

    return (
      <div className="space-y-4">
        {/* Quick provider buttons */}
        <div>
          <label className="block text-xs font-ui text-mist-gray mb-1.5">快速设置</label>
          <div className="flex flex-wrap gap-1.5">
            {API_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApiChange(tier, 'baseUrl', p.url)}
                className="text-[10px] px-2 py-0.5 rounded border border-faded-gold/20 text-mist-gray/70 hover:text-celestial-gold hover:border-celestial-gold/40 transition-colors font-ui"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <TextField
          label="Base URL"
          value={config.baseUrl}
          onChange={(v) => handleApiChange(tier, 'baseUrl', v)}
          placeholder="http://localhost:1234/v1"
        />

        {/* Generated endpoint URL */}
        <div>
          <label className="block text-xs font-ui text-mist-gray mb-1">接口地址</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={endpointUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="input-field flex-1 text-[11px] font-mono opacity-75 cursor-default select-all"
            />
            <button
              type="button"
              onClick={() => handleCopyUrl(tier)}
              className="rune-button text-xs px-2 py-1 flex items-center gap-1 shrink-0"
              title="复制链接"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* API Key */}
        <PasswordField
          label="API Key"
          value={config.apiKey}
          onChange={(v) => handleApiChange(tier, 'apiKey', v)}
        />

        {/* Model with fetch button */}
        <div>
          <label className="block text-xs font-ui text-mist-gray mb-1">Model</label>
          <div className="flex gap-2 relative" ref={tier === modelFetchTier.current ? modelDropdownRef : undefined}>
            <input
              type="text"
              value={config.model}
              onChange={(e) => handleApiChange(tier, 'model', e.target.value)}
              className="input-field flex-1"
              placeholder="local-model"
            />
            <button
              type="button"
              onClick={() => handleFetchModels(tier)}
              disabled={fetchingModels}
              className="rune-button text-xs px-2 py-1 flex items-center gap-1 shrink-0"
              title="获取可用模型"
            >
              {fetchingModels ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              获取
            </button>

            {/* Dropdown */}
            {modelDropdownOpen && tier === modelFetchTier.current && modelList.length > 0 && (
              <div className="absolute top-full right-0 mt-1 w-64 max-h-48 overflow-y-auto bg-mystic-azure border border-faded-gold/30 rounded shadow-lg z-50">
                {modelList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="w-full text-left text-xs font-mono text-mist-gray hover:text-scroll-white hover:bg-faded-gold/10 px-3 py-1.5 transition-colors"
                    onClick={() => {
                      handleApiChange(tier, 'model', m);
                      setModelDropdownOpen(false);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {modelDropdownOpen && tier === modelFetchTier.current && modelList.length === 0 && !fetchingModels && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-mystic-azure border border-faded-gold/30 rounded shadow-lg z-50 px-3 py-2">
                <p className="text-xs text-mist-gray/60">未找到模型，请检查 API Key 和地址。</p>
              </div>
            )}
          </div>
        </div>

        {/* Connection test section */}
        <div className="pt-3 border-t border-faded-gold/20">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => testConnection(tier)}
              disabled={status === 'testing'}
              className={`rune-button text-xs px-3 py-1.5 ${status === 'testing' ? 'opacity-50' : ''}`}
            >
              {status === 'testing' && <Loader2 size={13} className="animate-spin mr-1" />}
              {status === 'testing' ? '检测中...' : '检测连接'}
            </button>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-ui px-2.5 py-1 rounded-full border ${
              status === 'untested'
                ? 'text-mist-gray/50 bg-mystic-azure/20 border-faded-gold/10'
                : status === 'testing'
                ? 'text-celestial-gold bg-celestial-gold/10 border-celestial-gold/30 animate-pulse'
                : status === 'success'
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                : 'text-fire-vein bg-fire-vein/10 border-fire-vein/30'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                status === 'untested' ? 'bg-mist-gray/40'
                : status === 'testing' ? 'bg-celestial-gold'
                : status === 'success' ? 'bg-emerald-400'
                : 'bg-fire-vein'
              }`} />
              {status === 'untested' && '未检测'}
              {status === 'testing' && '检测中...'}
              {status === 'success' && '连接成功'}
              {status === 'failed' && '连接失败'}
            </span>
          </div>

          {/* Error detail */}
          {status === 'failed' && error && (
            <p className="mt-2 text-[11px] text-fire-vein/80 font-ui bg-fire-vein/5 border border-fire-vein/10 rounded px-2.5 py-1.5">
              错误: {error}
            </p>
          )}

          {status === 'success' && (
            <p className="mt-2 text-[11px] text-emerald-400/80 font-ui bg-emerald-400/5 border border-emerald-400/10 rounded px-2.5 py-1.5">
              {tierLabel} API 连接正常，可以开始对话。
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel p-0 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-faded-gold/30">
          <h2 className="font-title text-lg text-celestial-gold">设置</h2>
          <button onClick={onClose} className="text-mist-gray hover:text-scroll-white"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-faded-gold/30 px-4 overflow-x-auto">
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
                label="角色名"
                value={settings.characterName}
                onChange={(v) => handleChange('characterName', v)}
              />
              <TextField
                label="道号"
                value={settings.userName}
                onChange={(v) => handleChange('userName', v)}
              />
            </div>
          )}

          {/* Primary API Tab */}
          {activeTab === 'primary-api' && renderApiSection('primary')}

          {/* Secondary API Tab */}
          {activeTab === 'secondary-api' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-ui text-mist-gray cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.api.secondary.enabled}
                  onChange={(e) => handleApiChange('secondary', 'enabled', e.target.checked)}
                  className="accent-celestial-gold"
                />
                Enable Secondary API
              </label>
              {settings.api.secondary.enabled && renderApiSection('secondary')}
            </div>
          )}

          {/* UI Tab */}
          {activeTab === 'ui' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-ui text-mist-gray mb-2">UI Mode</label>
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
              <p className="text-xs font-ui text-mist-gray">Default starting values for new game sessions.</p>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="初始气血"
                  value={settings.defaultGameVariables.maxHp}
                  min={1}
                  max={9999}
                  onChange={(v) => handleDefaultsChange('maxHp', v)}
                />
                <NumberField
                  label="初始灵力"
                  value={settings.defaultGameVariables.maxMp}
                  min={0}
                  max={9999}
                  onChange={(v) => handleDefaultsChange('maxMp', v)}
                />
                <NumberField
                  label="初始境界"
                  value={settings.defaultGameVariables.level}
                  min={1}
                  max={999}
                  onChange={(v) => handleDefaultsChange('level', v)}
                />
                <NumberField
                  label="初始灵石"
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
      <label className="block text-xs font-ui text-mist-gray mb-1">{label}</label>
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
      <label className="block text-xs font-ui text-mist-gray mb-1">{label}</label>
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
