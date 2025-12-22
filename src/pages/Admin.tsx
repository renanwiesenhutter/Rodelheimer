import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AdminHeader from '@/components/admin/AdminHeader';
import AppointmentsSection from '@/components/admin/AppointmentsSection';
import ServicesSection from '@/components/admin/ServicesSection';
import BarbersSection from '@/components/admin/BarbersSection';
import EditAppointmentModal from '@/components/admin/EditAppointmentModal';
import { timeSlots } from '@/components/admin/constants';
import { toDateKey, getRequiredSlots } from '@/components/admin/utils';
import type { AppointmentRow, Barber } from '@/components/admin/types';

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

  const selectedDateKey = useMemo(
    () => (selectedDate ? toDateKey(selectedDate) : ''),
    [selectedDate]
  );

  const [dayAppointments, setDayAppointments] = useState<AppointmentRow[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // editar
  const [editing, setEditing] = useState<AppointmentRow | null>(null);

  // scroll pro agendamento clicado no grid
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // seção ativa
  const [activeSection, setActiveSection] = useState<'agendamentos' | 'servicos' | 'barbeiros'>('agendamentos');

  /* =========================
     AUTH + ADMIN CHECK
  ========================= */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
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
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      setCheckingAuth(false);
    } else {
      toast({
        title: 'Zugriff verweigert',
        description: 'Sie haben keine Administratorberechtigung.',
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
    const { data, error } = await supabase
      .from('barbers')
      .select('id,name,photo_url,display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    setBarbersLoading(false);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Barbiere konnten nicht geladen werden.',
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

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', dateKey)
      .eq('barber', barberName)
      .order('time', { ascending: true });

    setDayLoading(false);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Termine des Tages konnten nicht geladen werden.',
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
     ACTIONS
  ========================= */
  const cancelAppointment = async (appt: AppointmentRow) => {
    const ok = window.confirm('Diesen Termin stornieren?');
    if (!ok) return;

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', appt.id);

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

  // BLOQUEAR: cria linha blocked (evita duplicado)
  const blockSlot = async (time: string) => {
    if (!selectedDateKey || !selectedBarber) return;

    // evita duplicar bloqueio no mesmo slot
    const { data: exists, error: checkErr } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', selectedDateKey)
      .eq('barber', selectedBarber)
      .eq('time', time)
      .eq('status', 'blocked')
      .maybeSingle();

    if (checkErr) {
      toast({
        title: 'Fehler',
        description: 'Die Sperrung konnte nicht validiert werden.',
        variant: 'destructive',
      });
      return;
    }

    if (exists?.id) return;

    const { error } = await supabase.from('appointments').insert({
      service: 'Zeit gesperrt',
      barber: selectedBarber,
      date: selectedDateKey,
      time,
      duration_slots: 1,
      duration_minutes: 30,
      status: 'blocked',
      name: 'Gesperrt',
      phone: '-',
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Zeit konnte nicht gesperrt werden.',
        variant: 'destructive',
      });
      return;
    }

    refreshDay();
  };

  // DESBLOQUEAR: deleta o appointment blocked daquele slot
  const unblockSlot = async (time: string) => {
    if (!selectedDateKey || !selectedBarber) return;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('date', selectedDateKey)
      .eq('barber', selectedBarber)
      .eq('time', time)
      .eq('status', 'blocked');

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Zeit konnte nicht entsperrt werden.',
        variant: 'destructive',
      });
      return;
    }

    refreshDay();
  };

  const scrollToAppointment = (apptId: string) => {
    setHighlightId(apptId);
    window.setTimeout(() => {
      setHighlightId((cur) => (cur === apptId ? null : cur));
    }, 1600);
  };

  const handleSlotClick = async (time: string) => {
    // Calculate occupancy
    const occupancy: Record<string, { id: string; status: 'booked' | 'blocked' }> = {};
    const active = dayAppointments.filter((a) => (a.status ?? 'booked') !== 'canceled');

    for (const appt of active) {
      const status = (appt.status ?? 'booked') as 'booked' | 'blocked';
      if (status !== 'booked' && status !== 'blocked') continue;

      const slots = getRequiredSlots(
        appt.time,
        Math.max(1, appt.duration_slots ?? 1),
        timeSlots
      );
      slots.forEach((t) => (occupancy[t] = { id: appt.id, status }));
    }

    const hit = occupancy[time];

    if (!hit) {
      await blockSlot(time);
      return;
    }

    if (hit.status === 'blocked') {
      await unblockSlot(time);
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
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveEdit = async (data: {
    service: string;
    barber: string;
    date: string;
    time: string;
    duration_slots: number;
    duration_minutes?: number | null;
    name: string | null;
    phone: string | null;
  }) => {
    if (!editing) return;

    // valida conflito no destino
    let targetDayAppointments = dayAppointments;
    const movingToAnotherDayOrBarber = data.date !== editing.date || data.barber !== editing.barber;

    if (movingToAnotherDayOrBarber) {
      const { data: fetchedData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', data.date)
        .eq('barber', data.barber)
        .order('time', { ascending: true });

      if (error) {
        toast({
          title: 'Fehler',
          description: 'Die Verfügbarkeit am Zielort konnte nicht validiert werden.',
          variant: 'destructive',
        });
        throw error;
      }

      targetDayAppointments = (fetchedData ?? []) as AppointmentRow[];
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

    const required = getRequiredSlots(data.time, Math.max(1, data.duration_slots), timeSlots);
    const fits = required.length === Math.max(1, data.duration_slots);

    const conflict = required.some((t) => {
      const hit = targetOcc[t];
      if (!hit) return false;
      if (hit.id === editing.id) return false;
      return true;
    });

    if (!fits || conflict) {
      toast({
        title: 'Zeitkonflikt',
        description: 'Diese Zeit (oder ein Teil davon) ist bereits belegt.',
        variant: 'destructive',
      });
      throw new Error('Conflito de horário');
    }

    // Buscar o serviço para obter duration_minutes
    let durationMinutes = data.duration_minutes;
    if (!durationMinutes) {
      const { data: serviceData } = await supabase
        .from('services')
        .select('duration_minutes, duration_slots')
        .eq('name', data.service)
        .single();
      
      durationMinutes = serviceData?.duration_minutes ?? (serviceData?.duration_slots ?? 1) * 30;
    }

    const { error: updErr } = await supabase
      .from('appointments')
      .update({
        service: data.service,
        barber: data.barber,
        date: data.date,
        time: data.time,
        duration_slots: Math.max(1, data.duration_slots),
        duration_minutes: durationMinutes,
        name: data.name || null,
        phone: data.phone || null,
      })
      .eq('id', editing.id);

    if (updErr) {
      toast({
        title: 'Fehler',
        description: 'Die Änderungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
      throw updErr;
    }

    if (data.date === selectedDateKey && data.barber === selectedBarber) {
      refreshDay();
    } else {
      const [yy, mm, dd] = data.date.split('-').map(Number);
      const nd = new Date(yy, mm - 1, dd);
      nd.setHours(0, 0, 0, 0);
      setSelectedDate(nd);
      setSelectedBarber(data.barber);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Berechtigungen werden überprüft...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main */}
      <main className="section-padding bg-secondary pt-24">
        <div className="container-custom">
          {activeSection === 'agendamentos' ? (
            <AppointmentsSection
              barbers={barbers}
              selectedBarber={selectedBarber}
              onBarberChange={setSelectedBarber}
              barbersLoading={barbersLoading}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={dayAppointments}
              appointmentsLoading={dayLoading}
              highlightId={highlightId}
              onSlotClick={handleSlotClick}
              onEdit={openEdit}
              onCancel={cancelAppointment}
              onScrollTo={scrollToAppointment}
            />
          ) : activeSection === 'servicos' ? (
            <ServicesSection />
          ) : (
            <BarbersSection />
          )}
        </div>
      </main>

      {/* EDIT MODAL */}
      <EditAppointmentModal
        appointment={editing}
        barbers={barbers}
        selectedDateKey={selectedDateKey}
        dayAppointments={dayAppointments}
        onClose={closeEdit}
        onSave={saveEdit}
      />
    </div>
  );
};

export default Admin;
