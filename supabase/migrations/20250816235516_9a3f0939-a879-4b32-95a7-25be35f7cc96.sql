-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_date DATE,
  children_count INTEGER,
  age_range TEXT,
  child_name TEXT,
  preferences TEXT[],
  total_estimate INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'rejected')),
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'onboarding', 'services')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_services junction table
CREATE TABLE public.quote_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_services ENABLE ROW LEVEL SECURITY;

-- Create policies for customers (public read for now, can be restricted later)
CREATE POLICY "Allow public read access to customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- Create policies for quotes
CREATE POLICY "Allow public read access to quotes" 
ON public.quotes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to quotes" 
ON public.quotes 
FOR UPDATE 
USING (true);

-- Create policies for quote_services
CREATE POLICY "Allow public read access to quote_services" 
ON public.quote_services 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to quote_services" 
ON public.quote_services 
FOR INSERT 
WITH CHECK (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();