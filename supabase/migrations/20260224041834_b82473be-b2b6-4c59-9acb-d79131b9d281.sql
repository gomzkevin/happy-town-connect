
-- Create quote_payments table for individual payment tracking
CREATE TABLE public.quote_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'transferencia',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;

-- Public can insert (for edge functions / frontend)
CREATE POLICY "Payments insertable by anyone"
  ON public.quote_payments FOR INSERT
  WITH CHECK (true);

-- Admins can view
CREATE POLICY "Payments viewable by admins"
  ON public.quote_payments FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can delete (corrections)
CREATE POLICY "Payments deletable by admins"
  ON public.quote_payments FOR DELETE
  USING (is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_quote_payments_quote_id ON public.quote_payments(quote_id);
