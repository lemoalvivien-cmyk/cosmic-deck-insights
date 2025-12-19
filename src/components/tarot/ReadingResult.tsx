import { motion, useReducedMotion } from 'framer-motion';
import { TarotCard as TarotCardUI } from '@/components/tarot-ui/TarotCard';
import { OracleLoader } from '@/components/tarot-ui/OracleLoader';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';
import type { TarotInterpretation, DrawnCard, TarotCard } from '@/types/tarot';

interface ReadingResultProps {
  cards: DrawnCard[];
  interpretation: TarotInterpretation | null;
  allCards: TarotCard[] | undefined;
  isLoading?: boolean;
}

export function ReadingResult({ 
  cards, 
  interpretation, 
  allCards,
  isLoading = false 
}: ReadingResultProps) {
  const shouldReduceMotion = useReducedMotion();

  const getCardDetails = (cardId: string) => {
    return allCards?.find(c => c.id === cardId);
  };

  // Get card data with details
  const enrichedCards = cards.map(drawnCard => {
    const details = getCardDetails(drawnCard.card_id);
    return {
      ...drawnCard,
      details,
    };
  });

  const leftCard = enrichedCards[0];
  const rightCards = enrichedCards.slice(1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          Voici le résultat de votre tirage
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {enrichedCards.map((card, index) => (
            <span
              key={card.card_id}
              className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {card.details?.nom_fr || `Carte ${index + 1}`}
              {card.orientation === 'reversed' && ' (Renversée)'}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Desktop Layout: 1 card left - interpretation center - 2 cards right */}
      {/* Mobile Layout: interpretation first, then cards in horizontal scroll */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">
        {/* Left Card - Hidden on mobile, shown first on desktop */}
        {leftCard && (
          <motion.div
            variants={itemVariants}
            className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start lg:w-1/4 space-y-3"
          >
            <TarotCardUI
              id={leftCard.card_id}
              name={leftCard.details?.nom_fr || ''}
              imageUrl={leftCard.details?.image_url || undefined}
              isRevealed={true}
              isSelected={false}
              isDisabled={false}
            />
            <div className="text-center">
              <p className="font-medium text-foreground">{leftCard.details?.nom_fr}</p>
              <p className="text-sm text-muted-foreground">
                {leftCard.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Center - Interpretation */}
        <motion.div
          variants={itemVariants}
          className="flex-1 lg:w-1/2 order-first lg:order-none"
        >
          {isLoading || !interpretation ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <OracleLoader size="md" message="Interprétation en cours…" />
              <p className="text-muted-foreground text-center">
                L'oracle analyse les énergies de vos cartes...
              </p>
            </div>
          ) : (
            <InterpretationDisplay interpretation={interpretation} />
          )}
        </motion.div>

        {/* Right Cards - Hidden on mobile, shown last on desktop */}
        {rightCards.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start lg:w-1/4 space-y-6"
          >
            {rightCards.map((card) => (
              <div key={card.card_id} className="flex flex-col items-center space-y-3">
                <TarotCardUI
                  id={card.card_id}
                  name={card.details?.nom_fr || ''}
                  imageUrl={card.details?.image_url || undefined}
                  isRevealed={true}
                  isSelected={false}
                  isDisabled={false}
                />
                <div className="text-center">
                  <p className="font-medium text-foreground">{card.details?.nom_fr}</p>
                  <p className="text-sm text-muted-foreground">
                    {card.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Mobile Cards - Horizontal scroll */}
      <motion.div
        variants={itemVariants}
        className="lg:hidden"
      >
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {enrichedCards.map((card) => (
            <div 
              key={card.card_id} 
              className="flex-shrink-0 snap-center flex flex-col items-center space-y-3"
            >
              <TarotCardUI
                id={card.card_id}
                name={card.details?.nom_fr || ''}
                imageUrl={card.details?.image_url || undefined}
                isRevealed={true}
                isSelected={false}
                isDisabled={false}
              />
              <div className="text-center">
                <p className="font-medium text-foreground text-sm">{card.details?.nom_fr}</p>
                <p className="text-xs text-muted-foreground">
                  {card.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
