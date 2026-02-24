
-- Drop existing RESTRICTIVE policies on quotes
DROP POLICY IF EXISTS "Allow public insert to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public read access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public update to quotes" ON public.quotes;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Allow public insert to quotes"
ON public.quotes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to quotes"
ON public.quotes
FOR SELECT
USING (true);

CREATE POLICY "Allow public update to quotes"
ON public.quotes
FOR UPDATE
USING (true);
