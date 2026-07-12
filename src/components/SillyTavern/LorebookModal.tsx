import { useSillytavern } from '../../hooks/useSillytavern';
import { createDefaultLorebook } from '../../sillytavern/editor-utils';
import { exportToJson, downloadJson, validateSillyTavernJson, importSillyTavernJson } from '../../sillytavern/importer';
import type { SillyTavernExport } from '../../sillytavern/importer';

interface LorebookModalProps {
  onClose: () => void;
  onEdit: (id: string) => void;
}

export function LorebookModal({ onClose, onEdit }: LorebookModalProps) {
  const { lorebooks, activeChat, toggleLorebook, saveLorebookById, deleteLorebookById, loadAll } = useSillytavern();

  const activeLorebookIds = activeChat?.lorebookIds ?? [];

  const handleNewBook = async () => {
    const book = createDefaultLorebook();
    await saveLorebookById(book);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this lorebook permanently?')) {
      await deleteLorebookById(id);
    }
  };

  const handleExport = () => {
    const data = exportToJson({ lorebooks });
    downloadJson(data, 'lorebooks-export.json');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (validateSillyTavernJson(data)) {
          await importSillyTavernJson(data);
          await loadAll();
        } else {
          alert('Invalid SillyTavern JSON format.');
        }
      } catch {
        alert('Failed to parse file.');
      }
    };
    input.click();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-arcane-gold">World Books</h2>
          <button onClick={onClose} className="text-faded-ink hover:text-parchment text-lg">{'✕'}</button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={handleNewBook} className="rune-button text-xs">+ New Book</button>
          <button onClick={handleExport} className="rune-button text-xs">Export All</button>
          <button onClick={handleImport} className="rune-button text-xs">Import</button>
        </div>

        {/* Lorebook list */}
        {lorebooks.length === 0 ? (
          <p className="text-sm text-faded-ink/50 italic">No world books yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {lorebooks.map((book) => (
              <div key={book.id} className="p-3 parchment-card rounded flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-ui text-sm text-parchment truncate">{book.name}</h3>
                    <span className="text-[10px] text-faded-ink">
                      {book.entries.length} entries
                    </span>
                  </div>
                  {book.description && (
                    <p className="text-xs text-faded-ink/70 truncate mt-1">{book.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <label className="flex items-center gap-1 text-xs font-ui text-faded-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLorebookIds.includes(book.id)}
                      onChange={() => toggleLorebook(book.id)}
                      className="accent-arcane-gold"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => onEdit(book.id)}
                    className="rune-button text-xs px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="ember-button text-xs px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
