
-- 1. Rename hamburgueseria → pizzeria (title only, keep id for backwards compat)
UPDATE public.services SET title = 'Pizzería', description = 'Pizza artesanal de juguete', hora_extra = 500 WHERE id = 'hamburgueseria';

-- 2. Deactivate boliche (combined with pesca as "Pesca y Boliche")
UPDATE public.services SET is_active = false WHERE id = 'boliche';

-- 3. Reclassify pesca as a fixed service with combined name
UPDATE public.services SET 
  title = 'Pesca y Boliche',
  description = 'Diversión con cañas y pinos',
  base_price = 1200,
  price = '$1,200',
  hora_extra = 500,
  pricing_type = 'fixed',
  features = ARRAY['Cañas de pescar magnéticas', 'Peces de juguete', 'Set de boliche completo', 'Equipo reutilizable']
WHERE id = 'pesca';

-- 4. Update hora_extra for existing estaciones
UPDATE public.services SET hora_extra = 500 WHERE id IN ('guarderia', 'construccion', 'supermercado', 'veterinaria', 'decora-cupcake');

-- 5. Update spa
UPDATE public.services SET 
  base_price = 2200, price = '$2,200', hora_extra = 1000,
  features = ARRAY['Mascarillas faciales', 'Aplicación de esmalte', 'Accesorios para el pelo', 'Aromaterapia infantil']
WHERE id = 'spa';

-- 6. Update talleres hora_extra and base_price
UPDATE public.services SET base_price = 2000, price = 'Desde $2,000', hora_extra = 1000 WHERE id = 'caballetes';
UPDATE public.services SET base_price = 1500, price = 'Desde $1,500', hora_extra = 1000 WHERE id = 'yesitos';
UPDATE public.services SET base_price = 1500, price = 'Desde $1,500', hora_extra = 1000 WHERE id = 'haz-pulsera';

-- 7. Insert missing estaciones
INSERT INTO public.services (id, title, description, category, icon, price, base_price, hora_extra, pricing_type, features, is_active)
VALUES
  ('cafeteria', 'Cafetería', 'Prepara bebidas y snacks de juguete', 'Estaciones de Juego', 'Coffee', '$0', 0, 500, 'fixed', ARRAY['Cafetera de juguete', 'Tazas y platos', 'Ingredientes de felpa', 'Uniforme de barista'], true),
  ('correo', 'Correo', 'Envía cartas y paquetes de juguete', 'Estaciones de Juego', 'Mail', '$0', 0, 500, 'fixed', ARRAY['Buzón de correo', 'Sobres y estampillas', 'Paquetes de juguete', 'Uniforme postal'], true),
  ('peluqueria', 'Peluquería', 'Estilismo y peinados divertidos', 'Estaciones de Juego', 'Scissors', '$0', 0, 500, 'fixed', ARRAY['Secadoras de juguete', 'Peines y cepillos', 'Accesorios para el pelo', 'Espejo y silla'], true)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert missing servicios fijos
INSERT INTO public.services (id, title, description, category, icon, price, base_price, hora_extra, pricing_type, features, is_active)
VALUES
  ('area_bebes', 'Área de Bebés', 'Espacio seguro para los más pequeños', 'Estaciones de Juego', 'Baby', '$2,500', 2500, 500, 'fixed', ARRAY['Toldo de protección solar', 'Tapete acolchado', 'Juguetes sensoriales', 'Staff dedicado'], true),
  ('inflable_bebes', 'Inflable para Bebés', 'Brinca-brinca seguro para bebés', 'Estaciones de Juego', 'Star', '$1,500', 1500, 500, 'fixed', ARRAY['Inflable 2×2m', 'Pelotas de colores', 'Supervisión constante', 'Montaje incluido'], true)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert missing talleres
INSERT INTO public.services (id, title, description, category, icon, price, base_price, hora_extra, pricing_type, features, is_active)
VALUES
  ('foamy', 'Foami Moldeable', 'Moldea y crea figuras', 'Talleres Creativos', 'Shapes', 'Desde $800', 800, 500, 'per_child', ARRAY['Foami moldeable', 'Moldes y cortadores', 'Accesorios decorativos', 'Bolsas para llevar'], true),
  ('diamante', 'Arte Diamante', 'Brilla con arte de gemas', 'Talleres Creativos', 'Diamond', 'Desde $800', 800, 500, 'per_child', ARRAY['Kit de arte diamante', 'Gemas de colores surtidos', 'Plantillas temáticas', 'Bolsas para llevar'], true)
ON CONFLICT (id) DO NOTHING;
