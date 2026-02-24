

# Kanban Board - Pipeline de Ventas JapiTown

## Resumen

Reemplazar las pestanas separadas de "Dashboard" y "CRM" por una sola vista Kanban de arrastrar y soltar (drag & drop) que funcione como pipeline visual de ventas. Cada columna representa una etapa del proceso y cada tarjeta es una cotizacion. Se podra mover tarjetas entre columnas arrastrándolas o desde el detalle de la cotizacion.

## Etapas del Pipeline

| Etapa | Nombre | Descripcion | Puede moverse a |
|-------|--------|-------------|-----------------|
| 1 | **Pendiente** | Cotizacion enviada al cliente, esperando respuesta | Contactado, Cancelado |
| 2 | **Contactado** | Se dio seguimiento al cliente sobre la cotizacion | Confirmado, Cancelado |
| 3 | **Confirmado** | Cliente pago anticipo, evento reservado | Proximo, Cancelado |
| 4 | **Proximo** | Evento ocurrira dentro de los proximos 5 dias o ya tiene fecha asignada proxima | Realizado |
| 5 | **Realizado** | El evento ya ocurrio (etapa final) | (ninguna) |
| X | **Cancelado** | Cliente no interesado tras seguimiento | (ninguna) |

Nota: "Proximo" y "Realizado" se determinan automaticamente por la fecha del evento cuando el status es "confirmed", pero tambien pueden asignarse manualmente. En la base de datos se agregaran estos como valores validos del campo `status`.

## Funcionalidad de las Tarjetas (Cards)

Cada tarjeta mostrara:
- Nombre del cliente y nombre del festejado
- Fecha del evento
- Monto estimado / monto total
- Indicador de pago de anticipo (si/no + monto)
- Tiempo desde la ultima actualizacion
- Fuente (Wizard / Servicios)

Al hacer clic en una tarjeta se abre un dialogo de detalle con:
- Toda la informacion del cliente (nombre, email, telefono, ubicacion)
- Datos del evento (fecha, numero de ninos, rango de edad)
- Servicios seleccionados (desde `quote_services`)
- Seccion de pagos: anticipo pagado, monto total, saldo pendiente
- Preferencias
- Botones para avanzar a la siguiente etapa valida segun la logica definida
- Historial de cambios de estado

## Metricas (Header del Kanban)

Arriba del tablero se mostraran KPIs resumidos:
- Total cotizaciones activas (excluyendo canceladas y realizadas)
- Ingresos confirmados (sum de `total_estimate` en confirmados)
- Ingresos realizados (sum en realizados)
- Tasa de conversion (confirmados + realizados / total)
- Anticipos cobrados vs pendientes

## Drag & Drop

Se implementara usando la API nativa de HTML5 drag and drop (sin dependencias adicionales):
- Las tarjetas se pueden arrastrar solo a las columnas permitidas segun la logica de transiciones
- Las columnas destino validas se resaltan visualmente al arrastrar
- Las columnas no validas se atenuan
- Al soltar, se actualiza el status en la base de datos

## Cambios Tecnicos

### 1. Migracion de Base de Datos

Agregar los nuevos valores de status a la tabla `quotes`:
- Agregar `deposit_amount` (integer, nullable, default 0) para rastrear anticipos
- Agregar `deposit_paid` (boolean, default false)
- Agregar `total_paid` (integer, nullable, default 0) para rastrear pagos totales
- Los nuevos valores de status `upcoming` y `completed` se usaran directamente (el campo `status` es texto libre, no tiene constraint)

### 2. Nuevo Componente: `AdminKanban.tsx`

Reemplaza `AdminOverview` + `AdminCRM` con un solo componente que contiene:
- Barra de metricas KPI en la parte superior
- Tablero Kanban con 6 columnas horizontales (scroll horizontal en movil)
- Cada columna con contador de tarjetas y suma de montos
- Tarjetas arrastrables con informacion resumida
- Dialogo de detalle al hacer clic

### 3. Modificar `AdminDashboard.tsx`

- Reemplazar las pestanas "Dashboard" y "CRM" por una sola pestana "Pipeline" que carga `AdminKanban`
- Mantener el resto de pestanas (Calendario, Servicios, Eventos, Config, etc.)

### 4. Logica de Transiciones

```text
pendiente --> contactado --> confirmado --> proximo --> realizado
     |              |              |
     v              v              v
  cancelado      cancelado      cancelado
```

- Auto-deteccion: cotizaciones confirmadas cuyo `event_date` esta dentro de 5 dias se muestran en "Proximo" automaticamente
- Cotizaciones confirmadas cuyo `event_date` ya paso se muestran en "Realizado" automaticamente
- Cancelado es terminal, no se puede mover a ninguna otra etapa

### 5. Seccion de Pagos en Detalle

En el dialogo de detalle de cada cotizacion:
- Campo para registrar monto de anticipo
- Toggle de "anticipo pagado"
- Campo de monto total pagado
- Calculo automatico de saldo pendiente

### Archivos a Crear
- `src/components/admin/AdminKanban.tsx` - Componente principal del tablero Kanban

### Archivos a Modificar
- `src/components/admin/AdminDashboard.tsx` - Reemplazar tabs Dashboard + CRM por Pipeline
- `src/components/admin/AdminOverview.tsx` - Se puede eliminar (reemplazado por metricas en Kanban)
- `src/components/admin/AdminCRM.tsx` - Se puede eliminar (reemplazado por Kanban)

### Migracion SQL
- Agregar columnas `deposit_amount`, `deposit_paid`, `total_paid` a la tabla `quotes`

