
# Diagnóstico de inconsistencias en regeneración de PDF

## Hallazgos (con evidencia de logs y contenido real)

Revisé los logs de Edge Functions, los requests de `function_edge_logs`, el contenido del PDF generado más reciente y el código frontend/admin.

### 1) Hay **versiones distintas desplegadas** de `generate-quote` y eso está causando regresiones
En analytics de edge logs aparecen POST recientes ejecutando versiones diferentes de la misma función:

- v30, v32, v33, v34, v36 (todas recientes)
- Ejemplo de secuencia reciente:
  - v34 (01:05–01:06)
  - v36 (01:08–01:10)

Esto confirma que no era una sola versión estable, sino despliegues sucesivos con cambios distintos.

**Señal fuerte de regresión entre versiones:**
- En v34 sí aparecen logs DIAG (`[DIAG mapQuoteToConfig]`, `[DIAG calcularLayout]` con 3 cards).
- En v36 ya no aparecen esos DIAG.
- Al invocar nuevamente `generate-quote` para la cotización `f32f24b3...` (respuesta 200), el PDF guardado resultante (`cotizacion-Ari-1771981855370.pdf`) contiene solo “Yesitos” y texto antiguo.
  
Conclusión: la versión activa más reciente volvió a un estado regresionado (o diferente al que tenía fixes).

---

### 2) El frontend del admin puede descargar un **PDF viejo (URL stale)** aunque la cotización ya tenga una URL nueva
En `src/components/admin/AdminKanban.tsx`, `PdfSection` hace:

- `const [pdfUrl, setPdfUrl] = useState(quote.pdf_url);`

pero **no sincroniza** ese estado cuando `quote.pdf_url` cambia por regeneración automática desde otro flujo (por ejemplo al guardar edición de cotización).

Esto puede provocar que el usuario descargue una URL anterior y vea “texto no actualizado”, aunque el backend haya generado una versión nueva.

---

### 3) Hay deriva entre catálogo DB y clasificación hardcodeada del PDF (causa “faltan servicios” en ciertos casos)
La función clasifica con listas estáticas (`ESTACION_IDS`, `FIJO_IDS`, `TALLER_IDS`), pero en DB hay servicios activos que no están en esas listas o están en categorías distintas:

- Ejemplo: `hamburgueseria` existe en DB activa y no está en `ESTACION_IDS`.
- Cuando un `service_id` no coincide, se descarta silenciosamente (warning en logs).

Esto explica comportamiento “a veces sí / a veces no” según qué servicios tenga cada cotización.

---

## Qué problema genera las inconsistencias (raíz)

La inconsistencia no parece ser un bug aleatorio del motor PDF en tiempo de ejecución; es una combinación de:

1. **Regresiones por despliegues múltiples/versionado no estabilizado** en `generate-quote` (v34 vs v36).
2. **Descarga de URL vieja en admin** por estado local no sincronizado.
3. **Mapeo estático desalineado con servicios reales de DB**, que hace que algunos servicios se pierdan según la cotización.

---

## Plan de corrección propuesto

## Paso 1 — Congelar una sola versión estable de `generate-quote`
- Dejar una única versión con:
  - fixes de `haz-pulsera`,
  - soporte correcto de 1 estación (según regla actual),
  - logs de diagnóstico mínimos temporales.
- Validar que todos los requests nuevos caen en la misma versión (sin saltos regresivos).

## Paso 2 — Corregir stale URL en `PdfSection` (admin)
- Sincronizar `pdfUrl` local con cambios de `quote.pdf_url` para que “Descargar PDF” siempre use la última URL.
- Así se elimina el falso positivo de “regeneré pero se bajó el viejo”.

## Paso 3 — Eliminar clasificación rígida por listas hardcodeadas
- Clasificar por `services.category` de DB (y fallback por ID legacy).
- Mantener un mapa de aliases únicamente para compatibilidad histórica.
- Así servicios nuevos (ej. `hamburgueseria`) no desaparecen.

## Paso 4 — Trazabilidad mínima en historial
- Registrar en `quote_history` acción `pdf_generated` con:
  - `quote_id`,
  - `pdf_url`,
  - `function_version`/`deployment_id`,
  - snapshot de `service_ids` usados.
- Esto permite auditar exactamente “qué versión generó qué PDF”.

## Paso 5 — Prueba de verificación end-to-end
- Regenerar la misma cotización problemática (`f32f24b3...`).
- Confirmar:
  - URL nueva en DB,
  - descarga desde admin abre esa URL nueva,
  - PDF incluye supermercado + haz-pulsera + yesitos,
  - texto actualizado de la edge function visible.

---

## Nota técnica importante

En los logs DIAG de v34, la función reporta 3 cards correctas, pero el PDF final que devuelve la versión más reciente (v36) sigue saliendo solo con Yesitos. Esto refuerza que el problema principal ahora mismo es **versión desplegada regresionada + consumo de URL antigua en UI**, no únicamente el dataset de la cotización.
