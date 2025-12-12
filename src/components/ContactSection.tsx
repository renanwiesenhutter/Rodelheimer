import { MapPin, Phone, Clock, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const businessHours = [
  { day: 'Montag', hours: '9:00–19:30' },
  { day: 'Dienstag', hours: '9:00–19:30' },
  { day: 'Mittwoch', hours: '9:00–19:30' },
  { day: 'Donnerstag', hours: '9:00–19:30' },
  { day: 'Freitag', hours: '9:00–19:30' },
  { day: 'Samstag', hours: '9:00–19:30' },
  { day: 'Sonntag', hours: 'Geschlossen' },
];

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Contact
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Kontakt
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
                <h3 className="font-display text-lg font-semibold mb-1">Adresse</h3>
                <p className="text-muted-foreground whitespace-normal">
                  Lorscher Str. 12, 60489 Frankfurt am Main, Deutschland
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary-foreground" />
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold mb-1">Telefon</h3>
                <a
                  href="tel:+4917662677622"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  +49 176 62677622
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">
                  Öffnungszeiten
                </h3>
                <div className="space-y-1">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground min-w-[110px]">{item.day}</span>
                      <span
                        className={
                          item.hours === 'Geschlossen'
                            ? 'text-destructive'
                            : 'text-foreground'
                        }
                      >
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps */}
          <div className="h-[400px] lg:h-full min-h-[400px] rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2557.8684140468235!2d8.607627476814201!3d50.12618421065833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bd09e125b9f7d1%3A0x619b816861003fc6!2sR%C3%B6delheimer%20Barber%20Shop!5e0!3m2!1sen!2sbr!4v1765566871530!5m2!1sen!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Rödelheimer Barber Shop – Standort"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;