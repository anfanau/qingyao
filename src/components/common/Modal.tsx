import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel ${maxWidth} w-[90vw] p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="font-title text-lg text-celestial-gold">{title}</h2>}
          <button onClick={onClose} className="p-1 rounded text-mist-gray hover:text-scroll-white hover:bg-faded-gold/30 transition-colors ml-auto">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
