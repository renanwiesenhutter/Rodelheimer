import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center bg-primary overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10 text-center px-4">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Tagline */}
          <p className="text-primary-foreground/70 font-body text-sm md:text-base tracking-[0.3em] uppercase mb-6 animate-fade-in">
            Barber Shop Frankfurt
          </p>

          {/* Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Rödelheimer
            <span className="block text-3xl md:text-5xl lg:text-6xl font-medium mt-2">
              Barber Shop
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-primary-foreground/80 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Cortes de alta qualidade em Frankfurt — Walk-in oder Online Termin buchen.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => scrollToSection('#agendar')}
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg font-medium"
            >
              Agendar Corte
            </Button>
            <Button
              onClick={() => scrollToSection('#servicos')}
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-6 text-lg font-medium"
            >
              Ver Serviços
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary-foreground/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
