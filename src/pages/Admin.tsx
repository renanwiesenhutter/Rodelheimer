import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, User, Phone, Scissors, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Appointment {
  id: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  created_at: string;
}

const Admin = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        // Defer Supabase calls
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
        setCheckingAuth(false);
      } else {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchAppointments();
    } else {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão de administrador.",
        variant: "destructive"
      });
      navigate('/');
    }
    setCheckingAuth(false);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (data && !error) {
      setAppointments(data);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const todayAppointments = appointments.filter(
    (a) => a.date === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingAppointments = appointments.filter(
    (a) => a.date > format(new Date(), 'yyyy-MM-dd')
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container-custom flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Painel de Agendamentos</h1>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/">Voltar ao Site</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Carregando agendamentos...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-muted-foreground text-sm mb-1">Hoje</p>
                <p className="font-display text-4xl font-bold">{todayAppointments.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-muted-foreground text-sm mb-1">Próximos</p>
                <p className="font-display text-4xl font-bold">{upcomingAppointments.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-muted-foreground text-sm mb-1">Total</p>
                <p className="font-display text-4xl font-bold">{appointments.length}</p>
              </div>
            </div>

            {/* Today's Appointments */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-6">
                Agendamentos de Hoje
              </h2>
              {todayAppointments.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {todayAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Appointments */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-6">
                Próximos Agendamentos
              </h2>
              {upcomingAppointments.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{format(new Date(appointment.date), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{appointment.time}</span>
        </div>
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-muted-foreground" />
          <span>{appointment.service}</span>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-muted-foreground" />
          <span>{appointment.barber}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Cliente:</span>
          <span className="font-medium">{appointment.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <a href={`tel:${appointment.phone}`} className="text-foreground hover:underline">
            {appointment.phone}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Admin;
