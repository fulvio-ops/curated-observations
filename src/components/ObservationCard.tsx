interface ObservationCardProps {
  title: string;
  source: string;
  microJudgment?: string;
  date: string;
}

const ObservationCard = ({ title, source, microJudgment, date }: ObservationCardProps) => {
  return (
    <article className="observation-card group cursor-pointer">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">{source}</span>
          <span className="text-border">·</span>
          <time>{date}</time>
        </div>
        <h3 className="font-serif text-xl md:text-2xl font-medium text-foreground leading-snug group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {microJudgment && (
          <p className="micro-judgment mt-2">
            {microJudgment}
          </p>
        )}
      </div>
    </article>
  );
};

export default ObservationCard;
