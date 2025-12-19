export type Barber = { id: string; name: string };

export type AppointmentRow = {
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

export type Service = {
  name: string;
  price: string;
  durationSlots: number;
};
