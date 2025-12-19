import { User, ChevronDown } from 'lucide-react';
import type { Barber } from './types';

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarber: string;
  onBarberChange: (barber: string) => void;
  loading: boolean;
}

const BarberSelector = ({ barbers, selectedBarber, onBarberChange, loading }: BarberSelectorProps) => {
  return (
    <div className="flex justify-center mb-10">
      <div className="w-full max-w-xl">
        <div className="bg-card border border-border rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <p className="text-xs text-center tracking-[0.18em] uppercase text-muted-foreground mb-2">
                Barbier auswählen
              </p>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                <select
                  value={selectedBarber}
                  onChange={(e) => onBarberChange(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 rounded-xl border border-border bg-background text-foreground
                            appearance-none pl-10 pr-10
                            focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {loading && <option value="">Laden...</option>}
                  {!loading && barbers.length === 0 && <option value="">Kein Barbier</option>}
                  {barbers.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberSelector;
