import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Imprint() {
  return (
    <Layout>
      <SEOHead
        title="Mentions Légales | Tarot Divinatoire"
        description="Mentions légales du service Tarot Divinatoire. Éditeur, hébergement et propriété intellectuelle."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Mentions Légales
          </h1>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Éditeur du site</h2>
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">
                ⚠ Section à compléter
              </p>
              <p className="text-muted-foreground text-sm">
                Les coordonnées de l'éditeur du site doivent être renseignées ici conformément 
                à l'article 6 de la loi n° 2004-575 du 21 juin 2004 (LCEN). 
                Cette section sera mise à jour prochainement.
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Directeur de la publication</h2>
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">
                ⚠ Section à compléter
              </p>
              <p className="text-muted-foreground text-sm">
                Le nom du directeur de la publication sera indiqué ici.
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Hébergement</h2>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground">
                Lovable Cloud<br />
                Infrastructure cloud sécurisée
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble du contenu de ce site (textes, images, graphismes, logo, structure) 
              est protégé par le droit d'auteur. Toute reproduction, même partielle, 
              sans autorisation préalable est interdite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">5. Crédits</h2>
            <p className="text-muted-foreground">
              Conception : Tarot Divinatoire<br />
              Expertise : Collectif de 30+ tarologues<br />
              Intelligence artificielle : Lovable AI
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
