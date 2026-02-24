import logoFull from "@/assets/icon-voyelux.ico";

const Footer = () => {
  return (
    <footer className="py-16 px-6 md:px-12 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <img src={logoFull} alt="Voyelux One" className="h-28 mb-8 opacity-80" />
          <div className="w-16 h-px bg-gold-gradient mb-8" />
          <p className="body-text text-muted-foreground max-w-md mb-8">
            Curating luxury travel experiences from the United States to every corner of the world.
          </p>
          <div className="flex items-center gap-8 mb-10">
            <a href="#services" className="label-text text-muted-foreground hover:text-primary transition-colors text-[10px]">Services</a>
            <a href="#destinations" className="label-text text-muted-foreground hover:text-primary transition-colors text-[10px]">Destinations</a>
            <a href="#about" className="label-text text-muted-foreground hover:text-primary transition-colors text-[10px]">About</a>
            <a href="#contact" className="label-text text-muted-foreground hover:text-primary transition-colors text-[10px]">Contact</a>
          </div>
          <p className="text-muted-foreground/40 text-xs tracking-wider">
            © 2025 Voyelux One. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
