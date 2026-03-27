import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useQueryClient } from '@tanstack/react-query';
import { User, Download, Trash2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Profile() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: flags, refetch: refetchFlags } = useFeatureFlags();
  
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Show bootstrap section only if admin_bootstrap_used is false
  // The edge function will validate email server-side
  const canShowBootstrap = flags?.admin_bootstrap_used === false;

  const handleBootstrapAdmin = async () => {
    if (!session?.access_token || !bootstrapToken.trim()) return;
    
    setActivating(true);
    try {
      const response = await supabase.functions.invoke('bootstrap-admin', {
        headers: {
          'x-admin-bootstrap-token': bootstrapToken.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Bootstrap failed');
      }

      // Clear token from memory immediately
      setBootstrapToken('');
      setActivated(true);
      
      // Refresh feature flags
      await refetchFlags();
      
      // Invalidate any admin-related queries
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      
      toast({
        title: "Admin activé",
        description: "Votre compte a été promu administrateur.",
      });
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      setBootstrapToken('');
      toast({
        title: "Erreur d'activation",
        description: error.message || "Impossible d'activer le compte admin.",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      // Fetch all user data
      const [profileRes, readingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tarot_readings').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          id: user.id,
        },
        profile: profileRes.data,
        readings: readingsRes.data || [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-divinatoire-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Vos données ont été téléchargées.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter vos données.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !session?.access_token) return;
    
    setDeleting(true);
    try {
      const response = await supabase.functions.invoke('delete-account', {
        body: { confirmation: 'SUPPRIMER' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Suppression échouée');
      }

      const data = response.data as { success?: boolean; error?: string };
      if (!data?.success) {
        throw new Error(data?.error || 'Suppression échouée');
      }

      // Sign out locally after server-side deletion
      await supabase.auth.signOut();
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données associées ont été définitivement supprimés.",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer votre compte. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Mon Profil
            </h1>
          </div>

          {/* User Info */}
          <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4 animate-scale-in">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Admin Bootstrap Section - Only visible before first admin is activated */}
          {canShowBootstrap && !activated && (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium text-primary">Activer accès Admin</h3>
                    <p className="text-sm text-muted-foreground">
                      Entrez le token d'administration pour activer votre compte admin.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Token admin"
                      value={bootstrapToken}
                      onChange={(e) => setBootstrapToken(e.target.value)}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button 
                      onClick={handleBootstrapAdmin}
                      disabled={activating || !bootstrapToken.trim()}
                    >
                      {activating ? 'Activation...' : 'Activer'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Activated Success */}
          {activated && (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 space-y-4 animate-scale-in">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-600 dark:text-green-400">Admin activé</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre compte administrateur est maintenant actif.
                  </p>
                  <Button onClick={() => navigate('/admin')}>
                    Aller au tableau de bord admin
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RGPD Actions */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Vos données (RGPD)</h2>
            
            <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
              <div className="flex items-start gap-4">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium">Exporter mes données</h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une copie de toutes vos données au format JSON.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  {exporting ? 'Export...' : 'Exporter'}
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
              <div className="flex items-start gap-4">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-destructive">Supprimer mon compte</h3>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmer la suppression
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Votre compte sera entièrement supprimé côté serveur, 
                        y compris vos identifiants de connexion, votre profil et tout votre historique de tirages. 
                        Vous ne pourrez plus vous reconnecter avec cette adresse email. Voulez-vous vraiment continuer ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
