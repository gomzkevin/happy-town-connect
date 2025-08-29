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

  const uploadFeaturedImage = async (file: File, eventId: string) => {
    try {
      setLoading(true);
      
      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${eventId}/featured-${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      // Update event with new featured image URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ featured_image_url: publicUrl })
        .eq('id', eventId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading featured image:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteFeaturedImage = async (eventId: string, imageUrl: string) => {
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

      // Update event to remove featured image URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ featured_image_url: null })
        .eq('id', eventId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error deleting featured image:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    images, 
    loading, 
    error, 
    refetch: fetchEventImages, 
    uploadImage: uploadEventImage,
    uploadFeaturedImage,
    deleteFeaturedImage
  };
};