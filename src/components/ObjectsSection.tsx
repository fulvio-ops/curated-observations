import { useLocale } from "@/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ObjectCard from "./ObjectCard";

interface ObjectItem {
  id: string;
  name_en: string;
  name_it: string | null;
  price: string;
  amazon_url_com: string | null;
  amazon_url_it: string | null;
  image_url: string | null;
  micro_judgment_en: string | null;
  micro_judgment_it: string | null;
}

// Fallback mock data
const fallbackObjects = [
  {
    id: "1",
    name_en: "Banana Slicer (For people who find bananas too challenging)",
    name_it: "Affettabanane (Per chi trova le banane troppo impegnative)",
    price: "€7.99",
    amazon_url_com: "https://www.amazon.com/s?k=banana+slicer",
    amazon_url_it: "https://www.amazon.it/s?k=affetta+banane",
    image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop",
    micro_judgment_en: "Civilization advances.",
    micro_judgment_it: "La civiltà avanza.",
  },
  {
    id: "2",
    name_en: "Handerpants (Underwear for your hands)",
    name_it: "Mutande per le mani",
    price: "€12.50",
    amazon_url_com: "https://www.amazon.com/s?k=handerpants+hand+underwear",
    amazon_url_it: "https://www.amazon.it/s?k=handerpants+guanti+mutande",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    micro_judgment_en: "Someone needed this.",
    micro_judgment_it: "Qualcuno ne aveva bisogno.",
  },
  {
    id: "3",
    name_en: "Nicolas Cage Sequin Pillow (Face appears when you rub it)",
    name_it: "Cuscino con paillettes di Nicolas Cage (Il volto appare strofinando)",
    price: "€15.99",
    amazon_url_com: "https://www.amazon.com/s?k=nicolas+cage+sequin+pillow",
    amazon_url_it: "https://www.amazon.it/s?k=cuscino+paillettes+nicolas+cage",
    image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    micro_judgment_en: "Art finds a way.",
    micro_judgment_it: "L'arte trova sempre una via.",
  },
];

const ObjectsSection = () => {
  const { t, locale } = useLocale();
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjects = async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching objects:', error);
        setObjects(fallbackObjects);
      } else if (data && data.length > 0) {
        setObjects(data);
      } else {
        setObjects(fallbackObjects);
      }
      setLoading(false);
    };

    fetchObjects();
  }, []);

  const getLocalizedName = (obj: ObjectItem) => {
    if (locale === 'it' && obj.name_it) return obj.name_it;
    return obj.name_en;
  };

  const getLocalizedJudgment = (obj: ObjectItem) => {
    if (locale === 'it' && obj.micro_judgment_it) return obj.micro_judgment_it;
    return obj.micro_judgment_en || undefined;
  };

  const getAmazonUrl = (obj: ObjectItem) => {
    if (locale === 'it' && obj.amazon_url_it) return obj.amazon_url_it;
    return obj.amazon_url_com || undefined;
  };

  if (loading) {
    return (
      <section id="objects" className="py-16 bg-card border-y border-border">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center text-muted-foreground">
            {locale === 'it' ? 'Caricamento...' : 'Loading...'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="objects" className="py-16 bg-card border-y border-border">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-serif text-2xl font-medium text-foreground">
            {t('objectsTitle')}
          </h2>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {t('purchasable')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {objects.map((object, index) => (
            <a
              key={object.id}
              href={getAmazonUrl(object)}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-fade-in block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ObjectCard 
                name={getLocalizedName(object)}
                price={object.price}
                microJudgment={getLocalizedJudgment(object)}
                imageUrl={object.image_url || undefined}
              />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-12 max-w-md mx-auto">
          {t('objectsDisclaimer')}
        </p>
      </div>
    </section>
  );
};

export default ObjectsSection;
