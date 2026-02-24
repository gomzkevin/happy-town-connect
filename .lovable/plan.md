

# Plan: Subir iconos a Supabase Storage e integrarlos en el PDF

## Resumen

Subir los 20 iconos y logos al bucket `japitown-assets` de Supabase Storage, y luego modificar `generate-quote/index.ts` para que embeba los iconos PNG en las tarjetas del PDF usando `pdfDoc.embedPng()`.

---

## Paso 1: Subir los assets al bucket

Los archivos estan en `src/assets/` pero son archivos binarios del repo que no se pueden subir programaticamente desde una edge function de forma directa. La solucion es crear una **edge function utilitaria temporal** (`upload-assets`) que:

1. Descargue cada icono desde la URL publica del sitio publicado (`https://happy-town-connect.lovable.app/src/assets/Iconos-XX.png` -- aunque esto no funciona directamente con Vite, los assets se empaquetan con hash).

**Alternativa mas robusta**: Crear la edge function que reciba los archivos como base64 en el body, y desde el frontend hacer un script unico que lea los imports y los envie. Pero esto es complejo.

**Solucion mas practica**: El usuario sube manualmente los 20 PNGs al bucket `japitown-assets` desde el dashboard de Supabase Storage, organizados asi:

```text
japitown-assets/
  icons/Iconos-01.png
  icons/Iconos-02.png
  ...
  icons/Iconos-20.png
  logos/Logo-24.png
  fonts/Poppins-Bold.ttf   (ya existente)
  fonts/Poppins-Medium.ttf (ya existente)
  ...
```

**Solucion automatizada elegante**: Crear una pagina temporal en el admin (`/admin/upload-assets`) que lea los iconos importados y los suba al bucket via el SDK de Supabase Storage. Esto es un one-time upload tool.

---

## Paso 2: Crear componente temporal de subida de assets

Crear un componente React simple en el admin que:
- Importe todos los iconos de `src/assets/`
- Convierta cada imagen a `Blob` usando `fetch()`
- Suba cada uno al bucket `japitown-assets/icons/` via `supabase.storage.from('japitown-assets').upload()`
- Muestre progreso y resultado

Este componente se usara una sola vez y luego se puede eliminar.

---

## Paso 3: Integrar iconos en el PDF

Modificar `generate-quote/index.ts`:

### 3a. Mapeo de iconos por servicio

Agregar un mapa de servicio a icono:

```text
ICON_MAP = {
  guarderia: "icons/Iconos-12.png",
  construccion: "icons/Iconos-04.png",
  hamburgueseria: "icons/Iconos-03.png",
  supermercado: "icons/Iconos-05.png",
  veterinaria: "icons/Iconos-07.png",
  cafeteria: "icons/Iconos-06.png",
  correo: "icons/Iconos-08.png",
  peluqueria: "icons/Iconos-09.png",
  "decora-cupcake": "icons/Iconos-10.png",
  spa: "icons/Iconos-02.png",
  pesca: "icons/Iconos-01.png",
  area_bebes: "icons/Iconos-11.png",
  inflable_bebes: "icons/Iconos-11.png",
  caballetes: "icons/Iconos-16.png",
  yesitos: "icons/Iconos-16.png",
  "haz-pulsera": "icons/Iconos-16.png",
  foamy: "icons/Iconos-16.png",
  diamante: "icons/Iconos-16.png",
}
```

(Los numeros exactos de mapeo se ajustaran segun la correspondencia real de cada icono -- el usuario puede confirmar.)

### 3b. Carga de iconos

Funcion `loadIcons()` que descarga y embebe todos los PNGs necesarios:

```text
async function loadIcons(pdfDoc, serviceKeys):
  cache de iconos embebidos
  para cada key unico en serviceKeys:
    fetch PNG desde japitown-assets/icons/...
    pdfDoc.embedPng(bytes)
    guardar en cache
  return cache
```

### 3c. Render de iconos en las tarjetas

- En `drawCard()`: dibujar el icono (aprox 24x24px) a la izquierda del titulo en la banda de color
- En `drawEstacionResumen()`: dibujar un icono pequeno (16x16px) al lado de cada nombre de estacion en la lista
- Opcionalmente: agregar el logo en el header/footer

---

## Paso 4: Iconos decorativos en el PDF

Los iconos 13-20 (flower, cloud, star, spiral, sun, wave) se pueden usar como elementos decorativos sutiles:
- Opacidad reducida en las esquinas de la pagina
- O como separadores entre secciones

Nota: `pdf-lib` no soporta opacidad directa en imagenes. Se puede simular reduciendo el tamano o usarlos a escala muy pequena como adornos.

---

## Archivos a crear/modificar

1. **Nuevo**: `src/components/admin/AssetUploader.tsx` -- componente temporal de subida
2. **Modificar**: `src/components/admin/AdminDashboard.tsx` -- agregar ruta temporal al uploader
3. **Modificar**: `supabase/functions/generate-quote/index.ts` -- integrar iconos en el PDF

## Secuencia de ejecucion

1. Crear el componente AssetUploader
2. El usuario ejecuta la subida desde el admin
3. Verificar que los iconos estan en el bucket
4. Modificar la edge function para usar los iconos
5. Redesplegar y probar
6. Eliminar el componente temporal

