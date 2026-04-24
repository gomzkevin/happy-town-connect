-- 1. Insertar el nuevo registro normalizado (si no existe)
INSERT INTO public.services (
  id, title, description, price, category, icon,
  base_price, pricing_type, hora_extra, is_active,
  pdf_color, pdf_subtitle, duration, age_range,
  min_participants, max_participants
)
SELECT
  'kit-yesitos',
  COALESCE(title, 'Kit Yesitos Personalizados'),
  COALESCE(description, 'Kit personalizado por niño'),
  COALESCE(price, '$25'),
  'Talleres Creativos',
  COALESCE(icon, 'palette'),
  25,
  'per_child',
  0,
  true,
  COALESCE(pdf_color, 'pink'),
  pdf_subtitle,
  duration,
  age_range,
  min_participants,
  max_participants
FROM public.services
WHERE TRIM(id) = 'Kit yesitos'
ON CONFLICT (id) DO UPDATE SET
  category = 'Talleres Creativos',
  pricing_type = 'per_child',
  hora_extra = 0,
  base_price = 25,
  is_active = true,
  updated_at = now();

-- 2. Si no existía el viejo, crear uno limpio igualmente
INSERT INTO public.services (
  id, title, description, price, category, icon,
  base_price, pricing_type, hora_extra, is_active, pdf_color
)
VALUES (
  'kit-yesitos',
  'Kit Yesitos Personalizados',
  'Kit personalizado de yesitos (uno por niño)',
  '$25',
  'Talleres Creativos',
  'palette',
  25,
  'per_child',
  0,
  true,
  'pink'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Reasignar quote_services al nuevo id
UPDATE public.quote_services
SET service_id = 'kit-yesitos'
WHERE TRIM(service_id) = 'Kit yesitos'
  AND service_id <> 'kit-yesitos';

-- 4. Eliminar el registro viejo con espacio
DELETE FROM public.services
WHERE id <> 'kit-yesitos'
  AND TRIM(id) = 'Kit yesitos';
