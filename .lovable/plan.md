

# Fix: Precios individuales de estaciones no incluyen horas extra en el PDF

## Problema
En `drawEstacionResumen` (línea 660-661), los precios por par ($3,000) y por estación individual ($1,800) están **hardcodeados**. El total del bloque sí incluye las horas extra (se calcula correctamente en `calcularTotal`), pero cada renglón del desglose muestra el precio base sin las horas extra.

Además, la línea 647 dice "3 horas" hardcodeado en el subtítulo.

## Solución

### Archivo: `supabase/functions/generate-quote/index.ts`

1. **Pasar `extraHours` a `drawEstacionResumen`** (o derivarlo de `config.horas`).

2. **Calcular precio por par y por estación individual con horas extra**:
   - `pairPrice = 3000 + (hora_extra_svc1 + hora_extra_svc2) * extraHours`
   - `singlePrice = 1800 + hora_extra_svc * extraHours`

3. **Actualizar el subtítulo** de "3 horas" a `${config.horas || 3} horas`.

4. **Redesplegar** la Edge Function.

### Cambio concreto

En la función `drawEstacionResumen`:
- Agregar parámetro `extraHours: number`
- Línea 660: calcular `pairPrice` dinámicamente para cada par usando `hora_extra` de cada servicio del par
- Línea 697: calcular `singlePrice` dinámicamente usando `hora_extra` del servicio
- Línea 647: usar horas reales en el texto

En las llamadas a `drawEstacionResumen` (línea 1142): pasar `extraHours`.

