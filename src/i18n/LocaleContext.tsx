import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, translations, observationTitles, objectNames, getAmazonDomain } from './translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  translateTitle: (title: string) => string;
  translateObjectName: (name: string) => string;
  amazonDomain: string;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocale] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Use ipapi.co for free IP geolocation
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          
          // Set Italian locale if user is from Italy
          if (countryCode === 'IT') {
            setLocale('it');
          }
        }
      } catch (error) {
        // Silently fail - default to English
        console.log('Geolocation detection failed, defaulting to English');
      } finally {
        setIsLoading(false);
      }
    };

    detectCountry();
  }, []);

  const t = (key: string): string => {
    const localeTranslations = translations[locale];
    return (localeTranslations as Record<string, string>)[key] || key;
  };

  const translateTitle = (title: string): string => {
    const localeTitles = observationTitles[locale];
    return (localeTitles as Record<string, string>)[title] || title;
  };

  const translateObjectName = (name: string): string => {
    const localeNames = objectNames[locale];
    return (localeNames as Record<string, string>)[name] || name;
  };

  const amazonDomain = getAmazonDomain(locale);

  return (
    <LocaleContext.Provider 
      value={{ 
        locale, 
        setLocale, 
        t, 
        translateTitle, 
        translateObjectName, 
        amazonDomain, 
        isLoading 
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
