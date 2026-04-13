-- Homologar hora_extra: Pesca 802→800, Arte+Foami (diamante) 800→1000, Kit yesitos 800→1000
UPDATE public.services SET hora_extra = 800 WHERE id = 'pesca' AND hora_extra = 802;
UPDATE public.services SET hora_extra = 1000 WHERE id = 'diamante' AND hora_extra = 800;
UPDATE public.services SET hora_extra = 1000 WHERE id = 'Kit yesitos ' AND hora_extra = 800;