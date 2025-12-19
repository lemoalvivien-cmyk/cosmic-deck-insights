import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTarotCards, useRandomCard } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Wand2, AlertTriangle, Save, Home } from 'lucide-react';
import { z } from 'zod';
import type { TarotCard as TarotCardType, DrawnCard, TarotInterpretation } from '@/types/tarot';
import { generateFallbackInterpretation, createFallbackForStorage, type FallbackInterpretationData } from '@/utils/tarotFallback';
import { preloadCardBack } from '@/utils/tarotImageHelpers';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';

// Mystic Premium Components
import { MysticBackground, MysticButton, BetaBadge } from '@/components/mystic';
import { StepHeader, TarotCard, TarotGrid, OracleLoader } from '@/components/tarot-ui';

const questionSchema = z.string().max(240, 'La question ne doit pas dépasser 240 caractères').optional();

type Step = 'question' | 'draw' | 'interpretation';
type AIStatus = 'idle' | 'loading' | 'success' | 'unavailable' | 'error';

export default function NewReading() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cards, isLoading: cardsLoading, error: cardsError } = useTarotCards();
  const { drawCard } = useRandomCard(cards);
  
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [drawnCard, setDrawnCard] = useState<{ card: TarotCardType; drawnCard: DrawnCard } | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [interpretation, setInterpretation] = useState<TarotInterpretation | FallbackInterpretationData | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus>('idle');
  const [isSaving, setIsSaving] = useState(false);

  // Preload card back on mount
  useEffect(() => {
    preloadCardBack();
  }, []);

  const validateQuestion = () => {
    const result = questionSchema.safeParse(question);
    if (!result.success) {
      setQuestionError(result.error.errors[0]?.message || 'Question invalide');
      return false;
    }
    setQuestionError(null);
    return true;
  };

  const handleStartDrawing = () => {
    if (!validateQuestion()) return;
    setStep('draw');
  };

  const handleDrawCard = async () => {
    if (!cards || cards.length === 0) {
      toast.error('Impossible de charger les cartes');
      return;
    }

    setIsShuffling(true);
    setIsRevealed(false);
    setAIStatus('idle');
    setInterpretation(null);

    // Simulate shuffle animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = drawCard();
    if (result) {
      setDrawnCard(result);
      setIsShuffling(false);
      
      // Reveal after a short delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsRevealed(true);
    }
  };

  const handleGetInterpretation = async () => {
    if (!drawnCard || !user) return;

    setAIStatus('loading');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/auth');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            spread_id: 'one_card',
            question: question || null,
            cards: [drawnCard.drawnCard],
          }),
        }
      );

      if (response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/auth');
        return;
      }

      // Handle 402 - Credits exhausted
      if (response.status === 402) {
        console.log('AI credits exhausted, using fallback interpretation');
        const fallbackInterp = generateFallbackInterpretation(
          drawnCard.card,
          drawnCard.drawnCard.orientation,
          question
        );
        const fallbackData = createFallbackForStorage(fallbackInterp, 'INSUFFICIENT_BALANCE');
        setInterpretation(fallbackData);
        setAIStatus('unavailable');
        setStep('interpretation');
        toast.warning('Crédits IA épuisés. Une interprétation simplifiée a été générée.', {
          duration: 6000,
        });
        return;
      }

      // Handle 429 - Rate limited
      if (response.status === 429) {
        console.log('Rate limited, using fallback interpretation');
        const fallbackInterp = generateFallbackInterpretation(
          drawnCard.card,
          drawnCard.drawnCard.orientation,
          question
        );
        const fallbackData = createFallbackForStorage(fallbackInterp, 'RATE_LIMITED');
        setInterpretation(fallbackData);
        setAIStatus('unavailable');
        setStep('interpretation');
        toast.warning('Limite quotidienne atteinte. Une interprétation simplifiée a été générée.', {
          duration: 6000,
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'interprétation');
      }

      const data = await response.json();
      setInterpretation(data);
      setAIStatus('success');
      setStep('interpretation');
    } catch (error) {
      console.error('Interpretation error:', error);
      // Fallback on any error
      const fallbackInterp = generateFallbackInterpretation(
        drawnCard.card,
        drawnCard.drawnCard.orientation,
        question
      );
      const fallbackData = createFallbackForStorage(fallbackInterp, 'AI_ERROR');
      setInterpretation(fallbackData);
      setAIStatus('error');
      setStep('interpretation');
      toast.error('Erreur IA. Une interprétation simplifiée a été générée.');
    }
  };

  const handleSaveReading = async () => {
    if (!drawnCard || !interpretation || !user) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('tarot_readings')
        .insert([{
          user_id: user.id,
          spread_id: 'one_card',
          question: question || null,
          cards: JSON.parse(JSON.stringify([drawnCard.drawnCard])),
          ai_interpretation: JSON.parse(JSON.stringify(interpretation)),
          is_favorite: false,
        }])
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Tirage sauvegardé');
      navigate(`/app/reading/${data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep('question');
    setQuestion('');
    setDrawnCard(null);
    setIsRevealed(false);
    setInterpretation(null);
    setAIStatus('idle');
  };

  const isFallbackInterpretation = interpretation && '_meta' in interpretation;

  // Loading state - Full screen OracleLoader
  if (cardsLoading) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="Préparation des arcanes..." />
      </MysticBackground>
    );
  }

  // Error state
  if (cardsError) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 p-8 mp-glass rounded-2xl max-w-md mx-4">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}
          >
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Erreur de chargement
            </h2>
            <p className="text-muted-foreground text-sm">
              Impossible de charger les cartes. Vérifiez votre connexion.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <MysticButton onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </MysticButton>
            <MysticButton variant="outline" onClick={() => navigate('/app')}>
              <Home className="mr-2 h-4 w-4" />
              Retour
            </MysticButton>
          </div>
        </div>
      </MysticBackground>
    );
  }

  // AI Loading state - Full screen
  if (aiStatus === 'loading') {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="L'oracle médite sur votre tirage..." />
      </MysticBackground>
    );
  }

  return (
    <Layout>
      <MysticBackground className="min-h-screen py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Step Header */}
            <StepHeader
              title={
                step === 'question' ? 'Nouveau Tirage' :
                step === 'draw' ? 'Tirez votre carte' :
                'Votre Interprétation'
              }
              subtitle={
                step === 'question' ? 'Concentrez-vous sur votre question et laissez les cartes vous guider.' :
                step === 'draw' ? 'Cliquez sur la carte pour la révéler.' :
                undefined
              }
              currentStep={step === 'question' ? 1 : step === 'draw' ? 2 : 3}
              totalSteps={3}
            />

            {/* Step 1: Question */}
            {step === 'question' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="p-6 rounded-2xl mp-glass space-y-4">
                  <label className="block text-sm font-medium text-foreground">
                    Votre question ou intention (optionnel)
                  </label>
                  <Textarea
                    placeholder="Formulez votre question ou laissez vide pour une guidance générale..."
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      if (questionError) validateQuestion();
                    }}
                    className="min-h-[100px] resize-none bg-background/50 border-mp-surface-border"
                    maxLength={240}
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{questionError && <span className="text-destructive">{questionError}</span>}</span>
                    <span>{question.length}/240</span>
                  </div>
                </div>

                <MysticButton
                  onClick={handleStartDrawing}
                  size="lg"
                  className="w-full"
                  leftIcon={<Wand2 className="h-5 w-5" />}
                >
                  Procéder au tirage
                </MysticButton>
              </div>
            )}

            {/* Step 2: Draw Card */}
            {step === 'draw' && (
              <div className="space-y-8 animate-fade-in-up">
                {question && (
                  <div className="p-4 rounded-xl mp-glass text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Votre question</p>
                    <p className="font-medium text-foreground">{question}</p>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-6">
                  {/* Card Display */}
                  <div className="w-48 md:w-56">
                    {isShuffling ? (
                      <div className="aspect-[2/3] rounded-xl mp-glass flex items-center justify-center">
                        <OracleLoader size="sm" message="" />
                      </div>
                    ) : !drawnCard ? (
                      <TarotCard
                        id="draw-placeholder"
                        name="Tirez une carte"
                        isRevealed={false}
                        onClick={handleDrawCard}
                      />
                    ) : (
                      <TarotCard
                        id={drawnCard.card.id}
                        name={drawnCard.card.nom_fr}
                        imageUrl={drawnCard.card.image_url || undefined}
                        isRevealed={isRevealed}
                        isSelected={isRevealed}
                      />
                    )}
                  </div>

                  {/* Card Name & Orientation */}
                  {drawnCard && isRevealed && (
                    <div className="text-center space-y-2 animate-fade-in-up">
                      <h2 className="font-serif text-2xl font-semibold text-foreground">
                        {drawnCard.card.nom_fr}
                      </h2>
                      <p className="text-muted-foreground">
                        {drawnCard.drawnCard.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {!drawnCard && !isShuffling && (
                      <MysticButton
                        onClick={handleDrawCard}
                        size="lg"
                        className="w-full"
                        leftIcon={<Sparkles className="h-5 w-5" />}
                      >
                        Tirer une carte
                      </MysticButton>
                    )}

                    {drawnCard && isRevealed && (
                      <>
                        <MysticButton
                          onClick={handleGetInterpretation}
                          size="lg"
                          className="w-full"
                          leftIcon={<Wand2 className="h-5 w-5" />}
                        >
                          Recevoir l'interprétation
                        </MysticButton>
                        <MysticButton
                          variant="outline"
                          onClick={handleReset}
                          leftIcon={<RefreshCw className="h-4 w-4" />}
                        >
                          Nouveau tirage
                        </MysticButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interpretation */}
            {step === 'interpretation' && interpretation && drawnCard && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Fallback Warning Banner */}
                {isFallbackInterpretation && (
                  <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      <strong>Interprétation simplifiée</strong> – L'IA est temporairement indisponible 
                      {(interpretation as FallbackInterpretationData)._meta.reason === 'INSUFFICIENT_BALANCE' && ' (crédits épuisés)'}
                      {(interpretation as FallbackInterpretationData)._meta.reason === 'RATE_LIMITED' && ' (limite quotidienne atteinte)'}
                      . Cette interprétation est générée à partir des données de la carte.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Card Display */}
                <div className="flex justify-center">
                  <div className="w-36 md:w-44">
                    <TarotCard
                      id={drawnCard.card.id}
                      name={drawnCard.card.nom_fr}
                      imageUrl={drawnCard.card.image_url || undefined}
                      isRevealed={true}
                      isSelected={true}
                    />
                  </div>
                </div>

                {/* Interpretation */}
                <div className="mp-glass rounded-2xl p-6">
                  <InterpretationDisplay interpretation={interpretation} />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <MysticButton
                    onClick={handleSaveReading}
                    size="lg"
                    isLoading={isSaving}
                    leftIcon={<Save className="h-5 w-5" />}
                  >
                    Sauvegarder ce tirage
                  </MysticButton>
                  <MysticButton
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Nouveau tirage
                  </MysticButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </MysticBackground>
    </Layout>
  );
}
