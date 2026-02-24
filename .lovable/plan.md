

# Diagnóstico y corrección del PDF que no incluye todos los servicios

## Problema
La base de datos tiene los 5 servicios correctos para la cotización de Kevin Gomez, pero el PDF generado solo muestra 2 (inflable_bebes y yesitos). El total del PDF ($3,450) confirma que solo se calculan esos 2 servicios.

## Causa raíz
La edge function `generate-quote` no tiene logging de depuración, lo que impide ver qué datos recibe la función `mapQuoteToConfig`. La solución es agregar logging y redesplegar la función para confirmar el flujo, y corregir cualquier discrepancia.

## Plan de acción

### Paso 1: Agregar logging a `mapQuoteToConfig` en `supabase/functions/generate-quote/index.ts`

Agregar `console.log` en la función `mapQuoteToConfig` para registrar:
- Los `qServices` que retorna la consulta a `quote_services`
- La clasificación resultante (estaciones, fijos, talleres)
- El config final que se pasa al generador de PDF

```text
Ubicación: supabase/functions/generate-quote/index.ts, líneas ~828-866
Cambios:
- Después de la consulta a quote_services (línea 834): log de qServices
- Después del for loop de clasificación (línea 845): log de estaciones, fijos, talleres
- Antes del return (línea 857): log del config completo
```

### Paso 2: Redesplegar la edge function

Desplegar la función para asegurar que la versión en producción coincida con el código fuente actual. Este paso es clave porque es posible que la versión desplegada sea antigua y no incluya cambios recientes.

### Paso 3: Generar un PDF de prueba y verificar los logs

Invocar la función con el quoteId de Kevin Gomez para ver qué datos está procesando realmente.

### Paso 4: Corregir según hallazgos

Dependiendo de lo que muestren los logs:
- Si `qServices` retorna menos filas de las esperadas: investigar la consulta o RLS
- Si `qServices` retorna todas las filas pero la clasificación falla: corregir las listas de IDs
- Si el config es correcto pero el PDF no muestra todo: investigar el layout engine

## Notas técnicas
- La función usa `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS, así que los permisos no deberían ser un factor
- Las listas hardcodeadas `ESTACION_IDS`, `FIJO_IDS`, `TALLER_IDS` coinciden con los IDs en la base de datos
- El total de $3,450 = inflable_bebes ($1,500 fijo) + yesitos ($1,500 x 1.3 multiplicador para 20 niños = $1,950) confirma que solo esos 2 servicios se están procesando

