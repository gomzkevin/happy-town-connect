

# Edicion inline del detalle de cotizacion en el Kanban

## Resumen
Agregar un modo de edicion al dialogo de detalle (`QuoteDetailDialog`) que permita modificar los datos del cliente, evento, servicios y notas directamente desde la tarjeta, sin necesidad de crear una nueva cotizacion.

## Cambios tecnicos

### Archivo: `src/components/admin/AdminKanban.tsx`

**1. Estado de edicion en `QuoteDetailDialog`**
- Agregar un estado `isEditing` (boolean) al componente
- Agregar un boton de edicion (icono lapiz) en el header del dialogo, al lado del titulo "Detalle de Cotizacion"
- Cuando `isEditing` es `true`, los campos de texto se convierten en inputs editables

**2. Campos editables (modo edicion)**
Cuando se activa el modo edicion, los siguientes campos pasan de texto estatico a inputs:
- **Datos del cliente**: `customer_name`, `child_name`, `email`, `phone`, `location`
- **Datos del evento**: `event_date`, `children_count`, `age_range`
- **Notas**: `notes`
- **Servicios**: Selector de servicios similar al de `NewQuoteDialog` (toggle para agregar/quitar servicios con agrupacion por categoria)

Se usara un estado local `editForm` inicializado con los valores actuales del `quote`.

**3. Selector de servicios en modo edicion**
- Al entrar en modo edicion, cargar la lista de servicios disponibles desde la tabla `services` (igual que en `NewQuoteDialog`)
- Mostrar los servicios agrupados por categoria con el mismo estilo visual (botones toggle con colores por categoria)
- Pre-seleccionar los servicios que ya estan en la cotizacion (cruzando `quote_services` con `services`)
- Recalcular `total_estimate` dinamicamente segun los servicios seleccionados

**4. Guardado de cambios**
Al presionar "Guardar":
- Actualizar la tabla `quotes` con los campos modificados (customer_name, email, phone, location, event_date, child_name, children_count, age_range, notes, total_estimate)
- Para servicios: eliminar los `quote_services` existentes del quote y reinsertar los seleccionados (estrategia replace)
- Llamar a `onQuoteUpdate` para sincronizar el estado local del Kanban
- Volver al modo lectura (`isEditing = false`)
- Mostrar toast de confirmacion

**5. Botones de accion**
- En modo lectura: boton con icono de lapiz (`Pencil` de lucide) en el header
- En modo edicion: dos botones en el footer - "Cancelar" (vuelve a modo lectura sin guardar) y "Guardar cambios" (persiste los datos)

**6. Validaciones**
- `customer_name` y `email` son obligatorios
- `children_count` debe ser >= 1
- Mostrar toast de error si falta algun campo requerido

### Cambio en RLS (migracion SQL)
- La tabla `quote_services` actualmente no permite DELETE ni UPDATE. Se necesita agregar una politica RLS para que los admins puedan eliminar registros de `quote_services` (necesario para la estrategia de reemplazo de servicios al editar).

```sql
CREATE POLICY "Admins can delete quote_services"
  ON public.quote_services
  FOR DELETE
  USING (public.is_admin(auth.uid()));
```

### Flujo de usuario
1. El admin hace click en una tarjeta del Kanban para abrir el detalle
2. Hace click en el icono de lapiz (esquina superior)
3. Los campos se vuelven editables (inputs, date pickers, selector de servicios)
4. Modifica lo que necesita (agrega/quita servicios, cambia numero de ninos, etc.)
5. Presiona "Guardar cambios"
6. El sistema actualiza la base de datos, recalcula el total y sincroniza la UI
7. La tarjeta en el Kanban refleja los cambios inmediatamente

