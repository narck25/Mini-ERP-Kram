# Guía Rápida: Compras

> **Versión**: 1.0  
> **Fecha**: 24/06/2026

---

## Para Solicitantes (Empleados)

### Solicitar Compra
1. Ir a `/compras/nueva-solicitud`
2. Escribir justificación
3. Agregar ítems (producto/servicio + cantidad)
4. Enviar

### Seleccionar Cotización
1. Ir a `/compras/mis-solicitudes`
2. Cuando esté en **PENDIENTE**, abrir detalle
3. Revisar cotizaciones de proveedores
4. Hacer clic en **Seleccionar** en la elegida

### Solicitar Papelería
1. Ir a `/compras/papeleria/nueva-solicitud`
2. Agregar artículos (nombre + categoría + cantidad)
3. Enviar

---

## Para Compras

### Panel de Administración
1. Ir a `/dashboard/compras`
2. Revisar estadísticas y solicitudes

### Agregar Cotizaciones
1. Solicitud en **NUEVO**
2. Ir al detalle de la solicitud
3. Agregar cotizaciones (1-3 por solicitud)
4. La solicitud pasa a **PENDIENTE**

### Enviar a Autorización
1. Solicitud en **PENDIENTE** con cotización seleccionada
2. Si monto > $50,000 → **Autorizar**
3. Seleccionar aprobadores
4. Enviar

### Marcar como Entregado
1. Solicitud en **APROBADO**
2. Hacer clic en **Entregar**
3. Confirmar

---

## Estados de Solicitud de Compra

| Estado | Significado |
|--------|-------------|
| NUEVO | Creada, esperando cotizaciones |
| PENDIENTE | Cotizaciones listas, esperando selección |
| EN_AUTORIZACION | En proceso de autorización |
| APROBADO | Autorizada |
| ENTREGADO | Completada |
| CANCELADO | Cancelada |

---

## Regla de Autorización

| Monto | Acción |
|-------|--------|
| ≤ $50,000 MXN | Aprobación automática |
| > $50,000 MXN | Requiere autorización de aprobadores |

---

## Rutas Rápidas

| Página | Ruta |
|--------|------|
| Nueva solicitud | `/compras/nueva-solicitud` |
| Mis solicitudes | `/compras/mis-solicitudes` |
| Detalle solicitud | `/compras/mis-solicitudes/[id]` |
| Panel Compras | `/dashboard/compras` |
| Papelería (empleado) | `/compras/papeleria` |
| Papelería (admin) | `/dashboard/compras/papeleria` |
| Uniformes (admin) | `/dashboard/compras/uniformes` |

---

*Documento generado el 24/06/2026 — ERP KRAM*
