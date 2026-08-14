# Manual de Papelería — Compras

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: COMPRAS — Departamento de Compras  
> **Módulo**: COMPRAS

---

## 1. Objetivo

Administrar las solicitudes de artículos de papelería y consumibles de oficina. El departamento de Compras puede ver todas las solicitudes, marcarlas como entregadas y gestionar el inventario de papelería.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado de solicitudes | Tabla con todas las solicitudes de papelería |
| Filtros por estatus | Filtrar por PENDIENTE, ENTREGADO, CANCELADO |
| Marcar como entregado | Cambiar estatus de solicitudes a ENTREGADO |
| Gestión de inventario | Visualización del inventario disponible |

---

## 3. Flujo Funcional

```
Empleado solicita artículos de papelería (PENDIENTE)
    ↓
Compras revisa la solicitud
    ↓
Compras prepara los artículos
    ↓
Compras marca como entregado (ENTREGADO)
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder a la Gestión de Papelería

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Compras → Papelería** o directamente a la ruta `/dashboard/compras/papeleria`
3. Se mostrará el panel de gestión de papelería

> **Captura pendiente**: Panel de gestión de papelería

### 4.2 Consultar Solicitudes

La tabla principal muestra todas las solicitudes con:

| Columna | Descripción |
|---------|-------------|
| **Folio** | Identificador único de la solicitud |
| **Solicitante** | Nombre del empleado que solicita |
| **Fecha** | Fecha de creación |
| **Artículos** | Número de artículos solicitados |
| **Estatus** | PENDIENTE, ENTREGADO, CANCELADO |
| **Acciones** | Botones para gestionar |

### 4.3 Filtrar por Estatus

Usa los botones de filtro en la parte superior:
- **TODOS**: Muestra todas las solicitudes
- **PENDIENTE**: Solicitudes pendientes de entrega
- **ENTREGADO**: Solicitudes ya entregadas
- **CANCELADO**: Solicitudes canceladas

### 4.4 Marcar como Entregado

**Cuándo**: Cuando los artículos de papelería han sido entregados al solicitante.

**Pasos**:
1. Localiza la solicitud con estatus **PENDIENTE**
2. Haz clic en **Entregar**
3. Confirma la acción: *"¿Marcar esta solicitud como entregada?"*
4. La solicitud cambia a estatus **ENTREGADO**

> **Captura pendiente**: Botón Entregar en solicitud de papelería

### 4.5 Ver Detalle de una Solicitud

1. Haz clic en el folio o en **Ver detalle** de la solicitud
2. Se mostrará:
   - Información general (folio, fecha, solicitante)
   - Lista de artículos solicitados (nombre, categoría, cantidad)
   - Observaciones
   - Estatus actual

**Ruta directa**: `/compras/papeleria/[id]`

### 4.6 Acceder al Inventario

1. Haz clic en **Inventario**
2. Se abrirá la página de inventario de papelería
3. **Ruta directa**: `/dashboard/compras/papeleria/inventario`

> **Captura pendiente**: Pantalla de inventario de papelería

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Marcar como entregado | Solo desde estatus **PENDIENTE** |
| Cancelación | Solo desde estatus **PENDIENTE** |
| Visualización | Requiere módulo COMPRAS |

---

## 6. Casos de Uso

### Caso 1: Solicitud de papelería estándar
1. Empleado solicita: 2 resmas de hoja, 5 plumas, 1 carpeta
2. Solicitud queda en **PENDIENTE**
3. Compras prepara los artículos
4. Compras marca como **ENTREGADO**

### Caso 2: Solicitud cancelada
1. Empleado solicita artículos
2. Antes de entregar, el empleado ya no los necesita
3. Compras cancela la solicitud → **CANCELADO**

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No veo solicitudes | Filtro activo o sin datos | Verificar filtros, recargar página |
| No aparece botón Entregar | Solicitud ya entregada o cancelada | Verificar estatus actual |
| Error al entregar | Problema de conexión | Intentar de nuevo |

---

## 8. Buenas Prácticas

1. **Entregar oportunamente**: Procesar las solicitudes pendientes lo antes posible
2. **Verificar inventario**: Antes de marcar como entregado, confirmar que hay existencias
3. **Comunicar al solicitante**: Notificar cuando la papelería está lista para entrega
4. **Revisar diariamente**: Mantener actualizado el estatus de las solicitudes

---

## 9. Preguntas Frecuentes

**P: ¿Puedo rechazar una solicitud de papelería?**
R: Actualmente no hay flujo de rechazo. Se puede cancelar la solicitud.

**P: ¿Puedo ver el historial de entregas de un empleado?**
R: Sí, desde el listado puedes ver todas las solicitudes de cada empleado.

**P: ¿Qué categorías de artículos existen?**
R: HOJAS, PLUMAS, LAPICES, MARCADORES, CARPETAS, POST-IT, CLIPS, GRAPAS, CINTA, SOBRES, OTRO.

**P: ¿Puedo editar una solicitud?**
R: No, las solicitudes las crea el empleado. Compras solo puede marcar como entregado o cancelar.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin edición de solicitudes | No se pueden modificar los artículos solicitados |
| Sin notificaciones | No se notifica al empleado cuando se entrega |
| Sin control de existencias | No valida inventario antes de marcar entregado |
| Sin reportes | No hay exportación de solicitudes de papelería |

---

## 11. Referencias

- **Gestión de Papelería**: `/dashboard/compras/papeleria`
- **Inventario**: `/dashboard/compras/papeleria/inventario`
- **Detalle de solicitud**: `/compras/papeleria/[id]`
- **Módulo documentado**: `docs/modules/COMPRAS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
