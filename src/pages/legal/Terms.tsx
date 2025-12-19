import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Terms() {
  return (
    <Layout>
      <SEOHead
        title="Conditions Générales d'Utilisation | Tarot Divinatoire"
        description="CGU du service Tarot Divinatoire. VERSION BÊTA GRATUITE. Service de guidance et introspection - pas de conseils médicaux, juridiques ou financiers."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Conditions Générales d'Utilisation
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Objet</h2>
            <p className="text-muted-foreground">
              Les présentes CGU régissent l'utilisation du service Tarot Divinatoire, 
              actuellement proposé en version bêta gratuite.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Description du service</h2>
            <p className="text-muted-foreground">
              Tarot Divinatoire est une plateforme de tirage de tarot assisté par IA, 
              conçue pour l'introspection personnelle.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Limitation de responsabilité</h2>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground font-medium">
                IMPORTANT : Les interprétations ne constituent PAS :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Des conseils médicaux</li>
                <li>Des conseils juridiques</li>
                <li>Des conseils financiers</li>
                <li>Des prédictions certaines</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Compte utilisateur</h2>
            <p className="text-muted-foreground">
              Vous êtes responsable de la confidentialité de vos identifiants.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">5. Droit applicable</h2>
            <p className="text-muted-foreground">
              Ces CGU sont régies par le droit français.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
