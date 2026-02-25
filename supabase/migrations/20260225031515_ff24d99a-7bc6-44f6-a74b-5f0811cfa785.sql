
-- Fase 1: Add pdf_color and pdf_subtitle to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS pdf_color text NOT NULL DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS pdf_subtitle text;

-- Fase 4: Add bank_info to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS bank_info text;
