# Manual de Reclutamiento — RH

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: RH — Recursos Humanos  
> **Módulo**: RECLUTAMIENTO

---

## 1. Objetivo

Gestionar el ciclo completo de reclutamiento: desde la recepción de solicitudes de vacante de los jefes de área, aprobación, definición de perfil técnico, búsqueda de candidatos, hasta el cierre de la vacante.

---

## 2. Alcance

Este manual cubre las funcionalidades de RH en el módulo de Reclutamiento:

| Funcionalidad | Descripción |
|---------------|-------------|
| Dashboard de Reclutamiento | Panel con estadísticas y listado de todas las vacantes |
| Aprobar solicitudes | Cambiar estatus de Solicitada a Aprobada |
| Cerrar solicitudes | Finalizar vacantes cubiertas o canceladas |
| Reabrir solicitudes | Reactivar vacantes cerradas |
| Crear vacante pre-aprobada | Alta directa de vacantes en estatus Aprobada |
| Gestionar candidatos | Administrar postulantes por vacante |
| Seguimiento de perfil técnico | Monitorear definición de requerimientos |

---

## 3. Flujo Funcional

```
Solicitante (Jefe de Área)
    ↓
Solicita Vacante (estatus: Solicitada)
    ↓
RH Aprueba (estatus: Aprobada)
    ↓
Solicitante define Perfil Técnico
    ↓
RH inicia Búsqueda (estatus: Buscando)
    ↓
RH gestiona Candidatos
    ↓
RH Cierra Vacante (estatus: Cerrada)
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder al Dashboard de Reclutamiento

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Administración Global → Reclutamiento RH**
3. **Ruta directa**: `/rh/reclutamiento`

> **Captura pendiente**: Pantalla del dashboard de reclutamiento

### 4.2 Interpretar las Estadísticas

El dashboard muestra 5 tarjetas con métricas:

| Tarjeta | Color | Descripción |
|---------|-------|-------------|
| **Total Solicitudes** | Gris oscuro | Todas las solicitudes registradas |
| **Solicitadas** | Amarillo | Pendientes de aprobación por RH |
| **Aprobadas** | Verde | Aprobadas, esperando perfil técnico |
| **Buscando** | Azul | En proceso de reclutamiento activo |
| **Cerradas** | Gris | Vacantes cubiertas o canceladas |

### 4.3 Aprobar una Solicitud de Vacante

**Cuándo**: Cuando un jefe de área solicita una nueva vacante y RH determina que es procedente.

**Pasos**:
1. En el dashboard, localiza la solicitud con estatus **Solicitada**
2. Revisa los detalles de la solicitud (título, departamento, justificación)
3. Haz clic en el botón **Aprobar Solicitud** (icono ✓ verde)
4. Confirma la acción en el diálogo: *"¿Estás seguro de aprobar esta solicitud de vacante?"*
5. El sistema mostrará: *"Solicitud aprobada exitosamente"*
6. La vacante cambia a estatus **Aprobada**

**Validaciones**:
- Solo se pueden aprobar solicitudes en estatus **Solicitada**
- La vacante debe tener toda la información básica completa

> **Captura pendiente**: Botón Aprobar Solicitud

### 4.4 Cerrar una Solicitud de Vacante

**Cuándo**: Cuando la vacante ha sido cubierta o se decide cancelar el proceso.

**Pasos**:
1. Localiza la solicitud con estatus **Buscando** o **Aprobada**
2. Haz clic en **Cerrar Solicitud**
3. Confirma la acción
4. La vacante cambia a estatus **Cerrada**

**Validaciones**:
- Se puede cerrar desde cualquier estatus excepto **Cerrada**
- Una vez cerrada, no se pueden agregar más candidatos

### 4.5 Reabrir una Solicitud

**Cuándo**: Cuando una vacante cerrada necesita reactivarse.

**Pasos**:
1. Localiza la solicitud con estatus **Cerrada**
2. Haz clic en **Reabrir Solicitud**
3. Confirma la acción
4. La vacante regresa al estatus anterior (generalmente **Buscando**)

### 4.6 Crear Vacante Pre-Aprobada

**Cuándo**: Cuando RH necesita crear una vacante directamente sin esperar la solicitud de un jefe de área.

**Pasos**:
1. En el dashboard de reclutamiento, haz clic en **+ Crear Vacante Pre-Aprobada**
2. Se abrirá el formulario con las siguientes secciones:

**Sección 1: Información de la Vacante**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Título de la vacante | Texto | Sí | Nombre del puesto |
| Departamento | Select | Sí | Departamento al que pertenece |
| Puesto | Select | Sí | Puesto específico (carga dinámica según departamento) |
| Número de vacantes | Número | Sí | Cantidad de posiciones (mínimo 1) |
| Motivo de solicitud | Select | Sí | NUEVA_CREACION, REEMPLAZO_DEFINITIVO, etc. |
| Persona a reemplazar (nombre) | Texto | No | Nombre de quien será reemplazado |
| Persona a reemplazar (cargo) | Texto | No | Cargo de quien será reemplazado |
| No aceptan reingresos | Checkbox | No | Marcar si aplica |
| Ubicación física | Texto | No | Lugar de trabajo |
| Tipo de contratación | Select | Sí | ADMINISTRATIVO, TEMPORAL, SINDICALIZADO, etc. |

**Sección 2: Requerimientos de Infraestructura**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Requiere computadora escritorio | Checkbox | Equipo de escritorio |
| Requiere laptop | Checkbox | Equipo portátil |
| Requiere teléfono móvil | Checkbox | Teléfono celular |
| Requiere extensión telefónica | Checkbox | Extensión de oficina |
| Otros requerimientos físicos | Texto | Especificaciones adicionales |

**Sección 3: Promoción Interna**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Considera promoción interna | Checkbox | ¿Se considera personal interno? |
| Candidatos internos propuestos | Lista dinámica | Nombre y cargo de cada candidato |
| Observaciones de promoción | Texto | Notas adicionales |

**Sección 4: Proceso de Entrevista**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Entrevistador técnico | Texto | Persona que realizará la entrevista técnica |
| Entrevistador de respaldo | Texto | Persona de respaldo |
| Conocimientos adicionales | Texto | Conocimientos extra requeridos |
| Requerimientos técnicos | Lista dinámica | Lista de requerimientos específicos |

3. Completa todos los campos requeridos
4. Haz clic en **Crear Vacante Pre-Aprobada**
5. La vacante se crea directamente en estatus **Aprobada**
6. El sistema redirige al dashboard de reclutamiento

**Validaciones del formulario**:
- Título: No puede estar vacío
- Departamento: Obligatorio
- Puesto: Obligatorio
- Requerimientos técnicos: Al menos uno
- Número de vacantes: Debe ser ≥ 1

> **Captura pendiente**: Formulario de crear vacante pre-aprobada

### 4.7 Gestionar Candidatos

**Cuándo**: Cuando la vacante está en estatus **Buscando** y se necesita administrar los postulantes.

**Pasos**:
1. En el dashboard, localiza la vacante con estatus **Buscando**
2. Haz clic en **Gestionar Candidatos**
3. Se abrirá la página de detalle de la vacante con la pestaña de candidatos

**Acciones disponibles**:
| Acción | Descripción |
|--------|-------------|
| **Agregar candidato** | Registrar un nuevo candidato manualmente |
| **Ver candidatos** | Lista de todos los postulantes |
| **Cambiar estatus** | Avanzar el proceso del candidato |
| **Agregar comentarios** | Notas sobre el candidato |
| **Subir documentos** | CV, certificados, etc. |

**Estados de candidato**:
| Estado | Descripción |
|--------|-------------|
| NUEVO | Recién registrado |
| EN_REVISION | Siendo evaluado |
| ENTREVISTA_TECNICA | En entrevista técnica |
| ENTREVISTA_RH | En entrevista con RH |
| APTO | Pasa a siguiente fase |
| NO_APTO | Descartado |
| CONTRATADO | Seleccionado y contratado |

> **Captura pendiente**: Gestión de candidatos

### 4.8 Seguimiento de Perfil Técnico

**Cuándo**: Cuando una vacante está **Aprobada** y el solicitante debe definir los requerimientos técnicos.

**Como RH puedes**:
- Ver si el perfil técnico ya fue definido
- Dar seguimiento al solicitante para que complete la definición
- Una vez definido, cambiar la vacante a **Buscando**

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Aprobación | Solo desde estatus **Solicitada** |
| Cierre | Desde cualquier estatus excepto **Cerrada** |
| Reapertura | Solo desde estatus **Cerrada** |
| Creación pre-aprobada | Requiere módulo RECLUTAMIENTO + rol ADMIN o RH |
| Gestión de candidatos | Solo cuando estatus es **Buscando** |
| Perfil técnico | Solo cuando estatus es **Aprobada** |

---

## 6. Casos de Uso

### Caso 1: Solicitud estándar
1. Jefe de área solicita vacante → **Solicitada**
2. RH revisa y aprueba → **Aprobada**
3. Jefe define perfil técnico
4. RH cambia a **Buscando**
5. RH gestiona candidatos
6. Se cubre la posición → **Cerrada**

### Caso 2: Vacante directa RH
1. RH crea vacante pre-aprobada → **Aprobada**
2. RH asigna solicitante para perfil técnico
3. Continúa flujo normal

### Caso 3: Vacante cancelada
1. Solicitud en cualquier estado
2. RH cierra solicitud → **Cerrada**
3. Si se necesita reactivar → **Reabrir**

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "No tienes acceso al módulo" | Módulo RECLUTAMIENTO no asignado | Verificar en Gestión de Accesos |
| No aparece botón Aprobar | La vacante no está en Solicitada | Verificar estatus actual |
| Error al crear vacante | Campos requeridos incompletos | Revisar validaciones del formulario |
| No se ven candidatos | Vacante no está en Buscando | Cambiar estatus primero |

---

## 8. Buenas Prácticas

1. **Revisar solicitudes diariamente**: No dejar acumular solicitudes en estatus **Solicitada**
2. **Comunicar al solicitante**: Notificar cuando una vacante es aprobada o rechazada
3. **Documentar candidatos**: Agregar comentarios y documentos de cada candidato
4. **Cerrar vacantes oportunamente**: Evitar mantener vacantes abiertas innecesariamente
5. **Usar vacantes pre-aprobadas**: Para posiciones críticas que RH sabe que son necesarias

---

## 9. Preguntas Frecuentes

**P: ¿Puedo rechazar una solicitud de vacante?**
R: Actualmente no hay un botón de "Rechazar". Se puede cerrar la solicitud para indicar que no procede.

**P: ¿Qué pasa si el solicitante no define el perfil técnico?**
R: La vacante se queda en **Aprobada**. RH debe dar seguimiento con el solicitante.

**P: ¿Puedo eliminar una vacante?**
R: No hay eliminación física. Se debe cerrar la vacante.

**P: ¿Cuántos candidatos puedo registrar?**
R: No hay límite definido. Se pueden registrar todos los candidatos necesarios.

**P: ¿Puedo reabrir una vacante cerrada?**
R: Sí, usando el botón **Reabrir Solicitud**.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin notificaciones automáticas | No se notifica al solicitante cuando se aprueba su vacante |
| Sin rechazo formal | No hay flujo de rechazo con motivo |
| Sin plantillas de vacantes | No se pueden guardar vacantes como plantilla |
| Sin calendarización de entrevistas | No hay integración con calendario |
| Sin pruebas técnicas | No se pueden adjuntar evaluaciones técnicas |

---

## 11. Referencias

- **Dashboard de Reclutamiento**: `/rh/reclutamiento`
- **Crear Vacante Pre-Aprobada**: `/rh/reclutamiento/crear-vacante`
- **Detalle de Vacante**: `/reclutamiento/vacantes/[id]`
- **Perfil Técnico**: `/reclutamiento/vacantes/[id]/perfil-tecnico`
- **Módulo documentado**: `docs/modules/RECLUTAMIENTO.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
