import type { TarotInterpretation } from '@/types/tarot';
import { 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  Heart, 
  Briefcase, 
  Wallet, 
  Info,
  Shield
} from 'lucide-react';

interface InterpretationDisplayProps {
  interpretation: TarotInterpretation;
}

export function InterpretationDisplay({ interpretation }: InterpretationDisplayProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title & Summary */}
      <div className="text-center space-y-3">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          {interpretation.title}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {interpretation.summary}
        </p>
      </div>

      {/* Domain Interpretations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* General */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Général</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {interpretation.interpretation.general}
          </p>
        </div>

        {/* Love */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-aurora-pink" />
            <h3 className="font-serif text-lg font-semibold">Amour</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {interpretation.interpretation.love}
          </p>
        </div>

        {/* Work */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-celestial-blue" />
            <h3 className="font-serif text-lg font-semibold">Travail</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {interpretation.interpretation.work}
          </p>
        </div>

        {/* Money */}
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-mystic-gold" />
            <h3 className="font-serif text-lg font-semibold">Finances</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {interpretation.interpretation.money}
          </p>
        </div>
      </div>

      {/* Advice */}
      {interpretation.advice && interpretation.advice.length > 0 && (
        <div className="p-6 rounded-xl glass-mystic space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-secondary" />
            <h3 className="font-serif text-lg font-semibold">Conseils</h3>
          </div>
          <ul className="space-y-2">
            {interpretation.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reflection Questions */}
      {interpretation.reflection_questions && interpretation.reflection_questions.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-serif text-lg font-semibold">Questions de réflexion</h3>
          </div>
          <ul className="space-y-3">
            {interpretation.reflection_questions.map((question, i) => (
              <li key={i} className="text-foreground italic text-sm">
                "{question}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Disclaimers */}
      <div className="p-5 rounded-xl bg-muted/50 border border-border/50 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-serif text-base font-semibold text-muted-foreground">
            Rappels importants
          </h3>
        </div>
        <div className="grid gap-3 text-xs text-muted-foreground">
          {interpretation.safety.medical && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span><strong>Santé :</strong> {interpretation.safety.medical}</span>
            </div>
          )}
          {interpretation.safety.legal && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span><strong>Juridique :</strong> {interpretation.safety.legal}</span>
            </div>
          )}
          {interpretation.safety.financial && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span><strong>Financier :</strong> {interpretation.safety.financial}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
