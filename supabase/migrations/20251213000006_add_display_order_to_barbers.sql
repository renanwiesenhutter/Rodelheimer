-- Add display_order column to barbers table
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing barbers with sequential order based on current name order
UPDATE public.barbers
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) as row_number
  FROM public.barbers
) AS subquery
WHERE public.barbers.id = subquery.id;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_barbers_display_order ON public.barbers(display_order);
