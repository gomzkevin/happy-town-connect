

# Eliminar listas hardcodeadas de categorias en la Edge Function

## Problema actual

La Edge Function `generate-quote` tiene dos listas hardcodeadas:
- `ESTACION_IDS` (8 servicios)
- `TALLER_IDS` (7 servicios)

Cada vez que se agrega, quita o reclasifica un servicio, hay que actualizar estas listas manualmente, lo que genera riesgo de inconsistencia con la base de datos.

## Solucion propuesta

Reemplazar las listas hardcodeadas por una consulta a la tabla `services` que lea la categoria de cada servicio dinamicamente.

### Cambios en `supabase/functions/generate-quote/index.ts`

1. **Eliminar** las constantes `ESTACION_IDS` y `TALLER_IDS`
2. **Agregar** una consulta al inicio del flujo que obtenga las categorias de los servicios seleccionados:
   ```text
   SELECT id, category FROM services WHERE id IN (...)
   ```
3. **Derivar** las listas de estaciones y talleres a partir del resultado de la consulta, filtrando por `category = 'Estaciones de Juego'` y `category = 'Talleres Creativos'`
4. **Actualizar** todas las referencias a `ESTACION_IDS` y `TALLER_IDS` para usar las listas derivadas
5. **Actualizar** la funcion `validateRequest` para que use las listas dinamicas en lugar de las constantes

### Detalles tecnicos

- La consulta se hara con el cliente Supabase (service role) que ya existe en la funcion
- Se usara un Map o Set para busquedas eficientes por ID
- Se mantiene la misma logica de precios, solo cambia de donde vienen las listas
- La validacion en `validateRequest` seguira funcionando igual, pero consultando la BD en vez de listas fijas

### Beneficios

- **Fuente unica de verdad**: la categoria vive solo en la tabla `services`
- **Sin mantenimiento manual**: agregar un nuevo servicio en la BD es suficiente
- **Cero riesgo de desincronizacion** entre BD y Edge Function

### Riesgo

- Agrega una consulta extra a la BD por cada generacion de cotizacion (impacto minimo, < 50ms)
- Si la tabla `services` no esta disponible, la generacion fallara (mismo riesgo que ya existe con `dbServices`)

### Archivos a modificar

- `supabase/functions/generate-quote/index.ts` — eliminar constantes hardcodeadas y usar consulta dinamica

