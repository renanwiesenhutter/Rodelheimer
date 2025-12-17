import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  ArrowLeft,
  CalendarIcon,
  User,
  Phone,
  Clock,
  X,
  Search,
} from 'lucide-react';
import { format, isSunday } from 'date-fns';
import { de } from 'date-fns/locale';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const SHOP_TZ = 'Europe/Berlin';

// cache simples (24h)
const BARBERS_CACHE_KEY = 'rhb_barbers_cache_v1';
const BARBERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/* =========================
   SERVICES + DURATION (slots de 30min)
========================= */
const services = [
  { name: 'Maschinenschnitt', price: '12€', durationSlots: 1 },
  { name: 'Bartrasur', price: '12€', durationSlots: 1 },
  { name: 'Augenbrauen zupfen', price: '7€', durationSlots: 1 },

  { name: 'Kurzhaarschnitte für Damen', price: '18€', durationSlots: 1 },
  { name: 'Schüler bis 16 Jahre', price: '16€', durationSlots: 1 },

  { name: 'Maschinenschnitt + Bartrasur', price: '24€', durationSlots: 2 },
  { name: 'Maschinenschnitt + Augenbrauen zupfen', price: '19€', durationSlots: 2 },
  { name: 'Bartrasur + Augenbrauen zupfen', price: '19€', durationSlots: 2 },
  { name: 'Maschinenschnitt + Bartrasur + Augenbrauen zupfen', price: '31€', durationSlots: 3 },
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
}

type Mode = 'booking' | 'manage';

type AppointmentRow = {
  id: string;
  service: string;
  barber: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  duration_slots?: number | null;
  status?: string | null;
};

/* =========================
   HELPERS (dates/slots)
========================= */
const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const getShopTodayKey = () => {
  const nowInShop = toZonedTime(new Date(), SHOP_TZ);
  const y = nowInShop.getFullYear();
  const m = pad2(nowInShop.getMonth() + 1);
  const d = pad2(nowInShop.getDate());
  return `${y}-${m}-${d}`;
};

const slotUtcFromKey = (dateKey: string, time: string) => {
  return fromZonedTime(`${dateKey} ${time}:00`, SHOP_TZ);
};

const getRequiredSlots = (startTime: string, durationSlots: number, allSlots: string[]) => {
  const startIndex = allSlots.indexOf(startTime);
  if (startIndex === -1) return [];
  return allSlots.slice(startIndex, startIndex + Math.max(durationSlots, 1));
};

/* =========================
   PHONE HELPERS (libphonenumber-js)
========================= */
const parsePhone = (raw: string) => {
  let v = raw.trim();
  if (!v) return undefined;

  // Se vier "00" (muito comum na Europa), converte para "+"
  if (v.startsWith('00')) v = `+${v.slice(2)}`;

  // Se já tem +, é internacional -> parse direto
  if (v.startsWith('+')) return parsePhoneNumberFromString(v);

  // Se começar com 0, trata como número local alemão (ex.: 0151...)
  if (/^0\d+$/g.test(v)) return parsePhoneNumberFromString(v, 'DE');

  // Se for só dígitos e NÃO começa com 0, assume que é "código do país + número"
  // ex.: 55... => +55..., 49... => +49...
  if (/^\d+$/g.test(v)) return parsePhoneNumberFromString(`+${v}`);

  return undefined;
};

const isValidInternationalPhone = (raw: string) => {
  const pn = parsePhone(raw);
  return !!pn && pn.isValid();
};

const toE164 = (raw: string) => {
  const pn = parsePhone(raw);
  return pn ? pn.number : raw.trim();
};

const BookingSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('booking');

  // booking
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(false);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // manage (my appointments)
  const [managePhone, setManagePhone] = useState('');
  const [manageLoading, setManageLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState<AppointmentRow[]>([]);

  const selectedServiceObj = useMemo(
    () => services.find((s) => s.name === selectedService),
    [selectedService]
  );

  const selectedDurationSlots = selectedServiceObj?.durationSlots ?? 1;
  const selectedDurationMinutes = selectedDurationSlots * 30;

  const selectedDateKey = useMemo(() => {
    if (!selectedDate) return '';
    return toDateKey(selectedDate);
  }, [selectedDate]);

  /* =========================
     PREFETCH BARBERS (uma vez) + CACHE
  ========================= */
  const fetchBarbers = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setBarbersLoading(true);

    const { data, error } = await supabase
      .from('barbers')
      .select('id,name');

    if (!silent) setBarbersLoading(false);

    if (error) return;

    if (data) {
      const mapped = data as Barber[];
      setBarbers(mapped);

      try {
        localStorage.setItem(
          BARBERS_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data: mapped })
        );
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BARBERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; data: Barber[] };
        if (
          parsed?.ts &&
          Array.isArray(parsed.data) &&
          Date.now() - parsed.ts < BARBERS_CACHE_TTL_MS
        ) {
          setBarbers(parsed.data);
          fetchBarbers({ silent: true });
          return;
        }
      }
    } catch {
      // ignore
    }

    fetchBarbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     BOOKED SLOTS
  ========================= */
  useEffect(() => {
    if (mode !== 'booking') return;
    if (selectedDate && selectedBarber) {
      fetchBookedSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDate, selectedBarber]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ✅ Quando entrar no STEP 4, pré-seleciona HOJE (no fuso da barbearia)
  useEffect(() => {
    if (mode !== 'booking') return;
    if (step !== 4) return;
    if (selectedDate) return;

    const todayKey = getShopTodayKey();
    const [yy, mm, dd] = todayKey.split('-').map((x) => Number(x));

    const todayLocal = new Date(yy, mm - 1, dd);
    todayLocal.setHours(0, 0, 0, 0);

    if (!isSunday(todayLocal)) {
      setSelectedDate(todayLocal);
    }
  }, [mode, step, selectedDate]);

  const fetchBookedSlots = async () => {
    if (!selectedDate || !selectedBarber) return;

    const dateKey = toDateKey(selectedDate);

    const { data, error } = await supabase.rpc('get_booked_slots', {
      p_barber: selectedBarber,
      p_date: dateKey,
    });

    if (data && !error) {
      setBookedSlots(data.map((a: { slot_time: string }) => a.slot_time));
    } else {
      setBookedSlots([]);
    }
  };

  /* =========================
     BOOKING SUBMIT (agora no Step 5)
  ========================= */
  const handleConfirmBooking = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie Name und Telefonnummer ein.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidInternationalPhone(phone)) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine gültige Telefonnummer ein.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie Service, Barbier, Datum und Uhrzeit.',
        variant: 'destructive',
      });
      return;
    }

    const required = getRequiredSlots(selectedTime, selectedDurationSlots, timeSlots);
    const doesFitInSchedule = required.length === selectedDurationSlots;
    const hasConflict = required.some((t) => bookedSlots.includes(t));

    const dateKey = toDateKey(selectedDate);
    const startUtc = slotUtcFromKey(dateKey, selectedTime);
    const isPastTime = startUtc.getTime() <= Date.now();

    if (!doesFitInSchedule || hasConflict || isPastTime) {
      toast({
        title: 'Fehler',
        description: 'Dieser Zeitraum ist nicht verfügbar. Bitte wählen Sie eine andere Uhrzeit.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('appointments').insert({
      service: selectedService,
      barber: selectedBarber,
      date: dateKey,
      time: selectedTime,
      duration_slots: selectedDurationSlots,
      name: name.trim(),
      phone: toE164(phone),
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Termin konnte nicht gebucht werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } else {
      setIsSuccess(true);
      toast({
        title: 'Erfolg!',
        description: 'Ihr Termin wurde erfolgreich bestätigt.',
      });
    }
  };

  const resetBookingFlow = () => {
    setMode('booking');
    setStep(1);

    // mantém name/phone preenchidos (melhor UX)
    setSelectedService('');
    setSelectedBarber('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setBookedSlots([]);
    setIsSuccess(false);
  };

  const hardResetAll = () => {
    setMode('booking');
    setStep(1);

    setName('');
    setPhone('');

    setSelectedService('');
    setSelectedBarber('');
    setSelectedDate(undefined);
    setSelectedTime('');

    setBookedSlots([]);
    setIsSuccess(false);

    setManagePhone('');
    setMyAppointments([]);
  };

  /* =========================
     MANAGE: buscar + cancelar
  ========================= */
  const fetchMyAppointments = async () => {
    if (!managePhone.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie Ihre Telefonnummer ein.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidInternationalPhone(managePhone)) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine gültige Telefonnummer ein.',
        variant: 'destructive',
      });
      return;
    }

    const phoneE164 = toE164(managePhone);                 // +5545991453366
    const phoneDigits = phoneE164.replace(/\D/g, '');      // 5545991453366
    setManageLoading(true);

    const q1 = await supabase
      .from('appointments')
      .select('id, service, barber, date, time, duration_slots, status')
      .or(`phone.eq.${phoneE164},phone.eq.${phoneDigits}`)
      .eq('status', 'booked')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (!q1.error && q1.data) {
      setMyAppointments(q1.data as AppointmentRow[]);
      setManageLoading(false);
      return;
    }

    // fallback se status não existir
    const q2 = await supabase
      .from('appointments')
      .select('id, service, barber, date, time, duration_slots')
      .eq('phone', phoneE164)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    setManageLoading(false);

    if (q2.error) {
      toast({
        title: 'Fehler',
        description: 'Termine konnten nicht geladen werden.',
        variant: 'destructive',
      });
      return;
    }

    setMyAppointments((q2.data ?? []) as AppointmentRow[]);
  };

  const cancelAppointment = async (appt: AppointmentRow) => {
    if (!isValidInternationalPhone(managePhone)) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine gültige Telefonnummer ein.',
        variant: 'destructive',
      });
      return;
    }

    const phoneE164 = toE164(managePhone);
    const phoneDigits = phoneE164.replace(/\D/g, '');
    setManageLoading(true);

    const rpc = await supabase.rpc('cancel_appointment', {
      p_id: appt.id,
      p_phone: phoneE164,
    });

    if (!rpc.error && rpc.data === true) {
      setManageLoading(false);
      toast({ title: 'Erfolg!', description: 'Termin wurde storniert.' });
      fetchMyAppointments();
      return;
    }

    // fallback: update direto (se RLS permitir)
    const upd = await supabase
      .from('appointments')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .match({ id: appt.id, phone: phoneE164 });

    setManageLoading(false);

    if (upd.error) {
      toast({
        title: 'Fehler',
        description:
          'Stornierung nicht möglich (DB/RLS).',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Erfolg!', description: 'Termin wurde storniert.' });
    fetchMyAppointments();
  };

  /* =========================
     SUCCESS SCREEN
  ========================= */
  if (isSuccess) {
    return (
      <section id="booking" className="section-padding bg-secondary">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-elevated">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Termin bestätigt!
            </h2>

            <div className="text-muted-foreground space-y-2 mb-8">
              <p><strong>Service:</strong> {selectedService}</p>
              <p><strong>Dauer:</strong> {selectedDurationMinutes} Min</p>
              <p><strong>Barbier:</strong> {selectedBarber}</p>
              <p><strong>Datum:</strong> {selectedDate && format(selectedDate, 'dd.MM.yyyy')}</p>
              <p><strong>Uhrzeit:</strong> {selectedTime}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetBookingFlow} className="btn-primary">
                Neuen Termin buchen
              </Button>

              <Button onClick={() => navigate('/')} variant="outline">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* =========================
     MAIN
  ========================= */
  return (
    <section id="booking" className="section-padding bg-secondary">
      <div className="container-custom">
        {/* 🔙 VOLTAR */}
        <div className="mb-6 mt-[-54px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>

        <div className="text-center mb-12">
          <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
            Book online
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Online buchen
          </h2>
          <div className="w-20 h-1 bg-foreground mx-auto" />
        </div>

        {/* dots só no modo booking */}
        {mode === 'booking' && (
          <div className="flex justify-center gap-2 mb-10">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* =========================
              MODE: MANAGE (Meus agendamentos)
          ========================= */}
          {mode === 'manage' && (
            <div className="animate-fade-in max-w-xl mx-auto">
              <button
                onClick={() => {
                  setMode('booking');
                  setStep(1);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Zurück
              </button>

              <h3 className="font-display text-2xl font-semibold text-center mb-8">
                Meine Termine
              </h3>

              <div className="bg-card rounded-lg p-5 border border-border">
                <label className="block text-sm font-medium mb-2">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={managePhone}
                    onChange={(e) => setManagePhone(e.target.value)}
                    placeholder="+49 XXX XXXXXXXX"
                    className="pl-10"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>

                {managePhone && !isValidInternationalPhone(managePhone) && (
                  <p className="text-xs text-destructive mt-2">
                    Bitte geben Sie eine gültige Telefonnummer ein (mit +Ländercode empfohlen).
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={fetchMyAppointments}
                    disabled={manageLoading || !isValidInternationalPhone(managePhone)}
                    className="btn-primary w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {manageLoading ? 'Lädt...' : 'Suchen'}
                  </Button>

                  <Button
                    onClick={() => {
                      setManagePhone('');
                      setMyAppointments([]);
                    }}
                    variant="outline"
                    className="w-auto"
                    title="Reset"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                {manageLoading ? (
                  <div className="text-center text-muted-foreground">Lädt...</div>
                ) : myAppointments.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Keine Termine gefunden.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAppointments.map((a) => (
                      <div key={a.id} className="bg-card rounded-lg p-5 border border-border">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">{a.service}</p>
                            <p className="text-sm text-muted-foreground">
                              Barbier: {a.barber}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <CalendarIcon className="w-4 h-4" />
                              {a.date} — {a.time}
                            </p>

                            {typeof a.duration_slots === 'number' && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4" />
                                {a.duration_slots * 30} Min
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={() => cancelAppointment(a)}
                            variant="outline"
                            className="shrink-0"
                            disabled={manageLoading}
                          >
                            Stornieren
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <Button onClick={hardResetAll} variant="outline">
                  Zurück zum Start
                </Button>
              </div>
            </div>
          )}

          {/* =========================
              MODE: BOOKING
          ========================= */}
          {mode === 'booking' && (
            <>
              {/* STEP 1: Nome + Telefone primeiro */}
              {step === 1 && (
                <div className="animate-fade-in max-w-md mx-auto">
                  <h3 className="font-display text-2xl font-semibold text-center mb-8">
                    Ihre Daten
                  </h3>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ihr Name"
                          className="pl-10"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Telefon</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+49 XXX XXXXXXXX"
                          className="pl-10"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </div>

                      {phone && !isValidInternationalPhone(phone) && (
                        <p className="text-xs text-destructive mt-2">
                          Bitte geben Sie eine gültige Telefonnummer ein (mit +Ländercode empfohlen).
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        if (!name.trim() || !phone.trim()) {
                          toast({
                            title: 'Fehler',
                            description: 'Bitte geben Sie Name und Telefonnummer ein.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        if (!isValidInternationalPhone(phone)) {
                          toast({
                            title: 'Fehler',
                            description: 'Bitte geben Sie eine gültige Telefonnummer ein.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setStep(2);
                      }}
                      disabled={!name.trim() || !isValidInternationalPhone(phone)}
                      className="btn-primary w-full h-14 mt-2"
                    >
                      Weiter
                    </Button>

                    <button
                      onClick={() => {
                        setMode('manage');
                        setMyAppointments([]);
                        setManagePhone(phone || '');
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 mt-2"
                    >
                      Meine Termine
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Service */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </button>

                  <h3 className="text-xl font-bold mb-6 text-center">
                    Service auswählen
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <button
                        key={service.name}
                        onClick={() => {
                          setSelectedService(service.name);
                          setSelectedBarber('');
                          setSelectedDate(undefined);
                          setSelectedTime('');
                          setBookedSlots([]);
                          setStep(3);
                        }}
                        className="border p-4 rounded-lg text-left transition hover:border-primary"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-foreground font-medium">
                            {service.name}
                          </span>
                          <strong className="text-foreground">
                            {service.price}
                          </strong>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {service.durationSlots * 30} Min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Barbier */}
              {step === 3 && (
                <div className="animate-fade-in">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </button>

                  <h3 className="font-display text-2xl font-semibold text-center mb-8">
                    Barbier auswählen
                  </h3>

                  {barbersLoading && barbers.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      Lädt...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {barbers.map((barber) => (
                        <button
                          key={barber.id}
                          onClick={() => {
                            setSelectedBarber(barber.name);
                            setSelectedDate(undefined);
                            setSelectedTime('');
                            setBookedSlots([]);
                            setStep(4);
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
                  )}
                </div>
              )}

              {/* STEP 4: Data/Hora (sem confirmar aqui) */}
              {step === 4 && (
                <div className="animate-fade-in">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </button>

                  <h3 className="font-display text-2xl font-semibold text-center mb-8">
                    Datum und Uhrzeit auswählen
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-8">
                    <div className="bg-card rounded-lg p-4 border border-border flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d);
                          setSelectedTime('');
                        }}
                        disabled={(date) => {
                          const todayKey = getShopTodayKey();
                          const dateKey = toDateKey(date);
                          return dateKey < todayKey || isSunday(date);
                        }}
                        locale={de}
                        className="origin-top md:scale-[1.10] lg:scale-[1.15]"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {selectedDate
                          ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: de })
                          : 'Bitte wählen Sie ein Datum'}
                      </p>

                      {selectedDate && (
                        <>
                          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Dauer: {selectedDurationMinutes} Min
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((time) => {
                              const required = getRequiredSlots(time, selectedDurationSlots, timeSlots);

                              const doesFitInSchedule = required.length === selectedDurationSlots;
                              const hasConflict = required.some((t) => bookedSlots.includes(t));

                              const dateKey = selectedDateKey || toDateKey(selectedDate);
                              const slotUtc = slotUtcFromKey(dateKey, time);
                              const isPastTime = slotUtc.getTime() <= Date.now();

                              const isUnavailable = !doesFitInSchedule || hasConflict || isPastTime;

                              return (
                                <button
                                  key={time}
                                  disabled={isUnavailable}
                                  onClick={() => {
                                    setSelectedTime(time);
                                    setStep(5); // ✅ vai para a tela de confirmação
                                  }}
                                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                    isUnavailable
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmação (igual antes) */}
              {step === 5 && (
                <div className="animate-fade-in max-w-md mx-auto">
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </button>

                  <h3 className="font-display text-2xl font-semibold text-center mb-8">
                    Bestätigung
                  </h3>

                  <div className="bg-card rounded-lg p-4 border border-border mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Zusammenfassung:</p>
                    <p className="font-medium">{selectedService} mit {selectedBarber}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4" />
                      {selectedDurationMinutes} Min
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedDate && format(selectedDate, 'dd.MM.yyyy')} um {selectedTime}
                    </p>
                  </div>

                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isLoading || !selectedTime}
                    className="btn-primary w-full h-14"
                  >
                    {isLoading ? 'Wird gebucht...' : 'Termin bestätigen'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
