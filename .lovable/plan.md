

# Auditoria Profunda: Edge Function `generate-quote` vs Base de Datos

## Resumen Ejecutivo

La Edge Function tiene **tres catalogos hardcodeados** (`CATALOGO_ESTACIONES`, `CATALOGO_FIJOS`, `CATALOGO_TALLERES`) que estan severamente desincronizados con la base de datos. Esto genera riesgos de regresion cada vez que se modifica un servicio en el admin.

---

## 1. Servicios que faltan en la BD

Los siguientes IDs existen en los catalogos hardcodeados pero **no existen en la tabla `services`**:

| ID hardcodeado | Catalogo | Accion requerida |
|---|---|---|
| `correo` | CATALOGO_ESTACIONES | Crear en BD o eliminar del catalogo |
| `peluqueria` | CATALOGO_ESTACIONES | Crear en BD o eliminar del catalogo |
| `pizzeria` | CATALOGO_ESTACIONES | Es un alias de `hamburgueseria` (que si existe en BD con title "Pizzeria"). Unificar ID |
| `pulseras` | CATALOGO_TALLERES | Es un alias de `haz-pulsera` (que si existe en BD). Unificar ID |

---

## 2. Desalineacion de Categorias entre Catalogos y BD

La clasificacion en los catalogos hardcodeados **contradice** la categoria asignada en la BD:

| ID | Catalogo hardcodeado | Categoria en BD | Impacto |
|---|---|---|---|
| `spa` | CATALOGO_FIJOS (fijo) | Talleres Creativos | Precio calculado sin multiplicador de ninos |
| `pesca` | CATALOGO_FIJOS (fijo) | Estaciones de Juego | No entra en formula de pares |
| `area_bebes` | CATALOGO_FIJOS (fijo) | Estaciones de Juego | No entra en formula de pares |
| `inflable_bebes` | CATALOGO_FIJOS (fijo) | Estaciones de Juego | No entra en formula de pares |
| `decora-cupcake` | CATALOGO_ESTACIONES | Talleres Creativos | Ya corregido en `deriveServiceSets`, pero catalogo sigue inconsistente |

Gracias a que `mapQuoteToConfig` ya usa la BD como fuente de verdad para clasificar, el impacto real es menor en el flujo `quoteId`. Pero el flujo directo (sin quoteId) y los fallbacks de nombre/subtitulo/items siguen usando los catalogos incorrectos.

---

## 3. Precios Hardcodeados vs BD

| ID | Precio en Catalogo | Precio en BD (base_price) | Diferencia |
|---|---|---|---|
| `spa` | $2,200 | $3,500 | -$1,300 |
| `pesca` | $1,200 | $800 | +$400 |
| `area_bebes` | $2,500 | $1,800 | +$700 |
| `foamy` | $800 | $2,000 | -$1,200 |
| `diamante` | $800 | $2,000 | -$1,200 |
| `haz-pulsera` | $1,500 | $2,500 | -$1,000 |
| `yesitos` | $1,500 | $1,800 | -$300 |

**Riesgo**: Si la consulta a BD falla o el servicio no se encuentra, la funcion usa el precio del catalogo como fallback, generando cotizaciones con montos incorrectos.

---

## 4. Constantes de Negocio Hardcodeadas

### Precios de formulas (lineas 638-639, 311-321)
```text
pairPrice = 3000   (precio por par de estaciones)
singlePrice = 1800 (precio de estacion individual)
$500 por estacion  (hora extra, linea 497)
```
Estos valores deberian derivarse de los `base_price` de la BD, no estar fijos.

### Datos bancarios (linea 824)
```text
"BBVA - Frida Velasquez Hdez. - CLABE: 012 610 015493815314"
```
Este dato deberia venir de la tabla `company_settings`.

### Duracion del evento (linea 1156)
```text
horas: 3  // Hardcodeado en mapQuoteToConfig
```
La tabla `quotes` no tiene campo `horas`. Se asume siempre 3 horas.

### Vigencia y anticipo (lineas 451-452)
```text
vigencia: "15 dias naturales"
anticipo_pct: 50
```
Podrian venir de `company_settings` o de un campo en `quotes`.

### Multiplicadores TIERS (lineas 297-302)
```text
<=15: x1.0 | <=30: x1.3 | <=50: x1.5 | >50: x1.8
```
Hardcodeados en la funcion y duplicados en `src/lib/pricing.ts`. Si se cambian en un lado, se dessincronizan.

---

## 5. Duplicacion de IDs (aliases)

Existen dos IDs que refieren al mismo servicio:

| ID en BD | ID en Catalogo | Titulo |
|---|---|---|
| `hamburgueseria` | `pizzeria` | Pizzeria |
| `haz-pulsera` | `pulseras` | Arma tu Pulsera / Haz tu Pulsera |

Esto causa que si alguien selecciona `hamburgueseria` en el frontend, la funcion no encuentra `pizzeria` en la BD y viceversa. La funcion tiene mapeo implicito pero fragil.

---

## 6. Campos faltantes en la BD para eliminar catalogos

Para poder eliminar completamente los catalogos hardcodeados, la tabla `services` necesita estos campos adicionales:

| Campo | Proposito | Estado actual |
|---|---|---|
| `features` | Items del servicio | Ya existe, pero incompleto para algunos servicios |
| `color` | Color de la card en el PDF | **No existe** — hardcodeado en catalogos |
| `subtitle` | Subtitulo descriptivo en el PDF | **No existe** — hardcodeado en catalogos |

Sin estos campos, la funcion no puede generar cards sin fallback al catalogo.

---

## 7. Mapa de Dependencias y Riesgos de Regresion

```text
+------------------+     +-------------------+     +------------------+
|   Admin Panel    |---->|   tabla services  |---->|  generate-quote  |
| (CRUD servicios) |     | (fuente de verdad)|     |  (Edge Function) |
+------------------+     +-------------------+     +------------------+
                                |                         |
                                |                    +----+----+
                                |                    |         |
                          +-----+------+      CATALOGO_*   deriveServiceSets()
                          |            |      (fallback)   (clasificacion)
                     base_price    category        |
                     hora_extra    features    Conflicto si
                                               difieren
```

**Flujo de regresion tipico:**
1. Admin agrega servicio nuevo en la BD
2. `deriveServiceSets()` lo clasifica correctamente por categoria
3. Pero no existe en ningun `CATALOGO_*`, asi que usa datos genericos (color "blue"/"green", sin subtitulo, sin items personalizados)
4. El PDF se genera con informacion incompleta

**Otro flujo de regresion:**
1. Admin cambia `base_price` de un servicio en BD
2. El precio de la BD se usa correctamente
3. Pero si la consulta a BD falla, el fallback usa el precio viejo del catalogo

---

## Plan de Accion Propuesto

### Fase 1 — Agregar campos faltantes a `services` (migracion)
- Agregar columna `pdf_color` (text, default 'blue')
- Agregar columna `pdf_subtitle` (text, nullable)
- Popular estos campos para todos los servicios existentes

### Fase 2 — Agregar servicios faltantes a la BD
- Crear `correo` y `peluqueria` en la tabla `services` (si siguen siendo servicios activos)
- Resolver alias: decidir si `pizzeria` se renombra a `hamburgueseria` o viceversa, y si `pulseras` se unifica con `haz-pulsera`

### Fase 3 — Eliminar catalogos hardcodeados de la Edge Function
- Eliminar `CATALOGO_ESTACIONES`, `CATALOGO_FIJOS`, `CATALOGO_TALLERES`
- Leer nombre, color, subtitulo, features, precio y hora_extra directamente de la BD
- Mantener `TIERS` como constante (es logica de negocio, no datos)

### Fase 4 — Mover datos bancarios a `company_settings`
- Leer datos de pago de la tabla `company_settings` en vez de hardcodear

### Fase 5 — Sincronizar `src/lib/pricing.ts`
- Asegurar que la logica de precios del frontend y la Edge Function usen los mismos parametros, idealmente leyendo de BD

### Archivos a modificar
- `supabase/functions/generate-quote/index.ts` — refactor completo de catalogos
- Migracion SQL — nuevas columnas y datos
- `src/lib/pricing.ts` — sincronizar constantes

