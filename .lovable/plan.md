

# Agregar Descuentos a Cotizaciones

## Concepto
Toggle de descuento (similar al de "Gastos de operación / arrastre") que aplica un **porcentaje** sobre el subtotal de servicios + horas extra (sin afectar gastos operativos). Se muestra en la UI admin, en el detalle de la cotización y en el PDF como una línea visible antes de "INVERSIÓN TOTAL".

## Decisión de alcance
**El descuento se aplica solo sobre el subtotal de servicios** (no sobre logistics_fee). Razones:
- Los gastos operativos son costos reales (gasolina, arrastre) que no tienen margen para descontar.
- El cliente percibe el descuento sobre el "valor del servicio", no sobre cargos administrativos.
- Es más limpio fiscalmente y operativamente.

Fórmula final:
```
subtotal_servicios = suma(servicios + horas_extra)
descuento_monto    = round(subtotal_servicios * discount_percentage / 100)
total_final        = subtotal_servicios - descuento_monto + logistics_fee
```

## Modelo de datos

Nueva migración a tabla `quotes`:
```sql
ALTER TABLE quotes
  ADD COLUMN discount_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN discount_percentage numeric(5,2) NOT NULL DEFAULT 0;
```
- `discount_percentage`: 0–100, validar en UI (max 100, min 0).
- Guardamos % en vez de monto fijo para que sea recalculable si cambian servicios.
- `total_estimate` en BD seguirá guardándose **ya con el descuento aplicado** (es lo que aparece en kanban, reportes, etc.).

## Cambios por archivo

### 1. BD — migración
Agregar `discount_enabled` y `discount_percentage` a `quotes`.

### 2. `src/lib/pricing.ts`
Agregar helper `aplicarDescuento(subtotal, percentage) => { discountAmount, totalConDescuento }` para reutilizar en admin y PDF.

### 3. `src/components/admin/AdminKanban.tsx`
- **NewQuoteDialog**: agregar bloque toggle "Descuento" con input numérico de % (0-100), justo debajo del bloque de logistics_fee. Calcular y guardar `discount_enabled`, `discount_percentage` y aplicar descuento sobre subtotal de servicios para `total_estimate`.
- **QuoteDetailDialog (modo edit)**: mismo bloque, con estados `editDiscountEnabled` / `editDiscountPercentage`.
- **QuoteDetailDialog (modo view)**: mostrar línea "Descuento (X%)" en color verde con monto restado, antes del total.
- Extender interface `Quote` con los dos nuevos campos.

### 4. `src/hooks/useQuotes.ts`
- Agregar `discountEnabled` y `discountPercentage` a `QuoteData`.
- Calcular descuento sobre subtotal de servicios; guardar `total_estimate` ya con descuento aplicado.
- Insertar `discount_enabled` y `discount_percentage` en la fila.

### 5. `src/components/ServiceCart.tsx` y `src/components/RamiOnboarding.tsx`
**No** se agrega UI pública (descuentos son herramienta de cierre de venta interno).
Solo aseguramos que pasamos `discountEnabled: false, discountPercentage: 0` por default al `submitQuote`.

### 6. `supabase/functions/generate-quote/index.ts`
- Extender `QuoteRequest` con `discount_enabled?: boolean; discount_percentage?: number`.
- En `mapQuoteToConfig`: leer ambos campos del quote.
- En `calcularTotal`: calcular `subtotalServicios` (estaciones + fijos + talleres con horas extra), restar descuento, sumar logistics_fee al final. Devolver también `discountAmount` para el render.
- En el render de la página 1: agregar fila visual antes de logistics_fee (o entre logistics_fee y total) con texto "Descuento (X%)" y monto en verde, similar al estilo del logistics_fee row pero con color distintivo (verde).
- Recalcular `LOGISTICS_FEE_H` y agregar `DISCOUNT_H` al cálculo de espacio.
- Redesplegar Edge Function.

## Layout del PDF (orden visual)
```text
[Tarjetas de servicios]
[Gastos de operación: $XXX]   ← si aplica
[Descuento (10%): -$XXX]      ← NUEVO si aplica, en verde
[INVERSIÓN TOTAL: $XXXX MXN]
[Hora adicional disponible…]
```

## Vista detalle del kanban (orden visual)
```text
- Servicio 1 ........ $X
- Servicio 2 ........ $X
- Gastos operación .. $X
- Descuento (10%) ... -$X    ← verde
─────────────────────────
Total estimado ...... $X
```

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| Migración BD | `discount_enabled`, `discount_percentage` en `quotes` |
| `src/lib/pricing.ts` | Helper `aplicarDescuento` |
| `src/components/admin/AdminKanban.tsx` | Toggle en NewQuoteDialog y edit, fila en view |
| `src/hooks/useQuotes.ts` | Campos en QuoteData e INSERT |
| `supabase/functions/generate-quote/index.ts` | Lógica + render de fila descuento |

