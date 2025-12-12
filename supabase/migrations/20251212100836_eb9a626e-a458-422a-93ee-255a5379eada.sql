-- Create a function to get booked time slots for a specific barber and date
-- This allows checking availability without exposing sensitive appointment data
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_barber text, p_date date)
RETURNS TABLE(slot_time text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT appointments.time AS slot_time
  FROM public.appointments
  WHERE appointments.barber = p_barber
    AND appointments.date = p_date
$$;