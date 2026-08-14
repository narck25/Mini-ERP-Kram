# Manual de Usuario — Compras

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: COMPRAS — Departamento de Compras  
> **Acceso**: Dashboard, Compras, Reportes

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Panel de Administración de Compras](#2-panel-de-administración-de-compras)
3. [Flujo de una Solicitud de Compra](#3-flujo-de-una-solicitud-de-compra)
4. [Gestionar Cotizaciones](#4-gestionar-cotizaciones)
5. [Enviar a Autorización](#5-enviar-a-autorización)
6. [Marcar como Entregado](#6-marcar-como-entregado)
7. [Exportar Reportes](#7-exportar-reportes)
8. [Solución de Problemas](#8-solución-de-problemas)

---

## 1. Introducción

### 1.1 ¿Qué hace el departamento de Compras?

El módulo de Compras permite gestionar todo el ciclo de solicitudes de compra:

1. Los empleados **solicitan** materiales o servicios
2. Compras **cotiza** con proveedores
3. El solicitante **selecciona** la mejor cotización
4. Si el monto lo requiere, se **autoriza** por la jerarquía
5. Se **entrega** y cierra la solicitud

### 1.2 Roles en el módulo de Compras

| Rol | Acceso |
|-----|--------|
| **COMPRAS** | Panel de administración completo, todas las solicitudes |
| **ADMIN** | Panel de administración completo |
| **Empleado** | Solo sus propias solicitudes (Mis Compras) |

---

## 2. Panel de Administración de Compras

### 2.1 Acceso

- **Ruta**: `/dashboard/compras`
- **Menú**: Administración Global → Gestión Global de Compras

### 2.2 Estadísticas

El panel muestra 7 tarjetas con el resumen de solicitudes:

| Tarjeta | Color | Descripción |
|---------|-------|-------------|
| Total | Gris | Todas las solicitudes |
| Nuevo | Rojo | Solicitudes recién creadas |
| Pendiente | Amarillo | Esperando cotización |
| En Autorización | Azul | En proceso de autorización |
| Aprobado | Verde | Autorizadas |
| Entregado | Verde | Completadas |
| Cancelado | Gris | Canceladas |

### 2.3 Gráficas

- **Solicitudes por Estado**: Gráfica de barras con la distribución
- **Gastos por Departamento**: Gráfica de barras con montos aprobados/entregados por departamento

### 2.4 Tabla de Solicitudes

La tabla principal muestra todas las solicitudes con:

| Columna | Descripción |
|---------|-------------|
| Folio | Número de folio único |
| Solicitante | Quién solicita |
| Departamento | Departamento del solicitante |
| Fecha | Fecha de la solicitud |
| Estado | Estado actual |
| Monto | Monto de la cotización seleccionada |
| Ítems | Cantidad de artículos |
| Acciones | Botones para gestionar |

### 2.5 Filtros

Puedes filtrar por **Estado** usando el selector en la parte superior.

---

## 3. Flujo de una Solicitud de Compra

### 3.1 Estados del Ciclo

```
NUEVO → PENDIENTE → EN_AUTORIZACION → APROBADO → ENTREGADO
                        ↓
                    CANCELADO
```

### 3.2 Estado NUEVO

Cuando un empleado crea una solicitud, esta aparece con estatus **NUEVO**.

**Tu labor**: Subir cotizaciones de proveedores.

1. En la tabla, haz clic en **Gestionar** de la solicitud
2. En la página de detalle, ve a la sección de cotizaciones
3. Agrega hasta 3 cotizaciones de diferentes proveedores
4. Una vez que tengas las cotizaciones, la solicitud pasará a **PENDIENTE**

### 3.3 Estado PENDIENTE

El solicitante debe seleccionar la cotización más conveniente.

**Tu labor**: Esperar a que el solicitante seleccione una cotización.

Una vez seleccionada:
- Si el monto es **≤ $50,000 MXN**: La solicitud pasa a **APROBADO**
- Si el monto es **> $50,000 MXN**: Debes enviar a autorización

### 3.4 Estado EN_AUTORIZACION

La solicitud requiere autorización de la jerarquía del solicitante.

**Tu labor**: Enviar la solicitud a los aprobadores correspondientes.

1. Haz clic en **Autorizar** o **Reenviar** en la tabla
2. Selecciona los aprobadores (jefe inmediato, gerente, etc.)
3. Envía la solicitud
4. Los aprobadores recibirán notificación

### 3.5 Estado APROBADO

La solicitud ha sido autorizada.

**Tu labor**: Gestionar la compra y marcar como entregado.

### 3.6 Estado ENTREGADO

La solicitud está completada.

---

## 4. Gestionar Cotizaciones

### 4.1 Agregar Cotizaciones

1. Desde el detalle de la solicitud, haz clic en **Agregar Cotización**
2. Completa los campos:
   - **Proveedor**: Nombre del proveedor
   - **Monto**: Monto total de la cotización
   - **Archivo** (opcional): PDF o imagen de la cotización
3. Haz clic en **Guardar**

### 4.2 Reglas de Cotizaciones

- Se pueden agregar de **1 a 3 cotizaciones** por solicitud
- No es obligatorio tener 3 cotizaciones
- El solicitante seleccionará la que más le convenga

### 4.3 Subir Archivos

Puedes adjuntar archivos PDF o imágenes de las cotizaciones de los proveedores.

---

## 5. Enviar a Autorización

### 5.1 ¿Cuándo se requiere?

Las solicitudes mayores a **$50,000 MXN** requieren autorización adicional.

### 5.2 ¿Cómo funciona?

1. En la tabla, haz clic en **Autorizar** (o **Reenviar** si ya fue enviada antes)
2. Se abrirá el modal de autorización
3. Selecciona los aprobadores según la jerarquía:
   - **Jefe Inmediato**: Primer nivel de autorización
   - **Gerente**: Segundo nivel (si aplica)
   - **Dirección**: Tercer nivel (si aplica)
4. Haz clic en **Enviar a Autorización**

### 5.3 Seguimiento

Puedes ver el estado de cada aprobador en el detalle de la solicitud:

| Indicador | Significado |
|-----------|-------------|
| ⏳ Pendiente | Aún no ha respondido |
| ✓ Aprobó | Aprobó la solicitud |
| ✗ Rechazó | Rechazó la solicitud |

---

## 6. Marcar como Entregado

### 6.1 Procedimiento

1. En la tabla, localiza la solicitud con estatus **APROBADO**
2. Haz clic en **Entregar**
3. Confirma la acción
4. La solicitud pasará a estatus **ENTREGADO**

---

## 7. Exportar Reportes

### 7.1 Exportar a Excel

1. Haz clic en **Exportar a Excel**
2. El archivo incluirá:
   - ID de solicitud
   - Folio
   - Fechas
   - Departamento
   - Solicitante
   - Estatus
   - Monto
   - Cotizaciones
   - Autorizaciones

### 7.2 Exportar Gastos por Departamento

1. En la sección de Gastos por Departamento, haz clic en **Exportar**
2. El archivo incluirá el total gastado por cada departamento

---

## 8. Solución de Problemas

### 8.1 No veo solicitudes en el panel

1. Verifica que no haya filtros activos
2. Confirma que tienes el módulo COMPRAS activado
3. Actualiza la página

### 8.2 No puedo subir una cotización

1. Verifica que el archivo no exceda el tamaño permitido
2. Asegúrate de que el formato sea PDF o imagen
3. Intenta de nuevo

### 8.3 La solicitud no pasa a autorización

1. Verifica que el monto supere los $50,000 MXN
2. Confirma que hay aprobadores disponibles
3. Revisa que la cotización esté seleccionada

---

## Apéndice: Rutas Rápidas

| Acción | Ruta |
|--------|------|
| Panel de Compras | `/dashboard/compras` |
| Mis Solicitudes | `/compras/mis-solicitudes` |
| Nueva Solicitud | `/compras/nueva-solicitud` |
| Detalle Solicitud | `/dashboard/compras/[id]` |

---

*Documento generado el 24/06/2026 — ERP KRAM*
