

# Cambiar categoría de "Inflable para Bebés" a "Extras"

## Problema
El servicio `inflable_bebes` tiene `category = 'Estaciones de Juego'` en la BD, lo que hace que entre en la logica de parejas a $3,000. Debe cobrar siempre su precio fijo de $1,000.

## Solucion

### Paso 1 — Actualizar la BD
Ejecutar un UPDATE para cambiar la categoria:
```sql
UPDATE services SET category = 'Extras' WHERE id = 'inflable_bebes';
```

Esto hace que la logica de pricing en `src/lib/pricing.ts`, `send-quote-email/index.ts` y `generate-quote/index.ts` lo trate como "otros" y use su `base_price` directo ($1,000), sin entrar en la formula de parejas.

### Paso 2 — Verificar
No se requieren cambios de codigo. Las tres funciones de pricing ya manejan correctamente la categoria "Extras" como precio fijo.

## Archivos a modificar
Ninguno.

## Datos a actualizar
| Tabla | Cambio |
|---|---|
| `services` | `category = 'Extras'` para `inflable_bebes` |

