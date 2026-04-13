ALTER TABLE public.quotes
ADD COLUMN logistics_fee_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN logistics_fee integer NOT NULL DEFAULT 0;