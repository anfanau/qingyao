import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type ToastType = 'success' | 'info' | 'warning' | 'error';

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
// Icons & Colors
// ============================================================

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <XCircle size={18} />,
};

const TYPE_ICON_COLOR: Record<ToastType, string> = {
  success: 'text-jade-green',
  info: 'text-spirit-cyan',
  warning: 'text-fire-vein',
  error: 'text-vermil-red',
};

const TYPE_BORDER: Record<ToastType, string> = {
  success: 'border-l-jade-green',
  info: 'border-l-spirit-cyan',
  warning: 'border-l-fire-vein',
  error: 'border-l-vermil-red',
};

const TYPE_PROGRESS: Record<ToastType, string> = {
  success: 'bg-jade-green',
  info: 'bg-spirit-cyan',
  warning: 'bg-fire-vein',
  error: 'bg-vermil-red',
};

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
// Provider
// ============================================================

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Clear the auto-dismiss timer for this toast
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }

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

      setToasts((prev) => {
        // Enforce max 3 visible toasts: if already at limit, remove oldest
        if (prev.length >= MAX_VISIBLE) {
          const oldest = prev[0];
          if (oldest) {
            const oldTimer = timersRef.current.get(oldest.id);
            if (oldTimer) {
              clearTimeout(oldTimer);
              timersRef.current.delete(oldest.id);
            }
          }
          return [...prev.slice(1), { id, message, type, removing: false }];
        }
        return [...prev, { id, message, type, removing: false }];
      });

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
  const { _toasts, _removeToast } = useContext(ToastContext);

  if (_toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-xs">
        {_toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto relative overflow-hidden
              border-l-4 ${TYPE_BORDER[toast.type]}
              bg-mystic-azure/90 backdrop-blur-sm
              text-sm font-body text-scroll-white
              px-4 py-3 pr-10 rounded shadow-lg
              min-w-[260px]
              transition-all duration-300
              ${toast.removing
                ? 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0 animate-slide-up'
              }
            `}
          >
            <div className="flex items-start gap-2.5">
              <span className={`shrink-0 mt-0.5 ${TYPE_ICON_COLOR[toast.type]}`}>
                {TOAST_ICONS[toast.type]}
              </span>
              <span className="flex-1 leading-snug">{toast.message}</span>
            </div>

            {/* Manual close button */}
            <button
              onClick={() => _removeToast(toast.id)}
              className="absolute top-2 right-2 p-0.5 rounded text-mist-gray/60 hover:text-scroll-white hover:bg-white/10 transition-colors"
              title="关闭"
            >
              <X size={14} />
            </button>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div
                className={`h-full rounded-full ${TYPE_PROGRESS[toast.type]}`}
                style={{
                  animation: 'toastProgress 3s linear forwards',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
