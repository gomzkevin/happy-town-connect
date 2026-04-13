
UPDATE services 
SET title = 'Arte Diamante + Foami Moldeable',
    base_price = 1000,
    price = 'Desde $1,000',
    description = 'Combina el arte de gemas brillantes con la creatividad del foami moldeable en un solo taller',
    features = ARRAY['Kit de arte diamante', 'Gemas de colores surtidos', 'Foami moldeable', 'Moldes y cortadores', 'Accesorios decorativos', 'Bolsas para llevar']
WHERE id = 'diamante';

UPDATE services SET is_active = false WHERE id = 'foamy';
