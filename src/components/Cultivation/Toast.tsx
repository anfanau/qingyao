import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ============================================================
// Types
// ============================================================

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  removing: boolean;
}

interface ToastContextValue {
  /** Public: add a toast notification. */
  addToast: (message: string, type?: ToastType) => void;
  /** @internal */
  _toasts: ToastItem[];
  /** @internal */
  _removeToast: (id: string) => void;
}

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  _toasts: [],
  _removeToast: () => {},
});

// ============================================================
// Hook (public)
// ============================================================

export function useToast(): { addToast: (message: string, type?: ToastType) => void } {
  const { addToast } = useContext(ToastContext);
  return { addToast };
}

// ============================================================
// Type → border color map
// ============================================================

const TYPE_BORDER: Record<ToastType, string> = {
  info: 'border-l-spirit-cyan',
  success: 'border-l-jade-green',
  warning: 'border-l-fire-vein',
  error: 'border-l-vermil-red',
};

// ============================================================
// Provider
// ============================================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Start fade-out animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));

    // Remove from DOM after animation completes
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 300);

    timersRef.current.set(id, timer);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type, removing: false }]);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        removeToast(id);
      }, 3000);

      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    const current = timersRef.current;
    return () => {
      current.forEach((t) => clearTimeout(t));
      current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, _toasts: toasts, _removeToast: removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ============================================================
// Container — renders visible toasts
// ============================================================

export function ToastContainer() {
  const { _toasts } = useContext(ToastContext);

  if (_toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {_toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            border-l-4 ${TYPE_BORDER[toast.type]}
            bg-mystic-azure/90 backdrop-blur-sm
            text-sm font-body text-scroll-white
            px-4 py-2.5 rounded shadow-lg
            max-w-xs
            transition-all duration-300
            ${toast.removing
              ? 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0 animate-slide-up'
            }
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
