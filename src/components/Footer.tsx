import { Scissors, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Scissors className="w-6 h-6" />
            <span className="font-display text-xl font-bold">Rödelheimer Barber Shop</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/rodelheimerbarbershop/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 border border-primary-foreground/30 rounded-lg flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@barbershop60489"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 border border-primary-foreground/30 rounded-lg flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Rödelheimer Barber Shop. Alle Rechte vorbehalten.</p>
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Datenschutz
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
