import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface QuotePayment {
  id: string;
  quote_id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export const useQuotePayments = (quoteId: string | undefined, refreshKey?: number) => {
  const [payments, setPayments] = useState<QuotePayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!quoteId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('quote_payments')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });
    if (error) console.error('Error fetching payments:', error);
    else setPayments((data || []) as QuotePayment[]);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments, refreshKey]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const addPayment = async (data: { amount: number; payment_method: string; notes?: string }) => {
    if (!quoteId) return false;
    const { error } = await supabase.from('quote_payments').insert({
      quote_id: quoteId,
      amount: data.amount,
      payment_method: data.payment_method,
      notes: data.notes || null,
    });
    if (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el pago', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Pago registrado' });
    await fetchPayments();
    return true;
  };

  const deletePayment = async (paymentId: string) => {
    const { error } = await supabase.from('quote_payments').delete().eq('id', paymentId);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el pago', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Pago eliminado' });
    await fetchPayments();
    return true;
  };

  return { payments, totalPaid, loading, addPayment, deletePayment, refetch: fetchPayments };
};
