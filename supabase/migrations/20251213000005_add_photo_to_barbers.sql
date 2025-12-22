-- Add photo_url column to barbers table
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add RLS policies for admins to insert/update/delete barbers
-- Note: These policies will be created only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'barbers' 
    AND policyname = 'Admins can insert barbers'
  ) THEN
    CREATE POLICY "Admins can insert barbers"
    ON public.barbers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'barbers' 
    AND policyname = 'Admins can update barbers'
  ) THEN
    CREATE POLICY "Admins can update barbers"
    ON public.barbers
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'barbers' 
    AND policyname = 'Admins can delete barbers'
  ) THEN
    CREATE POLICY "Admins can delete barbers"
    ON public.barbers
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create storage bucket for barber photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('barbers', 'barbers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for barbers bucket
-- Note: Storage policies need to be created with proper error handling
DO $$
BEGIN
  -- Allow anyone to view photos (public bucket)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view barber photos'
  ) THEN
    CREATE POLICY "Anyone can view barber photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'barbers');
  END IF;

  -- Allow authenticated admins to upload photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload barber photos'
  ) THEN
    CREATE POLICY "Admins can upload barber photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'barbers' 
      AND public.has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;

  -- Allow authenticated admins to update photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update barber photos'
  ) THEN
    CREATE POLICY "Admins can update barber photos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'barbers' 
      AND public.has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;

  -- Allow authenticated admins to delete photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete barber photos'
  ) THEN
    CREATE POLICY "Admins can delete barber photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'barbers' 
      AND public.has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;
END $$;
