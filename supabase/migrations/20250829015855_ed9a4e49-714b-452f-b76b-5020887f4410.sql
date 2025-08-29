-- Create services table
CREATE TABLE public.services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  duration TEXT DEFAULT '2 horas',
  max_participants INTEGER DEFAULT 8,
  age_range TEXT DEFAULT '4-12 años',
  space_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Services are viewable by everyone" 
ON public.services 
FOR SELECT 
USING (true);

-- Insert the current services data
INSERT INTO public.services (id, title, description, price, category, icon, features, duration, max_participants, age_range, space_requirements) VALUES
('boliche', 'Boliche', 'Diversión garantizada con pistas de boliche adaptadas para niños, con pelotas ligeras y pines coloridos.', '$150', 'Estaciones de Juego', 'Zap', ARRAY['Pistas adaptadas para niños', 'Pelotas ligeras y seguras', 'Pines coloridos', 'Sistema de puntuación simple'], '45 minutos', 6, '5-12 años', 'Espacio amplio de 4x2 metros'),
('pesca', 'Pesca', 'Experiencia de pesca simulada con estanque portátil, cañas de pescar seguras y peces de juguete.', '$120', 'Estaciones de Juego', 'Fish', ARRAY['Estanque portátil', 'Cañas de pescar seguras', 'Peces de colores', 'Premios por participar'], '30 minutos', 8, '3-10 años', 'Espacio de 3x3 metros'),
('guarderia', 'Guardería', 'Área especial para los más pequeños con juguetes seguros, colchonetas y supervisión especializada.', '$100', 'Estaciones de Juego', 'Baby', ARRAY['Supervisión especializada', 'Juguetes seguros', 'Área de descanso', 'Colchonetas suaves'], '2 horas', 6, '1-4 años', 'Espacio cerrado y seguro'),
('hamburgueseria', 'Hamburguesería', 'Estación culinaria donde los niños pueden preparar sus propias hamburguesas con ingredientes seguros.', '$180', 'Gastronomía', 'Beef', ARRAY['Ingredientes frescos y seguros', 'Utensilios adaptados', 'Delantales personalizados', 'Recetas fáciles'], '45 minutos', 6, '5-12 años', 'Acceso a cocina o área limpia'),
('spa', 'Spa', 'Experiencia de relajación con tratamientos faciales suaves, manicure para niños y ambiente tranquilo.', '$200', 'Servicios Profesionales', 'Sparkles', ARRAY['Tratamientos faciales suaves', 'Manicure para niños', 'Ambiente relajante', 'Productos naturales'], '1 hora', 4, '6-12 años', 'Área tranquila con agua'),
('caballetes', 'Caballetes', 'Taller de pintura con caballetes individuales, pinceles, pinturas y lienzos para crear obras de arte.', '$140', 'Talleres Creativos', 'Palette', ARRAY['Caballetes individuales', 'Pinturas no tóxicas', 'Pinceles variados', 'Lienzos incluidos'], '1 hora', 8, '4-12 años', 'Espacio bien ventilado'),
('yesitos', 'Yesitos', 'Taller de moldes de yeso donde los niños pueden crear figuras y decorarlas con colores vibrantes.', '$160', 'Talleres Creativos', 'Hammer', ARRAY['Moldes seguros', 'Yeso no tóxico', 'Pinturas de colores', 'Herramientas adaptadas'], '1.5 horas', 6, '5-12 años', 'Área con mesa amplia'),
('veterinaria', 'Veterinaria', 'Clínica veterinaria simulada con peluches, estetoscopios de juguete y actividades de cuidado animal.', '$170', 'Servicios Profesionales', 'Heart', ARRAY['Peluches de animales', 'Kit médico de juguete', 'Batas de veterinario', 'Certificados de cuidado'], '45 minutos', 6, '4-10 años', 'Mesa de exploración'),
('supermercado', 'Supermercado', 'Simulación completa de supermercado con productos, carritos, caja registradora y dinero de juguete.', '$190', 'Servicios Profesionales', 'ShoppingCart', ARRAY['Productos de juguete', 'Carritos infantiles', 'Caja registradora', 'Dinero didáctico'], '1 hora', 8, '3-10 años', 'Espacio para estantes y pasillos'),
('construccion', 'Construcción', 'Taller de construcción con bloques seguros, herramientas de juguete y proyectos guiados.', '$150', 'Servicios Profesionales', 'HardHat', ARRAY['Bloques de construcción', 'Herramientas de juguete', 'Cascos y chalecos', 'Planos simples'], '1 hora', 6, '4-12 años', 'Área amplia para construcción'),
('decora-cupcake', 'Decora tu Cupcake', 'Actividad culinaria donde los niños decoran cupcakes con glaseado, sprinkles y dulces.', '$130', 'Gastronomía', 'Cake', ARRAY['Cupcakes horneados', 'Glaseado de colores', 'Sprinkles variados', 'Dulces decorativos'], '45 minutos', 8, '3-12 años', 'Mesa limpia con acceso a agua'),
('decora-tote-bag', 'Decora tu Tote Bag', 'Taller de personalización de bolsas de tela con pinturas, marcadores y plantillas creativas.', '$110', 'Talleres Creativos', 'ShoppingBag', ARRAY['Bolsas de tela', 'Pinturas textiles', 'Marcadores especiales', 'Plantillas variadas'], '45 minutos', 8, '5-12 años', 'Mesa de trabajo amplia'),
('decora-gorra', 'Decora tu Gorra', 'Personalización de gorras con parches, pinturas y accesorios para crear diseños únicos.', '$120', 'Talleres Creativos', 'Crown', ARRAY['Gorras base', 'Parches adhesivos', 'Pinturas textiles', 'Accesorios decorativos'], '45 minutos', 6, '6-12 años', 'Mesa de trabajo organizada'),
('haz-pulsera', 'Haz tu Pulsera', 'Taller de bisutería donde los niños crean pulseras con cuentas, hilos y charms especiales.', '$100', 'Talleres Creativos', 'Gem', ARRAY['Cuentas variadas', 'Hilos elásticos', 'Charms especiales', 'Caja para guardar'], '30 minutos', 10, '4-12 años', 'Mesa con organizadores');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();