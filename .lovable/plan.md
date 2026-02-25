

# Recalculo masivo de precios en cotizaciones existentes

## Problema
Las cotizaciones creadas antes del refactor tienen precios snapshot de los catalogos hardcodeados, que difieren de los `base_price` actuales en la BD. Esto genera confusion en el admin.

## Solucion

Crear una Edge Function temporal `recalculate-quotes` que:

1. Consulte todas las cotizaciones con status distinto de `completed`/`cancelled`
2. Para cada cotizacion, obtenga sus `quote_services` y los `base_price` actuales de la tabla `services`
3. Aplique la logica de `calcularPreciosCotizacion` (pares de estaciones, multiplicadores de talleres) usando el `children_count` de cada cotizacion
4. Actualice `quote_services.service_price` y `quotes.total_estimate` con los nuevos valores

### Detalles tecnicos

**Nueva Edge Function**: `supabase/functions/recalculate-quotes/index.ts`
- Replica la logica de pricing de `src/lib/pricing.ts` (TIERS, pares de estaciones)
- Consulta todas las quotes activas (`pending`, `contacted`, `negotiating`, `accepted`)
- Para cada quote:
  - Obtiene sus quote_services con el service_id
  - Busca el base_price y category actuales de cada service_id en la tabla `services`
  - Recalcula precios individuales y total
  - Actualiza `quote_services.service_price` por cada registro
  - Actualiza `quotes.total_estimate` y `quotes.deposit_amount` (50% del total)
- Devuelve un resumen de cuantas cotizaciones se actualizaron

**Boton en AdminKanban**: `src/components/admin/AdminKanban.tsx`
- Agregar un boton "Recalcular precios" en la barra superior del Kanban
- Al hacer clic, invoca la Edge Function
- Muestra un toast con el resultado
- Recarga los datos del Kanban

**Configuracion**: `supabase/config.toml`
- Registrar la nueva funcion con `verify_jwt = false` (protegida por logica interna)

### Logica de recalculo (misma que pricing.ts)

```text
Estaciones de Juego:
  1 estacion  -> base_price individual
  2+ estaciones -> floor(n/2) * 3000 + (n%2) * 1800, distribuido

Talleres Creativos:
  base_price * multiplicador(children_count)
  <=15: x1.0 | <=30: x1.3 | <=50: x1.5 | >50: x1.8

Otros (Servicios Fijos):
  base_price directo
```

### Archivos a crear/modificar
- **Crear**: `supabase/functions/recalculate-quotes/index.ts`
- **Modificar**: `supabase/config.toml` (registrar funcion)
- **Modificar**: `src/components/admin/AdminKanban.tsx` (boton de recalculo)

### Riesgos
- Minimo: solo actualiza precios, no modifica servicios ni estructura
- Las cotizaciones `completed` o `cancelled` no se tocan
- Si un `service_id` en quote_services no existe en la tabla services, se mantiene el precio actual

