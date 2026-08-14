# Manual de Mis Solicitudes de Compra

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: EMPLEADO_BÁSICO — Empleado general  
> **Módulo**: COMPRAS

---

## 1. Objetivo

Solicitar materiales, equipos o servicios necesarios para el trabajo. Como empleado, puedes crear solicitudes de compra, dar seguimiento a su estado y consultar el historial de tus solicitudes.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Crear solicitud de compra | Solicitar productos o servicios con justificación |
| Ver mis solicitudes | Listado de todas tus solicitudes con su estado actual |
| Ver detalle de solicitud | Información completa de una solicitud específica |
| Cancelar solicitud | Cancelar una solicitud que aún no ha sido procesada |
| Seleccionar cotización | Elegir la cotización de proveedor que prefieras |

---

## 3. Flujo Funcional

```
Crear solicitud (NUEVO)
    ↓
Compras agrega cotizaciones (PENDIENTE)
    ↓
Tú seleccionas cotización
    ↓
    ├── Monto ≤ $50,000 → APROBADO automático
    └── Monto > $50,000 → EN_AUTORIZACION → Aprobadores → APROBADO
    ↓
Compras entrega (ENTREGADO)
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Crear una Solicitud de Compra

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Compras → Nueva Solicitud**
3. **Ruta directa**: `/compras/nueva-solicitud`

**Pasos**:
1. Completa la **Justificación** de tu solicitud (explica por qué necesitas los materiales/servicios)
2. Agrega los **ítems** que necesitas:
   | Campo | Tipo | Requerido | Descripción |
   |-------|------|-----------|-------------|
   | Producto/Servicio | Texto | Sí | Describe lo que necesitas |
   | Cantidad | Número | Sí | Cantidad requerida |
   | Descripción | Texto | No | Detalles adicionales |
3. Para agregar más ítems, haz clic en **+ Agregar ítem**
4. Para eliminar un ítem, haz clic en el icono de eliminar (debe haber al menos 1)
5. Haz clic en **Enviar Solicitud**

**Validaciones**:
- La justificación es obligatoria
- Todos los ítems deben tener producto/servicio y cantidad
- Las cantidades deben ser números mayores a 0

> **Captura pendiente**: Formulario de nueva solicitud de compra

### 4.2 Ver Mis Solicitudes

1. En el menú lateral, ve a **Compras → Mis Solicitudes**
2. **Ruta directa**: `/compras/mis-solicitudes`

La tabla muestra por cada solicitud:

| Columna | Descripción |
|---------|-------------|
| **Folio** | Identificador único |
| **Estatus** | Estado actual con icono y color |
| **Fecha** | Fecha de creación |
| **Justificación** | Motivo de la solicitud |
| **Monto** | Monto total (cuando hay cotización seleccionada) |
| **Proveedor** | Proveedor seleccionado (si aplica) |
| **Aprobadores** | Estado de cada aprobador (si aplica) |
| **Acciones** | Ver detalle, Cancelar |

**Estados y sus significados**:
| Estado | Icono | Significado |
|--------|-------|-------------|
| **NUEVO** | 🆕 | Solicitud creada, esperando cotizaciones |
| **PENDIENTE** | ⏳ | Cotizaciones listas, esperando tu selección |
| **EN_AUTORIZACION** | 📋 | En proceso de autorización |
| **APROBADO** | ✅ | Autorizada, Compras la procesará |
| **ENTREGADO** | 📦 | Bienes/servicios entregados |
| **CANCELADO** | ❌ | Solicitud cancelada |

### 4.3 Ver Detalle de una Solicitud

1. En la lista de mis solicitudes, haz clic en **Ver Detalle**
2. **Ruta directa**: `/compras/mis-solicitudes/[id]`

En el detalle puedes ver:
- Información general (folio, fechas, estatus)
- Justificación
- Lista de ítems solicitados
- Cotizaciones de proveedores (si Compras ya las agregó)
- Estado de autorizaciones (si aplica)

### 4.4 Seleccionar una Cotización

**Cuándo**: Cuando Compras ha agregado cotizaciones y la solicitud está en **PENDIENTE**.

**Pasos**:
1. Ve al detalle de la solicitud
2. En la sección de cotizaciones, revisa las opciones de proveedores
3. Haz clic en **Seleccionar** en la cotización que prefieras
4. Confirma tu selección
5. La solicitud avanzará al siguiente paso:
   - Si el monto ≤ $50,000 → **APROBADO** automático
   - Si el monto > $50,000 → **EN_AUTORIZACION**

> **Captura pendiente**: Selección de cotización

### 4.5 Cancelar una Solicitud

**Cuándo**: Cuando ya no necesitas los materiales/servicios solicitados.

**Pasos**:
1. En la lista de mis solicitudes, localiza la solicitud
2. Haz clic en **Cancelar**
3. Confirma la acción
4. La solicitud cambia a **CANCELADO**

**Nota**: Solo puedes cancelar solicitudes en estado **NUEVO** o **PENDIENTE**.

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Cancelación | Solo en estados NUEVO o PENDIENTE |
| Selección de cotización | Solo cuando hay cotizaciones disponibles |
| Creación de solicitud | Requiere módulo COMPRAS |
| Ítems por solicitud | Al menos 1 ítem |

---

## 6. Casos de Uso

### Caso 1: Solicitud de material de oficina
1. Necesitas 2 resmas de papel y 5 plumas
2. Creas solicitud con justificación: "Material para oficina"
3. Compras agrega cotizaciones
4. Seleccionas la cotización más económica
5. Como el monto es bajo, se aprueba automáticamente
6. Compras entrega el material

### Caso 2: Solicitud de equipo
1. Necesitas una computadora nueva
2. Creas solicitud con justificación detallada
3. Compras agrega 3 cotizaciones de diferentes proveedores
4. Seleccionas la que mejor se ajusta
5. Como el monto > $50,000, pasa a autorización
6. Esperas a que los aprobadores autoricen
7. Compras realiza la compra y entrega

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No puedo crear solicitud | Módulo COMPRAS no asignado | Solicitar acceso a RH |
| No veo mis solicitudes | Aún no has creado ninguna | Crear tu primera solicitud |
| No puedo seleccionar cotización | Solicitud no está en PENDIENTE | Esperar a que Compras agregue cotizaciones |
| Error al enviar | Campos incompletos | Revisar justificación e ítems |
| No aparece botón Cancelar | Solicitud ya está en proceso avanzado | Contactar a Compras |

---

## 8. Buenas Prácticas

1. **Justifica claramente**: Explica por qué necesitas los materiales/servicios
2. **Sé específico**: Describe claramente los productos/servicios que necesitas
3. **Revisa antes de enviar**: Verifica que todos los datos sean correctos
4. **Da seguimiento**: Revisa periódicamente el estado de tus solicitudes
5. **Selecciona oportunamente**: Cuando veas cotizaciones disponibles, selecciona pronto

---

## 9. Preguntas Frecuentes

**P: ¿Cuánto tiempo tarda en procesarse mi solicitud?**
R: Depende de la complejidad. Compras generalmente responde en 1-3 días hábiles.

**P: ¿Puedo modificar una solicitud después de enviarla?**
R: No directamente. Si necesitas cambios, cancela la solicitud y crea una nueva.

**P: ¿Qué pasa si nadie autoriza mi solicitud?**
R: Si los aprobadores no responden, contacta a Compras para dar seguimiento.

**P: ¿Puedo ver quién autorizó mi solicitud?**
R: Sí, en el detalle de la solicitud puedes ver el estado de cada aprobador.

**P: ¿Puedo solicitar servicios, no solo productos?**
R: Sí, el campo "Producto/Servicio" acepta ambos tipos.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin edición de solicitudes | No se pueden modificar solicitudes enviadas |
| Sin notificaciones | No se te notifica cuando hay cambios en tu solicitud |
| Sin adjuntar archivos | No puedes subir documentos de respaldo |
| Sin presupuesto | No hay validación contra presupuesto departamental |

---

## 11. Referencias

- **Nueva Solicitud**: `/compras/nueva-solicitud`
- **Mis Solicitudes**: `/compras/mis-solicitudes`
- **Detalle de Solicitud**: `/compras/mis-solicitudes/[id]`
- **Módulo documentado**: `docs/modules/COMPRAS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
