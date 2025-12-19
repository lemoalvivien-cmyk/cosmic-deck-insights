import { Menu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BetaBadge } from './BetaBadge';

interface SiteHeaderProps {
  className?: string;
  onMenuClick?: () => void;
}

/**
 * Header du site avec logo, BetaBadge et bouton menu
 */
export function SiteHeader({ className, onMenuClick }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'mp-glass backdrop-blur-xl',
        'border-b border-mp-surface-border',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a 
            href="/" 
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Sparkles 
                className="h-7 w-7 transition-all duration-300 group-hover:scale-110"
                style={{ color: 'hsl(var(--mp-brand-gold))' }}
              />
              <div 
                className="absolute inset-0 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
                style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.3)' }}
              />
            </div>
            <span 
              className="font-serif text-xl font-semibold tracking-tight"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Tarot Divinatoire
            </span>
          </a>

          {/* Centre - Beta Badge (desktop) */}
          <div className="hidden md:block">
            <BetaBadge variant="compact" />
          </div>

          {/* Menu button */}
          <button
            onClick={onMenuClick}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              'hover:bg-mp-brand-violet/10',
              'focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-mp-brand-violet focus-visible:ring-offset-2'
            )}
            aria-label="Menu"
          >
            <Menu 
              className="h-6 w-6" 
              style={{ color: 'hsl(var(--foreground))' }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
