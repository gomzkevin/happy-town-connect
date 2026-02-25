

# Fix: Botón de descarga PDF y precios ajustados por niños

## Problemas identificados

### Problema 1: Edge Function falla con `ReferenceError: dbServices is not defined`
Los logs muestran claramente el error:
```
Error generating quote PDF: ReferenceError: dbServices is not defined
    at mapQuoteToConfig (generate-quote/index.ts:1694:19)
```

En la funcion `mapQuoteToConfig` (linea 1075 del archivo fuente), el codigo de clasificacion dinamica referencia `dbServices.get(sid)` pero esa variable **nunca se declara ni se inicializa**. Fue agregada como parte del "Paso 3" del plan anterior (eliminar clasificacion rigida) pero falto crear el Map con los datos de la BD.

Cuando un `service_id` esta en las listas hardcodeadas (`ESTACION_IDS`, `TALLER_IDS`, `FIJO_IDS`), funciona bien (por eso la segunda ejecucion exitosa en los logs muestra los 3 servicios correctos). Pero cuando cae al fallback dinamico, explota.

**Por que a veces funciona y a veces no:** Supabase ejecuta multiples versiones de la Edge Function simultaneamente. La version anterior (sin el codigo de `dbServices`) funciona. La version nueva falla solo cuando un servicio no esta en las listas hardcodeadas.

### Problema 2: Precios en selector de servicios no muestran ajuste por niños
En las lineas 644 y 1007, el selector de servicios muestra `$svc.base_price.toLocaleString()` — el precio base crudo de la BD. Deberia mostrar el precio ajustado segun `calcularPreciosCotizacion` (que aplica multiplicadores por numero de niños para talleres y formula de pares para estaciones).

---

## Plan de correccion

### Paso 1 — Corregir `dbServices` en la Edge Function
En `supabase/functions/generate-quote/index.ts`, dentro de `mapQuoteToConfig`, agregar una consulta a la tabla `services` para construir el Map `dbServices` **antes** del loop de clasificacion:

```typescript
// Fetch all active services from DB for dynamic classification
const { data: allDbServices } = await supabase
  .from("services")
  .select("id, title, category, base_price, hora_extra, features")
  .eq("is_active", true);

const dbServices = new Map<string, any>();
for (const s of allDbServices || []) {
  dbServices.set(s.id, s);
}
```

Esto se inserta justo despues de obtener `qServices` (linea 1061) y antes del loop `for (const qs of qServices || [])` (linea 1067).

### Paso 2 — Mostrar precios ajustados en el selector de servicios
En los dos lugares donde se muestra `$svc.base_price.toLocaleString()`:

**NewQuoteDialog (linea 644):** Reemplazar con el precio calculado de `priceMap`:
```typescript
<p className="text-muted-foreground mt-0.5">
  ${(isSelected ? (priceMap.get(svc.id) ?? svc.base_price) : svc.base_price).toLocaleString()}
</p>
```

**QuoteDetailDialog edit mode (linea 1007):** Mismo patron con `editPriceMap`:
```typescript
<p className="text-muted-foreground mt-0.5">
  ${(isSelected ? (editPriceMap.get(svc.id) ?? svc.base_price) : svc.base_price).toLocaleString()}
</p>
```

Asi, cuando un servicio esta seleccionado, muestra el precio ajustado; cuando no esta seleccionado, muestra el precio base.

### Paso 3 — Sin cambios al mecanismo de descarga
El boton de descarga (lineas 342-374) esta implementado correctamente con fetch-blob-createObjectURL. El problema de descarga es **consecuencia** del error de la Edge Function: si `generate-quote` falla con error 500, no hay `pdf_url` nuevo, y el boton no puede descargar nada. Al corregir el Paso 1, la generacion funcionara y el boton de descarga operara normalmente.

---

## Archivos a modificar

1. **`supabase/functions/generate-quote/index.ts`** — Agregar consulta de `services` y crear Map `dbServices` (6 lineas nuevas)
2. **`src/components/admin/AdminKanban.tsx`** — Mostrar precio ajustado en selector de servicios (2 lineas modificadas)

## Riesgo de regresion

- **Edge Function**: El cambio solo agrega la variable faltante. No modifica logica de clasificacion, layout, ni generacion de PDF. Los servicios que ya estan en listas hardcodeadas siguen funcionando igual (el fallback dinamico solo se usa cuando no estan en esas listas).
- **Frontend**: El precio mostrado cambia solo visualmente cuando el servicio esta seleccionado. Los calculos de `calcularPreciosCotizacion` y los datos guardados en `quote_services` no se modifican.
