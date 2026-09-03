# Actualizar precio de estaciones: $1,800 → $2,000 y par $3,000 → $3,500

## Donde vive hoy el calculo

| Lugar | Que hace |
|---|---|
| `src/lib/pricing.ts` (lineas 68-79, 124-128) | Precio de estaciones en el frontend (wizard publico, ServiceCart, NewQuoteDialog y edicion en Kanban). Formula: `floor(n/2)*3000 + (n%2)*1800`; una sola estacion usa su `base_price` de BD |
| `supabase/functions/send-quote-email/index.ts` (linea 210) | Copia de la misma formula para recalcular el total del correo |
| `supabase/functions/generate-quote/index.ts` (lineas 294-305) | `precioEstaciones` para el total del PDF; con 1 estacion usa `base_price` de BD, fallback 1800 |
| `supabase/functions/generate-quote/index.ts` (lineas 713, 737) | Precios individuales que se imprimen dentro del bloque "estaciones": `pairPrice = 3000 + horas extra`, `singlePrice = 1800 + horas extra` |
| Tabla `services` | `base_price` = 1800 y texto `price` = "$1,800"/"$1800" en cada estacion |

## Cambios de datos (tabla `services`)

Solo categoria "Estaciones de Juego", excluyendo `pesca` (se queda en $800 por decision del negocio):

- `cafeteria`, `construccion`, `guarderia`, `hamburgueseria`, `supermercado`, `veterinaria` → `base_price = 2000` y `price = '$2,000'`
- `correo` y `peluqueria` (inactivos) tambien se actualizan por consistencia, aunque no se muestran
- No se toca ningun taller, ni Extras (`area_bebes`, `inflable_bebes`), ni `kit-yesitos` (per_child), ni ningun `hora_extra`

## Cambios de codigo

Introducir constantes con nombre en lugar de numeros sueltos, en los tres archivos:

- `PRECIO_ESTACION_INDIVIDUAL = 2000`
- `PRECIO_PAR_ESTACIONES = 3500`

Reemplazos:
1. `src/lib/pricing.ts`: formula del par, fallback de estacion unica y comentario del encabezado.
2. `supabase/functions/send-quote-email/index.ts` linea 210.
3. `supabase/functions/generate-quote/index.ts`: `precioEstaciones` (fallback y formula) y los precios individuales impresos (`pairPrice`, `singlePrice`), manteniendo la suma de horas extra tal como esta.

Ambas Edge Functions se redespliegan automaticamente.

## Impactos a revisar

- **Cotizaciones nuevas**: total, tarjetas del PDF y correo suben. Ej. 4 estaciones: $6,000 → $7,000; 3 estaciones: $4,800 → $5,500.
- **Cotizaciones existentes**: `total_estimate` y `quote_services.service_price` guardados no cambian (historico intacto). Pero si se **regenera el PDF** o se **edita** una cotizacion antigua, se recalcula con los precios nuevos y el total cambiara. Esto es esperado; conviene saberlo antes de regenerar PDFs viejos.
- **Pesca y Boliche**: sigue en $800 como precio individual, pero cuando se empareja con otra estacion el par se cobra $3,500 (la formula del par no mira el `base_price`). Igual, si queda como estacion impar sobrante, la formula le cobra $2,000, no $800. Si eso no es deseado, habria que sacar `pesca` de la categoria de estaciones o darle su propio manejo — se puede tratar como ajuste aparte.
- **Landing y tarjetas de servicio**: mostraran "$2,000" al venir de BD; no hay textos hardcodeados de precio en componentes.
- **Horas extra**: no se alteran ($500 por estacion como esta hoy en BD); el nuevo precio base solo cambia el punto de partida.
- **Descuentos y gastos de operacion**: se calculan sobre el subtotal de servicios, asi que absorben el nuevo precio automaticamente sin cambios.
- **KPIs y pagos**: siguen leyendo `quote_payments` y totales guardados; no requieren cambios.
