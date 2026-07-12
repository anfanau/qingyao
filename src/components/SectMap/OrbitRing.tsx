// src/components/SectMap/OrbitRing.tsx

interface OrbitRingProps {
  radius: number;
  color: 'gold' | 'cyan';
  animationClass: string;
}

const COLOR_MAP = { gold: 'rgba(212,168,67,0.15)', cyan: 'rgba(34,211,238,0.1)' };

export function OrbitRing({ radius, color, animationClass }: OrbitRingProps) {
  const diameter = radius * 2;
  return (
    <div
      className={`absolute ${animationClass}`}
      style={{
        left: `calc(50% - ${radius}px)`,
        top: `calc(50% - ${radius}px)`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: '50%',
        border: `1px dashed ${COLOR_MAP[color]}`,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
