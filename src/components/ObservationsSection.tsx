import { useLocale } from "@/i18n";
import ObservationCard from "./ObservationCard";

const observations = [
  {
    title: "Man spends three years building spreadsheet to track every meal he's ever eaten",
    source: "Reddit",
    microJudgment: "This exists.",
    date: "Dec 26",
  },
  {
    title: "Town council votes to rename street after local cat who attended every meeting",
    source: "Local news",
    microJudgment: "Democracy works.",
    date: "Dec 25",
  },
  {
    title: "Company introduces mandatory fun training for employees who seem too serious",
    source: "LinkedIn",
    microJudgment: "Someone approved this.",
    date: "Dec 24",
  },
  {
    title: "Study finds people who announce gym plans less likely to go",
    source: "Science",
    microJudgment: "And yet, here we are.",
    date: "Dec 23",
  },
];

const ObservationsSection = () => {
  const { t, translateTitle } = useLocale();

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
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ObservationCard 
                {...observation} 
                title={translateTitle(observation.title)}
                microJudgment={observation.microJudgment ? t(observation.microJudgment) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObservationsSection;
