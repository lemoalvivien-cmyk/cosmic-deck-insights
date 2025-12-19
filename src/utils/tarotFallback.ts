import type { TarotCard, TarotInterpretation } from '@/types/tarot';

/**
 * Génère une interprétation fallback locale à partir des données de la carte
 * Utilisée quand l'IA est indisponible (crédits épuisés, erreur réseau, etc.)
 */
export function generateFallbackInterpretation(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  question?: string
): TarotInterpretation {
  const isReversed = orientation === 'reversed';
  const meaning = isReversed ? card.meaning_reversed_fr : card.meaning_upright_fr;
  const keywords = card.keywords_fr || [];

  const orientationText = isReversed ? 'renversée' : 'à l\'endroit';
  const keywordList = keywords.length > 0 ? keywords.slice(0, 5).join(', ') : 'mystère, introspection';

  // Construire une interprétation simplifiée mais cohérente
  const summary = meaning 
    ? `${card.nom_fr} ${orientationText} vous invite à méditer sur : ${meaning.slice(0, 150)}${meaning.length > 150 ? '...' : ''}`
    : `${card.nom_fr} apparaît ${orientationText}. Mots-clés associés : ${keywordList}. Prenez un moment pour réfléchir à ce que cette carte évoque pour vous.`;

  const generalInterpretation = meaning 
    ? meaning 
    : `La carte ${card.nom_fr} ${orientationText} suggère une période de réflexion. Les thèmes de ${keywordList} sont au centre de votre tirage.`;

  const loveInterpretation = `Dans le domaine affectif, ${card.nom_fr} vous encourage à explorer les aspects de ${keywords[0] || 'connexion'} dans vos relations.`;
  
  const workInterpretation = `Sur le plan professionnel, cette carte suggère de porter attention aux thèmes de ${keywords[1] || keywords[0] || 'évolution'}.`;
  
  const moneyInterpretation = `Concernant les finances, ${card.nom_fr} invite à la réflexion et à l'équilibre.`;

  return {
    title: `${card.nom_fr} – ${isReversed ? 'Renversée' : 'À l\'endroit'}`,
    summary,
    interpretation: {
      general: generalInterpretation,
      love: loveInterpretation,
      work: workInterpretation,
      money: moneyInterpretation,
    },
    advice: [
      `Méditez sur les thèmes de ${keywordList}.`,
      'Notez vos impressions et revenez-y dans quelques jours.',
      'Faites confiance à votre intuition pour interpréter ce message.',
    ],
    reflection_questions: [
      `Que représente ${card.nom_fr} dans votre situation actuelle ?`,
      `Comment les thèmes de ${keywords[0] || 'cette carte'} résonnent-ils avec votre question ?`,
    ],
    safety: {
      medical: 'Ce tirage ne remplace pas un avis médical professionnel.',
      legal: 'Ce tirage ne constitue pas un conseil juridique.',
      financial: 'Ce tirage ne constitue pas un conseil financier.',
    },
  };
}

/**
 * Structure pour stocker une interprétation fallback en DB
 */
export interface FallbackInterpretationData extends TarotInterpretation {
  _meta: {
    source: 'fallback';
    reason: 'INSUFFICIENT_BALANCE' | 'RATE_LIMITED' | 'AI_ERROR' | 'NETWORK_ERROR';
    generated_at: string;
  };
}

export function createFallbackForStorage(
  interpretation: TarotInterpretation,
  reason: FallbackInterpretationData['_meta']['reason']
): FallbackInterpretationData {
  return {
    ...interpretation,
    _meta: {
      source: 'fallback',
      reason,
      generated_at: new Date().toISOString(),
    },
  };
}
