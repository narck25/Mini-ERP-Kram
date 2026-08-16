# Presentación del Proyecto — ERP KRAM

## Resumen ejecutivo

**ERP KRAM** es un sistema de gestión empresarial (ERP) desarrollado a la medida para **Comercializadora KRAM**. Centraliza la operación de recursos humanos, reclutamiento, compras, control de asistencia y administración del sistema en una única plataforma web, con un modelo de permisos dinámico basado en **módulos** y **roles** que se configura sin necesidad de modificar código.

El sistema fue diseñado para una empresa con **alta rotación de personal**, por lo que incorpora mecanismos específicos como la **reutilización de correos institucionales** (contabilidad@kram.mx, sistemas@kram.mx, etc.) entre las personas que ocupan un mismo puesto a lo largo del tiempo, y la **baja de empleados con motivo** que libera automáticamente dichos correos.

## Contexto y problema que resuelve

Antes del ERP, la operación de KRAM se manejaba con herramientas dispersas (hojas de cálculo, correo, papeles). Los principales problemas eran:

1. **Expedientes de personal desorganizados** — sin un lugar único donde consultar la información de cada empleado (datos personales, laborales, legales, financieros, uniformes, beneficiarios).
2. **Reclutamiento manual** — la solicitud de vacantes (requisición de personal) y el seguimiento de candidatos se hacía sin un flujo digital ni trazabilidad.
3. **Compras sin control** — las solicitudes de compra, cotizaciones y órdenes de compra no tenían un flujo de aprobación ni control de inventario.
4. **Accesos rígidos** — no había un sistema de permisos flexible; cada persona debía tener una cuenta "personalizada" (costosa en licencias), en lugar de reutilizar correos institucionales por puesto.
5. **Asistencia manual** — el control de asistencia (checador) se procesaba a mano para detectar incidencias.

El ERP KRAM resuelve estos problemas con módulos integrados, permisos configurables y trazabilidad completa.

## Módulos del sistema

### 1. Dashboard (siempre activo)
- **"Mi Espacio"**: panel personal de autoservicio donde cada usuario ve **solo lo suyo** (vacantes, compras, actividades, candidatos), aplicando *scoping* por jerarquía.
- **Dashboard RH**: vista consolidada de indicadores para RH y Administración.

### 2. Empleados
- **Expediente digital completo** (~50 campos en secciones: personales, laborales, contacto, legales, financieros, uniformes, beneficiarios, familiares).
- **Alta, edición y baja** con trazabilidad.
- **Baja con motivo**: al dar de baja se registra el motivo (Renuncia, Despido, Fin de contrato, Abandono, Otro + nota) y la fecha, se desactiva la cuenta y se **libera el correo institucional** para reutilizarlo.
- **Documentos** del empleado (tipos permitidos, subida y descarga).
- **Foto de perfil**.
- **Historial de sueldos** con cálculo automático de SD/SDI.
- **Organización**: departamentos, puestos y jefes.
- **Importación/exportación CSV**.
- Validación de unicidad de RFC, CURP, NSS y clave.

### 3. Reclutamiento
- Flujo completo de **requisición de personal**: el empleado solicita una vacante → RH la aprueba → estado "Buscando" → se registran candidatos.
- **Tablero Kanban** de candidatos (En revisión, Seleccionado, Descartado) con **votos** (visto bueno / no seleccionado) mediante arrastrar y soltar.
- **Perfil técnico detallado**, actividades y comentarios por vacante.
- CV y pruebas psicométricas de cada candidato.

### 4. Compras
- **Solicitudes de compra** con productos, cantidades y justificación.
- **Cotizaciones** de proveedores y selección de la ganadora.
- **Autorización gerencial** automática para compras mayores a $50,000 MXN.
- **Órdenes de compra (OC)** con partidas.
- **Papelería**: solicitudes e inventario.
- **Uniformes**: inventario, entregas a empleados y **acta imprimible** de entrega con firmas.
- **Inventario** con **kardex de movimientos** (entradas/salidas/ajustes), **restock** y **solicitudes de ajuste** aprobadas por RH/Admin.
- **Comentarios** en solicitudes con actualización en tiempo real (SSE).

### 5. Incidencias (Asistencia)
- Carga del **CSV del reloj checador (ZKTeco)**.
- Procesamiento automático de checadas (filtro anti-rebote, cálculo de jornada).
- **Reporte de incidencias** (faltas, retardos) por rango de fechas y empleado.

### 6. Configuración
- **Gestión de Accesos**: asignación de módulos por usuario, aplicación de presets por rol y gestión de **roles personalizados**.
- **Gestión de Usuarios**: creación, edición, eliminación de cuentas y restablecimiento de contraseñas.

## Roles y modelo de seguridad

El sistema usa **roles semidinámicos** y un control de acceso en **tres niveles**:

| Nivel | Mecanismo | Descripción |
|-------|-----------|-------------|
| **A — Módulos** | `accessibleModules` | Determina qué módulos ve cada usuario (menú, rutas, endpoints). |
| **B — Scoping** | Lógica de negocio | Determina qué datos ve dentro de un módulo (ej. un jefe ve solo su departamento). |
| **C — Operaciones críticas** | `requireRole(['ADMIN'])` | Solo ADMIN cambia roles, elimina usuarios y gestiona roles personalizados. |

**Roles estratégicos (bypass global):**
- **ADMIN** — control técnico global (acceso total + operaciones críticas).
- **RH** — control operativo global autorizado por Dirección General (acceso total operativo, excepto operaciones críticas de sistema).

**Roles departamentales y base:**
- **SISTEMAS** (soporte técnico), **COMPRAS** (compras), **PRODUCCION** (producción), **EMPLEADO_BASICO** (acceso básico).

Los permisos se **configuran desde la interfaz** (no se hardcodean), lo que permite agregar roles o reorganizar responsabilidades sin tocar código.

## Arquitectura técnica

### Backend (Node.js + Express + Prisma + PostgreSQL)
- Separación estricta en **3 capas**: `routes → controllers → services`.
- Los controladores se mantienen delgados (validan y orquestan); la lógica de negocio vive en servicios.
- **Prisma ORM** como única vía de acceso a la base de datos (prohibido SQL directo).
- Middlewares de seguridad: `verifyToken`, `requireModule`, `requireRole`, `requireAdmin`, `requireRHOrAdmin`.
- **JWT** con `role` y `accessibleModules` en el payload; contraseñas con bcrypt (salt 10).
- **41 migraciones** de base de datos (PostgreSQL).

### Frontend (Next.js 14 + React 18 + Tailwind CSS)
- **App Router** de Next.js con páginas delgadas y componentes reutilizables.
- `<DashboardLayout>` (sidebar + header) y `<ProtectedRoute>` para proteger rutas.
- Contexto de autenticación (`AuthContext`), hooks reutilizables y cliente Axios centralizado.
- Formato de fechas `DD/MM/YYYY` en la UI (evitando el "bug del día anterior").

### Infraestructura
- **Docker + Docker Compose** para desarrollo y producción.
- Las **migraciones se aplican automáticamente** al iniciar el contenedor del backend.
- **GitHub Actions** para CI (backend y frontend).

## Flujos de negocio clave

1. **Alta de empleado**: formulario por secciones → validación de RFC/CURP/NSS → cálculo de SD/SDI → creación del empleado → (opcional) creación de cuenta de acceso.
2. **Baja de empleado**: modal con motivo y fecha → estatus "Inactivo" → desactivación de cuenta → liberación del correo institucional.
3. **Reclutamiento**: requisición → aprobación → búsqueda → candidatos (Kanban) → votos → selección.
4. **Compra**: solicitud → cotizaciones → selección → autorización (si > $50k) → orden de compra → entrega.
5. **Ajuste de inventario**: solicitud (COMPRAS) → aprobación/rechazo (RH/Admin) → aplicación + registro en kardex.

## Estado del proyecto

- **6 módulos habilitados** y funcionales; 2 deshabilitados (Vacaciones y Reportes).
- **14 suites / 99 pruebas** automatizadas (Jest + Supertest), todas pasando.
- Documentación completa por módulo (manuales + flujos con diagramas Mermaid).

## Conclusiones

El ERP KRAM es una solución a la medida que **digitaliza y centraliza la operación** de Comercializadora KRAM, con un énfasis en:
- **Configuración sobre código** (permisos y módulos dinámicos).
- **Seguridad por niveles** (módulos, scoping y operaciones críticas).
- **Adaptación a la rotación de personal** (reutilización de correos institucionales).
- **Trazabilidad y auditoría** en cada proceso (bajas, compras, inventario).
