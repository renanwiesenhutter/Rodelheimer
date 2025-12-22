-- Add display_order column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing services with sequential order based on current name order
UPDATE public.services
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) as row_number
  FROM public.services
) AS subquery
WHERE public.services.id = subquery.id;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(display_order);
