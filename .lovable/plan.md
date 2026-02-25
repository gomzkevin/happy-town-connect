

# Rediseno del Email de Cotizacion + PDF Adjunto

## Resumen

Redisenar la plantilla de email `quote-email-complete.tsx` para alinearse con la identidad visual de japitown (Fredoka/Quicksand, paleta de colores neutros/purpura, iconos del bucket), y modificar el flujo `send-quote-email` para generar el PDF automaticamente y adjuntarlo al correo.

---

## 1. Rediseno del HTML del Email (Identidad Corporativa)

### Cambios en `supabase/functions/send-quote-email/_templates/quote-email-complete.tsx`:

**Tipografia**:
- Reemplazar la font-family generica por Google Fonts embebidos via `<link>` en el `<Head>`:
  - `Fredoka` para encabezados (h1, h2, h3)
  - `Quicksand` para cuerpo de texto
- Nota: No todos los clientes de correo soportan Google Fonts, pero los principales (Gmail, Apple Mail, Outlook web) si. Se mantiene un fallback seguro (`Arial, sans-serif`).

**Paleta de colores**:
- Header: fondo `#f3ece5` (crema calido) en lugar de purpura solido, con texto `#555250`
- Acento principal: `#a68bea` (purpura) para bordes, badges de numero de cotizacion y fila de total
- Categorias de servicios con colores de tag: verde `#84bc70` (talleres) y azul `#9bc2e5` (estaciones)
- Footer y secciones secundarias: `#f3ece5` crema

**Logo e Iconos**:
- Usar el logo oficial desde el bucket publico: `https://hnkkgjmudteyzzfbogto.supabase.co/storage/v1/object/public/japitown-assets/logos/Logo-21.png`
- Agregar iconos decorativos (estrellas, nubes) del bucket `japitown-assets/icons/` como imagenes en el header y footer del email
- Los iconos se referencian como URLs publicas del bucket de Supabase Storage

**Estructura visual mejorada**:
- Header con logo centrado grande sobre fondo crema
- Badges de categoria por servicio (verde/azul) en la tabla de servicios
- Bordes redondeados en secciones (dentro de lo que permite email HTML)
- Footer con iconos decorativos y texto de marca

---

## 2. PDF Adjunto al Email

### Tradeoffs evaluados

| Opcion | Ventajas | Desventajas |
|---|---|---|
| **A) Generar PDF dentro de `send-quote-email`** | Un solo request, atomico | Duplica logica de `generate-quote`, Edge Function pesada |
| **B) Llamar a `generate-quote` desde `send-quote-email`** | Reutiliza logica existente, un solo punto de verdad | Latencia adicional (~2-5s), dependencia entre funciones |
| **C) Generar PDF en el frontend antes de enviar email** | Separacion clara | Mala UX (el usuario espera mas), requiere cambios en el frontend |

**Recomendacion: Opcion B** - `send-quote-email` invoca internamente a `generate-quote` con el `quoteId`, obtiene el PDF ya generado (o lo genera si no existe), y lo adjunta al correo via Resend.

### Flujo propuesto

```text
Cliente completa wizard/servicios
        |
        v
useQuotes.submitQuote()
        |
        v
  send-quote-email (Edge Function)
        |
        +-- 1. Llama a generate-quote con quoteId
        |      (genera PDF y lo sube a Storage)
        |
        +-- 2. Descarga el PDF desde Storage (como bytes)
        |
        +-- 3. Renderiza email HTML con nueva plantilla
        |
        +-- 4. Envia via Resend con PDF como attachment
        |
        v
  Cliente recibe email con PDF adjunto
```

### Cambios en `supabase/functions/send-quote-email/index.ts`:

1. Despues de preparar `emailData`, invocar `generate-quote` pasando el `quoteId`:
   - Hacer un `fetch` interno al endpoint de `generate-quote` con `{ quoteId }` y `output=storage`
   - Obtener la `pdf_url` del response
2. Descargar el PDF desde la URL publica de Storage como `Uint8Array`
3. Usar el campo `attachments` de Resend para adjuntar el PDF:
   ```typescript
   attachments: [{
     filename: `Cotizacion-japitown-${quoteNumber}.pdf`,
     content: Buffer.from(pdfBytes).toString('base64'),
   }]
   ```
4. Si la generacion del PDF falla, enviar el email sin adjunto (fallback graceful) y loguear el error

### Impacto en latencia:
- Actualmente el email se envia en ~1-2s
- Con PDF adjunto: ~4-7s totales (generacion PDF + upload + descarga + envio)
- Esto es aceptable porque el usuario ya ve el toast de confirmacion inmediato (el email se envia en background)

---

## 3. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/send-quote-email/_templates/quote-email-complete.tsx` | Rediseno completo: tipografia Fredoka/Quicksand, paleta crema/purpura, logo e iconos del bucket, badges de categoria |
| `supabase/functions/send-quote-email/index.ts` | Agregar logica para: (1) invocar `generate-quote`, (2) descargar PDF, (3) adjuntar al email via Resend |

### Archivos que NO se modifican
- `supabase/functions/generate-quote/index.ts` — se reutiliza tal cual, sin cambios
- `src/hooks/useQuotes.ts` — el flujo del frontend no cambia, sigue invocando solo `send-quote-email`
- `supabase/config.toml` — no requiere cambios

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| `generate-quote` falla o timeout | Enviar email sin PDF y loguear error en `quote_history` |
| Iconos/logo no cargan en ciertos clientes de correo | Los iconos son decorativos, el contenido critico es texto; se usan `alt` tags descriptivos |
| Google Fonts no soportadas en Outlook desktop | Fallback a Arial/sans-serif en la declaracion de font-family |
| PDF muy grande para adjuntar via Resend | Los PDFs de japitown son ~100-200KB, Resend permite hasta 40MB |
| Latencia total del email aumenta | El toast de confirmacion es inmediato; el email es asincrono para el usuario |

