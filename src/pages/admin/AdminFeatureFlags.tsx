import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, AlertTriangle, ShoppingBag, CreditCard, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FlagConfig {
  key: 'maintenance_mode' | 'enable_waitlist';
  label: string;
  description: string;
  icon: React.ReactNode;
  dangerous?: boolean;
}

const FLAGS: FlagConfig[] = [
  {
    key: 'maintenance_mode',
    label: 'Mode maintenance',
    description: 'Active le mode maintenance. Seuls les admins pourront accéder au site.',
    icon: <AlertTriangle className="h-5 w-5" />,
    dangerous: true,
  },
  {
    key: 'enable_waitlist',
    label: 'Liste d\'attente',
    description: 'Bloque les nouvelles inscriptions. Les utilisateurs existants peuvent toujours se connecter.',
    icon: <Users className="h-5 w-5" />,
  },
];

export default function AdminFeatureFlags() {
  const { data: flags, isLoading } = useFeatureFlags();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: FlagConfig['key'], newValue: boolean) => {
    if (!user) return;
    
    setUpdating(key);
    try {
      // Update the flag
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ [key]: newValue, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action: 'update_feature_flag',
          target_type: 'feature_flags',
          target_id: key,
          metadata: { key, old_value: !newValue, new_value: newValue },
        });

      if (logError) {
        console.error('Failed to log action:', logError);
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      
      toast.success(`${FLAGS.find(f => f.key === key)?.label} ${newValue ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Error updating flag:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Feature Flags
                </h1>
                <p className="text-muted-foreground">Gestion des fonctionnalités</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin">← Dashboard</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {FLAGS.map((flag) => (
              <Card key={flag.key} className={flag.dangerous ? 'border-destructive/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${flag.dangerous ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {flag.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{flag.label}</CardTitle>
                        <CardDescription>{flag.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={flags?.[flag.key] ?? false}
                      onCheckedChange={(checked) => handleToggle(flag.key, checked)}
                      disabled={updating === flag.key}
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {flags?.maintenance_mode && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">
                    Le mode maintenance est actif. Les utilisateurs sont redirigés vers /status.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
