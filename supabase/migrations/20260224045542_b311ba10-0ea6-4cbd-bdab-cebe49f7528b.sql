
-- Create storage bucket for quote PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-pdfs', 'quote-pdfs', true);

-- Allow anyone to read quote PDFs (public bucket)
CREATE POLICY "Quote PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-pdfs');

-- Allow authenticated admins to upload/manage quote PDFs
CREATE POLICY "Admins can upload quote PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-pdfs' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update quote PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'quote-pdfs' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete quote PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'quote-pdfs' AND public.is_admin(auth.uid()));
