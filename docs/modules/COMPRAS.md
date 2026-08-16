# Módulo Compras

## 1. Cómo funciona

Gestiona el proceso de compras y el inventario de insumos:

- **Solicitudes de compra**: creación, cotizaciones, órdenes de compra (OC) y autorización (compras mayores a $50,000 MXN requieren autorización gerencial).
- **Papelería**: solicitudes de papelería y su inventario.
- **Uniformes**: inventario de uniformes, entregas a empleados y **acta imprimible** de entrega.
- **Inventario**: control de existencias con **kardex de movimientos** (entradas/salidas/ajustes), **restock** y **solicitudes de ajuste** (aprobadas por RH/Admin).
- **Comentarios** en solicitudes (con actualización en tiempo real).

## 2. Quiénes pueden usarlo

| Rol | Qué puede hacer |
|-----|-----------------|
| **Empleado** | Crear y consultar sus solicitudes ("Mis Compras", "Papelería"). |
| **COMPRAS** | Gestionar solicitudes, cotizaciones, órdenes de compra, papelería y uniformes; solicitar ajustes de inventario. |
| **ADMIN / RH** | Todo lo anterior + aprobar/rechazar ajustes de inventario, autorizar compras y editar inventario directamente. |
| **ADMIN / RH / COMPRAS** | Ver inventario y movimientos (kardex). |

## 3. Manual del administrador

- **Autorizar compra**: en el detalle de una solicitud en estado "En Autorización".
- **Cotizaciones**: seleccionar la cotización ganadora; si supera $50,000 MXN pasa a autorización gerencial.
- **Orden de compra**: generar la OC desde una solicitud aprobada.
- **Inventario (papelería/uniformes)**: dar de alta productos, **restock** (producto existente o nuevo) y registrar entregas.
- **Ajustes de inventario**: `COMPRAS` puede *solicitar* un ajuste (agregar/actualizar/eliminar); ADMIN/RH lo **aprueban o rechazan** en "Aprobaciones de Inventario".
- **Kardex**: consulta "Movimientos de Inventario" para ver entradas/salidas/ajustes con stock anterior/nuevo y responsable.
- **Entrega de uniformes**: registra la entrega y genera el **acta imprimible** con firmas.

## 4. Manual del usuario

- **Crear solicitud de compra**: "Mis Compras" → nueva solicitud (productos, cantidades, justificación).
- **Crear solicitud de papelería**: "Papelería" → nueva solicitud.
- **Seguimiento**: revisa el estado de tus solicitudes (Pendiente, Aprobado, Entregado, Cancelado) y comenta en ellas.
