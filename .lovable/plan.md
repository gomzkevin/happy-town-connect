
# Fix: Descarga de PDF bloqueada por Chrome

## Problema
El boton "Descargar PDF" usa `<a href={pdfUrl} target="_blank">` para abrir el PDF en una nueva pestana. Los bloqueadores de anuncios (uBlock Origin, AdBlock, etc.) o las protecciones nativas de Chrome interceptan esta navegacion y muestran `ERR_BLOCKED_BY_CLIENT`.

## Solucion
Reemplazar el enlace directo por una descarga programatica: el navegador hace `fetch()` del PDF, lo convierte en un blob, crea un enlace temporal de descarga y lo activa. Esto evita completamente la apertura de una nueva pestana.

## Cambios tecnicos

### `src/components/admin/AdminKanban.tsx`

1. Crear una funcion `handleDownloadPdf` dentro del componente `QuoteCard` que:
   - Hace `fetch(pdfUrl)` para obtener el archivo
   - Convierte la respuesta a blob
   - Crea un `URL.createObjectURL(blob)`
   - Crea un elemento `<a>` temporal con `download` attribute y lo ejecuta con `.click()`
   - Revoca el object URL despues

2. Reemplazar el boton actual (que usa `asChild` con un `<a>` directo) por un `<Button>` normal con `onClick={handleDownloadPdf}`:

```typescript
const handleDownloadPdf = async () => {
  if (!pdfUrl) return;
  try {
    const res = await fetch(pdfUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cotizacion-${quote.customer_name || "japitown"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Fallback: abrir directamente si fetch falla
    window.open(pdfUrl, "_blank");
  }
};
```

3. El boton pasa de ser un `<a>` a un `<Button onClick={handleDownloadPdf}>`, eliminando `asChild`.

Este cambio hace que el PDF se descargue directamente al dispositivo del usuario sin abrir ninguna pestana nueva.
