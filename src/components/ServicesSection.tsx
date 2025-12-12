import { Scissors, Clock } from 'lucide-react';

const services = [
  { 
    name: 'Maschinenschnitt', 
    price: '12€', 
    description: 'Haarschnitt mit der Haarschneidemaschine, schnell und glatt',
    time: '~30 min'
  },
  { 
    name: 'Bartrasur', 
    price: '12€', 
    description: 'Bart trimmen und in Form bringen',
    time: '~30 min'
  },
  { 
    name: 'Augenbrauen zupfen', 
    price: '7€', 
    description: 'Augenbrauen schneiden und formen',
    time: '~30 min'
  },
  { 
    name: 'Kurzhaarschnitte für Damen', 
    price: '18€', 
    description: 'Kurzer Damenhaarschnitt',
    time: '~30 min'
  },
  { 
    name: 'Schüler bis 16 Jahre', 
    price: '14€', 
    description: 'Haarschnitte für Schüler bis 16 Jahre, jeden Mittwoch',
    time: '~30 min'
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Our Services
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Dienstleistungen
          </h2>
          <div className="w-20 h-1 bg-foreground mx-auto" />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.name}
              className="group bg-card border border-border rounded-lg p-6 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary rounded-lg">
                  <Scissors className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display text-2xl font-bold text-foreground">
                  {service.price}
                </span>
              </div>
              
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {service.name}
              </h3>
              
              <p className="text-muted-foreground text-sm font-body">
                {service.description}
              </p>
              
              <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs">
                <Clock className="w-4 h-4" />
                <span>{service.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;