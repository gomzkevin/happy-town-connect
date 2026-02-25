

# Fix: PDF Adjunto + Precios Correctos en Email

## Problemas Identificados

### 1. PDF no se adjunta: `RangeError: Maximum call stack size exceeded`

En `send-quote-email/index.ts` linea 97:
```typescript
const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
```
El operador spread (`...`) pasa cada byte del PDF como argumento individual a `String.fromCharCode`. Un PDF de ~150KB = ~150,000 argumentos, lo cual excede el limite del call stack de JavaScript. La solucion es convertir a base64 por chunks.

### 2 y 3. Precios incorrectos en el email

El email recibe los precios desde el frontend (`useQuotes.ts`), que los construye asi:

```typescript
// useQuotes.ts linea ~32
const svcsForPricing = selectedServices.map(item => ({
  id: item.service.id,
  base_price: parseInt(item.service.price.replace(/[^\d]/g, '')),  // <-- PROBLEMA
  category: item.service.category,
}));
```

El campo `service.price` es un TEXT de display (ej. `"$1,800"`) que puede no coincidir con el campo entero `base_price` de la tabla `services`. La interfaz `Service` en `ServicesContext.tsx` ni siquiera incluye `base_price`.

Luego, estos precios calculados con el texto se envian directamente al email:
```typescript
services: selectedServices.map(item => ({
  name: item.service.title,
  price: priceMap.get(item.service.id) ?? parseInt(item.service.price.replace(...)),
  quantity: item.quantity
})),
```

**Resultado**: El email muestra precios basados en el texto `price` en lugar del `base_price` real de la BD.

---

## Solucion

### A. Fix del base64 (PDF adjunto)

**Archivo**: `supabase/functions/send-quote-email/index.ts`

Reemplazar la linea 97:
```typescript
const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
```
Por una conversion por chunks que no desborde el stack:
```typescript
let binary = '';
const chunkSize = 8192;
for (let i = 0; i < pdfBytes.length; i += chunkSize) {
  const chunk = pdfBytes.subarray(i, i + chunkSize);
  binary += String.fromCharCode(...chunk);
}
const pdfBase64 = btoa(binary);
```

### B. Precios del email desde la BD (no del frontend)

**Archivo**: `supabase/functions/send-quote-email/index.ts`

En lugar de confiar en `data.services` (que viene del frontend con precios potencialmente incorrectos), el handler debe:

1. Consultar `quote_services` + `services` para obtener los precios reales de la BD
2. Recalcular el total usando la misma logica de pricing
3. Usar esos datos para renderizar el email

Cambio en el handler principal (despues de obtener `data`):

```typescript
// Fetch real services data from DB
const { data: quoteServices } = await supabase
  .from('quote_services')
  .select('service_id, service_name, service_price, quantity')
  .eq('quote_id', data.quoteId);

const serviceIds = quoteServices?.map(qs => qs.service_id) || [];
const { data: dbServices } = await supabase
  .from('services')
  .select('id, base_price, category')
  .in('id', serviceIds);

// Recalculate using DB prices
// Apply pricing logic (station pairs, workshop multipliers)
// Use recalculated prices for email rendering
```

Esto asegura que el email siempre refleje los precios de la BD, independientemente de lo que envie el frontend.

### C. Fix del frontend (prevencion)

**Archivo**: `src/contexts/ServicesContext.tsx`

Agregar `base_price` a la interfaz `Service`:
```typescript
export interface Service {
  // ... campos existentes
  base_price?: number;  // precio real de la BD
}
```

**Archivo**: `src/hooks/useQuotes.ts`

Usar `base_price` en lugar de parsear el texto:
```typescript
base_price: item.service.base_price ?? parseInt(item.service.price.replace(/[^\d]/g, '')),
```

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/send-quote-email/index.ts` | Fix base64 por chunks + leer precios de BD en vez del frontend |
| `src/contexts/ServicesContext.tsx` | Agregar `base_price` a la interfaz `Service` |
| `src/hooks/useQuotes.ts` | Usar `base_price` de la BD en lugar de parsear texto |

## Archivos que NO se modifican
- `supabase/functions/generate-quote/index.ts` — sin cambios
- `supabase/functions/send-quote-email/_templates/quote-email-complete.tsx` — sin cambios (la plantilla ya esta bien, el problema son los datos que recibe)

## Riesgos
| Riesgo | Mitigacion |
|---|---|
| Chunk size inadecuado para base64 | 8192 bytes es un tamano estandar seguro para el stack |
| quote_services aun no insertados cuando se lee | `useQuotes.ts` inserta primero y luego invoca el email, asi que ya existen |
| Servicios sin `base_price` en la BD | Fallback al `service_price` ya guardado en `quote_services` |
