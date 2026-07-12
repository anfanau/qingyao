import { useMemo } from 'react';

interface StarFieldProps {
  count?: number;
}

interface StarConfig {
  id: number;
  x: string;
  y: string;
  size: string;
  color: string;
  duration: string;
  delay: string;
}

const STAR_COLORS = [
  '#ffffff',
  '#f0e6c8',
  '#d4e8f0',
  '#e8d5f0',
  '#f5d78a',
  '#c8e8f0',
];

export function StarField({ count = 80 }: StarFieldProps) {
  const stars: StarConfig[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: `${Math.random() * 2.5 + 1}px`,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 5}s`,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-particle"
          style={{
            '--star-x': star.x,
            '--star-y': star.y,
            '--star-size': star.size,
            '--star-color': star.color,
            '--star-duration': star.duration,
            '--star-delay': star.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
