import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const [isAtTop, setIsAtTop] = useState(true);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    handleScroll(); // estado correto ao carregar
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center bg-primary overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Content */}
      <div className="container-custom relative z-10 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-primary-foreground/70 font-body text-sm md:text-base tracking-[0.3em] uppercase mb-6 animate-fade-in">
            Based in Frankfurt
          </p>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl text-primary-foreground mb-6 animate-fade-in-up tracking-widest"
            style={{ fontFamily: 'Bebas Neue, sans-serif', animationDelay: '0.1s' }}
          >
            Rödelheimer
            <span className="block text-3xl md:text-5xl lg:text-6xl mt-2 tracking-wide">
              Barber Shop
            </span>
          </h1>

          <p
            className="text-primary-foreground/80 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Frankfurt’s best cuts — walk-in or book online.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
          <Button
            onClick={() => scrollToSection('#agendar')}
            size="lg"
            className="h-14 bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 text-lg font-medium"
          >
            Termin buchen
          </Button>

          <Button
            onClick={() => scrollToSection('#servicos')}
            size="lg"
            className="
              h-14
              bg-transparent
              border-2 border-primary-foreground
              text-primary-foreground
              hover:bg-primary-foreground
              hover:text-primary
              px-8
              text-lg font-medium
            "
          >
            Services ansehen
          </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (some ao scrollar) */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-300 ${
          isAtTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronDown className="w-8 h-8 text-primary-foreground/50 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;