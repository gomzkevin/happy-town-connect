import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from './useServices';
import { useToast } from '@/hooks/use-toast';

export const useServiceMutations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createService = async (serviceData: Service) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Servicio creado",
        description: "El servicio se ha creado exitosamente.",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Servicio actualizado",
        description: "El servicio se ha actualizado exitosamente.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Servicio eliminado",
        description: "El servicio se ha eliminado exitosamente.",
      });
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createService,
    updateService,
    deleteService,
    loading
  };
};