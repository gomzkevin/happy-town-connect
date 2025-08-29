import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuoteHistoryEntry {
  id: string;
  quote_id: string;
  action_type: string;
  recipient: string;
  status: string;
  metadata?: any;
  error_message?: string;
  created_at: string;
}

export const useQuoteHistory = (quoteId?: string) => {
  const {
    data: history,
    isLoading,
    error
  } = useQuery({
    queryKey: ['quote-history', quoteId],
    queryFn: async () => {
      let query = supabase
        .from('quote_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (quoteId) {
        query = query.eq('quote_id', quoteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as QuoteHistoryEntry[];
    },
    enabled: !!quoteId || true, // Enable always for admin view, or when quoteId is provided
  });

  return {
    history,
    isLoading,
    error,
  };
};