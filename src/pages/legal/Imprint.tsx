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
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground">
                [Nom de la société ou du particulier]<br />
                [Adresse]<br />
                [Code postal, Ville]<br />
                [Pays]<br />
                Email : [contact@tarot-divinatoire.com]
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Directeur de la publication</h2>
            <p className="text-muted-foreground">[Nom du directeur de publication]</p>
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
              L'ensemble du contenu est protégé. Toute reproduction non autorisée est interdite.
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
