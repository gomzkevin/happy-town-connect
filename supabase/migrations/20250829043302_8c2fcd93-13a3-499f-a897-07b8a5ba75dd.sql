-- Enable admin CRUD operations on services table
CREATE POLICY "Admins can manage services" 
ON public.services 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Enable admin CRUD operations on events table  
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Enable admin delete operations on service_images
CREATE POLICY "Admins can delete service images"
ON public.service_images
FOR DELETE
USING (is_admin(auth.uid()));

-- Enable admin delete operations on event_images
CREATE POLICY "Admins can delete event images" 
ON public.event_images
FOR DELETE
USING (is_admin(auth.uid()));