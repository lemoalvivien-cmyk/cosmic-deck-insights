import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg font-semibold">Tarot Divinatoire</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fait et développé avec le savoir-faire d'une trentaine de Tarologues professionnels.
            </p>
            <div className="beta-badge">
              <Sparkles className="h-3 w-3" />
              VERSION BÊTA GRATUITE
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-semibold">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/disclaimer" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                À propos du service
              </Link>
              <Link 
                to="/legal/imprint" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Mentions légales
              </Link>
              <Link 
                to="/legal/privacy" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                to="/legal/terms" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                CGU
              </Link>
              <Link 
                to="/status" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                État du service
              </Link>
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-semibold">Information importante</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ce service est destiné à la guidance et à l'introspection personnelle uniquement. 
              Les interprétations fournies ne constituent pas des conseils médicaux, juridiques 
              ou financiers.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tarot Divinatoire. Tous droits réservés.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Créé avec <Heart className="h-3 w-3 text-primary" /> pour votre guidance spirituelle
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
