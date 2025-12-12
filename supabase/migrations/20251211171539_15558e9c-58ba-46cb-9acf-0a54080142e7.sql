-- Create appointments table for booking system
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  barber TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert appointments (public booking)
CREATE POLICY "Anyone can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read appointments (for admin view - we'll add auth later if needed)
CREATE POLICY "Anyone can view appointments" 
ON public.appointments 
FOR SELECT 
USING (true);

-- Create barbers table
CREATE TABLE public.barbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  services TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view barbers
CREATE POLICY "Anyone can view barbers" 
ON public.barbers 
FOR SELECT 
USING (true);

-- Insert default barbers
INSERT INTO public.barbers (name, services) VALUES
  ('Marco', ARRAY['Haarschnitt', 'Maschinenschnitt', 'Barttrimm', 'Augenbrauen zupfen', 'Kurzhaarschnitte für Damen', 'Mittwoch Rabatt']),
  ('Luis', ARRAY['Haarschnitt', 'Maschinenschnitt', 'Barttrimm', 'Augenbrauen zupfen', 'Kurzhaarschnitte für Damen', 'Mittwoch Rabatt']),
  ('Carlos', ARRAY['Haarschnitt', 'Maschinenschnitt', 'Barttrimm', 'Augenbrauen zupfen']);