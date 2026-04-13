

# Fix: Hora Extra duplicada en el PDF

## Problemas encontrados

### Problema 1 — El renglón de hora extra se renderiza en AMBAS páginas
En `generateQuotePDF`, `drawExtraHourNote` se llama dos veces:
- Línea 1142-1144: en la **página 1** (después del total)
- Línea 1170-1173: en la **página 2** (antes de condiciones)

Esto causa que el renglón completo aparezca duplicado.

### Problema 2 — Dentro del renglón, "taller" aparece duplicado con valores distintos
En `generarNotaHoraExtra` (líneas 482-495), los servicios `fijos` y `talleres` se agrupan por precio en el mismo `extras` map. Si tienen `hora_extra` diferente, se generan múltiples entradas todas etiquetadas `"por taller"` (línea 494: `nombres.length === 1 ? 'taller' : 'taller'` — ambas ramas dicen lo mismo). Debería distinguir entre "servicio fijo" y "taller", o simplemente usar el nombre del servicio.

## Correcciones

### Archivo: `supabase/functions/generate-quote/index.ts`

1. **Eliminar la llamada duplicada en página 2** (líneas 1170-1173): Quitar `drawExtraHourNote` de la página 2. Solo debe aparecer en la página 1 debajo del total.

2. **Corregir `generarNotaHoraExtra`** (líneas 482-495):
   - Separar la lógica de `fijos` y `talleres` para que se etiqueten correctamente ("por servicio fijo" vs "por taller")
   - O mejor: agrupar por precio y usar la etiqueta genérica correcta según el tipo, evitando duplicados del mismo concepto

3. **Redesplegar** la Edge Function.

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| `supabase/functions/generate-quote/index.ts` | Quitar `drawExtraHourNote` duplicado en pág. 2; corregir etiquetas en `generarNotaHoraExtra` |

