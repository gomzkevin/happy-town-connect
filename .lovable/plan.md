
# Corregir el generador de PDF: servicios faltantes

## Problema

Al generar el PDF para una cotizacion con 3 servicios (supermercado, haz-pulsera, yesitos), solo aparece "yesitos". Esto se debe a 3 bugs en el archivo `supabase/functions/generate-quote/index.ts`:

### Bug 1: ID desalineado -- `haz-pulsera` vs `pulseras`
- La base de datos usa `service_id = "haz-pulsera"`, pero `TALLER_IDS` (linea 246) lista `"pulseras"`.
- En `mapQuoteToConfig`, `haz-pulsera` no coincide con ninguna categoria y se descarta silenciosamente.
- El catalogo `CATALOGO_TALLERES` tampoco tiene entrada para `haz-pulsera`.

### Bug 2: Estaciones con 1 sola se ignoran
- `calcularLayout` (linea 338) solo genera el bloque de estaciones si `est.length >= 2`.
- `calcularTotal` (linea 309) tambien ignora estaciones si hay menos de 2.
- `precioEstaciones(1)` retorna `$0` (linea 292).
- Resultado: si solo hay 1 estacion (como `supermercado`), no aparece en el PDF ni se cobra.

### Bug 3: Resumen tambien omite estaciones solas
- `generarResumen` (linea 428) dice `if (nEst >= 2)`, asi que 1 estacion no aparece en el texto resumen.

## Solucion

### Paso 1: Agregar `haz-pulsera` como alias en TALLER_IDS
Agregar `"haz-pulsera"` a la lista `TALLER_IDS` para que se clasifique correctamente:
```
const TALLER_IDS = ["caballetes", "yesitos", "pulseras", "haz-pulsera", "foamy", "diamante"];
```

### Paso 2: Agregar entrada en CATALOGO_TALLERES para `haz-pulsera`
Duplicar la entrada de `pulseras` con la clave `haz-pulsera` para que el nombre, precio e items se resuelvan correctamente.

### Paso 3: Manejar 1 estacion sola
Cuando solo hay 1 estacion, renderizarla como tarjeta individual (tipo card) en lugar de ignorarla. Cambios en:
- `calcularLayout`: si `est.length === 1`, crear una CardData y agregarla a las cards en vez del bloque resumen.
- `calcularTotal`: calcular precio para 1 estacion (usar el `base_price` de la BD o un precio por defecto).
- `precioEstaciones`: ajustar para que `n=1` retorne un precio razonable (el `base_price` del servicio de la BD).

### Paso 4: Actualizar texto resumen
- `generarResumen`: cambiar `if (nEst >= 2)` a `if (nEst >= 1)` para incluir estaciones solas.
- `generarNotaHoraExtra`: cambiar `if (... >= 2)` a `if (... >= 1)` de la misma forma.

## Archivos a modificar
- `supabase/functions/generate-quote/index.ts` (se despliega automaticamente)

## Alternativa mas simple
Si el negocio NO deberia permitir cotizaciones con 1 sola estacion (siempre deben ser 2+), entonces solo necesitamos resolver el Bug 1 (alias `haz-pulsera`). Pero dado que el sistema ya permite agregar 1 estacion, la solucion completa es mas robusta.
