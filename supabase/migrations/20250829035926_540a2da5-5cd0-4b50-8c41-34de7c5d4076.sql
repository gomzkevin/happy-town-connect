-- Create admin_users table for authorized administrators
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin users can view their own record" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admin users can update their own record" 
ON public.admin_users 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE admin_users.user_id = $1
      AND is_active = true
  )
$$;

-- Update storage policies to require admin access
DROP POLICY IF EXISTS "Service images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Event images are viewable by everyone" ON storage.objects;

CREATE POLICY "Images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('service-images', 'event-images', 'gallery-images'));

CREATE POLICY "Only admins can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'service-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update service images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'service-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete service images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'service-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND public.is_admin(auth.uid()));

-- Update service_images and event_images policies
DROP POLICY IF EXISTS "Service images are viewable by everyone" ON public.service_images;
DROP POLICY IF EXISTS "Event images are viewable by everyone" ON public.event_images;

CREATE POLICY "Service images are viewable by everyone" 
ON public.service_images 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage service images" 
ON public.service_images 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Event images are viewable by everyone" 
ON public.event_images 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage event images" 
ON public.event_images 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add trigger for updating timestamps
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();