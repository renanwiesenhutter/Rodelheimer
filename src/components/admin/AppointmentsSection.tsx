import { useMemo, useState } from 'react';
import BarberSelector from './BarberSelector';
import AppointmentsCalendar, { DateDisplay } from './AppointmentsCalendar';
import TimeSlotsGrid from './TimeSlotsGrid';
import AppointmentsList from './AppointmentsList';
import type { AppointmentRow, Barber } from './types';

interface AppointmentsSectionProps {
  barbers: Barber[];
  selectedBarber: string;
  onBarberChange: (barber: string) => void;
  barbersLoading: boolean;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  appointments: AppointmentRow[];
  appointmentsLoading: boolean;
  highlightId: string | null;
  onSlotClick: (time: string) => void;
  onEdit: (appt: AppointmentRow) => void;
  onCancel: (appt: AppointmentRow) => void;
  onScrollTo: (apptId: string) => void;
}

const AppointmentsSection = ({
  barbers,
  selectedBarber,
  onBarberChange,
  barbersLoading,
  selectedDate,
  onDateSelect,
  appointments,
  appointmentsLoading,
  highlightId,
  onSlotClick,
  onEdit,
  onCancel,
  onScrollTo,
}: AppointmentsSectionProps) => {
  const bookedToday = useMemo(
    () => appointments.filter((a) => (a.status ?? 'booked') === 'booked'),
    [appointments]
  );

  return (
    <div id="agendamentos" className="scroll-mt-24">
      <div className="text-center mb-12">
        <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
          Appointments
        </p>

        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Termine
        </h2>

        <div className="w-20 h-1 bg-foreground mx-auto" />
      </div>

      <BarberSelector
        barbers={barbers}
        selectedBarber={selectedBarber}
        onBarberChange={onBarberChange}
        loading={barbersLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-8">
        <AppointmentsCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />

        <div>
          <DateDisplay selectedDate={selectedDate} />
          <TimeSlotsGrid
            appointments={appointments}
            onSlotClick={onSlotClick}
            loading={appointmentsLoading}
          />
        </div>
      </div>

      {/* Agendamentos */}
      <div className="mt-10">
        <h3 className="font-display text-xl font-semibold mb-4 text-center">
          Termine des Tages ({bookedToday.length})
        </h3>

        <AppointmentsList
          appointments={bookedToday}
          highlightId={highlightId}
          onEdit={onEdit}
          onCancel={onCancel}
          onScrollTo={onScrollTo}
        />
      </div>
    </div>
  );
};

export default AppointmentsSection;
