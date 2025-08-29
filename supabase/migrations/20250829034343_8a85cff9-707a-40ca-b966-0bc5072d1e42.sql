-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('service-images', 'service-images', true),
  ('event-images', 'event-images', true),
  ('gallery-images', 'gallery-images', true);

-- Create storage policies for service images
CREATE POLICY "Public access to service images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

CREATE POLICY "Allow upload of service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'service-images');

-- Create storage policies for event images
CREATE POLICY "Public access to event images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Allow upload of event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images');

-- Create storage policies for gallery images
CREATE POLICY "Public access to gallery images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gallery-images');

CREATE POLICY "Allow upload of gallery images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gallery-images');

-- Create events table for portfolio
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  location TEXT,
  guest_count INTEGER,
  services TEXT[], -- Array of service names
  featured_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to events
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

-- Create service_images table
CREATE TABLE public.service_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_images
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to service images
CREATE POLICY "Service images are viewable by everyone" 
ON public.service_images 
FOR SELECT 
USING (true);

-- Create event_images table for gallery
CREATE TABLE public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_images
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to event images
CREATE POLICY "Event images are viewable by everyone" 
ON public.event_images 
FOR SELECT 
USING (true);

-- Add trigger for updated_at on events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert portfolio data from hardcoded events
INSERT INTO public.events (id, title, description, event_date, location, guest_count, services, featured_image_url, is_featured) VALUES
  (gen_random_uuid(), 'Fiesta de Sofía - Ciudad de Profesiones', 'Una fiesta increíble donde los niños exploraron diferentes profesiones en un ambiente lleno de diversión y aprendizaje.', '2024-10-15', 'Jardín Las Flores, Oaxaca', 25, ARRAY['Chef', 'Arte', 'Belleza', 'Construcción'], 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=300&fit=crop', true),
  (gen_random_uuid(), 'Cumpleaños de Diego - Aventura Creativa', 'Diego y sus amigos vivieron una experiencia única creando música, arte y capturando recuerdos especiales.', '2024-10-08', 'Casa Familiar, Centro Histórico', 18, ARRAY['Música', 'Arte', 'Fotografía'], 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop', true),
  (gen_random_uuid(), 'Fiesta Temática de Emma - Mini Veterinarios', 'Emma cumplió su sueño de ser veterinaria por un día, junto con sus amigos en una experiencia educativa increíble.', '2024-10-02', 'Parque Central, Oaxaca', 22, ARRAY['Veterinario', 'Chef', 'Supermercado'], 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=500&h=300&fit=crop', true),
  (gen_random_uuid(), 'Celebración de Mateo - Constructor por un Día', 'Mateo y sus invitados construyeron proyectos increíbles mientras disfrutaban de una fiesta llena de creatividad.', '2024-09-25', 'Salón de Eventos Villa Real', 30, ARRAY['Construcción', 'Chef', 'Música', 'Fotografía'], 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=300&fit=crop', true),
  (gen_random_uuid(), 'Fiesta Artística de Luna - Pequeños Artistas', 'Luna exploró su lado artístico junto con sus amigos en una celebración llena de color y creatividad.', '2024-09-18', 'Casa de la Cultura, Oaxaca', 20, ARRAY['Arte', 'Música', 'Belleza'], 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500&h=300&fit=crop', true),
  (gen_random_uuid(), 'Fiesta de Alejandro - Mini Chefs', 'Alejandro y sus amigos cocinaron deliciosas recetas y aprendieron sobre alimentación saludable.', '2024-09-12', 'Jardín Privado, Col. Reforma', 16, ARRAY['Chef', 'Supermercado', 'Fotografía'], 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop', true);