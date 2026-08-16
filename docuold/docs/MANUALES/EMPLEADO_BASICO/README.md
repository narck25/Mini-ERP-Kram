# Manual de Usuario — Empleado

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: EMPLEADO_BASICO — Empleado general  
> **Acceso**: Dashboard (mínimo), más módulos según asignación

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Dashboard](#2-dashboard)
3. [Mis Solicitudes de Compra](#3-mis-solicitudes-de-compra)
4. [Solicitar una Vacante](#4-solicitar-una-vacante)
5. [Mis Solicitudes de Vacante](#5-mis-solicitudes-de-vacante)
6. [Solución de Problemas](#6-solución-de-problemas)

---

## 1. Introducción

### 1.1 ¿Qué es el ERP KRAM?

El ERP KRAM es el sistema de gestión empresarial de **Comercializadora KRAM**. Aquí puedes:

- Ver tu **Dashboard** personal
- **Solicitar compras** de materiales o servicios
- **Solicitar vacantes** para tu equipo
- Dar seguimiento a tus solicitudes

### 1.2 Acceso al Sistema

1. Abre tu navegador web (Chrome, Edge, Firefox)
2. Navega a la dirección del sistema (ej: `http://localhost:3000`)
3. Ingresa tu **correo electrónico** y **contraseña**
4. Haz clic en **Iniciar Sesión**

> **Nota**: Si olvidaste tu contraseña, contacta al administrador del sistema.

### 1.3 ¿Qué puedes ver?

Dependiendo de los módulos que RH te haya asignado, puedes ver:

| Módulo | Descripción |
|--------|-------------|
| Dashboard | ✅ Siempre activo |
| Compras | ✅ Si te asignaron COMPRAS |
| Reclutamiento | ✅ Si te asignaron RECLUTAMIENTO |
| Otros | Según asignación |

---

## 2. Dashboard

### 2.1 Acceso

- **Ruta**: `/dashboard`
- **Menú**: Dashboard

### 2.2 ¿Qué muestra?

Tu panel principal con información relevante para ti:

- **Bienvenida** con tu nombre
- **Resumen** de tus solicitudes activas
- **Notificaciones** importantes
- **Accesos rápidos** a los módulos que tienes disponibles

---

## 3. Mis Solicitudes de Compra

### 3.1 Acceso

- **Ruta**: `/compras/mis-solicitudes`
- **Menú**: Compras → Mis Solicitudes

### 3.2 ¿Qué puedes hacer?

- **Ver** todas tus solicitudes de compra
- **Crear** nuevas solicitudes
- **Cancelar** solicitudes en estado NUEVO o PENDIENTE
- **Seleccionar cotización** cuando esté disponible

### 3.3 Crear una Nueva Solicitud

1. Haz clic en **+ Nueva Solicitud**
2. Completa los campos:
   - **Justificación**: Explica por qué necesitas los materiales/servicios
   - **Ítems**: Agrega los productos o servicios que necesitas
     - Producto/Servicio (requerido)
     - Cantidad (requerido)
     - Descripción (opcional)
3. Puedes agregar múltiples ítems con **Agregar Ítem**
4. Haz clic en **Enviar Solicitud**

### 3.4 Estados de una Solicitud

| Estado | Significado |
|--------|-------------|
| 🆕 **NUEVO** | Solicitud creada, esperando cotización |
| ⏳ **PENDIENTE** | Compras subió cotizaciones, debes seleccionar una |
| 📋 **EN_AUTORIZACION** | En proceso de autorización |
| ✅ **APROBADO** | Autorizada, en proceso de compra |
| 📦 **ENTREGADO** | Compra completada |
| ❌ **CANCELADO** | Cancelada |

### 3.5 Seleccionar una Cotización

1. Cuando tu solicitud esté en **PENDIENTE**, haz clic en **Seleccionar Cotización**
2. Revisa las cotizaciones de los proveedores
3. Selecciona la que más te convenga
4. Confirma tu selección

### 3.6 Cancelar una Solicitud

1. En tu lista de solicitudes, localiza la que deseas cancelar
2. Haz clic en **Cancelar Solicitud**
3. Confirma la acción

> **Nota**: Solo puedes cancelar solicitudes en estado **NUEVO** o **PENDIENTE**.

---

## 4. Solicitar una Vacante

### 4.1 Acceso

- **Ruta**: `/reclutamiento/solicitar-vacante`
- **Menú**: Reclutamiento → Solicitar Vacante

### 4.2 ¿Qué necesitas?

Para solicitar una vacante, necesitas:

- **Título del puesto**: Nombre del puesto que necesitas
- **Departamento**: Área donde se requiere
- **Justificación**: Por qué es necesaria la contratación
- **Requerimientos**: Conocimientos y habilidades necesarias

### 4.3 Formulario Digitalizado

El sistema cuenta con un **Formulario Digitalizado** que incluye:

1. **Información de la Vacante**
   - Título del puesto
   - Departamento
   - Número de vacantes
   - Tipo de contratación
   - Salario estimado

2. **Requerimientos**
   - Conocimientos técnicos
   - Experiencia requerida
   - Habilidades blandas
   - Escolaridad

3. **Proceso de Entrevista**
   - Número de entrevistas
   - Participantes en el proceso
   - Tipo de evaluación

### 4.4 Enviar la Solicitud

1. Completa todos los campos del formulario
2. Revisa la información
3. Haz clic en **Enviar Solicitud**
4. RH recibirá tu solicitud y la procesará

---

## 5. Mis Solicitudes de Vacante

### 5.1 Acceso

- **Ruta**: `/reclutamiento/mis-solicitudes`
- **Menú**: Reclutamiento → Mis Solicitudes

### 5.2 Estados de una Vacante

| Estado | Significado |
|--------|-------------|
| 🟡 **Solicitada** | En revisión por RH |
| 🟢 **Aprobada** | Aprobada, debes definir el perfil técnico |
| 🔵 **Buscando** | En búsqueda de candidatos |
| ⚫ **Cerrada** | Vacante cubierta o cancelada |

### 5.3 Definir Perfil Técnico

Cuando tu vacante está **Aprobada**:

1. Haz clic en **Definir Perfil Técnico**
2. Completa los requerimientos técnicos específicos
3. Guarda los cambios
4. RH iniciará la búsqueda de candidatos

### 5.4 Ver Detalles

Haz clic en **Ver Detalles** para:
- Ver la información completa de la vacante
- Agregar comentarios
- Ver candidatos (cuando esté en búsqueda)

---

## 6. Solución de Problemas

### 6.1 No puedo acceder al sistema

1. Verifica tu conexión a internet
2. Confirma que tu usuario está activo
3. Usa la opción "¿Olvidaste tu contraseña?"

### 6.2 No veo el módulo de Compras

1. Contacta a RH para que te asignen el módulo
2. Una vez asignado, cierra sesión y vuelve a entrar

### 6.3 No puedo cancelar mi solicitud

Solo puedes cancelar solicitudes en estado **NUEVO** o **PENDIENTE**. Si ya está en otro estado, contacta a Compras.

### 6.4 Mi solicitud de vacante no avanza

1. Verifica el estado actual
2. Si está **Aprobada**, define el perfil técnico
3. Si está **Solicitada**, espera la revisión de RH

---

## Apéndice: Rutas Rápidas

| Acción | Ruta |
|--------|------|
| Dashboard | `/dashboard` |
| Mis Solicitudes de Compra | `/compras/mis-solicitudes` |
| Nueva Solicitud de Compra | `/compras/nueva-solicitud` |
| Solicitar Vacante | `/reclutamiento/solicitar-vacante` |
| Mis Solicitudes de Vacante | `/reclutamiento/mis-solicitudes` |

---

*Documento generado el 24/06/2026 — ERP KRAM*
