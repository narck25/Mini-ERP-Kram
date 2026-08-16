# Manual de Mis Solicitudes de Papelería

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: EMPLEADO_BÁSICO — Empleado general  
> **Módulo**: COMPRAS

---

## 1. Objetivo

Solicitar artículos de papelería y consumibles de oficina. Como empleado, puedes crear solicitudes de papelería, dar seguimiento y consultar tu historial.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Crear solicitud de papelería | Solicitar artículos de oficina |
| Ver mis solicitudes | Listado de tus solicitudes con estatus |
| Cancelar solicitud | Cancelar una solicitud pendiente |

---

## 3. Flujo Funcional

```
Crear solicitud de papelería (PENDIENTE)
    ↓
Compras prepara los artículos
    ↓
Compras entrega (ENTREGADO)
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Crear una Solicitud de Papelería

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Compras → Papelería**
3. **Ruta directa**: `/compras/papeleria/nueva-solicitud`

**Pasos**:
1. Agrega los artículos que necesitas:
   | Campo | Tipo | Requerido | Descripción |
   |-------|------|-----------|-------------|
   | Nombre del artículo | Texto | Sí | Descripción del artículo |
   | Categoría | Select | Sí | HOJAS, PLUMAS, LAPICES, MARCADORES, CARPETAS, POST-IT, CLIPS, GRAPAS, CINTA, SOBRES, OTRO |
   | Cantidad | Número | Sí | Cantidad solicitada |
   | Observaciones | Texto | No | Detalles adicionales |
2. Para agregar más artículos, haz clic en **+ Agregar artículo**
3. Opcionalmente, agrega observaciones generales
4. Haz clic en **Enviar Solicitud**

**Validaciones**:
- Al menos un artículo con nombre
- Cantidad debe ser ≥ 1

> **Captura pendiente**: Formulario de nueva solicitud de papelería

### 4.2 Ver Mis Solicitudes de Papelería

1. **Ruta directa**: `/compras/papeleria`

La tabla muestra:
| Columna | Descripción |
|---------|-------------|
| **Folio** | Identificador único |
| **Fecha** | Fecha de creación |
| **Artículos** | Número de artículos |
| **Estatus** | PENDIENTE, ENTREGADO, CANCELADO |
| **Observaciones** | Notas de la solicitud |
| **Acciones** | Cancelar (si está pendiente) |

### 4.3 Cancelar una Solicitud

1. En la lista, localiza la solicitud con estatus **PENDIENTE**
2. Haz clic en **Cancelar**
3. Confirma la acción

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Cancelación | Solo desde estatus PENDIENTE |
| Artículos | Al menos 1 con nombre |
| Categoría | Debe ser una de las categorías definidas |

---

## 6. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No puedo crear solicitud | Módulo COMPRAS no asignado | Solicitar acceso |
| Error al enviar | Artículos sin nombre | Completar nombres de artículos |

---

## 7. Referencias

- **Nueva Solicitud**: `/compras/papeleria/nueva-solicitud`
- **Mis Solicitudes**: `/compras/papeleria`
- **Detalle**: `/compras/papeleria/[id]`

---

*Documento generado el 24/06/2026 — ERP KRAM*
