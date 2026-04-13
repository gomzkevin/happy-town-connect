

# Fusionar "Arte Diamante" + "Foami Moldeable" en un solo servicio

## Situacion actual
- `diamante` — Arte Diamante, $1,200 base, Talleres Creativos, per_child
- `foamy` — Foami Moldeable, $1,200 base, Talleres Creativos, per_child

## Cambios necesarios (solo datos, sin cambios de codigo)

### 1. Actualizar el servicio `diamante`
- Renombrar titulo a **"Arte Diamante + Foami Moldeable"** (o el nombre que prefieras)
- Cambiar `base_price` de 1200 a **1000**
- Actualizar la descripcion para reflejar que incluye ambas actividades
- Ajustar features si es necesario

### 2. Desactivar el servicio `foamy`
- Cambiar `is_active = false` para que deje de aparecer en la landing y el onboarding

### 3. Verificar cotizaciones existentes
Las cotizaciones ya generadas en `quote_services` conservan el nombre y precio con el que fueron creadas, asi que no se ven afectadas.

## Resultado
El servicio combinado quedara como Taller Creativo con base $1,000, sujeto a los multiplicadores por numero de ninos (x1.0 hasta 15, x1.3 hasta 30, x1.5 hasta 50, x1.8 mas de 50). No se requieren cambios de codigo.

## Archivos a modificar
Ninguno.

## Datos a actualizar
| Tabla | Registro | Cambio |
|---|---|---|
| `services` | `diamante` | `title`, `base_price = 1000`, `description` |
| `services` | `foamy` | `is_active = false` |

