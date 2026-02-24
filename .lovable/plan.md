

## Creacion Manual de Cotizaciones desde el Admin

### Contexto

Actualmente las cotizaciones solo se crean desde el lado del cliente (wizard de onboarding o carrito de servicios). El equipo de Japitown necesita poder crear cotizaciones manualmente para leads que llegan por WhatsApp, Facebook o Instagram.

### Alcance de esta iteracion

1. **Formulario de creacion de cotizacion manual** en el panel admin
2. **Generacion de PDF** directamente en Supabase Edge Functions (sin depender de Google Cloud)
3. **Almacenamiento y descarga del PDF** desde la tarjeta del cliente en el pipeline
4. **Integracion automatica con calendario** (ya funciona, solo verificar consistencia)

Queda fuera de esta iteracion: envio automatico por WhatsApp/FB/Instagram.

---

### Cambios detallados

#### 1. Formulario "Nueva Cotizacion" en AdminKanban

Agregar un boton "Nueva Cotizacion" en la vista del pipeline que abra un dialog con:

- **Datos del cliente**: Nombre, email, telefono, ubicacion
- **Datos del evento**: Fecha, nombre del festejado, numero de ninos, rango de edad
- **Selector de servicios**: Lista de servicios existentes con checkboxes y campo de cantidad (cargados desde la tabla `services`)
- **Notas**: Campo libre para observaciones
- **Origen**: Badge automatico "Manual" (se guarda `source: 'manual'` en la tabla `quotes`)

Al guardar:
- Se inserta en `quotes` con `status: 'pending'`, `source: 'manual'`, `quote_type: 'manual'`
- Se insertan los servicios seleccionados en `quote_services`
- La cotizacion aparece automaticamente en la columna "Pendiente" del pipeline
- Si tiene `event_date`, aparece automaticamente en el calendario (ya funciona asi)

**Archivos afectados:**
- `src/components/admin/AdminKanban.tsx` -- Agregar boton + dialog de creacion

#### 2. Edge Function para generacion de PDF

Crear una nueva Edge Function `generate-quote-pdf` que:

- Reciba el `quoteId` como parametro
- Consulte la cotizacion, sus servicios, y los datos de la empresa desde la BD
- Genere el PDF usando `jspdf` (biblioteca compatible con Deno)
- Suba el PDF a un nuevo bucket de Supabase Storage (`quote-pdfs`)
- Actualice el campo `pdf_url` en la tabla `quotes`
- Retorne la URL publica del PDF

**Archivos nuevos:**
- `supabase/functions/generate-quote-pdf/index.ts`

**Cambios en config:**
- `supabase/config.toml` -- Agregar configuracion de la nueva funcion

**Migracion de BD:**
- Crear bucket de storage `quote-pdfs` (publico)

#### 3. Boton "Generar PDF" y "Descargar PDF" en la tarjeta del cliente

En el `QuoteDetailDialog` del Kanban:

- Agregar seccion de "Documento" con:
  - Boton "Generar Cotizacion PDF" que llama a la Edge Function
  - Una vez generado, mostrar boton "Descargar PDF" con enlace directo al archivo
  - Indicador de estado (generando / listo / error)
- El `pdf_url` se almacena en la cotizacion, asi que al volver a abrir la tarjeta, el boton de descarga ya estara disponible si el PDF fue generado previamente

**Archivos afectados:**
- `src/components/admin/AdminKanban.tsx` -- Seccion de documento en `QuoteDetailDialog`

#### 4. Actualizacion del badge de origen en QuoteCard

Actualmente el badge muestra "Wizard" o "Servicios". Agregar soporte para el nuevo origen:

- `manual` -> "Manual"
- `onboarding` -> "Wizard"  
- `services` -> "Servicios"

**Archivos afectados:**
- `src/components/admin/AdminKanban.tsx` -- Logica del badge en `QuoteCard`

#### 5. Verificacion de consistencia en calendario

El calendario ya muestra cotizaciones con `event_date`. Las cotizaciones manuales tambien tendran `event_date`, por lo que apareceran automaticamente. Solo hay que verificar que el filtro `neq('status', 'cancelled')` en `AdminCalendar.tsx` no excluya las nuevas cotizaciones manuales (no deberia, ya que inician como `pending`).

No se requieren cambios en el calendario.

---

### Resumen de archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| `src/components/admin/AdminKanban.tsx` | Modificar: agregar formulario de creacion, seccion PDF en detalle, badge "Manual" |
| `supabase/functions/generate-quote-pdf/index.ts` | Crear: Edge Function para generar PDF con jspdf |
| `supabase/config.toml` | Modificar: agregar configuracion de `generate-quote-pdf` |
| Migracion SQL | Crear bucket `quote-pdfs` |

### Riesgos y mitigacion

- **AdminKanban.tsx ya es un archivo grande (~554 lineas)**: Se agregaran los componentes nuevos de forma modular dentro del mismo archivo para mantener consistencia con el patron actual, pero si crece demasiado se podra extraer a componentes separados en una futura iteracion.
- **El campo `source` no tiene restriccion CHECK en la BD**: Esto es correcto, ya que se maneja como texto libre. Solo hay que ser consistente con los valores usados en el codigo.
- **El campo `pdf_url` ya existe en la tabla `quotes`**: No se necesita migracion de esquema para esto.

