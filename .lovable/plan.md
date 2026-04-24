

# Fix: Kit yesitos como producto "por niño" (sin horas extra)

## Problema detectado

"Kit yesitos personalizados" es el único producto del catálogo que se cobra **por niño** (precio base × número de niños), no como servicio fijo o estación. Hoy:

1. Está mal categorizado en BD: `category: "talleres-creativos"` (kebab) — distinto a "Talleres Creativos" usado por la lógica.
2. `pricing.ts` (frontend) no lo reconoce como taller → cae en bucket `otros` → cobra $25 plano.
3. `generate-quote` (Edge Function) sí lo trata como taller → le aplica multiplicador por niños **y** suma $800 por hora extra.
4. Hay un campo `pricing_type` en la tabla `services` (valores: `fixed` | `per_child`) que **nunca se usa**. Es el campo natural para resolver esto.
5. El `id` actual `"Kit yesitos "` tiene un espacio al final — frágil.

Resultado: el precio que ve el cliente y el que sale en el PDF no coinciden, y se le cobran horas extra que no aplican.

## Decisión de modelo

Usar el campo existente `pricing_type` como **fuente única de verdad** del modo de cobro:

| `pricing_type` | Fórmula | Horas extra |
|---|---|---|
| `fixed` (default) | Lógica actual por categoría (combo estaciones / multiplicador talleres) | Suma `hora_extra × extraHours` |
| `per_child` | `base_price × children_count` | **No aplica** (kit consumible, no servicio cronometrado) |

Razón: el "Kit yesitos" es un consumible físico (un kit por niño). Las horas extra son tiempo operativo del staff — no aplican a un producto que se entrega.

En el PDF se sigue renderizando como una tarjeta de servicio normal, pero su precio y subtítulo reflejan la naturaleza per-child.

## Cambios

### 1. BD — corrección de datos (migración)
- Normalizar el id: borrar/reemplazar `"Kit yesitos "` (con espacio) → `"kit-yesitos"`.
- Fijar `category = 'Talleres Creativos'` (consistente con el resto).
- Fijar `pricing_type = 'per_child'`.
- Fijar `hora_extra = 0` (no aplica).
- Confirmar `base_price = 25`.
- Reasignar `quote_services.service_id` viejo al nuevo id para no romper cotizaciones existentes.

### 2. `src/lib/pricing.ts`
- Agregar `pricing_type?: 'fixed' | 'per_child'` y `price_per_child?: number` a `ServiceForPricing`.
- En `calcularPreciosCotizacion`: antes de clasificar por categoría, separar los servicios `per_child`. Su precio = `base_price × nNinos`. **No** suma horas extra.
- Resto de la lógica (estaciones combo, talleres multiplicador, otros fijos) intacta.

### 3. `src/hooks/useQuotes.ts`
- Pasar `pricing_type` al calcular precios para que la lógica nueva aplique.

### 4. `src/components/admin/AdminKanban.tsx`
- Incluir `pricing_type` en los `select(...)` de `services` (NewQuoteDialog y edit mode) y propagarlo al cálculo.

### 5. `supabase/functions/generate-quote/index.ts`
- En `mapQuoteToConfig`: si `dbSvc.pricing_type === 'per_child'`, clasificarlo en un nuevo bucket `perChild[]` (no en talleres ni fijos).
- En `calcularTotal`: bucket `perChild` aporta `Σ base_price × n_ninos`, sin horas extra ni descuento por combo.
- En el render: cada servicio `per_child` se dibuja como una tarjeta normal (misma estética que talleres/fijos). El precio que se muestra es `base_price × n_ninos`. El subtítulo de la tarjeta usa el formato existente (`pdf_subtitle` de la BD); si está vacío, usar uno genérico (ej. "Kit personalizado por niño · X niños").
- En la nota de hora extra: excluir `per_child` del cálculo de precios extra disponibles.
- Redesplegar.

## Layout sin cambios visuales mayores
La tarjeta de Kit yesitos se ve igual que cualquier otra tarjeta de servicio. La única diferencia es el precio total, que ya refleja `base_price × niños`.

## Validación post-deploy
Crear una cotización de prueba con 35 niños + Kit yesitos + 2 horas extra:
- Kit yesitos debe mostrar **$875** ($25 × 35), NO sumarle nada por las 2 horas extra.
- Los demás servicios sí deben tener el extra aplicado normalmente.

## Archivos modificados
| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Normalizar `Kit yesitos` (id, category, pricing_type, hora_extra=0) y reasignar `quote_services` |
| `src/lib/pricing.ts` | Soportar `pricing_type='per_child'` |
| `src/hooks/useQuotes.ts` | Propagar `pricing_type` |
| `src/components/admin/AdminKanban.tsx` | Cargar `pricing_type` en queries |
| `supabase/functions/generate-quote/index.ts` | Bucket `perChild`, total y render |

