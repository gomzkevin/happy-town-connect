import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export const useServiceImages = (serviceId?: string) => {
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceImages();
    }
  }, [serviceId]);

  const fetchServiceImages = async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_images')
        .select('*')
        .eq('service_id', serviceId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching service images:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadServiceImage = async (file: File, altText?: string, isPrimary = false) => {
    if (!serviceId) throw new Error('Service ID is required');

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId}_${Date.now()}.${fileExt}`;
      const filePath = `${serviceId}/${fileName}`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      // Save image record to database
      const { data, error: dbError } = await supabase
        .from('service_images')
        .insert({
          service_id: serviceId,
          image_url: publicUrl,
          alt_text: altText,
          is_primary: isPrimary,
          order_index: images.length
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Refresh images list
      await fetchServiceImages();
      
      return data;
    } catch (error: any) {
      console.error('Error uploading service image:', error);
      throw error;
    }
  };

  return { 
    images, 
    loading, 
    error, 
    refetch: fetchServiceImages, 
    uploadImage: uploadServiceImage 
  };
};