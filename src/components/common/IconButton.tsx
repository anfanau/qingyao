import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function IconButton({ icon: Icon, label, onClick, active }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 font-ui text-sm ${active ? 'bg-celestial-gold/10 text-celestial-gold' : 'text-mist-gray hover:text-scroll-white hover:bg-faded-gold/20'}`}
      title={label}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
