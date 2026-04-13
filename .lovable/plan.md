

# PDF multi-página: Página 1 = Cotización, Página 2 = Condiciones y Pago

## Problema
La Edge Function `generate-quote` renderiza todo en una sola página PDF (612x792 pts). Con cotizaciones largas (muchos servicios), las condiciones y datos de pago se cortan o salen del área visible.

## Solución
Siempre generar 2 páginas:
- **Página 1**: Header, título, datos del evento, tarjetas de servicios, barra de total, nota de hora extra
- **Página 2**: Condiciones, datos bancarios/pago, vigencia de la cotización, footer decorativo

## Cambios técnicos

### Archivo: `supabase/functions/generate-quote/index.ts`

1. **Modificar `generateQuotePDF`** (líneas ~943-1057):
   - Página 1: Renderizar header, título, callout, bloques de servicios, barra de total y nota de hora extra. Footer decorativo al fondo.
   - Crear una segunda página con `pdfDoc.addPage([W, H])`.
   - Página 2: Renderizar header simplificado (logo + "Condiciones y forma de pago"), condiciones completas, datos bancarios/pago, vigencia, iconos decorativos y footer.

2. **Beneficio en página 1**: Al liberar el espacio de condiciones y pago (~100pts), las tarjetas de servicios tienen más espacio y mejor distribución vertical, incluso con 6+ servicios.

3. **Página 2 — Contenido**:
   - Encabezado con logo y referencia al cliente
   - Sección "Condiciones del servicio" (todas las condiciones generadas por `generarCondiciones`)
   - Sección "Forma de pago" con datos bancarios de `company_settings.bank_info`
   - Sección "Vigencia" con la vigencia de la cotización
   - Nota de hora extra (si aplica)
   - Footer decorativo (rainbow stripe + iconos + footer bar)

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `supabase/functions/generate-quote/index.ts` | Refactorizar `generateQuotePDF` para 2 páginas |

### Sin cambios en
- Base de datos
- Frontend (el PDF se descarga igual, solo ahora tiene 2 páginas)
- Otras Edge Functions

