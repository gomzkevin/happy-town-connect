-- Add location column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN location text;