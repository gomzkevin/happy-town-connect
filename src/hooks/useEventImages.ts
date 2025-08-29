import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventImage {
  id: string;
  event_id?: string;
  image_url: string;
  caption?: string;
  order_index?: number;
  created_at: string;
}

export const useEventImages = (eventId: string) => {
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventImages();
    }
  }, [eventId]);

  const fetchEventImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching event images:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadEventImage = async (file: File, caption?: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      const nextOrderIndex = images.length > 0 ? Math.max(...images.map(img => img.order_index || 0)) + 1 : 0;

      const { error: insertError } = await supabase
        .from('event_images')
        .insert({
          event_id: eventId,
          image_url: publicUrl,
          caption: caption || '',
          order_index: nextOrderIndex
        });

      if (insertError) throw insertError;

      await fetchEventImages();
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading event image:', error);
      throw error;
    }
  };

  return { 
    images, 
    loading, 
    error, 
    refetch: fetchEventImages, 
    uploadImage: uploadEventImage 
  };
};