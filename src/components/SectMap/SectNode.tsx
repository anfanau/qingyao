import type { SectData } from '../../data/sects-data';

interface SectNodeProps {
  sect: SectData;
  angleDeg: number;
  radius: number;
  isSelected: boolean;
  onClick: () => void;
}

export function SectNode({ sect, angleDeg, radius, isSelected, onClick }: SectNodeProps) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = Math.cos(angleRad) * radius;
  const cy = Math.sin(angleRad) * radius;
  const Icon = sect.icon;

  return (
    <div
      className="absolute transition-transform duration-300 ease-out cursor-pointer group"
      style={{
        left: `calc(50% + ${cx}px)`,
        top: `calc(50% + ${cy}px)`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={onClick}
    >
      <div
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          bg-gradient-to-br ${sect.color}
          transition-all duration-300
          group-hover:scale-110
          ${isSelected
            ? `scale-110 ring-2 ring-celestial-gold/60 ${sect.glow}`
            : `ring-1 ring-white/10 ${sect.glow}`
          }
        `}
        style={isSelected ? {
          boxShadow: '0 0 20px rgba(212,168,67,0.5), 0 0 40px rgba(212,168,67,0.2)',
        } : undefined}
      >
        <div className="absolute inset-0 rounded-full bg-ink-black/30" />
        <Icon size={24} className="relative z-10 text-scroll-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
      </div>
      <div
        className={`
          mt-1.5 text-center font-title text-xs tracking-wider transition-all duration-300
          ${isSelected ? 'text-celestial-gold' : 'text-mist-gray/80'}
          group-hover:text-celestial-gold
        `}
        style={isSelected ? { textShadow: '0 0 6px rgba(212,168,67,0.4)' } : undefined}
      >
        {sect.name}
      </div>
    </div>
  );
}
