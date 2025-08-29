import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from './useEvents';
import { useToast } from '@/hooks/use-toast';

export const useEventMutations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createEvent = async (eventData: Omit<Event, 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Evento creado",
        description: "El evento se ha creado exitosamente.",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el evento. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Evento actualizado",
        description: "El evento se ha actualizado exitosamente.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado exitosamente.",
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    loading
  };
};