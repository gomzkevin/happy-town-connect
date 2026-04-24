

# Fix: Emails de cotización no se entregan (dominio no verificado en Resend)

## Problema

Las cotizaciones del wizard se guardan en BD y los PDFs se generan, pero **ningún email se ha entregado** al cliente desde que se configuró el remitente. Resend rechaza cada envío con:

> `The hotmail.com domain is not verified.`

Causa: el edge function `send-quote-email` usa `companySettings.email` (`fvh_32@hotmail.com`) como remitente `from`. Resend solo permite enviar desde dominios verificados por DNS — nunca desde `@hotmail.com`, `@gmail.com`, etc.

Además, el frontend muestra "¡Cotización enviada!" aunque el envío haya fallado, porque el error se loguea pero no se propaga.

## Decisión

Separar dos conceptos en el código y en la UI de configuración de empresa:

| Campo | Uso | Ejemplo |
|---|---|---|
| **Email de envío (`from`)** | Remitente de Resend. Debe pertenecer a un dominio verificado. | `cotizaciones@japitown.com` |
| **Email de contacto (`reply_to`)** | Dirección a la que el cliente responde. Puede ser cualquiera. | `fvh_32@hotmail.com` |

Así el cliente recibe el correo desde un dominio profesional y, al responder, le llega a la bandeja real del negocio.

## Cambios

### 1. Edge Function `send-quote-email/index.ts`
- Cambiar `from` a un remitente fijo desde dominio verificado: `Japitown <cotizaciones@japitown.com>` (o el subdominio que se verifique).
- Agregar `reply_to: [companySettings.email]` para que las respuestas lleguen al hotmail del negocio.
- Mantener `companyName` y `companyEmail` en el cuerpo/footer del template (info de contacto visible para el cliente), separados del header SMTP.
- Mejorar manejo de error: si Resend falla, devolver `{ success: false, error: ... }` con HTTP 200 pero flag explícito, y el frontend debe mostrar toast de advertencia ("Cotización guardada, pero no se pudo enviar el email — revisa configuración").

### 2. `src/hooks/useQuotes.ts`
- Detectar `emailResult?.success === false` y mostrar toast `variant: "destructive"` con mensaje claro, en vez de el "¡Cotización enviada!" actual.
- Igual seguir devolviendo `quote` (la cotización sí quedó guardada).

### 3. Verificación de dominio en Resend (acción del usuario, no código)
- Agregar y verificar `japitown.com` (o `mail.japitown.com`) en https://resend.com/domains añadiendo los registros DNS (SPF, DKIM, opcional DMARC) en el proveedor de dominio.
- Una vez verificado, el `from: cotizaciones@japitown.com` empezará a entregar.

### 4. (Opcional) `CompanySettingsForm.tsx`
- Renombrar el campo actual "Email" a "Email de contacto (respuestas)" para que quede claro que NO es el remitente técnico.
- Indicar en helper text que el remitente está configurado en el dominio verificado de Resend.

### 5. Backfill / Comunicación
- Las cotizaciones recientes (Juan Oablo del 23-abr, Queti del 28-feb, etc.) **nunca recibieron su email**. Generar lista de cotizaciones `source IN ('onboarding','services')` cuyo último `quote_history.email_sent` esté en `failed`, para reenvío manual una vez arreglado.

## Pasos en orden

1. Confirmar/elegir el dominio remitente (`japitown.com` o subdominio).
2. Usuario verifica dominio en Resend (DNS).
3. Aplicar cambios 1, 2 y 4 al código.
4. Probar con una cotización dummy desde el wizard.
5. Generar lista de cotizaciones huérfanas para reenvío.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/send-quote-email/index.ts` | `from` fijo verificado, agregar `reply_to`, mejorar respuesta de error |
| `src/hooks/useQuotes.ts` | Detectar fallo de email y mostrar toast distinto |
| `src/components/admin/CompanySettingsForm.tsx` | Renombrar label del campo email + helper text |

