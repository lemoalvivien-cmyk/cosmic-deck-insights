import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReadingResult } from '@/components/tarot/ReadingResult';
import { useTarotCards } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Star, 
  Trash2, 
  ArrowLeft,
  Calendar,
  Save,
  AlertTriangle
} from 'lucide-react';
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
import type { TarotReading, TarotInterpretation, DrawnCard } from '@/types/tarot';
import type { FallbackInterpretationData } from '@/utils/tarotFallback';

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allCards } = useTarotCards();
  
  const [userNotes, setUserNotes] = useState('');
  const [isNotesModified, setIsNotesModified] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch reading
  const { data: reading, isLoading, error } = useQuery({
    queryKey: ['reading', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarot_readings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Parse the data to match our types
      const parsedReading: TarotReading = {
        id: data.id,
        user_id: data.user_id,
        spread_id: data.spread_id,
        question: data.question,
        cards: data.cards as unknown as DrawnCard[],
        ai_interpretation: data.ai_interpretation as unknown as TarotInterpretation | null,
        user_notes: data.user_notes,
        is_favorite: data.is_favorite ?? false,
        created_at: data.created_at,
      };
      
      return parsedReading;
    },
    enabled: !!id,
  });

  // Initialize notes from reading
  useEffect(() => {
    if (reading?.user_notes !== undefined) {
      setUserNotes(reading.user_notes || '');
    }
  }, [reading?.user_notes]);

  // Debounced save for notes
  const saveNotes = useCallback(async (notes: string) => {
    if (!id) return;
    
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('tarot_readings')
        .update({ user_notes: notes })
        .eq('id', id);

      if (error) throw error;
      setIsNotesModified(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Erreur lors de la sauvegarde des notes');
    } finally {
      setIsSavingNotes(false);
    }
  }, [id]);

  // Debounce effect
  useEffect(() => {
    if (!isNotesModified) return;

    const timer = setTimeout(() => {
      saveNotes(userNotes);
    }, 800);

    return () => clearTimeout(timer);
  }, [userNotes, isNotesModified, saveNotes]);

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tarot_readings')
        .update({ is_favorite: !reading?.is_favorite })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['reading', id] });
      const previous = queryClient.getQueryData(['reading', id]);
      
      queryClient.setQueryData(['reading', id], (old: TarotReading | undefined) => {
        if (!old) return old;
        return { ...old, is_favorite: !old.is_favorite };
      });
      
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['reading', id], context?.previous);
      toast.error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  // Delete mutation
  const deleteReading = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tarot_readings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tirage supprimé');
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      navigate('/app/history');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });


  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !reading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <p className="text-destructive">Tirage non trouvé</p>
            <Button variant="outline" onClick={() => navigate('/app/history')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'historique
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const drawnCards = reading.cards || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/history')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Historique
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite.mutate()}
                disabled={toggleFavorite.isPending}
              >
                <Star 
                  className={`h-5 w-5 ${reading.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce tirage ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le tirage et son interprétation seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteReading.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(reading.created_at).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Question */}
          {reading.question && (
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Question posée :</p>
              <p className="font-medium mt-1">{reading.question}</p>
            </div>
          )}

          {/* Fallback Warning Banner */}
          {reading.ai_interpretation && typeof reading.ai_interpretation === 'object' && '_meta' in (reading.ai_interpretation as unknown as Record<string, unknown>) && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <strong>Interprétation simplifiée</strong> – Ce tirage a été réalisé alors que l'IA était indisponible
                {(reading.ai_interpretation as unknown as FallbackInterpretationData)._meta?.reason === 'INSUFFICIENT_BALANCE' && ' (crédits épuisés)'}
                {(reading.ai_interpretation as unknown as FallbackInterpretationData)._meta?.reason === 'RATE_LIMITED' && ' (limite quotidienne atteinte)'}
                . L'interprétation a été générée à partir des données de la carte.
              </AlertDescription>
            </Alert>
          )}

          {/* Reading Result with Cards + Interpretation */}
          <ReadingResult
            cards={drawnCards}
            interpretation={reading.ai_interpretation as TarotInterpretation | null}
            allCards={allCards}
          />

          {/* User Notes */}
          <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Notes personnelles
              </label>
              {isSavingNotes && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3 w-3 animate-pulse" />
                  Sauvegarde...
                </div>
              )}
            </div>
            <Textarea
              placeholder="Ajoutez vos réflexions, vos ressentis..."
              value={userNotes}
              onChange={(e) => {
                setUserNotes(e.target.value);
                setIsNotesModified(true);
              }}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
