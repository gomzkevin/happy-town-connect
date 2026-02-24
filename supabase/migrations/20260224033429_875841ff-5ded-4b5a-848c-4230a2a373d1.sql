
-- Add payment tracking columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS deposit_amount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_paid integer DEFAULT 0;
