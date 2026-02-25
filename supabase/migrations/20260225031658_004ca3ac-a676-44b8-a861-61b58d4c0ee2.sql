
-- Update pdf_color and pdf_subtitle for all existing services based on catalog data

-- Estaciones de Juego
UPDATE public.services SET pdf_color = 'blue', pdf_subtitle = 'Cuidado y juego para los más pequeños' WHERE id = 'guarderia';
UPDATE public.services SET pdf_color = 'yellow', pdf_subtitle = 'Construye, imagina y crea' WHERE id = 'construccion';
UPDATE public.services SET pdf_color = 'red', pdf_subtitle = 'Pizza artesanal de juguete' WHERE id = 'hamburgueseria';
UPDATE public.services SET pdf_color = 'green', pdf_subtitle = 'Compra, paga y diviértete' WHERE id = 'supermercado';
UPDATE public.services SET pdf_color = 'green', pdf_subtitle = 'Cuida a los animalitos' WHERE id = 'veterinaria';
UPDATE public.services SET pdf_color = 'pink', pdf_subtitle = 'Barista por un día' WHERE id = 'cafeteria';
UPDATE public.services SET pdf_color = 'blue', pdf_subtitle = 'Espacio seguro para los más pequeños' WHERE id = 'area_bebes';
UPDATE public.services SET pdf_color = 'blue', pdf_subtitle = 'Diversión con cañas y pinos' WHERE id = 'pesca';
UPDATE public.services SET pdf_color = 'green', pdf_subtitle = 'Brinca-brinca seguro para bebés' WHERE id = 'inflable_bebes';

-- Talleres Creativos
UPDATE public.services SET pdf_color = 'purple', pdf_subtitle = 'Pinturas y dibujos personalizados' WHERE id = 'caballetes';
UPDATE public.services SET pdf_color = 'pink', pdf_subtitle = 'Figuras de yeso para pintar' WHERE id = 'yesitos';
UPDATE public.services SET pdf_color = 'green', pdf_subtitle = 'Diseña tu propia joyería' WHERE id = 'haz-pulsera';
UPDATE public.services SET pdf_color = 'yellow', pdf_subtitle = 'Moldea y crea figuras' WHERE id = 'foamy';
UPDATE public.services SET pdf_color = 'blue', pdf_subtitle = 'Brilla con arte de gemas' WHERE id = 'diamante';
UPDATE public.services SET pdf_color = 'pink', pdf_subtitle = 'Decora y disfruta' WHERE id = 'decora-cupcake';
UPDATE public.services SET pdf_color = 'pink', pdf_subtitle = 'Relajación y cuidado personal' WHERE id = 'spa';

-- Insert missing services: correo and peluqueria
INSERT INTO public.services (id, title, description, price, category, icon, base_price, hora_extra, features, pdf_color, pdf_subtitle, is_active, pricing_type)
VALUES
  ('correo', 'Correo', 'Entrega cartas y paquetes como un cartero real', '$1,800', 'Estaciones de Juego', 'Mail', 1800, 500, ARRAY['Buzón de juguete', 'Sellos y etiquetas', 'Paquetes para enviar', 'Uniforme de cartero', '1 persona de apoyo dedicada'], 'blue', 'Entrega cartas y paquetes', true, 'fixed'),
  ('peluqueria', 'Peluquería', 'Estilista por un día con accesorios de peluquería', '$1,800', 'Estaciones de Juego', 'Scissors', 1800, 500, ARRAY['Silla de peluquería', 'Secadoras y cepillos', 'Accesorios para el pelo', 'Capas y espejos', '1 persona de apoyo dedicada'], 'purple', 'Estilista por un día', true, 'fixed');

-- Update bank_info in company_settings
UPDATE public.company_settings SET bank_info = 'BBVA · Frida Velásquez Hdez. · CLABE: 012 610 015493815314' WHERE id = 'd9129837-f07c-4897-9193-592c524f2f17';
