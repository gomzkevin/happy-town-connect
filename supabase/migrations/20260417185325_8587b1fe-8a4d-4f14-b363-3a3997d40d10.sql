ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS discount_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0;