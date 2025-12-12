import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsAtTop(window.scrollY === 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🔧 Corrige 100vh no mobile (Android + iOS)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // Normaliza scroll (0 → 1 nos primeiros 400px)
  const progress = Math.min(scrollY / 400, 1);

  return (
    <section
      id="inicio"
      className="
        relative
        min-h-[calc(var(--vh)*100)]
        md:min-h-screen
        flex
        items-center
        justify-center
        overflow-hidden
      "
    >
      {/* Background Image com distorção */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: "url('/images/barbershop.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `
            scale(${1 + progress * 0.15})
            rotate(${progress * 1.5}deg)
          `,
          filter: `
            blur(${progress * 6}px)
            saturate(${1 + progress * 0.6})
            contrast(${1 + progress * 0.4})
          `,
          transition: 'transform 0.1s linear, filter 0.1s linear',
        }}
      />

      {/* Riscos diagonais no scroll */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: progress,
          backgroundImage: `
            repeating-linear-gradient(
              120deg,
              rgba(255,255,255,0.12) 0px,
              rgba(255,255,255,0.12) 2px,
              transparent 2px,
              transparent 20px
            )
          `,
          mixBlendMode: 'overlay',
          transition: 'opacity 0.2s linear',
        }}
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Hero Content */}
      <div className="container-custom relative z-10 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-primary-foreground/70 font-body text-sm md:text-base tracking-[0.3em] uppercase mb-6">
            Based in Frankfurt
          </p>

          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/logo.png"
              alt="Rödelheimer Barber Shop"
              className="w-64 md:w-80 lg:w-96 h-auto"
            />
          </div>

          <p className="text-primary-foreground/80 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Frankfurt’s best cuts — walk-in or book online.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

      {/* Scroll Indicator */}
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