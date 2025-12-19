import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, isSunday } from 'date-fns';
import { de } from 'date-fns/locale';

interface AppointmentsCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const AppointmentsCalendar = ({ selectedDate, onDateSelect }: AppointmentsCalendarProps) => {
  return (
    <div className="bg-card rounded-lg p-4 border border-border flex justify-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={(date) => isSunday(date)}
        locale={de}
        className="origin-top md:scale-[1.10] lg:scale-[1.15]"
      />
    </div>
  );
};

export const DateDisplay = ({ selectedDate }: { selectedDate: Date | undefined }) => {
  return (
    <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
      <CalendarIcon className="w-4 h-4" />
      {selectedDate
        ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: de })
        : 'Bitte wählen Sie ein Datum'}
    </p>
  );
};

export default AppointmentsCalendar;
