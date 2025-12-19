import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Phone, Scissors, User, X } from 'lucide-react';
import type { AppointmentRow } from './types';

interface AppointmentsListProps {
  appointments: AppointmentRow[];
  highlightId: string | null;
  onEdit: (appt: AppointmentRow) => void;
  onCancel: (appt: AppointmentRow) => void;
  onScrollTo: (apptId: string) => void;
}

const AppointmentsList = ({
  appointments,
  highlightId,
  onEdit,
  onCancel,
  onScrollTo,
}: AppointmentsListProps) => {
  const appointmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleAppointmentClick = (appt: AppointmentRow) => {
    const el = appointmentRefs.current[appt.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrollTo(appt.id);
    }
  };

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Keine Termine an diesem Tag.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <div
          key={a.id}
          ref={(el) => {
            appointmentRefs.current[a.id] = el;
          }}
          className={[
            'border rounded-lg p-4 bg-background transition cursor-pointer',
            highlightId === a.id ? 'border-primary ring-2 ring-primary/20' : 'border-border',
          ].join(' ')}
          onClick={() => handleAppointmentClick(a)}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{a.time}</span>

                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  {a.service}
                </span>

                <span className="text-xs text-muted-foreground">
                  ({Math.max(1, a.duration_slots ?? 1) * 30} min)
                </span>
              </div>

              <div className="text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {a.name || '—'}
                </span>

                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {a.phone ? (
                    <a
                      href={`tel:${a.phone}`}
                      className="hover:underline text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(a);
                }}
                className="hidden sm:inline-flex whitespace-nowrap"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(a);
                }}
                className="hidden sm:inline-flex whitespace-nowrap"
              >
                <X className="w-4 h-4 mr-2" />
                Stornieren
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(a);
                }}
                title="Bearbeiten"
                className="sm:hidden"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(a);
                }}
                title="Stornieren"
                className="sm:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;
