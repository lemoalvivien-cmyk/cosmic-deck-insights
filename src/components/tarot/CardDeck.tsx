import { useState, useEffect } from 'react';
import { TarotCardPlaceholder } from './TarotCardPlaceholder';
import { cn } from '@/lib/utils';

interface CardDeckProps {
  isShuffling: boolean;
  onDrawClick: () => void;
  disabled?: boolean;
}

export function CardDeck({ isShuffling, onDrawClick, disabled }: CardDeckProps) {
  const [shufflePhase, setShufflePhase] = useState(0);

  useEffect(() => {
    if (isShuffling) {
      const interval = setInterval(() => {
        setShufflePhase(p => (p + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    }
    setShufflePhase(0);
  }, [isShuffling]);

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Stacked cards effect */}
      <div className="relative w-40 h-60">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
              isShuffling && i === shufflePhase && 'animate-shuffle'
            )}
            style={{
              transform: `translate(-50%, -50%) rotate(${(i - 2) * 3 + (isShuffling ? Math.sin(Date.now() / 100 + i) * 2 : 0)}deg)`,
              zIndex: 5 - i,
            }}
          >
            <TarotCardPlaceholder 
              size="md" 
              isRevealed={false}
            />
          </div>
        ))}
      </div>

      {/* Draw button */}
      <button
        onClick={onDrawClick}
        disabled={disabled || isShuffling}
        className={cn(
          'px-8 py-4 rounded-xl font-serif text-lg font-semibold transition-all duration-300',
          'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground',
          'hover:shadow-glow hover:-translate-y-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
          isShuffling && 'animate-pulse'
        )}
      >
        {isShuffling ? 'Mélange en cours...' : 'Tirer une carte'}
      </button>
    </div>
  );
}
