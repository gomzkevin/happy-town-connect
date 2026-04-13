

# Simplificar hora extra a solo 2 categorías

## Situación actual
La función `generarNotaHoraExtra` genera una línea por cada combinación precio+tipo, resultando en texto largo como:
> $500 por estación · $500 por servicio · $1,000 por taller · $500 por Arte + Foami

Esto ocurre porque:
1. Hay 3 categorías internas (estaciones, fijos, talleres) con sub-agrupación por precio
2. Los valores de `hora_extra` en BD no son uniformes dentro de cada categoría (Arte+Foami tiene $800 vs los demás talleres $1,000; Pesca tiene $802 vs $800)

## Solución propuesta

### Paso 1 — Homologar `hora_extra` en la BD
Corregir los valores inconsistentes para que cada grupo tenga un solo precio:

| Servicio | hora_extra actual | hora_extra corregido |
|---|---|---|
| Pesca y Boliche | 802 | 800 |
| Arte + Foami (diamante) | 800 | 1,000 |

Esto deja:
- **Estaciones + Extras**: todos a $800
- **Talleres Creativos**: todos a $1,000

### Paso 2 — Simplificar `generarNotaHoraExtra` en la Edge Function
Reescribir la función para generar solo 2 líneas:
- `$800 por estación` (si hay estaciones/extras/fijos)
- `$1,000 por taller` (si hay talleres creativos)

La lógica sería: tomar el `hora_extra` del primer servicio de cada grupo (ya que son uniformes) y usar etiqueta genérica. Resultado:
> Hora adicional disponible: $800 por estación · $1,000 por taller · Sujeto a disponibilidad

### Paso 3 — Redesplegar la Edge Function

## Archivos a modificar
| Recurso | Cambio |
|---|---|
| BD tabla `services` | UPDATE hora_extra de `pesca` a 800 y `diamante` a 1000 |
| `supabase/functions/generate-quote/index.ts` | Reescribir `generarNotaHoraExtra` con solo 2 buckets |

## Pregunta de confirmación
- ¿Los valores $800/estación y $1,000/taller son correctos, o prefieres otros montos?
- ¿"Kit yesitos personalizados" (categoría `talleres-creativos` con minúscula y hora_extra=800) debería también ser $1,000? Parece un servicio duplicado o legacy.

