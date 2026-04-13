

# Agregar Horas Extra al cotizador (admin + wizard)

## Concepto
Permitir al usuario elegir cuántas horas totales quiere contratar (mínimo 3, que es el paquete base). Las horas extra se cobran según la categoría del servicio ($800/estación, $1,000/taller) y se **suman al precio de cada servicio** en las tarjetas del PDF y en la UI.

## Modelo de datos

### Nueva columna en `quotes`
```sql
ALTER TABLE quotes ADD COLUMN extra_hours integer NOT NULL DEFAULT 0;
```
`extra_hours` = número de horas adicionales más allá de las 3 base (ej: si quieren 5 horas → `extra_hours = 2`).

## Cambios por archivo

### 1. BD — migración
- Agregar `extra_hours` (integer, default 0) a `quotes`.

### 2. `src/lib/pricing.ts` — incluir horas extra en cálculo
- Modificar `calcularPreciosCotizacion` para aceptar un parámetro `extraHours: number`.
- Después de calcular el precio base de cada servicio, sumar `hora_extra * extraHours` (leído de la BD del servicio).
- Para esto, extender `ServiceForPricing` con campo `hora_extra`.
- El total resultante ya incluye las horas extra por servicio.

### 3. `src/components/admin/AdminKanban.tsx` — UI admin
- En `NewQuoteDialog` y `QuoteDetailDialog` (modo edición):
  - Agregar un selector "Horas totales" (stepper o input numérico, min=3) junto al campo de "Número de niños".
  - Calcular `extraHours = horasTotales - 3`.
  - Pasar `extraHours` a `calcularPreciosCotizacion`.
  - Guardar `extra_hours` en la tabla `quotes`.
  - Fetch `hora_extra` junto con los otros campos de `services`.
- Los precios individuales mostrados en cada botón de servicio ya incluirán el costo de horas extra.

### 4. `src/components/ServiceCart.tsx` — UI pública (carrito)
- Agregar un stepper "Horas de servicio" (min 3, default 3) en el formulario de cotización.
- Calcular `extraHours = horas - 3` y pasarlo a `calcularPreciosCotizacion`.
- Guardar `extra_hours` en la cotización vía `useQuotes`.

### 5. `src/components/RamiOnboarding.tsx` — wizard Rami
- Agregar selector de horas en el paso de "Detalles" (paso 4).
- Pasar `extraHours` al flujo de `submitQuote`.

### 6. `src/hooks/useQuotes.ts` — persistencia
- Agregar `extraHours` a `QuoteData`.
- Incluir `extra_hours` en el INSERT a `quotes`.
- Pasar `extraHours` al cálculo de precios para que `service_price` en `quote_services` ya incluya las horas extra.

### 7. `supabase/functions/generate-quote/index.ts` — PDF
- En `mapQuoteToConfig`: leer `extra_hours` del quote, calcular `horas = 3 + extra_hours`.
- En `calcularTotal`: sumar `hora_extra * extraHours` al precio de cada servicio (estación y taller).
- En `calcularLayout`: los precios de las tarjetas ya incluyen horas extra.
- Actualizar `generarNotaHoraExtra` para que diga algo como "Incluye 2 horas adicionales" en vez del desglose por tipo, ya que el costo está embebido en cada servicio.
- Redesplegar Edge Function.

## Flujo del usuario
1. Admin o cliente selecciona servicios.
2. Elige "5 horas" (slider o stepper).
3. Cada servicio muestra su precio base + 2 × hora_extra de ese servicio.
4. El total refleja todo sumado.
5. El PDF muestra los precios finales por tarjeta y una nota indicando las horas contratadas.

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| BD `quotes` | `extra_hours integer default 0` |
| `src/lib/pricing.ts` | Agregar `hora_extra` a `ServiceForPricing`, sumar extra hours al precio |
| `src/components/admin/AdminKanban.tsx` | Stepper de horas en NewQuoteDialog y edit mode |
| `src/components/ServiceCart.tsx` | Stepper de horas en formulario de cotización |
| `src/components/RamiOnboarding.tsx` | Selector de horas en paso 4 |
| `src/hooks/useQuotes.ts` | `extraHours` en QuoteData y INSERT |
| `supabase/functions/generate-quote/index.ts` | Leer extra_hours, sumar a precios, actualizar nota |

