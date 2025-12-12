import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, ArrowLeft, CalendarIcon, User, Phone, Scissors } from 'lucide-react';
import { format, addDays, isSunday } from 'date-fns';
import { de } from 'date-fns/locale';

const services = [
  { name: 'Haarschnitt', price: '12€' },
  { name: 'Maschinenschnitt', price: '7€' },
  { name: 'Barttrimm', price: '7€' },
  { name: 'Augenbrauen zupfen', price: '5€' },
  { name: 'Kurzhaarschnitte für Damen', price: '12€' },
  { name: 'Mittwoch Rabatt', price: '14€' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00'
];

interface Barber {
  id: string;
  name: string;
  services: string[];
}

const BookingSection = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch barbers based on selected service
  useEffect(() => {
    if (selectedService) {
      fetchBarbers();
    }
  }, [selectedService]);

  // Fetch booked slots when date and barber are selected
  useEffect(() => {
    if (selectedDate && selectedBarber) {
      fetchBookedSlots();
    }
  }, [selectedDate, selectedBarber]);

  const fetchBarbers = async () => {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .contains('services', [selectedService]);
    
    if (data && !error) {
      setBarbers(data);
    }
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate || !selectedBarber) return;
    
    const { data, error } = await supabase
      .rpc('get_booked_slots', {
        p_barber: selectedBarber,
        p_date: format(selectedDate, 'yyyy-MM-dd')
      });
    
    if (data && !error) {
      setBookedSlots(data.map((a: { slot_time: string }) => a.slot_time));
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !name || !phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('appointments').insert({
      service: selectedService,
      barber: selectedBarber,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      name: name,
      phone: phone,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível agendar. Tente novamente.",
        variant: "destructive",
      });
    } else {
      setIsSuccess(true);
      toast({
        title: "Sucesso!",
        description: "Seu agendamento foi confirmado.",
      });
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService('');
    setSelectedBarber('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setName('');
    setPhone('');
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <section id="agendar" className="section-padding bg-secondary">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-elevated">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Agendamento Confirmado!
            </h2>
            <div className="text-muted-foreground space-y-2 mb-8">
              <p><strong>Serviço:</strong> {selectedService}</p>
              <p><strong>Barbeiro:</strong> {selectedBarber}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, 'dd/MM/yyyy')}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
            </div>
            <Button onClick={resetForm} className="btn-primary">
              Novo Agendamento
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="agendar" className="section-padding bg-secondary">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Termin buchen
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Agendar Online
          </h2>
          <div className="w-20 h-1 bg-foreground mx-auto" />
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                step >= s ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 className="font-display text-2xl font-semibold text-center mb-8">
                Escolha o Serviço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.name}
                    onClick={() => {
                      setSelectedService(service.name);
                      setStep(2);
                    }}
                    className={`p-6 rounded-lg border-2 text-left transition-all hover:border-primary ${
                      selectedService === service.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{service.name}</span>
                      </div>
                      <span className="font-display text-xl font-bold">{service.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Barber */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h3 className="font-display text-2xl font-semibold text-center mb-8">
                Escolha o Barbeiro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber.name);
                      setStep(3);
                    }}
                    className={`p-6 rounded-lg border-2 text-center transition-all hover:border-primary ${
                      selectedBarber === barber.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <span className="font-display text-lg font-semibold">{barber.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Date and Time */}
          {step === 3 && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h3 className="font-display text-2xl font-semibold text-center mb-8">
                Escolha Data e Horário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="bg-card rounded-lg p-4 border border-border">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || isSunday(date);
                    }}
                    locale={de}
                    className="rounded-md"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {selectedDate 
                      ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: de })
                      : 'Selecione uma data'}
                  </p>
                  {selectedDate && (
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => {
                        const isBooked = bookedSlots.includes(time);
                        return (
                          <button
                            key={time}
                            disabled={isBooked}
                            onClick={() => {
                              setSelectedTime(time);
                              setStep(4);
                            }}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              isBooked
                                ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                                : selectedTime === time
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:border-primary'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact Info */}
          {step === 4 && (
            <div className="animate-fade-in max-w-md mx-auto">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h3 className="font-display text-2xl font-semibold text-center mb-8">
                Seus Dados
              </h3>

              {/* Summary */}
              <div className="bg-card rounded-lg p-4 border border-border mb-6">
                <p className="text-sm text-muted-foreground mb-2">Resumo do agendamento:</p>
                <p className="font-medium">{selectedService} com {selectedBarber}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, 'dd/MM/yyyy')} às {selectedTime}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 XXX XXXXXXXX"
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !name || !phone}
                  className="btn-primary w-full mt-6"
                >
                  {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
