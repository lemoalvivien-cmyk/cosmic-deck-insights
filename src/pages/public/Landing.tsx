import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Stars, Moon, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MysticBackground, BetaBadge, MysticButton, SiteHeader, SiteFooter } from '@/components/mystic';
import { motion, useReducedMotion } from 'framer-motion';

const Landing = () => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const fadeInUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  return (
    <MysticBackground withFiligree className="min-h-screen flex flex-col">
      <SEOHead
        title="Tarot Divinatoire - VERSION BÊTA GRATUITE | Guidance & Introspection"
        description="Découvrez votre avenir avec le Tarot Divinatoire. VERSION BÊTA GRATUITE. Interprétations créées par 30 tarologues professionnels. Guidance, introspection et développement personnel."
        ogTitle="Tarot Divinatoire - VERSION BÊTA GRATUITE"
        ogDescription="Guidance mystique et introspection personnelle. Fait avec le savoir-faire de 30 tarologues professionnels. Essayez gratuitement."
      />
      
      <SiteHeader />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Decorative floating elements */}
          <motion.div 
            className="absolute top-24 left-[10%] opacity-40"
            animate={shouldReduceMotion ? {} : { y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="h-16 w-16 text-mp-brand-violet" />
          </motion.div>
          
          <motion.div 
            className="absolute top-32 right-[15%] opacity-30"
            animate={shouldReduceMotion ? {} : { y: [10, -10, 10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Stars className="h-12 w-12 text-mp-brand-gold" />
          </motion.div>

          <motion.div 
            className="absolute bottom-32 left-[20%] opacity-25"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-8 w-8 text-mp-brand-gold" />
          </motion.div>

          <div className="container mx-auto px-4 py-20 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center space-y-8"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Beta Badge */}
              <motion.div variants={fadeInUp} className="flex justify-center">
                <BetaBadge />
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                variants={fadeInUp}
                className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight text-foreground"
              >
                Découvrez les messages
                <span 
                  className="block bg-gradient-to-r from-mp-brand-violet to-mp-brand-violet2 bg-clip-text text-transparent"
                >
                  de l'univers
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Une expérience de tarot divinatoire unique, guidée par l'intelligence artificielle 
                et le savoir-faire d'une trentaine de tarologues professionnels.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
              >
                {user ? (
                  <Link to="/app">
                    <MysticButton size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                      Accéder à mon espace
                    </MysticButton>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <MysticButton size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                        Commencer votre voyage
                      </MysticButton>
                    </Link>
                    <Link to="/disclaimer">
                      <MysticButton variant="outline" size="lg">
                        En savoir plus
                      </MysticButton>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-mp-bg-800/30" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4 text-foreground">
                Une guidance authentique
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Notre approche combine tradition ancestrale et technologie moderne 
                pour vous offrir une expérience de tarot unique.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Stars,
                  title: "Tirages intuitifs",
                  description: "Choisissez parmi différents types de tirages adaptés à vos questions.",
                  color: "mp-brand-violet"
                },
                {
                  icon: Sparkles,
                  title: "Interprétation IA",
                  description: "Une IA formée par 30 tarologues experts pour des interprétations profondes.",
                  color: "mp-brand-gold"
                },
                {
                  icon: Moon,
                  title: "Journal personnel",
                  description: "Conservez l'historique de vos tirages et suivez votre évolution.",
                  color: "mp-brand-violet2"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className="text-center space-y-4 p-6 rounded-xl mp-glass"
                >
                  <div 
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(var(--${feature.color}) / 0.15)`,
                      color: `hsl(var(--${feature.color}))`
                    }}
                  >
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-2xl mp-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-serif text-xl md:text-2xl text-foreground italic">
                "Fait et développé avec le savoir-faire d'une trentaine de Tarologues professionnels"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-mp-surface-border" />
                <Sparkles className="h-4 w-4 text-mp-brand-gold" />
                <div className="h-px w-12 bg-mp-surface-border" />
              </div>
              <p className="text-sm text-muted-foreground">
                Notre engagement : vous offrir une guidance respectueuse, éthique et véritablement éclairante.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </MysticBackground>
  );
};

export default Landing;
