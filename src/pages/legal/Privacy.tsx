import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Privacy() {
  return (
    <Layout>
      <SEOHead
        title="Politique de Confidentialité | Tarot Divinatoire"
        description="Politique de confidentialité et protection des données personnelles. RGPD compliant. Vos droits : accès, rectification, effacement, portabilité."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Politique de Confidentialité
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Collecte des données</h2>
            <p className="text-muted-foreground">
              Nous collectons les informations suivantes :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Adresse email (pour l'authentification)</li>
              <li>Historique de vos tirages de tarot</li>
              <li>Préférences utilisateur</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Utilisation des données</h2>
            <p className="text-muted-foreground">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Vous authentifier et sécuriser votre compte</li>
              <li>Personnaliser votre expérience</li>
              <li>Conserver l'historique de vos tirages</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Vos droits (RGPD)</h2>
            <p className="text-muted-foreground">Vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Droit d'accès</strong> : demander une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : modifier vos informations</li>
              <li><strong>Droit à l'effacement</strong> : supprimer votre compte</li>
              <li><strong>Droit à la portabilité</strong> : exporter vos données en JSON</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Exercez ces droits dans votre <Link to="/app/profile" className="text-primary hover:underline">profil</Link>.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Cookies</h2>
            <p className="text-muted-foreground">
              Nous utilisons uniquement des cookies essentiels (authentification). 
              Aucun cookie publicitaire n'est utilisé.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">5. Contact</h2>
            <p className="text-muted-foreground">
              Questions ? Consultez nos <Link to="/legal/imprint" className="text-primary hover:underline">mentions légales</Link>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
