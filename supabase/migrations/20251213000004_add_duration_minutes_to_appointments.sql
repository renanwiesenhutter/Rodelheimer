-- Add duration_minutes column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Update existing appointments: get duration_minutes from services table
UPDATE public.appointments a
SET duration_minutes = s.duration_minutes
FROM public.services s
WHERE a.service = s.name
  AND a.duration_minutes IS NULL;

-- For appointments where service name doesn't match, calculate from duration_slots
UPDATE public.appointments
SET duration_minutes = duration_slots * 30
WHERE duration_minutes IS NULL;
