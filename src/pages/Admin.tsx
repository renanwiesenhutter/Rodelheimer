import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { ArrowLeft, CalendarIcon, Clock, LogOut, Pencil, Phone, Scissors, User, X } from 'lucide-react';
import { format, isSunday } from 'date-fns';
import { de } from 'date-fns/locale';

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

// mesmos slots do booking
const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
];

type Barber = { id: string; name: string };

type AppointmentRow = {
  id: string;
  service: string;
  barber: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  duration_slots?: number | null;
  status?: string | null; // booked | blocked | canceled
  name?: string | null;
  phone?: string | null;
  created_at?: string | null;
  canceled_at?: string | null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const getRequiredSlots = (startTime: string, durationSlots: number, allSlots: string[]) => {
  const startIndex = allSlots.indexOf(startTime);
  if (startIndex === -1) return [];
  return allSlots.slice(startIndex, startIndex + Math.max(durationSlots, 1));
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [_user, setUser] = useState<SupabaseUser | null>(null);
  const [_session, setSession] = useState<Session | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const selectedDateKey = useMemo(() => (selectedDate ? toDateKey(selectedDate) : ''), [selectedDate]);

  const [dayAppointments, setDayAppointments] = useState<AppointmentRow[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // editar
  const [editing, setEditing] = useState<AppointmentRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editService, setEditService] = useState<string>('');
  const [editBarber, setEditBarber] = useState<string>('');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');

  const editServiceObj = useMemo(() => services.find((s) => s.name === editService), [editService]);
  const editDurationSlots = editServiceObj?.durationSlots ?? (editing?.duration_slots ?? 1);

  // scroll pro agendamento clicado no grid
  const appointmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // refs do modal para controlar scroll
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     LOCK SCROLL DO BODY QUANDO MODAL ABRE
  ========================= */
  useEffect(() => {
    if (!editing) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    // evita "pulo" de layout quando some a scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    // garante que o modal começa no topo
    requestAnimationFrame(() => {
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [editing]);

  /* =========================
     AUTH + ADMIN CHECK
  ========================= */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      if (!sess?.user) {
        navigate('/auth');
      } else {
        setTimeout(() => checkAdminRole(sess.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      if (!sess?.user) {
        navigate('/auth');
        setCheckingAuth(false);
      } else {
        checkAdminRole(sess.user.id);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();

    if (data) {
      setIsAdmin(true);
      setCheckingAuth(false);
    } else {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão de administrador.',
        variant: 'destructive',
      });
      navigate('/');
      setCheckingAuth(false);
    }
  };

  /* =========================
     BARBERS
  ========================= */
  const fetchBarbers = async () => {
    setBarbersLoading(true);
    const { data, error } = await supabase.from('barbers').select('id,name');
    setBarbersLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os barbeiros.',
        variant: 'destructive',
      });
      return;
    }

    const list = (data ?? []) as Barber[];
    setBarbers(list);

    if (!selectedBarber && list.length > 0) {
      setSelectedBarber(list[0].name);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchBarbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  /* =========================
     DAY APPOINTMENTS
  ========================= */
  const fetchDayAppointments = async (dateKey: string, barberName: string) => {
    if (!dateKey || !barberName) {
      setDayAppointments([]);
      return;
    }

    setDayLoading(true);

    const { data, error } = await supabase.from('appointments').select('*').eq('date', dateKey).eq('barber', barberName).order('time', { ascending: true });

    setDayLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos do dia.',
        variant: 'destructive',
      });
      return;
    }

    setDayAppointments((data ?? []) as AppointmentRow[]);
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (!selectedDateKey || !selectedBarber) return;
    fetchDayAppointments(selectedDateKey, selectedBarber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedDateKey, selectedBarber]);

  const refreshDay = async () => {
    if (!selectedDateKey || !selectedBarber) return;
    await fetchDayAppointments(selectedDateKey, selectedBarber);
  };

  /* =========================
     OCCUPANCY MAP (booked/blocked)
  ========================= */
  const occupancy = useMemo(() => {
    const occ: Record<string, { id: string; status: 'booked' | 'blocked'; isHead: boolean; appt: AppointmentRow }> = {};

    const active = dayAppointments.filter((a) => (a.status ?? 'booked') !== 'canceled');

    for (const appt of active) {
      const status = (appt.status ?? 'booked') as 'booked' | 'blocked';
      if (status !== 'booked' && status !== 'blocked') continue;

      const slots = getRequiredSlots(appt.time, Math.max(1, appt.duration_slots ?? 1), timeSlots);

      slots.forEach((t, idx) => {
        occ[t] = { id: appt.id, status, isHead: idx === 0, appt };
      });
    }

    return occ;
  }, [dayAppointments]);

  /* =========================
     ACTIONS
  ========================= */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const cancelAppointment = async (appt: AppointmentRow) => {
    const ok = window.confirm('Cancelar este agendamento?');
    if (!ok) return;

    const { error } = await supabase.from('appointments').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('id', appt.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar.',
        variant: 'destructive',
      });
      return;
    }

    refreshDay();
  };

  // evita duplicar bloqueio no mesmo slot (latência / double click)
  // Sem toasts de sucesso
  const blockSlot = async (time: string) => {
    if (!selectedDateKey || !selectedBarber) return;

    // já existe bloqueio ativo nesse slot? então não insere de novo
    const { data: existing, error: checkErr } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', selectedDateKey)
      .eq('barber', selectedBarber)
      .eq('time', time)
      .eq('status', 'blocked')
      .maybeSingle();

    if (checkErr) {
      toast({
        title: 'Erro',
        description: 'Não foi possível validar o bloqueio.',
        variant: 'destructive',
      });
      return;
    }

    if (existing?.id) {
      // já está bloqueado
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      service: 'Horário bloqueado',
      barber: selectedBarber,
      date: selectedDateKey,
      time,
      duration_slots: 1,
      status: 'blocked',
      name: 'Bloqueado',
      phone: '-',
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível bloquear o horário.',
        variant: 'destructive',
      });
      return;
    }

    refreshDay();
  };

  // DESBLOQUEIA PELO SLOT (cancela todos os "blocked" duplicados daquele time/date/barber)
  const unblockSlot = async (time: string, apptIdFallback?: string) => {
    if (!selectedDateKey || !selectedBarber) return;

    // 1) tenta cancelar TODOS os bloqueios desse slot (resolve duplicados)
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('date', selectedDateKey)
      .eq('barber', selectedBarber)
      .eq('time', time)
      // aceita casos antigos onde status possa ter vindo null
      .in('status', ['blocked', null])
      .select('id');

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível desbloquear.',
        variant: 'destructive',
      });
      return;
    }

    // Se não atualizou nada, faz fallback por ID (o que você clicou no grid)
    if (!data || data.length === 0) {
      if (!apptIdFallback) {
        toast({
          title: 'Nada para desbloquear',
          description: 'Não encontrei bloqueio ativo para esse horário.',
          variant: 'destructive',
        });
        return;
      }

      const { error: e2 } = await supabase
        .from('appointments')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', apptIdFallback);

      if (e2) {
        toast({
          title: 'Erro',
          description: 'Não foi possível desbloquear (fallback).',
          variant: 'destructive',
        });
        return;
      }
    }

    await refreshDay();
  };

  const scrollToAppointment = (apptId: string) => {
    const el = appointmentRefs.current[apptId];
    if (!el) return;

    setHighlightId(apptId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    window.setTimeout(() => {
      setHighlightId((cur) => (cur === apptId ? null : cur));
    }, 1600);
  };

  const handleSlotClick = async (time: string) => {
    const hit = occupancy[time];

    if (!hit) {
      await blockSlot(time);
      return;
    }

    if (hit.status === 'blocked') {
      await unblockSlot(time, hit.appt.id); // <-- aqui
      return;
    }

    if (hit.status === 'booked') {
      scrollToAppointment(hit.id);
    }
  };

  /* =========================
     EDIT MODAL
  ========================= */
  const openEdit = (appt: AppointmentRow) => {
    setEditing(appt);
    setEditService(appt.service ?? '');
    setEditBarber(appt.barber ?? selectedBarber);

    const [y, m, d] = (appt.date ?? selectedDateKey).split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setHours(0, 0, 0, 0);

    setEditDate(dateObj);
    setEditTime(appt.time ?? '');
    setEditName(appt.name ?? '');
    setEditPhone(appt.phone ?? '');
  };

  const closeEdit = () => {
    setEditing(null);
    setEditSaving(false);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const dateKey = editDate ? toDateKey(editDate) : '';
    if (!editService || !editBarber || !dateKey || !editTime) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha serviço, barbeiro, data e hora.',
        variant: 'destructive',
      });
      return;
    }

    setEditSaving(true);

    // valida conflito no destino
    let targetDayAppointments = dayAppointments;
    const movingToAnotherDayOrBarber = dateKey !== editing.date || editBarber !== editing.barber;

    if (movingToAnotherDayOrBarber) {
      const { data, error } = await supabase.from('appointments').select('*').eq('date', dateKey).eq('barber', editBarber).order('time', { ascending: true });

      if (error) {
        setEditSaving(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível validar disponibilidade no destino.',
          variant: 'destructive',
        });
        return;
      }

      targetDayAppointments = (data ?? []) as AppointmentRow[];
    }

    const targetOcc: Record<string, { id: string; status: string }> = {};
    targetDayAppointments
      .filter((a) => (a.status ?? 'booked') !== 'canceled')
      .forEach((a) => {
        const st = a.status ?? 'booked';
        if (st !== 'booked' && st !== 'blocked') return;
        const slots = getRequiredSlots(a.time, Math.max(1, a.duration_slots ?? 1), timeSlots);
        slots.forEach((t) => (targetOcc[t] = { id: a.id, status: st }));
      });

    const required = getRequiredSlots(editTime, Math.max(1, editDurationSlots), timeSlots);
    const fits = required.length === Math.max(1, editDurationSlots);

    const conflict = required.some((t) => {
      const hit = targetOcc[t];
      if (!hit) return false;
      if (hit.id === editing.id) return false;
      return true;
    });

    if (!fits || conflict) {
      setEditSaving(false);
      toast({
        title: 'Conflito de horário',
        description: 'Esse horário (ou parte dele) já está ocupado.',
        variant: 'destructive',
      });
      return;
    }

    const { error: updErr } = await supabase
      .from('appointments')
      .update({
        service: editService,
        barber: editBarber,
        date: dateKey,
        time: editTime,
        duration_slots: Math.max(1, editDurationSlots),
        name: editName || null,
        phone: editPhone || null,
      })
      .eq('id', editing.id);

    setEditSaving(false);

    if (updErr) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar alterações.',
        variant: 'destructive',
      });
      return;
    }

    if (dateKey === selectedDateKey && editBarber === selectedBarber) {
      refreshDay();
    } else {
      const [yy, mm, dd] = dateKey.split('-').map(Number);
      const nd = new Date(yy, mm - 1, dd);
      nd.setHours(0, 0, 0, 0);
      setSelectedDate(nd);
      setSelectedBarber(editBarber);
    }

    closeEdit();
  };

  /* =========================
     DERIVED
  ========================= */
  const bookedToday = useMemo(() => dayAppointments.filter((a) => (a.status ?? 'booked') === 'booked'), [dayAppointments]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Main */}
      <main className="section-padding bg-secondary">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">Appointments</p>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Agendamentos</h2>

            <div className="w-20 h-1 bg-foreground mx-auto" />
          </div>

          <div className="flex justify-center mb-10">
            <div className="w-full max-w-xl">
              <div className="bg-card border border-border rounded-2xl px-4 py-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-center tracking-[0.18em] uppercase text-muted-foreground mb-2">Barbier auswählen</p>

                    <div className="relative">
                      <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

                      <select
                        value={selectedBarber}
                        onChange={(e) => setSelectedBarber(e.target.value)}
                        disabled={barbersLoading}
                        className="w-full h-11 rounded-xl border border-border bg-background text-foreground pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {barbersLoading && <option value="">Carregando...</option>}
                        {!barbersLoading && barbers.length === 0 && <option value="">Nenhum barbeiro</option>}
                        {barbers.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* (opcional) botões de navegação/logout se você quiser colocar aqui */}
                  {/* <div className="flex gap-2 justify-center sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-8 mt-[-20px]">
            <div className="bg-card rounded-lg p-4 border border-border flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d)}
                disabled={(date) => isSunday(date)}
                locale={de}
                className="origin-top md:scale-[1.10] lg:scale-[1.15]"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: de }) : 'Bitte wählen Sie ein Datum'}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const hit = occupancy[time];
                  const isBooked = hit?.status === 'booked';
                  const isBlocked = hit?.status === 'blocked';

                  const base = 'p-3 rounded-lg border text-sm font-medium transition-all';
                  const freeCls = `border-border bg-card md:hover:border-primary active:border-primary active:bg-primary/5`;
                  const bookedCls = 'border-border bg-muted text-muted-foreground';
                  const blockedCls = 'border-destructive/40 bg-destructive/15 text-destructive';

                  const cls = `${base} ${isBlocked ? blockedCls : isBooked ? bookedCls : freeCls}`;

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSlotClick(time)}
                      className={cls}
                      title={isBlocked ? 'Clique para desbloquear' : isBooked ? 'Clique para ir ao agendamento' : 'Clique para bloquear'}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {dayLoading && <p className="text-xs text-muted-foreground mt-3 text-center">Carregando horários...</p>}
            </div>
          </div>

          {/* Agendamentos */}
          <div className="mt-10">
            <h3 className="font-display text-xl font-semibold mb-4 text-center">Agendamentos do dia ({bookedToday.length})</h3>

            {bookedToday.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento neste dia.</p>
            ) : (
              <div className="space-y-3">
                {bookedToday.map((a) => (
                  <div
                    key={a.id}
                    ref={(el) => {
                      appointmentRefs.current[a.id] = el;
                    }}
                    className={[
                      'border rounded-lg p-4 bg-background transition',
                      highlightId === a.id ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                    ].join(' ')}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-medium">{a.time}</span>

                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            {a.service}
                          </span>

                          <span className="text-xs text-muted-foreground">({Math.max(1, a.duration_slots ?? 1) * 30} min)</span>
                        </div>

                        <div className="text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {a.name || '—'}
                          </span>

                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {a.phone ? (
                              <a href={`tel:${a.phone}`} className="hover:underline text-foreground">
                                {a.phone}
                              </a>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(a)} className="hidden sm:inline-flex whitespace-nowrap">
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => cancelAppointment(a)} className="hidden sm:inline-flex whitespace-nowrap">
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>

                        <Button variant="outline" size="icon" onClick={() => openEdit(a)} title="Editar" className="sm:hidden">
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button variant="outline" size="icon" onClick={() => cancelAppointment(a)} title="Cancelar" className="sm:hidden">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT MODAL (corrigido para mobile: scroll do modal + start topo) */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeEdit} aria-hidden="true" />

          {/* container com scroll próprio */}
          <div ref={modalScrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain">
            <div className="min-h-[100dvh] flex items-start justify-center p-4 sm:p-6">
              <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold">Editar agendamento</h3>
                  </div>

                  <Button variant="ghost" size="icon" onClick={closeEdit} title="Fechar">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Serviço</p>
                      <select
                        value={editService}
                        onChange={(e) => setEditService(e.target.value)}
                        className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        {services.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} ({s.price}) — {s.durationSlots * 30}min
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Barbeiro</p>
                      <select
                        value={editBarber}
                        onChange={(e) => setEditBarber(e.target.value)}
                        className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        {barbers.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Hora</p>
                      <select
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        {timeSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Duração (auto): <strong>{Math.max(1, editDurationSlots) * 30} min</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cliente</p>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Telefone</p>
                        <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+49..." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Data</p>
                    <div className="bg-background border border-border rounded-lg p-3 flex justify-center overflow-x-auto">
                      <div className="w-fit mx-auto">
                        <Calendar
                          mode="single"
                          selected={editDate}
                          onSelect={(d) => setEditDate(d)}
                          disabled={(date) => isSunday(date)}
                          locale={de}
                          className="w-full origin-top"
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground flex items-start gap-2 justify-center">
                      <CalendarIcon className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{editDate ? format(editDate, 'EEEE, dd MMMM yyyy', { locale: de }) : 'Selecione uma data'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                  <Button variant="outline" onClick={closeEdit} disabled={editSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={saveEdit} disabled={editSaving} className="w-full sm:w-auto">
                    {editSaving ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;