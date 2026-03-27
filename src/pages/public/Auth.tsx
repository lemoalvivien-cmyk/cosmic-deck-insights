import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Clock } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { user, signIn, signUp } = useAuth();
  const { data: publicConfig } = usePublicConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const waitlistActive = publicConfig?.enable_waitlist ?? false;

  const from = (location.state as { from?: string })?.from || '/app/onboarding';

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/app/onboarding', { replace: true });
    }
  }, [user, navigate]);

  // If waitlist is active, force login mode
  useEffect(() => {
    if (waitlistActive && !isLogin) {
      setIsLogin(true);
    }
  }, [waitlistActive, isLogin]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('leaked') || error.message.includes('compromised') || error.message.includes('pwned')) {
            toast({
              title: "Mot de passe compromis",
              description: "Ce mot de passe a été exposé dans une fuite de données. Veuillez en choisir un autre plus sécurisé.",
              variant: "destructive",
            });
          } else if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erreur de connexion",
              description: "Email ou mot de passe incorrect.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Bienvenue !",
            description: "Connexion réussie.",
          });
        }
      } else {
        // Double-check waitlist before allowing signup
        if (waitlistActive) {
          toast({
            title: "Inscriptions fermées",
            description: "Les nouvelles inscriptions sont temporairement suspendues.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('leaked') || error.message.includes('compromised') || error.message.includes('pwned')) {
            toast({
              title: "Mot de passe compromis",
              description: "Ce mot de passe a été exposé dans une fuite de données. Veuillez en choisir un autre plus sécurisé.",
              variant: "destructive",
            });
          } else if (error.message.includes('User already registered')) {
            toast({
              title: "Compte existant",
              description: "Un compte existe déjà avec cet email.",
              variant: "destructive",
            });
            setIsLogin(true);
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Inscription réussie !",
            description: "Bienvenue dans votre espace mystique.",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl font-semibold">
              {isLogin ? 'Bon retour' : 'Bienvenue'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? 'Connectez-vous pour accéder à vos tirages' : 'Créez votre compte pour commencer'}
            </p>
            <div className="beta-badge mx-auto">
              <Sparkles className="h-3 w-3" />
              VERSION BÊTA GRATUITE
            </div>
          </div>

          {/* Waitlist banner — shown when signups are disabled */}
          {waitlistActive && !isLogin && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Inscriptions temporairement fermées</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nous accueillons de nouveaux membres progressivement. Revenez bientôt !
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-2xl glass-mystic shadow-soft">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {!isLogin && !waitlistActive && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full btn-mystic group" size="lg" disabled={loading || (!isLogin && waitlistActive)}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>

            <div className="text-center text-sm">
              {waitlistActive ? (
                <span className="text-muted-foreground">
                  Vous avez déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Se connecter
                  </button>
                </span>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                  </span>{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "S'inscrire" : "Se connecter"}
                  </button>
                </>
              )}
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos{' '}
            <a href="/legal/terms" className="text-primary hover:underline">CGU</a>
            {' '}et notre{' '}
            <a href="/legal/privacy" className="text-primary hover:underline">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
