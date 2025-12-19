import { cn } from '@/lib/utils';

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

/**
 * En-tête d'étape avec titre centré, sous-titre et compteur
 */
export function StepHeader({
  title,
  subtitle,
  currentStep,
  totalSteps,
  className,
}: StepHeaderProps) {
  const showCounter = currentStep !== undefined && totalSteps !== undefined;

  return (
    <div className={cn('relative flex flex-col items-center py-6', className)}>
      {/* Compteur à droite (desktop) */}
      {showCounter && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
          <span 
            className="text-2xl font-serif font-semibold"
            style={{ color: 'hsl(var(--mp-brand-gold))' }}
          >
            {currentStep}
          </span>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-muted-foreground text-sm">{totalSteps}</span>
        </div>
      )}

      {/* Titre principal */}
      <h2 
        className="font-serif text-2xl md:text-3xl font-semibold text-center"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        {title}
      </h2>

      {/* Sous-titre */}
      {subtitle && (
        <p className="mt-2 text-muted-foreground text-center max-w-md">
          {subtitle}
        </p>
      )}

      {/* Compteur mobile */}
      {showCounter && (
        <div className="mt-3 flex items-center gap-1 md:hidden">
          <span 
            className="text-lg font-serif font-semibold"
            style={{ color: 'hsl(var(--mp-brand-gold))' }}
          >
            {currentStep}
          </span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-muted-foreground text-xs">{totalSteps}</span>
        </div>
      )}
    </div>
  );
}

export default StepHeader;
