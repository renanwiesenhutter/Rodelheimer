import { useState, useEffect } from 'react';
import { Scissors, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Service } from '@/components/admin/types';

const ServicesSection = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_combined', false)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } else {
      setServices((data ?? []) as Service[]);
    }
    setLoading(false);
  };

  return (
    <section id="services" className="section-padding bg-secondary">
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
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Lädt...</div>
        ) : services.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            Keine Dienstleistungen verfügbar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={service.id}
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
                
                {service.description && (
                  <p className="text-muted-foreground text-sm font-body">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs">
                  <Clock className="w-4 h-4" />
                  <span>~{service.duration_minutes ?? service.duration_slots * 30} min</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={() => navigate('/booking')}
            className="btn-primary px-12 py-6 text-base font-display rounded-sm"
          >
            Jetzt Termin buchen
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;