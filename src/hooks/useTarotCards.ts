import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TarotCard } from '@/types/tarot';

export function useTarotCards() {
  return useQuery({
    queryKey: ['tarot-cards'],
    queryFn: async (): Promise<TarotCard[]> => {
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr, image_url')
        .order('type')
        .order('numero');

      if (error) throw error;
      
      return data.map(card => ({
        ...card,
        type: card.type as 'major' | 'minor'
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hour - cards don't change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useRandomCard(cards: TarotCard[] | undefined) {
  const drawCard = () => {
    if (!cards || cards.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * cards.length);
    const card = cards[randomIndex];
    const orientation: 'upright' | 'reversed' = Math.random() < 0.5 ? 'upright' : 'reversed';
    
    return {
      card,
      drawnCard: {
        card_id: card.id,
        orientation,
        position_key: 'single'
      }
    };
  };

  return { drawCard };
}
