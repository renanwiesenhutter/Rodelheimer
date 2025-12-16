import { User } from 'lucide-react';

const AboutUsSection = () => {
  return (
    <section id="about" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header – same typography as Services */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            About Us
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Über Uns
          </h2>
          <div className="w-20 h-1 bg-foreground mx-auto" />
        </div>

        {/* About Text – same body font as Services descriptions */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground text-base font-body leading-relaxed">
            Die Barbershop Rödelheimer entstand im Stadtteil Rödelheim in Frankfurt mit der Idee, die Tradition der klassischen Barbershops mit einem modernen und zeitgemäßen Stil zu verbinden. Von Anfang an lag unser Fokus darauf, präzise Haarschnitte, hochwertige Bartpflege und einen persönlichen, professionellen Service anzubieten.

            Im Laufe der Zeit wurde der Rödelheimer Barbershop zu einem festen Bestandteil des Viertels und ist heute bekannt für seine Liebe zum Detail, die angenehme Atmosphäre und das konsequente Streben nach Qualität. Bis heute arbeiten wir mit derselben Leidenschaft wie am ersten Tag und bieten jedem Kunden ein Erlebnis von Vertrauen, Stil und Wohlbefinden.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
