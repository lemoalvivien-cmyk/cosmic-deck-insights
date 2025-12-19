import { cn } from '@/lib/utils';
import { Sparkles, Moon, Sun, Star } from 'lucide-react';
import type { TarotCard } from '@/types/tarot';

interface TarotCardPlaceholderProps {
  card?: TarotCard;
  orientation?: 'upright' | 'reversed';
  size?: 'sm' | 'md' | 'lg';
  isRevealed?: boolean;
  isShuffling?: boolean;
  className?: string;
}

export function TarotCardPlaceholder({
  card,
  orientation = 'upright',
  size = 'md',
  isRevealed = true,
  isShuffling = false,
  className,
}: TarotCardPlaceholderProps) {
  const sizeClasses = {
    sm: 'w-24 h-36',
    md: 'w-36 h-54',
    lg: 'w-48 h-72',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const isMajor = card?.type === 'major';
  const Icon = isMajor ? (card?.numero && card.numero <= 10 ? Sun : Moon) : Star;

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-500 select-none',
        sizeClasses[size],
        isShuffling && 'animate-shuffle',
        orientation === 'reversed' && isRevealed && 'rotate-180',
        className
      )}
      style={{ aspectRatio: '2/3' }}
    >
      {/* Card Back (not revealed) */}
      {!isRevealed && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center">
          <div className="absolute inset-2 border-2 border-primary-foreground/20 rounded-lg" />
          <div className="absolute inset-4 border border-primary-foreground/10 rounded-md" />
          <Sparkles className={cn('text-primary-foreground/60', iconSizes[size])} />
          
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-2 h-2 bg-primary-foreground rounded-full" />
            <div className="absolute top-4 right-4 w-2 h-2 bg-primary-foreground rounded-full" />
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-primary-foreground rounded-full" />
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        </div>
      )}

      {/* Card Front (revealed) */}
      {isRevealed && card && (
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-accent/20 border border-border shadow-soft flex flex-col items-center justify-between p-3">
          {/* Top decoration */}
          <div className="w-full flex justify-center">
            <div className="flex items-center gap-1">
              {isMajor && card.numero !== null && (
                <span className={cn('font-serif font-semibold text-primary', textSizes[size])}>
                  {card.numero}
                </span>
              )}
            </div>
          </div>

          {/* Center icon */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
              <div className={cn(
                'relative p-4 rounded-full',
                isMajor ? 'bg-gradient-to-br from-primary/20 to-secondary/20' : 'bg-gradient-to-br from-secondary/20 to-accent/20'
              )}>
                <Icon className={cn(
                  iconSizes[size],
                  isMajor ? 'text-primary' : 'text-secondary'
                )} />
              </div>
            </div>
          </div>

          {/* Card name */}
          <div className="w-full text-center">
            <p className={cn(
              'font-serif font-semibold text-foreground leading-tight',
              textSizes[size]
            )}>
              {card.nom_fr}
            </p>
            {orientation === 'reversed' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                (Renversée)
              </p>
            )}
          </div>

          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-border/50 rounded-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-border/50 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-border/50 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-border/50 rounded-br" />
        </div>
      )}
    </div>
  );
}
