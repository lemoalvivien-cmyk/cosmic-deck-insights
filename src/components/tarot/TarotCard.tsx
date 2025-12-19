import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Moon, Sun, Star } from 'lucide-react';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import { getCardBackUrl, getCardFaceUrl, preloadImage } from '@/utils/tarotImageHelpers';

interface TarotCardProps {
  card?: TarotCardType;
  orientation?: 'upright' | 'reversed';
  size?: 'sm' | 'md' | 'lg';
  isRevealed?: boolean;
  isShuffling?: boolean;
  className?: string;
}

export function TarotCard({
  card,
  orientation = 'upright',
  size = 'md',
  isRevealed = true,
  isShuffling = false,
  className,
}: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [faceLoaded, setFaceLoaded] = useState(false);
  const [backLoaded, setBackLoaded] = useState(false);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [showFace, setShowFace] = useState(isRevealed);

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

  // Load back URL on mount
  useEffect(() => {
    const url = getCardBackUrl();
    if (url) {
      setBackUrl(url);
      preloadImage(url)
        .then(() => setBackLoaded(true))
        .catch(() => setBackLoaded(false));
    }
  }, []);

  // Load face URL when card changes
  useEffect(() => {
    if (card) {
      const url = getCardFaceUrl(card);
      setFaceUrl(url);
      setFaceLoaded(false);
      
      if (url) {
        preloadImage(url)
          .then(() => setFaceLoaded(true))
          .catch(() => setFaceLoaded(false));
      }
    }
  }, [card]);

  // Handle flip animation
  const triggerFlip = useCallback(async () => {
    if (!isRevealed) {
      setIsFlipped(false);
      setShowFace(false);
      return;
    }

    // Wait for face to load before flipping
    if (faceUrl && !faceLoaded) {
      try {
        await preloadImage(faceUrl);
        setFaceLoaded(true);
      } catch {
        // Continue with placeholder
      }
    }

    setIsFlipped(true);
    // Wait for flip animation to complete before showing face content
    setTimeout(() => {
      setShowFace(true);
    }, 300);
  }, [isRevealed, faceUrl, faceLoaded]);

  // Trigger flip when isRevealed changes
  useEffect(() => {
    if (isRevealed && !isFlipped) {
      triggerFlip();
    } else if (!isRevealed) {
      setIsFlipped(false);
      setShowFace(false);
    }
  }, [isRevealed, isFlipped, triggerFlip]);

  // Render card back (placeholder/image)
  const renderBack = () => (
    <div className="absolute inset-0 backface-hidden">
      {backUrl && backLoaded ? (
        <img 
          src={backUrl} 
          alt="Dos de carte" 
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center rounded-xl">
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
    </div>
  );

  // Render card face (image or placeholder)
  const renderFace = () => (
    <div 
      className={cn(
        "absolute inset-0 backface-hidden rotate-y-180",
        orientation === 'reversed' && 'rotate-180'
      )}
    >
      {faceUrl && faceLoaded ? (
        <img 
          src={faceUrl} 
          alt={card?.nom_fr || 'Carte de tarot'} 
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-accent/20 border border-border shadow-soft flex flex-col items-center justify-between p-3 rounded-xl">
          {/* Top decoration */}
          <div className="w-full flex justify-center">
            <div className="flex items-center gap-1">
              {isMajor && card?.numero !== null && (
                <span className={cn('font-serif font-semibold text-primary', textSizes[size])}>
                  {card?.numero}
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
              {card?.nom_fr}
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

  return (
    <div
      className={cn(
        'relative select-none perspective-1000',
        sizeClasses[size],
        isShuffling && 'animate-shuffle',
        className
      )}
      style={{ aspectRatio: '2/3' }}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-700 transform-style-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        {renderBack()}
        {renderFace()}
      </div>
    </div>
  );
}
