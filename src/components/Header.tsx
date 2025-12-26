const Header = () => {
  return (
    <header className="py-8 border-b border-border">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-medium tracking-wide text-foreground">
            KETOGO
          </h1>
          <nav className="hidden sm:flex items-center gap-8">
            <a 
              href="#observations" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Observations
            </a>
            <a 
              href="#objects" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Objects
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
