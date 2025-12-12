import { Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between py-6 gap-4">
          
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
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

          {/* Copyright */}
          <div className="text-sm text-primary-foreground/70 text-center">
            © {new Date().getFullYear()} Rödelheimer. All rights reserved.
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.tiktok.com/@barbershop60489"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="TikTok"
            >
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/rodelheimerbarbershop/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-7 h-7" />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;