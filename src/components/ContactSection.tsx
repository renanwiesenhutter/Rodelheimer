import { MapPin, Phone, Clock, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const businessHours = [
  { day: 'Monday', hours: '9:00–19:30' },
  { day: 'Tuesday', hours: '9:00–19:30' },
  { day: 'Wednesday', hours: '9:00–19:30' },
  { day: 'Thursday', hours: '9:00–19:30' },
  { day: 'Friday', hours: '9:00–19:30' },
  { day: 'Saturday', hours: '9:00–19:30' },
  { day: 'Sunday', hours: 'Closed' },
];

const ContactSection = () => {
  return (
    <section id="contato" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Kontakt
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Contato
          </h2>
          <div className="w-20 h-1 bg-foreground mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            {/* Address */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">Endereço</h3>
                <p className="text-muted-foreground">
                  Lorscher Str. 12<br />
                  60489 Frankfurt am Main, Germany
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">Telefone</h3>
                <a 
                  href="tel:+4917662677622" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  +49 176 62677622
                </a>
                <div className="mt-3">
                  <Button asChild className="btn-primary">
                    <a href="tel:+4917662677622">
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar Agora
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">Horário de Funcionamento</h3>
                <div className="space-y-1">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.day}</span>
                      <span className={item.hours === 'Closed' ? 'text-destructive' : 'text-foreground'}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/rodelheimerbarbershop/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@barbershop60489"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Google Maps */}
          <div className="h-[400px] lg:h-full min-h-[400px] rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2556.8965123456789!2d8.6123456!3d50.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bd0ea123456789%3A0x123456789abcdef!2sLorscher%20Str.%2012%2C%2060489%20Frankfurt%20am%20Main%2C%20Germany!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Rödelheimer Barber Shop Location"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
