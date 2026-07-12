import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { createDefaultEntry, removeEntry } from '../../sillytavern/editor-utils';
import type { LorebookEntry } from '../../sillytavern/types';
import { EntryForm } from './EntryForm';

interface LorebookEditorModalProps {
  lorebookId: string;
  onBack: () => void;
}

export function LorebookEditorModal({ lorebookId, onBack }: LorebookEditorModalProps) {
  const { lorebooks, saveLorebookById } = useSillytavern();
  const lorebook = lorebooks.find((lb) => lb.id === lorebookId);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const entries = useMemo(() => lorebook?.entries ?? [], [lorebook]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );

  if (!lorebook) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel p-6">
          <p className="text-faded-ink">Lorebook not found.</p>
          <button onClick={onBack} className="rune-button mt-4">Back to Books</button>
        </div>
      </div>
    );
  }

  const handleSelectEntry = (id: string) => {
    setSelectedEntryId(id);
  };

  const handleUpdateEntry = async (updated: LorebookEntry) => {
    const newEntries = entries.map((e) => (e.id === updated.id ? updated : e));
    await saveLorebookById({ ...lorebook, entries: newEntries });
  };

  const handleAddEntry = async () => {
    const newEntry = createDefaultEntry();
    const newEntries = [...entries, newEntry];
    await saveLorebookById({ ...lorebook, entries: newEntries });
    setSelectedEntryId(newEntry.id);
  };

  const handleDeleteEntry = async (id: string) => {
    const newEntries = removeEntry(entries, id);
    await saveLorebookById({ ...lorebook, entries: newEntries });
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-4xl p-0 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-aged-leather/30">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="rune-button text-xs px-3 py-1">
              Back to Books
            </button>
            <h2 className="font-display text-lg text-arcane-gold">{lorebook.name}</h2>
          </div>
          <button onClick={handleAddEntry} className="rune-button text-xs px-3 py-1">
            + New Entry
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Entry list */}
          <div className="w-64 border-r border-aged-leather/30 overflow-y-auto p-3">
            {entries.length === 0 ? (
              <p className="text-xs text-faded-ink/50 italic">No entries yet.</p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedEntryId === entry.id
                        ? 'bg-aged-leather/40 border border-arcane-gold/30'
                        : 'bg-dark-parchment/30 border border-transparent hover:bg-aged-leather/20'
                    }`}
                    onClick={() => handleSelectEntry(entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-ui text-parchment truncate flex-1">
                        {entry.keys.join(', ') || '(no keys)'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
                        }}
                        className="text-ember hover:text-ember/80 text-xs ml-2 shrink-0"
                        title="Delete entry"
                      >
                        {'✕'}
                      </button>
                    </div>
                    <span className="text-[10px] text-faded-ink">{entry.content.slice(0, 40)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entry form */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedEntry ? (
              <EntryForm entry={selectedEntry} onChange={handleUpdateEntry} />
            ) : (
              <p className="text-sm text-faded-ink/50 italic">Select an entry to edit, or create a new one.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
