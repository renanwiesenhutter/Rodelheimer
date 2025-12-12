import { useState, useEffect } from 'react';
import { Menu, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // passe diese Zahl an, wenn es nur ganz oben verschwinden soll
      setIsAtTop(window.scrollY < 10);

      // optional: wenn wieder ganz oben, mobiles Menü schließen
      if (window.scrollY < 10) setIsMobileMenuOpen(false);
    };

    handleScroll(); // stellt beim Laden den korrekten Zustand sicher
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#inicio', label: 'Startseite' },
    { href: '#servicos', label: 'Services' },
    { href: '#agendar', label: 'Termin buchen' },
    { href: '#galeria', label: 'Galerie' },
    { href: '#contato', label: 'Kontakt' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const isVisible = !isAtTop;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        bg-background/95 backdrop-blur-md shadow-soft
      `}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 px-4 md:px-0">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-3">
            <img
              src="/images/testlogo.png"
              alt="Rödelheimer Barber Shop Logo"
              className="h-11 w-auto"
            />
            <span
              className="text-xl md:text-2xl tracking-widest"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Rödelheimer
            </span>
          </a>

          {/* Desktop-Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA-Button (verschwindet zusammen mit dem Header) */}
          <div className="hidden md:block">
            <Button
              onClick={() => scrollToSection('#agendar')}
              className="btn-primary px-6"
            >
              Jetzt Termin buchen
            </Button>
          </div>

          {/* Mobile-Menü-Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobiles Menü */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border py-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-left px-4 py-3 text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="px-4 pt-4">
              <Button
                onClick={() => scrollToSection('#agendar')}
                className="btn-primary w-full"
              >
                Jetzt Termin buchen
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;