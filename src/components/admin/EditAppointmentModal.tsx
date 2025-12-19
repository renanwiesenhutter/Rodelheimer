import { useEffect, useRef, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CalendarIcon, X } from 'lucide-react';
import { format, isSunday } from 'date-fns';
import { de } from 'date-fns/locale';
import { services, timeSlots } from './constants';
import { toDateKey, getRequiredSlots } from './utils';
import type { AppointmentRow, Barber } from './types';

interface EditAppointmentModalProps {
  appointment: AppointmentRow | null;
  barbers: Barber[];
  selectedDateKey: string;
  dayAppointments: AppointmentRow[];
  onClose: () => void;
  onSave: (data: {
    service: string;
    barber: string;
    date: string;
    time: string;
    duration_slots: number;
    name: string | null;
    phone: string | null;
  }) => Promise<void>;
}

const EditAppointmentModal = ({
  appointment,
  barbers,
  selectedDateKey,
  dayAppointments,
  onClose,
  onSave,
}: EditAppointmentModalProps) => {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const [editService, setEditService] = useState(appointment?.service ?? '');
  const [editBarber, setEditBarber] = useState(appointment?.barber ?? '');
  const [editDate, setEditDate] = useState<Date | undefined>(() => {
    if (!appointment?.date) return undefined;
    const [y, m, d] = appointment.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  });
  const [editTime, setEditTime] = useState(appointment?.time ?? '');
  const [editName, setEditName] = useState(appointment?.name ?? '');
  const [editPhone, setEditPhone] = useState(appointment?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const editServiceObj = useMemo(
    () => services.find((s) => s.name === editService),
    [editService]
  );
  const editDurationSlots = editServiceObj?.durationSlots ?? (appointment?.duration_slots ?? 1);

  useEffect(() => {
    if (!appointment) return;

    setEditService(appointment.service ?? '');
    setEditBarber(appointment.barber ?? '');
    const [y, m, d] = (appointment.date ?? selectedDateKey).split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setHours(0, 0, 0, 0);
    setEditDate(dateObj);
    setEditTime(appointment.time ?? '');
    setEditName(appointment.name ?? '');
    setEditPhone(appointment.phone ?? '');
  }, [appointment, selectedDateKey]);

  useEffect(() => {
    if (!appointment) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    requestAnimationFrame(() => {
      if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [appointment]);

  const handleSave = async () => {
    if (!appointment) return;

    const dateKey = editDate ? toDateKey(editDate) : '';
    if (!editService || !editBarber || !dateKey || !editTime) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        service: editService,
        barber: editBarber,
        date: dateKey,
        time: editTime,
        duration_slots: Math.max(1, editDurationSlots),
        name: editName || null,
        phone: editPhone || null,
      });
      onClose();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div ref={modalScrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="min-h-[100dvh] flex items-start justify-center p-4 sm:p-6">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold">Termin bearbeiten</h3>
              </div>

              <Button variant="ghost" size="icon" onClick={onClose} title="Schließen">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Service</p>
                  <select
                    value={editService}
                    onChange={(e) => setEditService(e.target.value)}
                    className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Auswählen...
                    </option>
                    {services.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.price}) — {s.durationSlots * 30}min
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Barbier</p>
                  <select
                    value={editBarber}
                    onChange={(e) => setEditBarber(e.target.value)}
                    className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Auswählen...
                    </option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uhrzeit</p>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full h-11 pl-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Auswählen...
                    </option>
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Dauer (auto): <strong>{Math.max(1, editDurationSlots) * 30} min</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Kunde</p>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Telefon</p>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+49..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Datum</p>
                <div className="bg-background border border-border rounded-lg p-3 flex justify-center overflow-x-auto">
                  <div className="w-fit mx-auto">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={(date) => isSunday(date)}
                      locale={de}
                      className="w-full origin-top"
                    />
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted-foreground flex items-start gap-2 justify-center">
                  <CalendarIcon className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    {editDate
                      ? format(editDate, 'EEEE, dd MMMM yyyy', { locale: de })
                      : 'Datum auswählen'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;
