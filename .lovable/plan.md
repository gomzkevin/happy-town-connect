

# Plan: QA Visual del PDF — generate-quote/index.ts

## Resumen

Implementar todos los ajustes de QA visual identificados en el documento de revision, excluyendo los puntos 1.1 y 1.2 (ya atendidos). Los cambios se aplican al archivo unico `supabase/functions/generate-quote/index.ts`.

---

## Cambios a implementar

### 1. Logica: estaciones minimo 2 (punto 1.3)

Tres lineas a corregir:
- Linea 165: `if (n < 1)` cambia a `if (n < 2)`
- Linea 182: `if (nEst >= 1)` cambia a `if (nEst >= 2)`
- Linea 215: `if (est.length >= 1)` cambia a `if (est.length >= 2)`

### 2. Validacion de keys invalidos (punto 1.4)

Agregar en `validate()` (linea 369) verificacion de que cada key de estaciones, fijos y talleres exista en su catalogo respectivo.

### 3. Precio dentro de la banda de color (punto 2.4)

Modificar `drawCard()` (linea 474-506): mover el precio de debajo de la banda a dentro de la banda, alineado a la derecha. Titulo a la izquierda, precio a la derecha, ambos centrados verticalmente en la banda.

### 4. Esquinas redondeadas (punto 2.2)

Implementar helper `drawRoundedRect()` usando la tecnica de 4 rectangulos + 4 circulos. Aplicarlo en:
- Cards (fondo blanco + banda de color)
- Bloque de estaciones (fondo offwhite + banda brown)
- Event callout
- Payment info box
- Extra hour note box

Radio: r=6 para cards, r=4 para boxes pequenos.

### 5. Espaciado vertical adaptativo (punto 2.3)

Despues de calcular todos los bloques, medir la altura total del contenido y distribuir gaps proporcionalmente para que el contenido no flote arriba con un hueco enorme. Anclar condiciones y pago cerca del footer.

### 6. Divider stripe (punto 2.5)

Ya existe en `drawFooter()` (linea 590), pero verificare que se dibuje correctamente. Si no aparece en el PDF generado, ajustare la posicion.

### 7. Textos del catalogo (punto 3)

Corregir en `CATALOGO_ESTACIONES` y sus entradas:
- `veterinaria.items[2]`: "Radiografias de juguete" a "Certificados de salud"
- `veterinaria.items[3]`: "Uniforme veterinario" a "Batas y estetoscopios"
- `cafeteria.subtitulo`: "Prepara bebidas y snacks" a "Barista por un dia"
- `cafeteria.items[0]`: "Cafetera de juguete" a "Maquina de cafe de juguete"
- `cafeteria.items[2]`: "Ingredientes de felpa" a "Postres de juguete"
- `cafeteria.items[3]`: "Uniforme de barista" a "Mandiles y gorros"
- `peluqueria.subtitulo`: "Estilismo y peinados divertidos" a "Estilista por un dia"

### 8. Gramatica singular/plural (punto 4.1)

La funcion `generarSubtitulo()` (linea 308) ya maneja correctamente singular con `estacion${nEst > 1 ? "es" : ""}`. Sin embargo, `generarResumen()` (linea 320) dice siempre "estaciones". Corregir para usar singular cuando corresponda.

---

## Detalle tecnico

### Helper drawRoundedRect

```text
function drawRoundedRect(page, x, y, w, h, r, options):
  // 4 rectangulos internos (horizontal, vertical, y 2 centrales)
  // 4 circulos en las esquinas
  // Soporta color de fondo y/o borde
```

### Reorganizacion del drawCard

```text
// Banda de color con esquinas redondeadas superiores
drawRoundedRect(page, x, y-bandH, w, bandH, r, {color: bandColor})
// Clip inferior para que solo las esquinas superiores sean redondeadas:
// dibujar rectangulo recto en la mitad inferior de la banda

// Titulo (izquierda, centrado vertical en banda)
// Precio (derecha, centrado vertical en banda)

// Resto del card (subtitulo, items) sin precio separado
```

### Espaciado vertical

```text
En generateQuotePDF():
1. Calcular altura de todos los bloques sin dibujarlos
2. Calcular espacio disponible = H - headerH - footerH - alturaTotal
3. Distribuir gapExtra = max(0, espacioDisponible / (numComponentes + 2))
4. Aplicar gapExtra entre cada componente al dibujar
```

---

## Archivo modificado

- `supabase/functions/generate-quote/index.ts` (unico archivo)

## Post-implementacion

- Redesplegar la edge function
- Generar un PDF de prueba para validar los cambios visuales

