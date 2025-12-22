-- Add duration_minutes column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Update existing services: calculate duration_minutes from duration_slots
-- This assumes existing services were created with standard 30-minute slots
UPDATE public.services
SET duration_minutes = duration_slots * 30
WHERE duration_minutes IS NULL;

-- Set NOT NULL constraint after updating existing rows
ALTER TABLE public.services 
ALTER COLUMN duration_minutes SET NOT NULL;
