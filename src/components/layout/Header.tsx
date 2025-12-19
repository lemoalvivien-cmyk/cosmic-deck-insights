import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, LogOut, User, BookOpen, Menu, X, Star, Home } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Check if user is on app routes
  const isAppRoute = window.location.pathname.startsWith('/app');

  return (
    <header className="sticky top-0 z-50 glass-mystic border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={user ? "/app" : "/"} className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              Tarot Divinatoire
            </span>
          </Link>

          {/* Beta Badge - Desktop */}
          <div className="hidden md:block beta-badge">
            <Sparkles className="h-3 w-3" />
            VERSION BÊTA GRATUITE
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {isAppRoute && (
                  <>
                    <Link 
                      to="/app" 
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Home className="h-4 w-4" />
                      Accueil
                    </Link>
                    <Link 
                      to="/app/new" 
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      Tirage
                    </Link>
                    <Link 
                      to="/app/history" 
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="h-4 w-4" />
                      Journal
                    </Link>
                    <Link 
                      to="/app/favorites" 
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Star className="h-4 w-4" />
                      Favoris
                    </Link>
                  </>
                )}
                <Link 
                  to="/app/profile" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  Profil
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/disclaimer" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  À propos
                </Link>
                <Link to="/auth">
                  <Button variant="default" size="sm" className="btn-mystic">
                    Commencer
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in-up">
            <div className="flex flex-col gap-4">
              <div className="beta-badge self-start">
                <Sparkles className="h-3 w-3" />
                VERSION BÊTA GRATUITE
              </div>
              
              {user ? (
                <>
                  <Link 
                    to="/app" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Accueil
                  </Link>
                  <Link 
                    to="/app/new" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Nouveau tirage
                  </Link>
                  <Link 
                    to="/app/history" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Journal
                  </Link>
                  <Link 
                    to="/app/favorites" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Favoris
                  </Link>
                  <Link 
                    to="/app/profile" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="text-destructive justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/disclaimer" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    À propos
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" size="sm" className="btn-mystic w-full">
                      Commencer
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
