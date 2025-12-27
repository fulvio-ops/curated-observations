import { useLocale } from "@/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ObservationCard from "./ObservationCard";

interface Observation {
  id: string;
  title_en: string;
  title_it: string | null;
  source: string;
  source_url: string | null;
  micro_judgment_en: string | null;
  micro_judgment_it: string | null;
  published_at: string;
}

// Fallback mock data in case no approved content yet
const fallbackObservations = [
  {
    id: "1",
    title_en: "Man spends three years building spreadsheet to track every meal he's ever eaten",
    title_it: "Uomo passa tre anni a costruire un foglio di calcolo per tracciare ogni pasto mai consumato",
    source: "Reddit",
    source_url: null,
    micro_judgment_en: "This exists.",
    micro_judgment_it: "Questo esiste.",
    published_at: new Date().toISOString(),
  },
  {
    id: "2",
    title_en: "Town council votes to rename street after local cat who attended every meeting",
    title_it: "Il consiglio comunale vota per rinominare una via in onore del gatto locale che ha partecipato a ogni riunione",
    source: "Local news",
    source_url: null,
    micro_judgment_en: "Democracy works.",
    micro_judgment_it: "La democrazia funziona.",
    published_at: new Date().toISOString(),
  },
  {
    id: "3",
    title_en: "Company introduces mandatory fun training for employees who seem too serious",
    title_it: "Azienda introduce formazione obbligatoria sul divertimento per dipendenti che sembrano troppo seri",
    source: "LinkedIn",
    source_url: null,
    micro_judgment_en: "Someone approved this.",
    micro_judgment_it: "Qualcuno ha approvato questo.",
    published_at: new Date().toISOString(),
  },
];

const ObservationsSection = () => {
  const { t, locale } = useLocale();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObservations = async () => {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .eq('approved', true)
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching observations:', error);
        setObservations(fallbackObservations);
      } else if (data && data.length > 0) {
        setObservations(data);
      } else {
        setObservations(fallbackObservations);
      }
      setLoading(false);
    };

    fetchObservations();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getLocalizedTitle = (obs: Observation) => {
    if (locale === 'it' && obs.title_it) return obs.title_it;
    return obs.title_en;
  };

  const getLocalizedJudgment = (obs: Observation) => {
    if (locale === 'it' && obs.micro_judgment_it) return obs.micro_judgment_it;
    return obs.micro_judgment_en || undefined;
  };

  if (loading) {
    return (
      <section id="observations" className="py-16">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center text-muted-foreground">
            {locale === 'it' ? 'Caricamento...' : 'Loading...'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="observations" className="py-16">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-serif text-2xl font-medium text-foreground">
            {t('recentObservations')}
          </h2>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {t('filtered')}
          </span>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {observations.map((observation, index) => (
            <div
              key={observation.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ObservationCard 
                title={getLocalizedTitle(observation)}
                source={observation.source}
                microJudgment={getLocalizedJudgment(observation)}
                date={formatDate(observation.published_at)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObservationsSection;
