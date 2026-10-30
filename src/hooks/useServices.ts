import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  base_price?: number;
  hora_extra?: number | null;
  pricing_type?: string;
  category: string;
  icon: string;
  features?: string[];
  duration?: string;
  max_participants?: number;
  age_range?: string;
  space_requirements?: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: unknown) {
      console.error('Error fetching services:', error);
      setError(error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  return { services, loading, error, refetch: fetchServices };
};