import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  // Types
  type ChatSession,
  type ChatMessage,
  type Lorebook,
  type ChatPreset,
  type AppSettings,
  type GameVariables,
  type ParsedTags,
  type StreamCallbacks,
  USER_ROLE,
  ASSISTANT_ROLE,
  DEFAULT_GAME_VARIABLES,

  // Database
  initializeDatabase,
  getLorebooks,
  saveLorebook,
  deleteLorebook,
  getPresets,
  savePreset,
  deletePreset,
  getSettings,
  saveSettings,
  getChats,
  saveChat,
  deleteChat,

  // Prompt assembly
  assemblePrompt,

  // Variables
  extractVariables,
  snapshotVariables,

  // Vars merger
  mergeVariables,
  backtrackVariables,

  // Streaming
  streamFetch,

  // API routing
  routeApi,
  buildRequestBody,
} from '../sillytavern';

// ============================================================
// Hook Return Type
// ============================================================

export interface UseSillytavernReturn {
  // State
  lorebooks: Lorebook[];
  presets: ChatPreset[];
  settings: AppSettings | null;
  chats: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | null;
  isSending: boolean;
  isLoading: boolean;

  // Settings
  loadAll: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Chats
  setActiveChatId: (id: string | null) => void;
  createChat: (overrides?: Partial<ChatSession>) => Promise<ChatSession>;
  renameChat: (id: string, name: string) => Promise<void>;
  deleteChatById: (id: string) => Promise<void>;

  // Messages
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessagesFrom: (messageId: string) => Promise<void>;
  branchFromMessage: (messageId: string, name?: string) => Promise<ChatSession | null>;

  // Variables
  updateVariables: (updates: Record<string, string | number>) => Promise<void>;

  // Lorebooks
  toggleLorebook: (lorebookId: string) => Promise<void>;
  saveLorebookById: (lorebook: Lorebook) => Promise<void>;
  deleteLorebookById: (id: string) => Promise<void>;

  // Presets
  savePresetById: (preset: ChatPreset) => Promise<void>;
  deletePresetById: (id: string) => Promise<void>;
}

// ============================================================
// Hook
// ============================================================

export function useSillytavern(): UseSillytavernReturn {
  // --------------------- State --------------------------------
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Derived: active chat object
  const activeChat = useMemo<ChatSession | null>(() => {
    if (!activeChatId) return null;
    return chats.find((c) => c.id === activeChatId) ?? null;
  }, [activeChatId, chats]);

  // --------------------- loadAll ------------------------------
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeDatabase();
      const [loadedSettings, loadedLorebooks, loadedPresets, loadedChats] = await Promise.all([
        getSettings(),
        getLorebooks(),
        getPresets(),
        getChats(),
      ]);
      if (loadedSettings) setSettings(loadedSettings);
      setLorebooks(loadedLorebooks);
      setPresets(loadedPresets);
      setChats(loadedChats);
    } catch (err) {
      console.error('loadAll error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --------------------- Settings -----------------------------
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const updated: AppSettings = { ...settings, ...updates, updatedAt: Date.now() };
    await saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  // --------------------- Chats --------------------------------
  const createChat = useCallback(async (overrides?: Partial<ChatSession>): Promise<ChatSession> => {
    const now = Date.now();
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: `Game ${new Date(now).toLocaleDateString()}`,
      messages: [],
      characterName: settings?.characterName ?? 'Adventurer',
      userName: settings?.userName ?? 'Player',
      presetId: settings?.activePresetId ?? null,
      lorebookIds: settings?.activeLorebookIds ?? [],
      variables: snapshotVariables(settings?.defaultGameVariables ?? DEFAULT_GAME_VARIABLES),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    await saveChat(newChat);
    setChats((prev) => [...prev, newChat]);
    return newChat;
  }, [settings]);

  const renameChat = useCallback(async (id: string, name: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, updatedAt: Date.now() } : c)),
    );
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      await saveChat({ ...chat, name, updatedAt: Date.now() });
    }
  }, [chats]);

  const deleteChatById = useCallback(async (id: string) => {
    await deleteChat(id);
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }, [activeChatId]);

  // --------------------- sendMessage -------------------------
  const sendMessage = useCallback(async (content: string) => {
    const chat = activeChat;
    const curSettings = settings;
    if (!chat || !curSettings || isSending) return;

    setIsSending(true);
    try {
      // 1. Find the active preset
      const activePreset = presets.find((p) => p.id === chat.presetId);
      if (!activePreset) {
        console.warn('sendMessage: no active preset found');
        return;
      }

      // 2. Match lorebooks active for this session
      const activeLorebooks = lorebooks.filter((lb) => chat.lorebookIds.includes(lb.id));

      // 3. Assemble prompt
      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: chat.messages,
        preset: activePreset,
        lorebooks: activeLorebooks,
        userName: curSettings.userName,
        characterName: curSettings.characterName,
        variables: chat.variables,
      });

      // 4. Route API request
      const route = routeApi(curSettings, { userInput: content });
      if (!route) {
        console.warn('sendMessage: no API route available');
        return;
      }

      // 5. Build request body
      const requestBody = buildRequestBody(route, promptMessages);

      // 6. Create user message with variable snapshot
      const varsSnapshot = snapshotVariables(chat.variables);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        variables: varsSnapshot,
      };
      const messagesWithUser = [...chat.messages, userMessage];

      // 7. Persist user message immediately
      const chatWithUser: ChatSession = {
        ...chat,
        messages: messagesWithUser,
        updatedAt: Date.now(),
      };
      await saveChat(chatWithUser);
      setChats((prev) => prev.map((c) => (c.id === chatWithUser.id ? chatWithUser : c)));

      // 8. Stream the response
      const apiUrl = route.config.baseUrl.replace(/\/+$/, '') + '/chat/completions';
      const parsedTags: ParsedTags = await streamFetch(
        apiUrl,
        requestBody,
        { Authorization: `Bearer ${route.config.apiKey}` },
        {
          onMainText: () => {},
          onThinking: () => {},
          onThink: () => {},
          onSum: () => {},
          onVars: () => {},
          onOptions: () => {},
        } as StreamCallbacks,
      );

      // 9. Merge variable deltas into floor state
      let updatedVariables = snapshotVariables(chat.variables);
      if (parsedTags.vars && Object.keys(parsedTags.vars).length > 0) {
        updatedVariables = mergeVariables(updatedVariables, parsedTags.vars);
      }

      // 10. Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: parsedTags.maintext || '',
        rawContent: parsedTags.maintext || '',
        parsedTags,
        timestamp: Date.now(),
        variables: snapshotVariables(updatedVariables),
      };

      // 11. Persist final state
      const finalChat: ChatSession = {
        ...chatWithUser,
        variables: updatedVariables,
        messages: [...messagesWithUser, assistantMessage],
        updatedAt: Date.now(),
      };
      await saveChat(finalChat);
      setChats((prev) => prev.map((c) => (c.id === finalChat.id ? finalChat : c)));
    } catch (err) {
      console.error('sendMessage error:', err);
    } finally {
      setIsSending(false);
    }
  }, [activeChat, settings, presets, lorebooks, isSending]);

  // --------------------- editMessage --------------------------
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const chat = activeChat;
    const curSettings = settings;
    if (!chat || !curSettings || isSending) return;

    const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    setIsSending(true);
    try {
      // Determine variable state at the truncation point
      const varsAtPoint = msgIndex > 0
        ? snapshotVariables(chat.messages[msgIndex - 1].variables)
        : snapshotVariables(DEFAULT_GAME_VARIABLES);

      // Truncate messages and update the edited message
      const messagesBefore = chat.messages.slice(0, msgIndex);
      const updatedMessage: ChatMessage = {
        ...chat.messages[msgIndex],
        content: newContent,
        variables: snapshotVariables(varsAtPoint),
      };
      const truncatedMessages = [...messagesBefore, updatedMessage];

      // Persist truncated state
      let updatedChat: ChatSession = {
        ...chat,
        messages: truncatedMessages,
        variables: varsAtPoint,
        updatedAt: Date.now(),
      };
      await saveChat(updatedChat);
      setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));

      // Re-send from the edited point to generate a new continuation
      const activePreset = presets.find((p) => p.id === updatedChat.presetId);
      if (!activePreset) {
        console.warn('editMessage: no preset for re-send');
        return;
      }
      const activeLorebooks = lorebooks.filter((lb) => updatedChat.lorebookIds.includes(lb.id));
      const { messages: promptMessages } = assemblePrompt({
        userInput: newContent,
        history: truncatedMessages,
        preset: activePreset,
        lorebooks: activeLorebooks,
        userName: curSettings.userName,
        characterName: curSettings.characterName,
        variables: varsAtPoint,
      });

      const route = routeApi(curSettings, { userInput: newContent });
      if (!route) return;
      const requestBody = buildRequestBody(route, promptMessages);
      const apiUrl = route.config.baseUrl.replace(/\/+$/, '') + '/chat/completions';

      const parsedTags = await streamFetch(
        apiUrl,
        requestBody,
        { Authorization: `Bearer ${route.config.apiKey}` },
        {} as StreamCallbacks,
      );

      let finalVars = snapshotVariables(varsAtPoint);
      if (parsedTags.vars && Object.keys(parsedTags.vars).length > 0) {
        finalVars = mergeVariables(finalVars, parsedTags.vars);
      }

      const newAssistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: parsedTags.maintext || '',
        rawContent: parsedTags.maintext || '',
        parsedTags,
        timestamp: Date.now(),
        variables: snapshotVariables(finalVars),
      };

      const finalChat: ChatSession = {
        ...updatedChat,
        variables: finalVars,
        messages: [...truncatedMessages, newAssistantMessage],
        updatedAt: Date.now(),
      };
      await saveChat(finalChat);
      setChats((prev) => prev.map((c) => (c.id === finalChat.id ? finalChat : c)));
    } catch (err) {
      console.error('editMessage error:', err);
    } finally {
      setIsSending(false);
    }
  }, [activeChat, settings, presets, lorebooks, isSending]);

  // --------------------- deleteMessagesFrom -------------------
  const deleteMessagesFrom = useCallback(async (messageId: string) => {
    const chat = activeChat;
    if (!chat) return;

    const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const truncatedMessages = chat.messages.slice(0, msgIndex);
    const varsAtPoint = truncatedMessages.length > 0
      ? snapshotVariables(truncatedMessages[truncatedMessages.length - 1].variables)
      : snapshotVariables(DEFAULT_GAME_VARIABLES);

    const updatedChat: ChatSession = {
      ...chat,
      messages: truncatedMessages,
      variables: varsAtPoint,
      updatedAt: Date.now(),
    };
    await saveChat(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }, [activeChat]);

  // --------------------- branchFromMessage --------------------
  const branchFromMessage = useCallback(async (messageId: string, name?: string): Promise<ChatSession | null> => {
    const chat = activeChat;
    if (!chat) return null;

    const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return null;

    const branchMessages = chat.messages.slice(0, msgIndex + 1);
    const varsAtBranch = snapshotVariables(
      branchMessages[branchMessages.length - 1]?.variables ?? DEFAULT_GAME_VARIABLES,
    );

    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: name || `${chat.name} (fork ${branchMessages.length})`,
      messages: branchMessages,
      characterName: chat.characterName,
      userName: chat.userName,
      presetId: chat.presetId,
      lorebookIds: [...chat.lorebookIds],
      variables: varsAtBranch,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveChat(newChat);
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChat.id);
    return newChat;
  }, [activeChat]);

  // --------------------- updateVariables ----------------------
  const updateVariables = useCallback(async (updates: Record<string, string | number>) => {
    const chat = activeChat;
    if (!chat) return;

    const newVars = mergeVariables(chat.variables, updates);
    const updatedChat: ChatSession = {
      ...chat,
      variables: newVars,
      updatedAt: Date.now(),
    };
    await saveChat(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }, [activeChat]);

  // --------------------- Lorebooks ----------------------------
  const toggleLorebook = useCallback(async (lorebookId: string) => {
    const chat = activeChat;
    if (!chat) return;

    const alreadyActive = chat.lorebookIds.includes(lorebookId);
    const newIds = alreadyActive
      ? chat.lorebookIds.filter((id) => id !== lorebookId)
      : [...chat.lorebookIds, lorebookId];

    const updatedChat: ChatSession = {
      ...chat,
      lorebookIds: newIds,
      updatedAt: Date.now(),
    };
    await saveChat(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }, [activeChat]);

  const saveLorebookById = useCallback(async (lorebook: Lorebook) => {
    await saveLorebook(lorebook);
    setLorebooks((prev) => {
      const idx = prev.findIndex((l) => l.id === lorebook.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = lorebook;
        return next;
      }
      return [...prev, lorebook];
    });
  }, []);

  const deleteLorebookById = useCallback(async (id: string) => {
    await deleteLorebook(id);
    setLorebooks((prev) => prev.filter((l) => l.id !== id));
    // Also remove from any chat's lorebookIds
    setChats((prev) =>
      prev.map((c) => ({
        ...c,
        lorebookIds: c.lorebookIds.filter((lid) => lid !== id),
      })),
    );
  }, []);

  // --------------------- Presets ------------------------------
  const savePresetById = useCallback(async (preset: ChatPreset) => {
    await savePreset(preset);
    setPresets((prev) => {
      const idx = prev.findIndex((p) => p.id === preset.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = preset;
        return next;
      }
      return [...prev, preset];
    });
  }, []);

  const deletePresetById = useCallback(async (id: string) => {
    await deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // --------------------- Return -------------------------------
  return {
    // State
    lorebooks,
    presets,
    settings,
    chats,
    activeChatId,
    activeChat,
    isSending,
    isLoading,

    // Settings
    loadAll,
    updateSettings,

    // Chats
    setActiveChatId,
    createChat,
    renameChat,
    deleteChatById: deleteChatById,

    // Messages
    sendMessage,
    editMessage,
    deleteMessagesFrom,
    branchFromMessage,

    // Variables
    updateVariables,

    // Lorebooks
    toggleLorebook,
    saveLorebookById: saveLorebookById,
    deleteLorebookById: deleteLorebookById,

    // Presets
    savePresetById: savePresetById,
    deletePresetById: deletePresetById,
  };
}
