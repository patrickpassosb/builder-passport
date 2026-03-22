export function Footer() {
  return (
    <footer className="w-full py-12 px-8 border-t border-outline-variant/15 bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto text-sm">
        <div className="space-y-4">
          <div className="text-lg font-bold text-primary font-headline">
            Builder Passport
          </div>
          <p className="text-on-surface-variant/60 leading-relaxed">
            The reputation layer for hackathons. Built on Monad.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-bold text-primary uppercase text-[10px] tracking-widest">
            Ecosystem
          </span>
          <a
            className="text-on-surface-variant/60 hover:text-primary transition-colors"
            href="https://docs.monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Monad Docs
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-bold text-primary uppercase text-[10px] tracking-widest">
            Resources
          </span>
          <a
            className="text-on-surface-variant/60 hover:text-primary transition-colors"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <p className="text-on-surface-variant/60">&copy; 2026 Builder Passport</p>
        </div>
      </div>
    </footer>
  );
}
