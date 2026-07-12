// src/components/Splash/SplashScreen.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { StarField } from './StarField';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'idle' | 'opening' | 'flash' | 'title' | 'fading';

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [doorOpen, setDoorOpen] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleOpenDoor = useCallback(() => {
    setPhase('opening');
    setDoorOpen(true);

    const t1 = setTimeout(() => setPhase('flash'), 1200);
    const t2 = setTimeout(() => setPhase('title'), 1500);
    const t3 = setTimeout(() => setPhase('fading'), 3500);
    const t4 = setTimeout(() => onComplete(), 4100);

    timersRef.current.push(t1, t2, t3, t4);
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex flex-col items-center justify-center
        bg-[#050508] overflow-hidden
        transition-opacity duration-[600ms] ease-out
        ${phase === 'fading' ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <StarField count={100} />

      {/* Nebula gradients */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,20,50,0.6)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(40,30,20,0.4)_0%,transparent_60%)]" />
      </div>

      {/* Door frame */}
      <div className="perspective-container relative flex items-center justify-center" style={{ width: '62vw', height: '68vh' }}>
        {/* Frame border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '3px solid rgba(180, 140, 60, 0.5)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 0 60px rgba(180,140,60,0.1)',
            background: 'linear-gradient(180deg, #1a1408 0%, #0d0a04 50%, #1a1408 100%)',
          }}
        />

        {/* Left door leaf */}
        <div className={`door-leaf door-left ${doorOpen ? 'open' : ''}`}>
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, #1a1008 0%, #2a1a0a 50%, #1a1008 100%)',
              border: '2px solid rgba(200, 160, 80, 0.6)',
              borderRight: '1px solid rgba(200, 160, 80, 0.3)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 55%, rgba(180,140,60,0.6) 2px, transparent 2px)
              `,
              backgroundSize: '100% 100%',
            }} />
            {/* Door handle */}
            <div className="absolute left-1/2 top-[55%]" style={{
              width: '48px', height: '48px', marginLeft: '-24px', marginTop: '-24px',
              borderRadius: '50%', border: '3px solid rgba(200,150,70,0.8)',
              background: 'radial-gradient(circle at 40% 40%, rgba(200,160,80,0.4), rgba(80,50,20,0.8))',
              boxShadow: '0 0 15px rgba(180,140,60,0.4), inset 0 0 10px rgba(0,0,0,0.5)',
            }}>
              <div className="absolute inset-2 rounded-full" style={{
                border: '2px solid rgba(180,130,50,0.6)',
                background: 'radial-gradient(circle at 50% 50%, rgba(60,30,10,0.8), rgba(20,10,5,0.9))',
              }} />
            </div>
          </div>
        </div>

        {/* Right door leaf */}
        <div className={`door-leaf door-right ${doorOpen ? 'open' : ''}`}>
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(270deg, #1a1008 0%, #2a1a0a 50%, #1a1008 100%)',
              border: '2px solid rgba(200, 160, 80, 0.6)',
              borderLeft: '1px solid rgba(200, 160, 80, 0.3)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 55%, rgba(180,140,60,0.6) 2px, transparent 2px)
              `,
              backgroundSize: '100% 100%',
            }} />
            <div className="absolute left-1/2 top-[55%]" style={{
              width: '48px', height: '48px', marginLeft: '-24px', marginTop: '-24px',
              borderRadius: '50%', border: '3px solid rgba(200,150,70,0.8)',
              background: 'radial-gradient(circle at 40% 40%, rgba(200,160,80,0.4), rgba(80,50,20,0.8))',
              boxShadow: '0 0 15px rgba(180,140,60,0.4), inset 0 0 10px rgba(0,0,0,0.5)',
            }}>
              <div className="absolute inset-2 rounded-full" style={{
                border: '2px solid rgba(180,130,50,0.6)',
                background: 'radial-gradient(circle at 50% 50%, rgba(60,30,10,0.8), rgba(20,10,5,0.9))',
              }} />
            </div>
          </div>
        </div>

        {/* Door crack glow */}
        {!doorOpen && (
          <div
            className="absolute left-1/2 top-[17.5%] pointer-events-none"
            style={{
              width: '2px', height: '65%', marginLeft: '-1px',
              background: 'linear-gradient(180deg, transparent 5%, rgba(255,220,150,0.4) 30%, rgba(255,240,200,0.6) 50%, rgba(255,220,150,0.4) 70%, transparent 95%)',
              boxShadow: '0 0 8px rgba(255,220,150,0.4), 0 0 20px rgba(255,200,100,0.2)',
            }}
          />
        )}
      </div>

      {/* White flash overlay */}
      {phase === 'flash' && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-30"
          style={{ animation: 'whiteFlash 0.3s ease-out forwards' }}
        />
      )}

      {/* SVG Title */}
      {phase === 'title' && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          style={{ animation: 'titleEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
        >
          <svg viewBox="0 0 400 200" height="40vh" style={{ filter: 'url(#gold-glow-splash)' }}>
            <defs>
              <linearGradient id="gold-gradient-title" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b8860b" />
                <stop offset="30%" stopColor="#f5d78a" />
                <stop offset="50%" stopColor="#d4a843" />
                <stop offset="70%" stopColor="#f5d78a" />
                <stop offset="100%" stopColor="#b8860b" />
                <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="3s" repeatCount="indefinite" />
              </linearGradient>
              <filter id="gold-glow-splash" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text x="70" y="145" fontFamily="'ZCOOL XiaoWei','Ma Shan Zheng',serif" fontSize="160" fontWeight="bold" fill="url(#gold-gradient-title)" stroke="white" strokeWidth="2" paintOrder="stroke fill">仙</text>
            <text x="210" y="145" fontFamily="'ZCOOL XiaoWei','Ma Shan Zheng',serif" fontSize="160" fontWeight="bold" fill="url(#gold-gradient-title)" stroke="white" strokeWidth="2" paintOrder="stroke fill">途</text>
          </svg>
        </div>
      )}

      {/* Title golden particles */}
      {phase === 'title' && (
        <div className="absolute inset-0 pointer-events-none z-[35]" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                background: `rgba(245, 215, 138, ${Math.random() * 0.6 + 0.3})`,
                left: `${40 + Math.random() * 20}%`,
                top: `${35 + Math.random() * 30}%`,
                '--tx': `${(Math.random() - 0.5) * 200}px`,
                '--ty': `${(Math.random() - 0.5) * 200 - 40}px`,
                animation: `titleParticleFloat ${Math.random() * 2 + 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* "开门" button */}
      {phase === 'idle' && (
        <button
          onClick={handleOpenDoor}
          className="absolute z-20 animate-breath-text font-title text-2xl tracking-[0.3em]"
          style={{
            bottom: '10vh',
            color: '#d4a843',
            textShadow: '0 0 12px rgba(212,168,67,0.5), 0 0 30px rgba(212,168,67,0.3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '12px 36px',
          }}
        >
          开&nbsp;&nbsp;门
        </button>
      )}
    </div>
  );
}
