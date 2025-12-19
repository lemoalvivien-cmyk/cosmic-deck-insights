import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MysticBackgroundProps {
  children: ReactNode;
  className?: string;
  withFiligree?: boolean;
}

/**
 * Fond cosmique premium avec dégradé violet, étoiles et filigrane zodiac optionnel
 */
export function MysticBackground({ 
  children, 
  className,
  withFiligree = false 
}: MysticBackgroundProps) {
  return (
    <div className={cn('mystic-bg min-h-screen', className)}>
      {/* Filigrane zodiac SVG */}
      {withFiligree && (
        <div 
          className="pointer-events-none absolute inset-0 z-0"
          style={{ opacity: 0.07 }}
          aria-hidden="true"
        >
          <svg
            className="absolute top-1/4 left-1/4 w-64 h-64 text-mp-brand-gold"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cercle zodiac simplifié */}
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
            <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
            {/* Rayons */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="50"
                x2={50 + 45 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 45 * Math.sin((angle * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="0.2"
                opacity="0.3"
              />
            ))}
            {/* Symboles zodiac simplifiés aux 12 positions */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <circle
                key={`dot-${angle}`}
                cx={50 + 40 * Math.cos((angle * Math.PI) / 180)}
                cy={50 + 40 * Math.sin((angle * Math.PI) / 180)}
                r="1.5"
                fill="currentColor"
                opacity="0.5"
              />
            ))}
          </svg>
          
          <svg
            className="absolute bottom-1/4 right-1/4 w-48 h-48 text-mp-brand-violet rotate-45"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.3" opacity="0.35" />
            {/* Étoile centrale */}
            <path
              d="M50 20 L54 40 L70 50 L54 60 L50 80 L46 60 L30 50 L46 40 Z"
              stroke="currentColor"
              strokeWidth="0.3"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>
      )}
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default MysticBackground;
