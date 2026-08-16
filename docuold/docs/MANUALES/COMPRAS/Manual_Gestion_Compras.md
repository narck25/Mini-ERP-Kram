# Manual de Gestión de Compras

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: COMPRAS — Departamento de Compras  
> **Módulo**: COMPRAS

---

## 1. Objetivo

Gestionar el ciclo completo de las solicitudes de compra: desde que un empleado solicita materiales o servicios, hasta la entrega final. El departamento de Compras administra cotizaciones, autorizaciones y la logística de entrega.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Panel de administración | Dashboard con estadísticas y listado de todas las solicitudes |
| Gestión de cotizaciones | Agregar, ver y gestionar cotizaciones de proveedores |
| Envío a autorización | Enviar solicitudes a aprobadores cuando el monto lo requiere |
| Marcado como entregado | Finalizar solicitudes marcando la entrega |
| Exportación a Excel | Descargar reportes de solicitudes y gastos |
| Gestión de Papelería | Administrar solicitudes de artículos de papelería |
| Gestión de Uniformes | Administrar entregas de uniformes |

---

## 3. Flujo Funcional

```
Empleado solicita (NUEVO)
    ↓
Compras agrega cotizaciones (PENDIENTE)
    ↓
Empleado selecciona cotización
    ↓
    ├── Monto ≤ $50,000 → APROBADO automático
    └── Monto > $50,000 → EN_AUTORIZACION → Aprobadores → APROBADO
    ↓
Compras entrega (ENTREGADO)
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder al Panel de Administración de Compras

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Administración Global → Gestión Global de Compras**
3. **Ruta directa**: `/dashboard/compras`

> **Captura pendiente**: Panel de administración de compras

### 4.2 Interpretar las Estadísticas

El panel muestra 7 tarjetas con el resumen de solicitudes:

| Tarjeta | Color | Descripción |
|---------|-------|-------------|
| **Total** | Gris | Todas las solicitudes registradas |
| **Nuevo** | Rojo | Solicitudes recién creadas, esperando cotización |
| **Pendiente** | Amarillo | Cotizaciones subidas, esperando selección del solicitante |
| **En Autorización** | Azul | En proceso de autorización por la jerarquía |
| **Aprobado** | Verde | Autorizadas, listas para comprar |
| **Entregado** | Verde | Completadas |
| **Cancelado** | Gris | Canceladas |

**Gráficas**:
- **Solicitudes por Estado**: Gráfica de barras con la distribución de estados
- **Gastos por Departamento**: Gráfica de barras con montos aprobados/entregados por departamento

### 4.3 Filtrar Solicitudes

Usa el selector de **Estado** en la parte superior para filtrar:
- Todos
- Nuevo
- Pendiente
- En Autorización
- Aprobado
- Entregado
- Cancelado

### 4.4 Gestionar Cotizaciones

#### 4.4.1 Agregar Cotizaciones a una Solicitud

**Cuándo**: Cuando una solicitud está en estatus **NUEVO**.

**Pasos**:
1. En la tabla, localiza la solicitud con estatus **NUEVO**
2. Haz clic en **Gestionar** para ir al detalle de la solicitud
3. En la página de detalle, ve a la sección de cotizaciones
4. Haz clic en **Agregar Cotización**
5. Completa los campos:
   | Campo | Tipo | Requerido | Descripción |
   |-------|------|-----------|-------------|
   | Proveedor | Texto | Sí | Nombre del proveedor |
   | Monto | Número | Sí | Monto total de la cotización |
   | Archivo | Archivo | No | PDF o imagen de la cotización |
6. Haz clic en **Guardar**

**Reglas**:
- Se pueden agregar de **1 a 3 cotizaciones** por solicitud
- No es obligatorio tener 3 cotizaciones
- Una vez agregada la primera cotización, la solicitud pasa a **PENDIENTE**

> **Captura pendiente**: Formulario de agregar cotización

#### 4.4.2 Ver Cotizaciones Existentes

En el detalle de la solicitud, la sección de cotizaciones muestra:
- Proveedor
- Monto
- Archivo adjunto (si existe)
- Indicador de selección (si el solicitante ya eligió)

### 4.5 Enviar a Autorización

**Cuándo**: Cuando el solicitante seleccionó una cotización y el monto supera los **$50,000 MXN**.

**Pasos**:
1. En la tabla, localiza la solicitud con estatus **PENDIENTE** y cotización seleccionada
2. Si el monto > $50,000, haz clic en **Autorizar** o **Reenviar**
3. Se abrirá el modal de autorización
4. Selecciona los aprobadores según la jerarquía:
   - **Jefe Inmediato**: Primer nivel
   - **Gerente**: Segundo nivel (si aplica)
   - **Dirección**: Tercer nivel (si aplica)
5. Haz clic en **Enviar a Autorización**
6. La solicitud pasa a **EN_AUTORIZACION**

**Seguimiento de aprobadores**:
| Indicador | Significado |
|-----------|-------------|
| ⏳ Pendiente | Aún no ha respondido |
| ✓ Aprobó | Aprobó la solicitud |
| ✗ Rechazó | Rechazó la solicitud |

> **Captura pendiente**: Modal de envío a autorización

### 4.6 Marcar como Entregado

**Cuándo**: Cuando la solicitud está en estatus **APROBADO** y los bienes/servicios han sido entregados.

**Pasos**:
1. En la tabla, localiza la solicitud con estatus **APROBADO**
2. Haz clic en **Entregar**
3. Confirma la acción
4. La solicitud pasa a estatus **ENTREGADO**

### 4.7 Cancelar una Solicitud

**Cuándo**: Cuando una solicitud ya no es necesaria.

**Pasos**:
1. En la tabla, localiza la solicitud que deseas cancelar
2. Haz clic en **Cancelar**
3. Confirma la acción
4. La solicitud pasa a estatus **CANCELADO**

### 4.8 Exportar Reportes

#### 4.8.1 Exportar a Excel

1. Haz clic en **Exportar a Excel**
2. El archivo incluirá:
   - ID de solicitud
   - Folio
   - Fechas (creación, actualización)
   - Departamento
   - Solicitante
   - Estatus
   - Monto
   - Cotizaciones
   - Autorizaciones

#### 4.8.2 Exportar Gastos por Departamento

1. En la sección de Gastos por Departamento, haz clic en **Exportar**
2. El archivo incluirá el total gastado por cada departamento

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Cotizaciones por solicitud | Máximo 3 |
| Monto para autorización | > $50,000 MXN requiere autorización |
| Cancelación | Solo en estados NUEVO o PENDIENTE |
| Entrega | Solo en estado APROBADO |
| Edición de cotizaciones | Solo si el solicitante no ha seleccionado |

---

## 6. Casos de Uso

### Caso 1: Solicitud de bajo monto
1. Empleado solicita material de oficina por $5,000
2. Compras agrega 2 cotizaciones
3. Solicitud pasa a **PENDIENTE**
4. Empleado selecciona cotización
5. Como monto ≤ $50,000 → **APROBADO** automático
6. Compras entrega → **ENTREGADO**

### Caso 2: Solicitud de alto monto
1. Empleado solicita equipo por $150,000
2. Compras agrega 3 cotizaciones
3. Empleado selecciona la más conveniente
4. Como monto > $50,000 → Compras envía a autorización
5. Aprobadores autorizan → **APROBADO**
6. Compras entrega → **ENTREGADO**

### Caso 3: Solicitud cancelada
1. Empleado solicita servicio
2. Compras agrega cotizaciones
3. Antes de seleccionar, el proyecto se cancela
4. Compras cancela la solicitud → **CANCELADO**

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No veo solicitudes en el panel | Filtro activo o sin módulo COMPRAS | Limpiar filtros, verificar accesos |
| No puedo subir cotización | Archivo muy grande o formato incorrecto | Usar PDF o imagen, verificar tamaño |
| No aparece botón Autorizar | Monto ≤ $50,000 o ya está autorizado | Verificar monto y estado |
| Error al enviar a autorización | Sin aprobadores disponibles | Verificar jerarquía del solicitante |
| No puedo agregar más cotizaciones | Ya hay 3 cotizaciones | Máximo permitido es 3 |

---

## 8. Buenas Prácticas

1. **Solicitar múltiples cotizaciones**: Siempre que sea posible, obtener al menos 2 cotizaciones
2. **Documentar proveedores**: Adjuntar PDFs de las cotizaciones de proveedores
3. **Dar seguimiento**: Revisar diariamente las solicitudes nuevas y pendientes
4. **Comunicar al solicitante**: Notificar cuando se requiera selección de cotización
5. **Cerrar oportunamente**: Marcar como entregado una vez que los bienes lleguen
6. **Verificar montos**: Confirmar que el monto de autorización sea correcto antes de enviar

---

## 9. Preguntas Frecuentes

**P: ¿Puedo editar una cotización después de agregarla?**
R: Sí, siempre que el solicitante no haya seleccionado una cotización.

**P: ¿Qué pasa si solo tengo 1 cotización?**
R: Es válido, no es obligatorio tener 3 cotizaciones.

**P: ¿Cómo sé si una solicitud requiere autorización?**
R: Si el monto de la cotización seleccionada es > $50,000 MXN.

**P: ¿Puedo reenviar a autorización si algún aprobador rechazó?**
R: Sí, usando el botón **Reenviar** puedes seleccionar nuevos aprobadores.

**P: ¿Puedo eliminar una solicitud?**
R: No hay eliminación física. Se puede cancelar la solicitud.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin notificaciones automáticas | No se notifica al solicitante cuando hay cotizaciones |
| Sin integración con proveedores | Las cotizaciones se ingresan manualmente |
| Sin control de inventario | No hay integración con inventario de almacén |
| Sin órdenes de compra | No se generan documentos de orden de compra |
| Sin flujo de rechazo formal | No hay motivo de rechazo en autorizaciones |

---

## 11. Referencias

- **Panel de Compras**: `/dashboard/compras`
- **Detalle de Solicitud**: `/dashboard/compras/[id]`
- **Gestión de Papelería**: `/dashboard/compras/papeleria`
- **Gestión de Uniformes**: `/dashboard/compras/uniformes`
- **Módulo documentado**: `docs/modules/COMPRAS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
