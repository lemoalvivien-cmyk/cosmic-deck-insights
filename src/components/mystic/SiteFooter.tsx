import { cn } from '@/lib/utils';
import { BetaBadge } from './BetaBadge';

interface SiteFooterProps {
  className?: string;
}

/**
 * Footer du site avec liens légaux et mention bêta
 */
export function SiteFooter({ className }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: '/legal/terms', label: 'CGU' },
    { href: '/legal/privacy', label: 'Confidentialité' },
    { href: '/legal/imprint', label: 'Mentions légales' },
    { href: '/disclaimer', label: 'Avertissement' },
  ];

  return (
    <footer
      className={cn(
        'relative z-10',
        'border-t border-mp-surface-border',
        'bg-mp-bg-900/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Beta Badge */}
          <BetaBadge />

          {/* Liens légaux */}
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors duration-200',
                  'text-muted-foreground hover:text-mp-brand-violet',
                  'focus:outline-none focus-visible:underline'
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Tarot Divinatoire. Tous droits réservés.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Service de guidance spirituelle — ne remplace pas un avis professionnel
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
