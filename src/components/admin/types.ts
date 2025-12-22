export type Barber = {
  id: string;
  name: string;
  photo_url?: string | null;
  display_order?: number | null;
  created_at?: string;
};

export type AppointmentRow = {
  id: string;
  service: string;
  barber: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  duration_slots?: number | null;
  duration_minutes?: number | null;
  status?: string | null; // booked | blocked | canceled
  name?: string | null;
  phone?: string | null;
  created_at?: string | null;
  canceled_at?: string | null;
};

export type Service = {
  id: string;
  name: string;
  price: string;
  description?: string | null;
  duration_slots: number;
  duration_minutes?: number | null;
  is_combined?: boolean | null;
  display_order?: number | null;
  created_at: string;
  updated_at: string;
};

export type BarberService = {
  id: string;
  barber_id: string;
  service_id: string;
  created_at: string;
};
