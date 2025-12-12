import { Scissors, Clock } from 'lucide-react';

const services = [
  { name: 'Haarschnitt', price: '12€', description: 'Corte de cabelo clássico com acabamento profissional' },
  { name: 'Maschinenschnitt', price: '7€', description: 'Corte com máquina rápido e preciso' },
  { name: 'Barttrimm', price: '7€', description: 'Aparar e modelar barba' },
  { name: 'Augenbrauen zupfen', price: '5€', description: 'Design de sobrancelhas' },
  { name: 'Kurzhaarschnitte für Damen', price: '12€', description: 'Cortes curtos femininos' },
  { name: 'Mittwoch Rabatt', price: '14€', description: 'Desconto para estudantes até 16 anos (quartas-feiras)' },
];

const ServicesSection = () => {
  return (
    <section id="servicos" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Unsere Leistungen
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Serviços
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
                <span>~20-30 min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
