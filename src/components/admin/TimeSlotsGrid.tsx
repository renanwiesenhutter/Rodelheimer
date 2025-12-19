import { timeSlots } from './constants';
import { getRequiredSlots } from './utils';
import type { AppointmentRow } from './types';

interface TimeSlotsGridProps {
  appointments: AppointmentRow[];
  onSlotClick: (time: string) => void;
  loading: boolean;
}

const TimeSlotsGrid = ({ appointments, onSlotClick, loading }: TimeSlotsGridProps) => {
  // Calculate occupancy map
  const occupancy: Record<
    string,
    { id: string; status: 'booked' | 'blocked'; isHead: boolean; appt: AppointmentRow }
  > = {};

  const active = appointments.filter((a) => (a.status ?? 'booked') !== 'canceled');

  for (const appt of active) {
    const status = (appt.status ?? 'booked') as 'booked' | 'blocked';
    if (status !== 'booked' && status !== 'blocked') continue;

    const slots = getRequiredSlots(appt.time, Math.max(1, appt.duration_slots ?? 1), timeSlots);
    slots.forEach((t, idx) => {
      occupancy[t] = { id: appt.id, status, isHead: idx === 0, appt };
    });
  }

  return (
    <div>
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
              onClick={() => onSlotClick(time)}
              className={cls}
              title={
                isBlocked
                  ? 'Klicken zum Entsperren'
                  : isBooked
                  ? 'Klicken, um zum Termin zu gehen'
                  : 'Klicken zum Sperren'
              }
            >
              {time}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Zeiten werden geladen...
        </p>
      )}
    </div>
  );
};

export default TimeSlotsGrid;
