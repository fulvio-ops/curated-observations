import { useLocale } from "@/i18n";
import ketogoLogo from "@/assets/ketogo-logo.png";
const Header = () => {
  const {
    t
  } = useLocale();
  return <header className="py-8 border-b border-border">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <img alt="KETOGO" className="h-16 md:h-20 brightness-0 dark:brightness-100" src="/lovable-uploads/d2adc3b6-7a94-4dce-8bb9-3b6c7bb09042.png" />
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#observations" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              {t('observations')}
            </a>
            <a href="#objects" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              {t('objects')}
            </a>
          </nav>
        </div>
      </div>
    </header>;
};
export default Header;