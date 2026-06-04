import { useState, useEffect } from 'react';

const Preloader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 160);
    return () => clearInterval(interval);
  }, []);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden">
      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative flex flex-col items-center gap-10 animate-fade-in">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-base font-light text-foreground"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.4em',
              textIndent: '0.4em',
            }}
          >
            universum
          </h1>
          <div className="h-px w-12 bg-foreground/20" />
          <p
            className="text-[9px] font-light text-muted-foreground"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              textIndent: '0.3em',
            }}
          >
            educational platform
          </p>
        </div>

        {/* Linear progress bar */}
        <div className="flex flex-col items-center gap-3 w-[220px]">
          <div className="relative w-full h-[2px] bg-foreground/10 overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out rounded-full"
              style={{
                width: `${displayProgress}%`,
                boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
              }}
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <span
              className="text-[10px] font-light text-muted-foreground tabular-nums"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.15em',
              }}
            >
              ЗАГРУЗКА
            </span>
            <span
              className="text-[10px] font-light text-foreground/70 tabular-nums"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              {String(displayProgress).padStart(3, '0')}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom marker */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        <span
          className="text-[8px] font-light text-muted-foreground"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
          }}
        >
          unvrsm.ru
        </span>
      </div>
    </div>
  );
};

export default Preloader;
