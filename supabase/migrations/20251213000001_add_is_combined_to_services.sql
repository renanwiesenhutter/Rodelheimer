-- Add is_combined column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_combined BOOLEAN NOT NULL DEFAULT false;

-- Update existing services to mark combined services
UPDATE public.services 
SET is_combined = true 
WHERE name LIKE '%+%' OR name LIKE '%kombiniert%';
