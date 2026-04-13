

# Agregar "Gastos de Operación / Arrastre" a cotizaciones

## Resumen
Agregar un toggle en el creador/editor de cotizaciones del dashboard para incluir opcionalmente un monto de "Gastos de Operación o Arrastre". Este monto se muestra en el PDF antes de la barra de INVERSIÓN TOTAL y se suma al total.

## Cambios necesarios

### 1. Base de datos — nueva columna en `quotes`
Agregar dos columnas:
- `logistics_fee_enabled` (boolean, default false) — indica si se activan los gastos de arrastre
- `logistics_fee` (integer, default 0) — monto capturado manualmente

### 2. Frontend — `AdminKanban.tsx`

**NewQuoteDialog** (~línea 396-696):
- Agregar un toggle (Switch) "Con gastos de operación/arrastre" debajo de la sección de servicios
- Si está activo, mostrar un Input numérico para capturar el monto
- Sumar ese monto al `totalEstimate` mostrado
- Incluir `logistics_fee_enabled` y `logistics_fee` en el INSERT a `quotes`

**QuoteDetailDialog — modo edición** (~línea 698+):
- Agregar el mismo toggle y campo en el formulario de edición
- Pre-cargar los valores actuales de la cotización
- Incluir los campos en el UPDATE

**QuoteDetailDialog — modo lectura**:
- Mostrar el monto de arrastre si está habilitado, antes del total

### 3. Edge Function — `generate-quote/index.ts`

**`mapQuoteToConfig`** (~línea 1164):
- Leer `logistics_fee` y `logistics_fee_enabled` del quote en BD
- Pasar estos valores en el `QuoteRequest`

**`QuoteRequest` interface** (~línea 18):
- Agregar `logistics_fee?: number`

**`calcularTotal`** (~línea 306):
- Sumar `logistics_fee` al total si existe

**`generateQuotePDF`** (~línea 1106):
- Antes de `drawTotalBar`, dibujar un recuadro/fila para "Gastos de operación y arrastre" con el monto, usando un estilo similar a `drawExtraHourNote`
- El `total` pasado a `drawTotalBar` ya incluirá el monto de arrastre

### 4. `useQuotes.ts` (onboarding flow)
- No requiere cambios — el onboarding público no incluye esta opción, solo aplica para cotizaciones manuales del staff

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| BD (`quotes`) | Agregar `logistics_fee_enabled` y `logistics_fee` |
| `src/components/admin/AdminKanban.tsx` | Toggle + input en NewQuoteDialog y QuoteDetailDialog |
| `supabase/functions/generate-quote/index.ts` | Leer fee de BD, sumarlo al total, renderizar fila en PDF |

## Sin cambios en
- `src/lib/pricing.ts` — el fee es un monto fijo manual, no afecta la lógica de pricing por servicio
- `useQuotes.ts` — solo cotizaciones manuales del admin
- Otras tablas

