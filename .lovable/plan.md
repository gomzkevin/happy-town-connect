

# Plan: Nueva Edge Function `generate-quote` + Numero de ninos obligatorio

## Resumen

Se reemplazara la edge function actual `generate-quote-pdf` (basada en jsPDF) por una nueva `generate-quote` basada en el spec proporcionado, usando `pdf-lib` + `@pdf-lib/fontkit` con el diseno visual de marca Japitown. Ademas, el campo "numero de ninos" se hara obligatorio en todos los flujos de cotizacion (wizard, servicios y manual).

---

## Parte 1: Alinear los servicios en la BD con el spec

El spec clasifica 17 servicios en 3 categorias, pero la BD actual solo tiene 12 servicios en 2 categorias. Necesitamos:

**Servicios que faltan en la BD (5 nuevos):**
- `cafeteria` (Estacion)
- `correo` (Estacion)
- `peluqueria` (Estacion)
- `area_bebes` (Servicio Fijo)
- `inflable_bebes` (Servicio Fijo)
- `foamy` (Taller)
- `diamante` (Taller)

**Reclasificacion necesaria:**
El spec divide en 3 categorias: Estaciones Mini Ciudad, Servicios Fijos y Talleres Creativos. Actualmente la BD tiene "Estaciones de Juego" y "Talleres Creativos". Necesitamos confirmar con el usuario si quiere agregar una tercera categoria "Servicios Fijos" o mantener la estructura actual de 2 categorias.

**Pregunta importante:** La DB no incluye algunos servicios del spec (cafeteria, correo, peluqueria, area_bebes, inflable_bebes, foamy, diamante). Tampoco tiene el campo `hora_extra` que el spec usa para el calculo de hora adicional.

---

## Parte 2: Infraestructura de Storage

### 2.1 Crear bucket `japitown-assets`
Bucket publico para fonts e iconos del PDF:

```text
japitown-assets/
  fonts/
    Poppins-Bold.ttf
    Poppins-Medium.ttf
    Poppins-Regular.ttf
    Poppins-Light.ttf
  icons/
    guarderia.png, construccion.png, ...
    asterisk.png, cloud.png, starburst.png, ...
```

**Accion requerida del usuario:** Subir manualmente los archivos TTF de Poppins y los iconos PNG al bucket.

### 2.2 Crear bucket privado `japitown-quotes`
Para almacenar los PDFs generados cuando se use el modo `?output=storage`.

---

## Parte 3: Nueva Edge Function `generate-quote`

### 3.1 Estructura
Todo en un solo archivo `supabase/functions/generate-quote/index.ts` (restriccion de Lovable).

### 3.2 Diferencias clave vs el spec

| Aspecto | Spec | Implementacion |
|---------|------|----------------|
| Precios hardcoded | Si (en catalogo) | No -- se consultaran de la tabla `services` |
| Clasificacion de servicios | Por keys del catalogo | Por `category` + `id` de la tabla `services` |
| Estructura de archivos | Multiples archivos | Todo en `index.ts` |
| Librerias | `pdf-lib` + `fontkit` | Igual |

### 3.3 Flujo de la funcion

1. Recibir JSON con datos de la cotizacion
2. Consultar la tabla `services` para obtener precios reales (base_price, price_per_child, etc.)
3. Validar input (cliente, n_ninos, horas, fecha, al menos 1 servicio)
4. Calcular precios usando logica del spec pero con precios de la BD
5. Determinar layout (bloques de estaciones, cards de fijos/talleres)
6. Cargar fonts e iconos desde Supabase Storage (con cache en memoria)
7. Generar PDF con pdf-lib siguiendo el diseno visual del spec
8. Responder con binary o subir a Storage segun `?output=`

### 3.4 Logica de pricing (desde BD, no hardcoded)

```text
Estaciones: precioEstaciones(n) = floor(n/2) * 3000 + (n%2) * 1800
  - Los $3000 y $1800 se pueden parametrizar desde la BD
  
Fijos: precio directo desde services.base_price

Talleres: base_price * multiplicador_tier(n_ninos)
  - Tiers: <=15 (x1.0), <=30 (x1.3), <=50 (x1.5), >50 (x1.8)
```

### 3.5 Integracion con el frontend

La funcion `PdfSection` en `AdminKanban.tsx` se actualizara para llamar a `generate-quote` en lugar de `generate-quote-pdf`, mapeando los datos de la cotizacion al formato del spec:

```text
Quote DB record --> mapear a QuoteRequest {
  cliente: quote.customer_name,
  n_ninos: quote.children_count,
  horas: 3 (default o nuevo campo),
  fecha: formato legible de quote.event_date,
  estaciones/fijos/talleres: clasificar desde quote_services
}
```

---

## Parte 4: Numero de ninos obligatorio

### 4.1 Wizard (RamiOnboarding.tsx)
- Ya es required en el paso 2 (`canAdvance` verifica `!!data.childrenCount`)
- No requiere cambios

### 4.2 Carrito de Servicios (ServiceCart.tsx)
- Actualmente `childrenCount` es opcional
- Cambiar: agregar validacion en `canSubmitQuote` para requerir `childrenCount >= 1`
- Agregar asterisco al label y mensaje de error visual

### 4.3 Cotizacion Manual (AdminKanban.tsx - NewQuoteDialog)
- Actualmente `children_count` es opcional
- Cambiar: agregar validacion en `handleSave` para requerir `children_count`
- Agregar asterisco al label y mensaje de error visual

### 4.4 Hook useQuotes.ts
- Cambiar `childrenCount` de opcional a requerido en la interfaz `QuoteData`

---

## Parte 5: Migracion de BD

### 5.1 Agregar campo `hora_extra` a tabla services
Para almacenar el costo de hora adicional por servicio.

### 5.2 Agregar servicios faltantes
Insertar los servicios que el spec define pero no existen en la BD.

### 5.3 Actualizar precios existentes
Ajustar `base_price` segun los precios del spec donde difiera.

---

## Parte 6: Config.toml

Agregar la nueva funcion:
```text
[functions.generate-quote]
verify_jwt = false
```

---

## Orden de ejecucion

1. Migracion BD: agregar campo `hora_extra`, insertar servicios faltantes
2. Crear buckets de Storage (`japitown-assets`, `japitown-quotes`)
3. Escribir la edge function `generate-quote/index.ts`
4. Actualizar `config.toml`
5. Hacer `children_count` obligatorio en Wizard, ServiceCart y AdminKanban
6. Actualizar `PdfSection` para usar la nueva funcion
7. Desplegar y probar

---

## Detalle tecnico: Edge Function

La funcion implementara todos los componentes de renderizado del spec:
- `drawBackground`: fondo cream con decoraciones
- `drawHeader`: barra con logo Japitown, fecha de emision, label "COTIZACION"
- `drawTitleStrip`: titulo y subtitulo auto-generados
- `drawEventCallout`: callout con datos del evento (ninos, horas, fecha)
- `drawEstacionResumen`: bloque resumen de estaciones Mini Ciudad
- `drawCardRow` / `drawCard`: cards individuales para fijos y talleres con color, icono, items incluidos y precio
- `drawTotalBar`: barra de inversion total
- `drawExtraHourNote`: nota de hora adicional
- `drawConditions`: condiciones del servicio
- `drawPaymentInfo`: datos bancarios
- `drawFooter`: contacto e iconos decorativos

Todos los precios se leeran de la BD. Los catalogos del spec (subtitulo, items, color, icono) se mantendran como constantes en el codigo ya que son datos de presentacion visual, no de negocio.

