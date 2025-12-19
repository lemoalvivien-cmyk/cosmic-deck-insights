import { Layout } from '@/components/layout/Layout';
import { AlertTriangle, Shield, Heart, MessageCircle } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Disclaimer() {
  return (
    <Layout>
      <SEOHead
        title="À propos du service | Tarot Divinatoire - VERSION BÊTA GRATUITE"
        description="Comprendre ce que le tarot peut et ne peut pas faire. Service de guidance et introspection créé par 30 tarologues professionnels. Pas d'avis médical, juridique ou financier."
        ogTitle="À propos - Tarot Divinatoire"
        ogDescription="Guidance et introspection uniquement. Le tarot ne remplace pas un avis médical, juridique ou financier."
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              À propos de notre service de guidance
            </h1>
            <p className="text-muted-foreground">
              Comprendre ce que le tarot peut et ne peut pas faire
            </p>
          </div>

          {/* What it is */}
          <section className="space-y-6">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border/50 shadow-soft">
              <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="font-serif text-xl font-semibold">Ce que nous proposons</h2>
                <p className="text-muted-foreground">
                  Le Tarot Divinatoire est un <strong>outil d'introspection et de réflexion personnelle</strong>. 
                  Nos tirages et interprétations sont conçus pour vous aider à explorer vos pensées, 
                  émotions et situations sous un angle différent. C'est une invitation à la méditation 
                  et à la compréhension de soi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border/50 shadow-soft">
              <MessageCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="font-serif text-xl font-semibold">Notre approche</h2>
                <p className="text-muted-foreground">
                  Chaque interprétation est générée avec le savoir-faire de plus de 30 tarologues professionnels, 
                  combiné à l'intelligence artificielle. Notre objectif est de vous offrir des perspectives 
                  bienveillantes et constructives pour accompagner votre cheminement personnel.
                </p>
              </div>
            </div>
          </section>

          {/* What it is NOT */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-serif text-xl font-semibold">Ce que nous ne sommes PAS</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
              <p className="font-medium text-foreground">
                Le Tarot Divinatoire ne remplace en aucun cas :
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✕</span>
                  <span className="text-muted-foreground">
                    <strong>Un avis médical</strong> — Pour toute question de santé physique ou mentale, 
                    consultez un médecin ou un professionnel de santé qualifié.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✕</span>
                  <span className="text-muted-foreground">
                    <strong>Un conseil juridique</strong> — Pour des questions légales, 
                    adressez-vous à un avocat ou conseiller juridique.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✕</span>
                  <span className="text-muted-foreground">
                    <strong>Un conseil financier</strong> — Pour vos décisions financières, 
                    consultez un conseiller financier agréé.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✕</span>
                  <span className="text-muted-foreground">
                    <strong>Une prédiction certaine de l'avenir</strong> — Le tarot n'est pas un oracle infaillible. 
                    Votre libre arbitre reste votre meilleur guide.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Responsibility */}
          <section className="p-8 rounded-2xl glass-mystic space-y-4 text-center">
            <h2 className="font-serif text-xl font-semibold">Votre responsabilité</h2>
            <p className="text-muted-foreground">
              En utilisant ce service, vous reconnaissez que les interprétations fournies sont 
              à titre informatif et de divertissement uniquement. Vous êtes seul responsable 
              des décisions que vous prenez dans votre vie. Nous vous encourageons à faire preuve 
              de discernement et à consulter des professionnels qualifiés pour toute décision importante.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
