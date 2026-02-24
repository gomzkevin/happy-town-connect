
-- =============================================
-- PHASE 2: Database Schema Evolution for Japitown v2
-- =============================================

-- 1. Evolve services table: dynamic pricing
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS base_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_child integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_participants integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Evolve quotes table: pipeline & tracking
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS followed_up_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS quote_type text NOT NULL DEFAULT 'instant',
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Update status to support full pipeline
-- pending → sent → viewed → follow_up_1 → follow_up_2 → accepted → rejected → expired
COMMENT ON COLUMN public.quotes.status IS 'Pipeline: pending, sent, viewed, follow_up_1, follow_up_2, accepted, rejected, expired';

-- 3. Create quote_follow_ups table
CREATE TABLE IF NOT EXISTS public.quote_follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  follow_up_type text NOT NULL DEFAULT 'automatic',
  channel text NOT NULL DEFAULT 'email',
  message text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  opened_at timestamp with time zone,
  response text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follow-ups viewable by admins"
  ON public.quote_follow_ups FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Follow-ups insertable by system"
  ON public.quote_follow_ups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Follow-ups updatable by admins"
  ON public.quote_follow_ups FOR UPDATE
  USING (is_admin(auth.uid()));

-- 4. Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  event_date date NOT NULL,
  event_time time,
  end_time time,
  location text,
  event_type text NOT NULL DEFAULT 'fiesta',
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  total_amount integer DEFAULT 0,
  deposit_amount integer DEFAULT 0,
  deposit_paid boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar viewable by admins"
  ON public.calendar_events FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Calendar manageable by admins"
  ON public.calendar_events FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 5. Create customer_interactions table (CRM)
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  interaction_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  content text,
  direction text NOT NULL DEFAULT 'outbound',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interactions viewable by admins"
  ON public.customer_interactions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Interactions insertable by system"
  ON public.customer_interactions FOR INSERT
  WITH CHECK (true);

-- 6. Add triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Add useful indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_next_follow_up ON public.quotes(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_quote ON public.quote_follow_ups(quote_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON public.customer_interactions(customer_id);
