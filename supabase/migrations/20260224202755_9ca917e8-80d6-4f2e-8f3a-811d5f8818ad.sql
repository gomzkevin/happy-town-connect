
-- Delete related data for quotes we're removing
DELETE FROM public.quote_services 
WHERE quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

DELETE FROM public.quote_payments 
WHERE quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

DELETE FROM public.quote_history 
WHERE quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

DELETE FROM public.quote_follow_ups 
WHERE quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

DELETE FROM public.customer_interactions 
WHERE quote_id IS NOT NULL 
AND quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

-- Delete the quotes themselves
DELETE FROM public.quotes 
WHERE id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');

-- Also clean up calendar events linked to deleted quotes
DELETE FROM public.calendar_events 
WHERE quote_id IS NOT NULL 
AND quote_id NOT IN ('787f89f6-92b4-48c4-a3e6-305383c39cea', 'eb3ecfd0-a8cf-4f8b-b428-0223de2c49e8');
