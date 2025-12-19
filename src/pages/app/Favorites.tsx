import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTarotCards } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Star, 
  Loader2, 
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { TarotReading, TarotInterpretation, DrawnCard } from '@/types/tarot';

const PAGE_SIZE = 20;

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allCards } = useTarotCards();
  
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch favorite readings with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ['readings', 'favorites', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('tarot_readings')
        .select('*', { count: 'exact' })
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const readings: TarotReading[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        spread_id: item.spread_id,
        question: item.question,
        cards: item.cards as unknown as DrawnCard[],
        ai_interpretation: item.ai_interpretation as unknown as TarotInterpretation | null,
        user_notes: item.user_notes,
        is_favorite: item.is_favorite ?? false,
        created_at: item.created_at,
      }));

      return { readings, total: count || 0 };
    },
  });

  // Remove from favorites mutation
  const removeFavorite = useMutation({
    mutationFn: async (readingId: string) => {
      const { error } = await supabase
        .from('tarot_readings')
        .update({ is_favorite: false })
        .eq('id', readingId);

      if (error) throw error;
      return readingId;
    },
    onMutate: async (readingId) => {
      await queryClient.cancelQueries({ queryKey: ['readings', 'favorites', page] });
      const previous = queryClient.getQueryData(['readings', 'favorites', page]);
      
      queryClient.setQueryData(['readings', 'favorites', page], (old: { readings: TarotReading[]; total: number } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          readings: old.readings.filter(r => r.id !== readingId),
          total: old.total - 1,
        };
      });
      
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['readings', 'favorites', page], context?.previous);
      toast.error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  // Get card details
  const getCardDetails = (cardId: string) => {
    return allCards?.find(c => c.id === cardId);
  };

  // Filter readings by search query
  const filteredReadings = data?.readings.filter(reading => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const firstCard = reading.cards[0];
    const cardDetails = firstCard ? getCardDetails(firstCard.card_id) : null;
    
    // Search in card name
    if (cardDetails?.nom_fr.toLowerCase().includes(query)) return true;
    
    // Search in keywords
    if (cardDetails?.keywords_fr?.some(k => k.toLowerCase().includes(query))) return true;
    
    // Search in interpretation title/summary
    if (reading.ai_interpretation?.title?.toLowerCase().includes(query)) return true;
    if (reading.ai_interpretation?.summary?.toLowerCase().includes(query)) return true;
    
    // Search in question
    if (reading.question?.toLowerCase().includes(query)) return true;
    
    return false;
  }) || [];

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-destructive">Erreur lors du chargement des favoris</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/30 text-foreground">
              <Star className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Mes Favoris
            </h1>
            <p className="text-muted-foreground">
              Vos tirages marqués comme favoris.
            </p>
          </div>

          {/* Search */}
          {(data?.readings?.length ?? 0) > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par carte, mot-clé, question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Readings List */}
          {filteredReadings.length === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic shadow-soft text-center animate-scale-in">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Aucun favori ne correspond à votre recherche.' 
                  : 'Vous n\'avez pas encore de tirages favoris.'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/new')} 
                  className="mt-4"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Faire un tirage
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReadings.map((reading) => {
                const firstCard = reading.cards[0];
                const cardDetails = firstCard ? getCardDetails(firstCard.card_id) : null;
                
                return (
                  <div
                    key={reading.id}
                    className="p-5 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-md transition-shadow animate-fade-in-up"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/app/lecture/${reading.id}`)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(reading.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {cardDetails && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-medium text-foreground">
                                {cardDetails.nom_fr}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({firstCard?.orientation === 'upright' ? 'Endroit' : 'Renversée'})
                              </span>
                            </>
                          )}
                        </div>
                        
                        {reading.ai_interpretation?.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {reading.ai_interpretation.summary}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite.mutate(reading.id);
                        }}
                        disabled={removeFavorite.isPending}
                        title="Retirer des favoris"
                      >
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {page + 1} sur {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
