
# Auditoría Edge Function `generate-quote` — COMPLETADO ✅

## Cambios Realizados

### Fase 1 ✅ — Nuevas columnas en `services`
- Columna `pdf_color` (text, default 'blue') — color de la card en el PDF
- Columna `pdf_subtitle` (text, nullable) — subtítulo descriptivo en el PDF
- Datos poblados para los 16 servicios existentes

### Fase 2 ✅ — Servicios faltantes agregados
- `correo` — Estación de Juego, $1,800
- `peluqueria` — Estación de Juego, $1,800
- Alias `pizzeria`/`pulseras` resueltos: se usa `hamburgueseria` y `haz-pulsera` como IDs canónicos

### Fase 3 ✅ — Catálogos hardcodeados eliminados
- `CATALOGO_ESTACIONES`, `CATALOGO_FIJOS`, `CATALOGO_TALLERES` eliminados completamente
- Nombre, color, subtítulo, features, precio y hora_extra se leen de la BD
- `deriveServiceSets()` clasifica dinámicamente por categoría
- `mapQuoteToConfig()` ya no muta catálogos

### Fase 4 ✅ — Datos bancarios en `company_settings`
- Columna `bank_info` agregada a `company_settings`
- `drawPaymentInfo()` lee de BD en lugar de hardcodear

### Constantes que se mantienen (lógica de negocio)
- `TIERS` multiplicadores — lógica de negocio, no datos
- `pairPrice = 3000`, `singlePrice = 1800` — fórmula de estaciones
- Colores del PDF (C object) — paleta de diseño

### Archivos modificados
- `supabase/functions/generate-quote/index.ts` — refactor completo
- 2 migraciones SQL — columnas + datos
