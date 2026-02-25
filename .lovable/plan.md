

# Diagnosticar y corregir la generacion del PDF

## Diagnostico

Revise el codigo actual de `supabase/functions/generate-quote/index.ts` y **todos los fixes estan presentes**:
- `haz-pulsera` esta en `TALLER_IDS` (linea 246) y en `CATALOGO_TALLERES` (linea 274)
- `precioEstaciones` maneja `n=1` (lineas 292-301)
- `calcularLayout` maneja estacion sola como card (lineas 351-364)
- `generarResumen` y `generarNotaHoraExtra` usan `>= 1` (lineas 451, 476)

Verifique la base de datos: la cotizacion `f32f24b3` tiene 3 servicios correctos (supermercado, haz-pulsera, yesitos).

**El problema mas probable es que la edge function no se redesplegó** despues de los ultimos cambios. Solo se ven logs de boot/shutdown sin ninguna ejecucion real con los fixes.

## Plan de accion

### Paso 1: Agregar logging diagnostico a la edge function
Agregar `console.log` en puntos clave de `mapQuoteToConfig` y `calcularLayout` para poder verificar que los servicios se clasifican y renderizan correctamente:
- Log de los `service_id` recibidos de la BD
- Log de la clasificacion (estaciones/talleres/fijos)
- Log de los cards generados por `calcularLayout`
- Log del total calculado

### Paso 2: Forzar redespliegue
Al guardar el archivo con los cambios de logging, la edge function se redesplegaría automaticamente.

### Paso 3: Verificar en logs
Despues del redespliegue, al generar un PDF se podran ver los logs y confirmar si la clasificacion funciona correctamente.

## Detalle tecnico

Archivos a modificar:
- `supabase/functions/generate-quote/index.ts` — agregar ~5 lineas de `console.log` en:
  - `mapQuoteToConfig`: despues de clasificar servicios (~linea 1069)
  - `calcularLayout`: despues de construir cards (~linea 393)
  - `generateQuotePDF`: log del total y bloques (~linea 939)

Los logs no afectan el rendimiento del PDF y se pueden remover despues de confirmar que todo funciona.

