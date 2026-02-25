

# Desactivar servicios "Peluqueria" y "Correo"

## Problema
Los servicios "Peluqueria" y "Correo" ya no se ofrecen pero siguen apareciendo en la landing y el admin porque:
1. Ambos tienen `is_active = true` en la BD
2. El hook `useServices` no filtra por `is_active`, asi que la landing muestra todos los servicios

## Solucion

### Paso 1 — Desactivar en la BD
Ejecutar un UPDATE para poner `is_active = false` en ambos servicios. Esto es mas seguro que eliminarlos porque preserva datos historicos (cotizaciones que los referencian).

```sql
UPDATE services SET is_active = false WHERE id IN ('peluqueria', 'correo');
```

### Paso 2 — Filtrar por `is_active` en el hook `useServices`
Agregar `.eq('is_active', true)` a la query en `src/hooks/useServices.ts` (linea 32). Esto hace que la landing y cualquier otro componente que use este hook solo muestre servicios activos.

### Paso 3 — Verificar el admin
El admin Kanban ya filtra por `is_active = true` (lineas 413 y 750 de `AdminKanban.tsx`), asi que no requiere cambios.

---

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/hooks/useServices.ts` | Agregar filtro `.eq('is_active', true)` |

## Datos a actualizar
| Tabla | Cambio |
|---|---|
| `services` | `is_active = false` para `peluqueria` y `correo` |

