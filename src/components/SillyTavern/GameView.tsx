import { useState, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { useStreamParser } from '../../hooks/useStreamParser';
import { useApiRouter } from '../../hooks/useApiRouter';
import { assemblePrompt } from '../../sillytavern/prompt-assembler';
import { snapshotVariables } from '../../sillytavern/variables';
import { mergeVariables } from '../../sillytavern/vars-merger';
import { MainTextPane } from './MainTextPane';
import { ThinkingFold } from './ThinkingFold';
import { OptionList } from './OptionList';
import { VariablePanel } from './VariablePanel';
import { HistoryDrawer } from './HistoryDrawer';
import type { ParsedTags } from '../../sillytavern/types';

interface GameViewProps {
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenPresets: () => void;
}

export function GameView({ onOpenSettings, onOpenLorebooks, onOpenPresets }: GameViewProps) {
  const {
    activeChat,
    activeChatId,
    settings,
    lorebooks,
    presets,
    isSending,
    sendMessage: hookSendMessage,
    loadAll,
    setActiveChatId,
    createChat,
  } = useSillytavern();

  const streamParser = useStreamParser();
  const apiRouter = useApiRouter(settings);

  // Local state for streaming display
  const [mainText, setMainText] = useState('');
  const [thinking, setThinking] = useState('');
  const [think, setThink] = useState('');
  const [sum, setSum] = useState('');
  const [options, setOptions] = useState<Array<{ name: string; description: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Get current chat vars
  const vars = activeChat?.variables;

  const resetStreamState = useCallback(() => {
    setMainText('');
    setThinking('');
    setThink('');
    setSum('');
    setOptions([]);
  }, []);

  const handleSend = useCallback(async (content: string) => {
    const chat = activeChat;
    const curSettings = settings;
    if (!chat || !curSettings || isSending || isStreaming) return;

    setIsStreaming(true);
    resetStreamState();

    try {
      // Find the active preset
      const activePreset = presets.find((p) => p.id === chat.presetId);
      if (!activePreset) {
        console.warn('sendMessage: no active preset found');
        setIsStreaming(false);
        return;
      }

      // Match lorebooks active for this session
      const activeLorebooks = lorebooks.filter((lb) => chat.lorebookIds.includes(lb.id));

      // Assemble prompt
      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: chat.messages,
        preset: activePreset,
        lorebooks: activeLorebooks,
        userName: curSettings.userName,
        characterName: curSettings.characterName,
        variables: chat.variables,
      });

      // Route API request
      const route = apiRouter.route(content);
      if (!route) {
        console.warn('sendMessage: no API route available');
        setIsStreaming(false);
        return;
      }

      // Build request body
      const requestBody = apiRouter.buildBody(route, promptMessages);

      // Stream the response with display callbacks
      const parser = streamParser.createParser({
        onMainText: (_chunk: string, full: string) => {
          setMainText(full);
        },
        onThinking: (_chunk: string, full: string) => {
          setThinking(full);
        },
        onThink: (_chunk: string, full: string) => {
          setThink(full);
        },
        onSum: (_chunk: string, full: string) => {
          setSum(full);
        },
        onOptions: (opts: Array<{ name: string; description: string }>) => {
          setOptions(opts);
        },
        onVars: (_vars: Record<string, string | number>) => {
          // Vars are handled on flush
        },
        onDone: (_parsed: ParsedTags) => {
          setIsStreaming(false);
        },
        onError: (_error: Error) => {
          setIsStreaming(false);
        },
      });

      // Use the hook's sendMessage to persist, then drive streaming display
      // We need to wire the streaming display separately from the persistence.
      // For now, use the hook's sendMessage (which handles persistence internally)
      // and run our own streaming in parallel for display purposes.
      //
      // Actually, the simpler approach is to use the API directly for display
      // while the hook handles persistence. But to avoid double-sending, let's
      // just use the hook and render the latest assistant message.
      //
      // Revert to simple: use the hook's sendMessage which handles everything.
      await hookSendMessage(content);

    } catch (err) {
      console.error('sendMessage error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [activeChat, settings, lorebooks, presets, isSending, isStreaming, hookSendMessage, apiRouter, streamParser, resetStreamState]);

  const handleOption = useCallback(async (opt: { name: string; description: string }) => {
    await handleSend(opt.name);
  }, [handleSend]);

  const handleCustomInput = useCallback(async (text: string) => {
    await handleSend(text);
  }, [handleSend]);

  const handleNewGame = async () => {
    const newChat = await createChat();
    setActiveChatId(newChat.id);
  };

  // Determine what to display for narrative text
  const displayText = isStreaming
    ? mainText
    : (activeChat && activeChat.messages.length > 0
        ? activeChat.messages[activeChat.messages.length - 1]?.parsedTags?.maintext
          ?? activeChat.messages[activeChat.messages.length - 1]?.content
          ?? ''
        : '');
  const displaySum = isStreaming ? sum : (
    activeChat && activeChat.messages.length > 0
      ? activeChat.messages[activeChat.messages.length - 1]?.parsedTags?.sum
      : undefined
  );
  const displayThinking = isStreaming ? thinking : (
    activeChat && activeChat.messages.length > 0
      ? activeChat.messages[activeChat.messages.length - 1]?.parsedTags?.thinking ?? ''
      : ''
  );
  const displayThink = isStreaming ? think : (
    activeChat && activeChat.messages.length > 0
      ? activeChat.messages[activeChat.messages.length - 1]?.parsedTags?.think ?? ''
      : ''
  );
  const displayOptions = isStreaming ? options : (
    activeChat && activeChat.messages.length > 0
      ? activeChat.messages[activeChat.messages.length - 1]?.parsedTags?.options ?? []
      : []
  );

  const hpPercent = vars && vars.maxHp > 0 ? (vars.hp / vars.maxHp) * 100 : 0;
  const mpPercent = vars && vars.maxMp > 0 ? (vars.mp / vars.maxMp) * 100 : 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-faded-gold/30 bg-mystic-azure/50">
        <div className="flex items-center gap-4">
          <h1 className="font-title text-lg text-celestial-gold">
            {activeChat?.characterName ?? 'Adventurer'}
          </h1>
          {vars && (
            <div className="flex items-center gap-3">
              <div className="w-24">
                <div className="flex justify-between text-[10px] font-ui text-mist-gray">
                  <span>HP</span>
                  <span>{vars.hp}/{vars.maxHp}</span>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill hp" style={{ width: `${hpPercent}%` }} />
                </div>
              </div>
              <div className="w-24">
                <div className="flex justify-between text-[10px] font-ui text-mist-gray">
                  <span>MP</span>
                  <span>{vars.mp}/{vars.maxMp}</span>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill mp" style={{ width: `${mpPercent}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!activeChatId && (
            <button onClick={handleNewGame} className="rune-button text-xs">新游戏</button>
          )}
          <button onClick={onOpenLorebooks} className="rune-button text-xs">典籍</button>
          <button onClick={onOpenPresets} className="rune-button text-xs">预设</button>
          <button onClick={onOpenSettings} className="rune-button text-xs">设置</button>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-title text-2xl text-celestial-gold mb-4">静待天机...</p>
              <button onClick={handleNewGame} className="rune-button text-lg px-8 py-3">
                踏入仙途
              </button>
            </div>
          </div>
        ) : (
          <>
            <MainTextPane
              text={displayText}
              isStreaming={isStreaming}
              sum={displaySum}
            />
            <ThinkingFold
              thinking={displayThinking}
              think={displayThink}
              isStreaming={isStreaming}
            />
            <OptionList
              options={displayOptions}
              onSelect={handleOption}
              onCustomInput={handleCustomInput}
              disabled={isSending || isStreaming}
            />
          </>
        )}
      </div>

      {/* Slide-out panels */}
      <VariablePanel />
      <HistoryDrawer />
    </div>
  );
}
