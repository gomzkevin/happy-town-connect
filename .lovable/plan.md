

# Cambios pendientes en el template del email

Estos cambios requieren modificar el codigo porque son strings hardcoded en el template HTML o logica de renderizado que no depende de la BD.

---

## Archivo 1: `supabase/functions/send-quote-email/_templates/quote-email-complete.tsx`

### Cambio A — Subtitulo del header (linea 119)
- **Actual**: `"Entretenimiento Infantil Premium"`
- **Nuevo**: `"Eventos Infantiles"`

### Cambio B — Texto de bienvenida (linea 151-152)
- **Actual**: `Gracias por contactar a <strong>{companyName}</strong>. Hemos preparado una cotización personalizada para tu evento.`
- **Nuevo**: `Gracias por tu interés en <strong>Japitown</strong>. Hemos preparado una cotización personalizada para tu evento.`

### Cambio C — Terminos y condiciones como bullets formateados (lineas 262-266)
Reemplazar el bloque actual que renderiza `{termsConditions}` como un solo `<Text>` por logica que:
1. Divide el texto de `termsConditions` por saltos de linea
2. Renderiza cada linea como un `<Text>` individual con estilo de bullet
3. Reemplaza dinamicamente la palabra "25 niños" (o cualquier numero) con el valor real de `{childrenCount}` cuando este disponible

Esto permite que el contenido siga viniendo de la BD pero se presente visualmente formateado.

### Cambio D — Vigencia en el footer (linea 281)
- **Actual**: `"Esta cotización es válida por 30 días desde la fecha de emisión."`
- **Nuevo**: `"Esta cotización es válida por 15 días desde la fecha de emisión."`

---

## Archivo 2: `supabase/functions/send-quote-email/index.ts`

### Cambio E — Fallback de email (linea 314)
- **Actual**: `'cotizaciones@japitown.com'`
- **Nuevo**: `'fvh_32@hotmail.com'`

---

## Resumen de archivos

| Archivo | Cambios |
|---|---|
| `quote-email-complete.tsx` | Subtitulo, greeting, bullets de T&C, vigencia footer |
| `index.ts` | Fallback de email |

## Nota sobre company_name
El `company_name` en la BD es `"Japitown - Eventos Infantiles"`. Este valor se usa en el subject del email y en el footer ("Gracias por confiar en..."). Si se prefiere que esos lugares digan solo "Japitown", se puede cambiar en la BD a solo `"Japitown"` y mantener "Eventos Infantiles" solo como subtitulo del header. No se requiere cambio de codigo para eso.
