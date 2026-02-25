

# Fix: Reclasificar "Decora tu Cupcake" como Taller Creativo

## Problema

"Decora tu Cupcake" (`decora-cupcake`) esta clasificado como "Estaciones de Juego" en dos lugares:

1. **Base de datos** (`services` table): `category = 'Estaciones de Juego'`
2. **Edge Function** (lista hardcodeada `ESTACION_IDS`): incluye `"decora-cupcake"`

Esto causa que en la cotizacion PDF aparezca junto a las estaciones en vez de con los talleres.

## Plan de correccion

### Paso 1 — Actualizar la categoria en la base de datos
Ejecutar un UPDATE en la tabla `services` para cambiar la categoria de `decora-cupcake` a "Talleres Creativos".

### Paso 2 — Mover el ID en las listas hardcodeadas de la Edge Function
En `supabase/functions/generate-quote/index.ts` (linea 244):
- **Quitar** `"decora-cupcake"` de `ESTACION_IDS`
- **Agregar** `"decora-cupcake"` a `TALLER_IDS` (linea 246)

### Paso 3 — Actualizar la validacion
En la funcion `validateRequest` (linea 931), la validacion de estaciones ya no incluira `decora-cupcake`, y la de talleres si. Esto ocurre automaticamente al cambiar las listas del Paso 2.

## Archivos a modificar

1. **Base de datos**: UPDATE en tabla `services`
2. **`supabase/functions/generate-quote/index.ts`**: Mover `"decora-cupcake"` de `ESTACION_IDS` a `TALLER_IDS`

## Impacto en precios

Al ser taller creativo, el precio de "Decora tu Cupcake" ahora aplicara el multiplicador por numero de ninos (x1.0 hasta 15, x1.3 hasta 30, etc.) en lugar del calculo de pares de estaciones. Esto es el comportamiento correcto segun la solicitud.

## Riesgo de regresion

Minimo. Solo se mueve un servicio de una categoria a otra, manteniendo la coherencia entre BD y Edge Function.
