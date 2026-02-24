
-- Add hora_extra column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS hora_extra integer DEFAULT 0;

-- Create public bucket for fonts and icons
INSERT INTO storage.buckets (id, name, public) VALUES ('japitown-assets', 'japitown-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create private bucket for generated quote PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('japitown-quotes', 'japitown-quotes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for japitown-assets: public read
CREATE POLICY "Public read access to japitown-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'japitown-assets');

-- RLS policy for japitown-quotes: admin read
CREATE POLICY "Admins can read japitown-quotes"
ON storage.objects FOR SELECT
USING (bucket_id = 'japitown-quotes' AND public.is_admin(auth.uid()));

-- RLS policy for japitown-quotes: service role upload (edge functions use service role, so this is for admin UI)
CREATE POLICY "Admins can upload japitown-quotes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'japitown-quotes' AND public.is_admin(auth.uid()));

-- RLS policy for japitown-assets: admin upload
CREATE POLICY "Admins can upload japitown-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'japitown-assets' AND public.is_admin(auth.uid()));
