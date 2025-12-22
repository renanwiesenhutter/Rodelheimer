-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  duration_slots INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create barber_services junction table
CREATE TABLE public.barber_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, service_id)
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
-- Anyone can read services
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

-- Only admins can insert/update/delete services
CREATE POLICY "Admins can insert services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update services"
ON public.services
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for barber_services
-- Anyone can read barber_services
CREATE POLICY "Anyone can view barber_services"
ON public.barber_services
FOR SELECT
USING (true);

-- Only admins can insert/update/delete barber_services
CREATE POLICY "Admins can insert barber_services"
ON public.barber_services
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update barber_services"
ON public.barber_services
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete barber_services"
ON public.barber_services
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial services
INSERT INTO public.services (name, price, description, duration_slots) VALUES
  ('Maschinenschnitt', '12€', 'Haarschnitt mit der Haarschneidemaschine, schnell und glatt', 1),
  ('Bartrasur', '12€', 'Bart trimmen und in Form bringen', 1),
  ('Augenbrauen zupfen', '7€', 'Augenbrauen schneiden und formen', 1),
  ('Kurzhaarschnitte für Damen', '18€', 'Kurzer Damenhaarschnitt', 1),
  ('Schüler bis 16 Jahre', '16€', 'Haarschnitte für Schüler bis 16 Jahre, jeden Mittwoch', 1),
  ('Maschinenschnitt + Bartrasur', '24€', 'Maschinenschnitt kombiniert mit Bartrasur', 2),
  ('Maschinenschnitt + Augenbrauen zupfen', '19€', 'Maschinenschnitt kombiniert mit Augenbrauen zupfen', 2),
  ('Bartrasur + Augenbrauen zupfen', '19€', 'Bartrasur kombiniert mit Augenbrauen zupfen', 2),
  ('Maschinenschnitt + Bartrasur + Augenbrauen zupfen', '31€', 'Komplettservice mit Maschinenschnitt, Bartrasur und Augenbrauen', 3);

-- Associate all services with all existing barbers
INSERT INTO public.barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM public.barbers b
CROSS JOIN public.services s;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
