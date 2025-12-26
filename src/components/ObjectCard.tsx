interface ObjectCardProps {
  name: string;
  price: string;
  microJudgment?: string;
  imageUrl?: string;
}

const ObjectCard = ({ name, price, microJudgment, imageUrl }: ObjectCardProps) => {
  return (
    <article className="object-card cursor-pointer group">
      {imageUrl && (
        <div className="aspect-square bg-muted mb-4 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      {!imageUrl && (
        <div className="aspect-square bg-muted mb-4 flex items-center justify-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Object</span>
        </div>
      )}
      <div className="space-y-2">
        <h4 className="font-serif text-base font-medium text-foreground leading-snug">
          {name}
        </h4>
        <p className="text-sm text-muted-foreground">
          {price}
        </p>
        {microJudgment && (
          <p className="micro-judgment pt-2 border-t border-border mt-3">
            {microJudgment}
          </p>
        )}
      </div>
    </article>
  );
};

export default ObjectCard;
