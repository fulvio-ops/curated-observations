import { useLocale } from "@/i18n";

const Footer = () => {
  const { t } = useLocale();

  return (
    <footer className="py-16">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="editorial-divider mb-12" />
        <div className="text-center space-y-4">
          <p className="font-serif text-lg text-foreground">
            KETOGO
          </p>
          <p className="text-sm text-muted-foreground">
            {t('footerByline')}
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto mt-8">
            {t('footerTagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
