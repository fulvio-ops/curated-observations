import { useLocale } from "@/i18n";
import ObjectCard from "./ObjectCard";

const objects = [
  {
    name: "Banana Slicer (For people who find bananas too challenging)",
    price: "€7.99",
    microJudgment: "Civilization advances.",
  },
  {
    name: "Handerpants (Underwear for your hands)",
    price: "€12.50",
    microJudgment: "Someone needed this.",
  },
  {
    name: "Nicolas Cage Sequin Pillow (Face appears when you rub it)",
    price: "€15.99",
    microJudgment: "Art finds a way.",
  },
];

const ObjectsSection = () => {
  const { t, translateObjectName } = useLocale();

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
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ObjectCard 
                {...object}
                name={translateObjectName(object.name)}
                microJudgment={object.microJudgment ? t(object.microJudgment) : undefined}
              />
            </div>
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
