

# Reemplazar el generador de PDF con la version correcta

## Problema identificado

El archivo `supabase/functions/generate-quote/index.ts` actual (974 lineas) es una version anterior al archivo que subiste (1160 lineas). Las diferencias principales son:

| Aspecto | Version actual (vieja) | Version correcta (subida) |
|---|---|---|
| Lineas | 974 | 1160 |
| ID estacion | `hamburgueseria` | `pizzeria` |
| ID taller | `haz-pulsera` | `pulseras` |
| Iconos en PDF | Carga iconos de servicio (01-12) | Solo iconos decorativos (13-19) |
| CardSizes | Sin `bodyPadTop`/`bodyPadBot` | Con padding adaptativo |
| Firma `precioTaller` | `(basePrice, nNinos)` | `(key, nNinos, dbPrice?)` |
| Catalogo fijos | Sin precios en catalogo | Con precios y hora extra |
| Visual | Sin banda arcoiris, sin iconos dispersos | Rainbow stripe, scattered icons, icon band |
| Espaciado | Basico | Sistema adaptativo con gaps minimos y bonus distribuido |

No hay dos funciones compitiendo: `generate-quote-pdf` (jsPDF) existe en el repo pero ningun componente del cliente lo invoca. El problema es simplemente que el archivo fue revertido o sobrescrito en algun momento.

## Plan de accion

### Paso 1: Reemplazar el archivo de la edge function
Sobrescribir `supabase/functions/generate-quote/index.ts` con el contenido completo del archivo subido (1160 lineas). Esto se despliega automaticamente.

### Paso 2: Verificar que no se necesitan otros cambios
No hay cambios necesarios en el cliente -- la funcion se invoca de la misma forma (`supabase.functions.invoke('generate-quote', { body: { quoteId } })`). La interfaz de entrada/salida es identica.

## Notas
- La version correcta usa solo iconos decorativos (13-19) del storage, lo cual es mas eficiente en CPU.
- Los IDs de servicio cambian (`pizzeria` en lugar de `hamburgueseria`, `pulseras` en lugar de `haz-pulsera`). Si la base de datos usa los IDs viejos, habria un desajuste. Esto se valida con los logs que ya muestran `haz-pulsera` -- habria que confirmar si la BD tiene `pulseras` o `haz-pulsera`.

