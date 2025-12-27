import { useLocale } from "@/i18n";

const Hero = () => {
  const { t } = useLocale();

  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            {t('editorialExperiment')}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-foreground mb-8 text-balance">
            {t('heroTitle')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {t('heroSubtitle')}
          </p>
        </div>
        <div className="editorial-divider mt-16" />
      </div>
    </section>
  );
};

export default Hero;
