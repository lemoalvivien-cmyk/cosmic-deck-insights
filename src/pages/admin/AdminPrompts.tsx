import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
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

interface PromptTemplate {
  id: string;
  key: string;
  content: string;
  description: string | null;
  updated_at: string;
}

const TEMPLATE_INFO: Record<string, { label: string; description: string }> = {
  tarot_system: {
    label: 'Prompt Système',
    description: 'Instructions de base pour le rôle de tarologue IA',
  },
  tarot_style: {
    label: 'Style & Ton',
    description: 'Directives de style (mystique, bienveillant, français)',
  },
  safety_rules: {
    label: 'Règles de Sécurité',
    description: 'Contraintes: pas de médical/juridique/financier',
  },
  json_schema: {
    label: 'Schéma JSON',
    description: 'Structure de sortie attendue',
  },
};

const DEFAULT_TEMPLATES: Record<string, string> = {
  tarot_system: `Tu es un tarologue expert du Tarot de Marseille avec 30 ans d'expérience. Tu pratiques une approche bienveillante et introspective du tarot.`,
  tarot_style: `STYLE ET TON:
- Ton mystique et premium, jamais fataliste ni alarmiste
- Langage évocateur avec métaphores lumineuses (aube, lumière, chemin, transformation)
- Français soutenu mais accessible
- Toujours bienveillant et encourageant
- Privilégie le Tarot de Marseille, mentionne le Rider-Waite seulement si pertinent`,
  safety_rules: `RÈGLES DE SÉCURITÉ ABSOLUES:
- Tu ne donnes JAMAIS d'avis médical, juridique ou financier
- Si la question touche ces domaines sensibles, tu DOIS:
  1. Rediriger vers un professionnel qualifié
  2. Proposer une lecture symbolique et introspective à la place
  3. Rappeler les limites du tarot dans la section "safety"
- Tu ne prédis jamais la mort, la maladie grave ou les catastrophes
- Tu rappelles toujours le libre arbitre de l'utilisateur`,
  json_schema: `{
  "title": "Titre évocateur du tirage",
  "summary": "Résumé global en 2-3 phrases",
  "interpretation": {
    "general": "Interprétation générale (3-4 phrases)",
    "love": "Guidance pour les relations (2-3 phrases)",
    "work": "Guidance carrière (2-3 phrases)",
    "money": "Guidance finances (2-3 phrases)"
  },
  "advice": ["Conseil 1", "Conseil 2", "Conseil 3"],
  "reflection_questions": ["Question 1 ?", "Question 2 ?"],
  "safety": {
    "medical": "Rappel santé",
    "legal": "Rappel juridique",
    "financial": "Rappel financier"
  }
}`,
};

export default function AdminPrompts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editedTemplates, setEditedTemplates] = useState<Map<string, string>>(new Map());
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-prompt-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as PromptTemplate[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ key, content }: { key: string; content: string }) => {
      const existing = templates?.find(t => t.key === key);
      
      if (existing) {
        const { error } = await supabase
          .from('ai_prompt_templates')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_prompt_templates')
          .insert({ 
            key, 
            content, 
            description: TEMPLATE_INFO[key]?.description || null 
          });
        if (error) throw error;
      }

      // Log action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user?.id,
        action: 'update_prompt_template',
        target_type: 'ai_prompt_templates',
        target_id: key,
        metadata: { key, content_length: content.length }
      });

      return { key };
    },
    onSuccess: ({ key }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-templates'] });
      setEditedTemplates(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      toast.success(`Template "${TEMPLATE_INFO[key]?.label || key}" sauvegardé`);
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  // Reset to defaults mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      for (const [key, content] of Object.entries(DEFAULT_TEMPLATES)) {
        const existing = templates?.find(t => t.key === key);
        
        if (existing) {
          await supabase
            .from('ai_prompt_templates')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('key', key);
        } else {
          await supabase
            .from('ai_prompt_templates')
            .insert({ 
              key, 
              content, 
              description: TEMPLATE_INFO[key]?.description || null 
            });
        }
      }

      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user?.id,
        action: 'reset_prompt_templates',
        target_type: 'ai_prompt_templates',
        metadata: { reset_keys: Object.keys(DEFAULT_TEMPLATES) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-templates'] });
      setEditedTemplates(new Map());
      toast.success('Templates réinitialisés aux valeurs par défaut');
    },
    onError: () => {
      toast.error('Erreur lors de la réinitialisation');
    },
  });

  const getContent = (key: string): string => {
    if (editedTemplates.has(key)) {
      return editedTemplates.get(key)!;
    }
    const template = templates?.find(t => t.key === key);
    return template?.content || DEFAULT_TEMPLATES[key] || '';
  };

  const handleChange = (key: string, value: string) => {
    setEditedTemplates(prev => new Map(prev.set(key, value)));
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    await saveMutation.mutateAsync({ key, content: getContent(key) });
    setSavingKey(null);
  };

  const isModified = (key: string): boolean => {
    if (!editedTemplates.has(key)) return false;
    const original = templates?.find(t => t.key === key)?.content || DEFAULT_TEMPLATES[key] || '';
    return editedTemplates.get(key) !== original;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  const templateKeys = Object.keys(TEMPLATE_INFO);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Prompts IA
                </h1>
                <p className="text-muted-foreground">Gestion des templates d'interprétation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/admin">← Dashboard</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={resetMutation.isPending}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser tous les templates ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action remplacera tous les templates par leurs valeurs par défaut.
                      Les modifications non sauvegardées seront perdues.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetMutation.mutate()}>
                      Réinitialiser
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="space-y-6">
            {templateKeys.map((key) => {
              const info = TEMPLATE_INFO[key];
              const template = templates?.find(t => t.key === key);
              const modified = isModified(key);
              
              return (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {info.label}
                          {modified && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-700 px-2 py-0.5 rounded">
                              Modifié
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {template && (
                          <span className="text-xs text-muted-foreground">
                            MAJ: {new Date(template.updated_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleSave(key)}
                          disabled={!modified || savingKey === key}
                        >
                          {savingKey === key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : modified ? (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Sauver
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              OK
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={getContent(key)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder={`Contenu du template ${key}...`}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {Array.from(editedTemplates.keys()).some(k => isModified(k)) && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">
                    Vous avez des modifications non sauvegardées. N'oubliez pas de cliquer sur "Sauver".
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
