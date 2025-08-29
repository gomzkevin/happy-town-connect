import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useImageMutations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteServiceImage = async (imageId: string, imageUrl: string) => {
    try {
      setLoading(true);
      
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const servicePath = urlParts[urlParts.length - 2];
      const filePath = `${servicePath}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('service-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('service_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente.",
      });
    } catch (error: any) {
      console.error('Error deleting service image:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEventImage = async (imageId: string, imageUrl: string) => {
    try {
      setLoading(true);
      
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const eventPath = urlParts[urlParts.length - 2];
      const filePath = `${eventPath}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('event-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('event_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente.",
      });
    } catch (error: any) {
      console.error('Error deleting event image:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateImageOrder = async (imageId: string, newOrder: number, isServiceImage: boolean) => {
    try {
      setLoading(true);
      const table = isServiceImage ? 'service_images' : 'event_images';
      
      const { error } = await supabase
        .from(table)
        .update({ order_index: newOrder })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Orden actualizado",
        description: "El orden de la imagen se ha actualizado.",
      });
    } catch (error: any) {
      console.error('Error updating image order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden. " + error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteServiceImage,
    deleteEventImage,
    updateImageOrder,
    loading
  };
};