const Hero = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            An editorial experiment
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-foreground mb-8 text-balance">
            The world already produces enough content.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            The problem is not creation, but selection. This is a space for noticing what is worth noticing.
          </p>
        </div>
        <div className="editorial-divider mt-16" />
      </div>
    </section>
  );
};

export default Hero;
