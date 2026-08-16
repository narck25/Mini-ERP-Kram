# Manual del Proyecto y Módulos — ERP KRAM

Manual completo de uso del sistema para todos los perfiles (administradores, RH, compras y empleados).

## 1. Introducción

El ERP KRAM es la plataforma de gestión de **Comercializadora KRAM**. Reúne en un solo lugar:

- **Empleados** (expedientes, documentos, organización).
- **Reclutamiento** (vacantes y candidatos).
- **Compras** (solicitudes, cotizaciones, órdenes de compra, papelería, uniformes e inventario).
- **Incidencias** (asistencia y reporte).
- **Configuración** (accesos, usuarios y roles).

Cada persona ve y usa únicamente los **módulos** que le fueron asignados según su rol y responsabilidad.

## 2. Acceso al sistema

1. Abre la URL del sistema e inicia sesión con tu **correo** y **contraseña**.
2. Según tu perfil serás redirigido a tu panel:
   - Empleados y usuarios en general → **"Mi Espacio"**.
   - ADMIN/RH → pueden acceder al **Dashboard RH**.

> Los correos institucionales (ej. `contabilidad@kram.mx`) son **reutilizables**: cuando una persona deja la empresa, su cuenta se desactiva y el correo queda libre para la siguiente persona del puesto.

## 3. Roles y permisos

| Rol | Qué puede hacer |
|-----|-----------------|
| **ADMIN** | Todo, incluidas las operaciones críticas (cambiar roles, eliminar usuarios, roles personalizados). |
| **RH** | Todo a nivel operativo: empleados, reclutamiento, incidencias y gestión de accesos (módulos). No puede cambiar roles de usuarios. |
| **SISTEMAS** | Soporte técnico (Dashboard + Configuración). |
| **COMPRAS** | Compras: solicitudes, cotizaciones, órdenes de compra, papelería, uniformes; solicita ajustes de inventario. |
| **PRODUCCION** | Solo Dashboard. |
| **EMPLEADO_BASICO** | Dashboard + los módulos que le asignen. |

## 4. Módulo Dashboard

### 4.1 Mi Espacio
Panel personal que muestra **tus** datos:
- Vacantes activas.
- Solicitudes de compra.
- Actividades pendientes.
- Candidatos relacionados.

### 4.2 Dashboard RH
Vista consolidada de indicadores (empleados, vacantes, incidencias) para RH/Admin.

## 5. Módulo Empleados

### 5.1 Lista de empleados (`/rh/empleados`)
- Busca por nombre, RFC, CURP o NSS.
- Filtra por departamento y estatus (Activo/Inactivo).
- Acciones por fila: **Editar**, **Baja**, **Eliminar** (permanente) y **Ver**.

### 5.2 Alta de empleado
1. Pulsa **"Nuevo Empleado"**.
2. Completa el formulario por secciones (personales, laborales, contacto, legales, financieros, uniformes, beneficiarios, familiares).
3. El sistema valida RFC/CURP/NSS únicos y calcula **SD/SDI** automáticamente.
4. Marca "crear usuario" si deseas crear su cuenta de acceso (usará su correo institucional).

### 5.3 Edición
1. Abre el expediente (`/rh/empleados/[id]`).
2. Edita cada sección con su botón de edición.

### 5.4 Baja de empleado (con motivo)
1. En la lista, pulsa **"Baja"**.
2. Se abre un modal donde eliges:
   - **Motivo**: Renuncia, Despido, Fin de contrato, Abandono u Otro.
   - **Nota/detalle** (opcional).
   - **Fecha de baja** (por defecto, hoy).
3. Al confirmar:
   - El empleado pasa a **Inactivo**.
   - Se guarda el **motivo** y la **fecha**.
   - Su cuenta se **desactiva** y su **correo institucional queda libre**.

### 5.5 Eliminación permanente
- Solo si el empleado **no tiene documentos ni vacantes** asociadas (si los tiene, el sistema lo bloquea).
- Borra el empleado y su cuenta de acceso.

### 5.6 Documentos y foto
- En el expediente, sube documentos (CV, contratos, etc.) y la foto de perfil.

### 5.7 Importación/Exportación CSV
- **Importar CSV**: carga masiva de empleados (descarga la plantilla para conocer las columnas).
- **Exportar CSV**: descarga el listado completo.

### 5.8 Organización
- Gestiona **departamentos**, **puestos** y **jefes** en `/dashboard/organizacion`.

## 6. Módulo Reclutamiento

### 6.1 Solicitar una vacante (empleado)
1. Entra a `/reclutamiento/solicitar-vacante`.
2. Completa el perfil, justificación, requisitos técnicos y actividades.
3. Envía; la solicitud queda en estado **Solicitada**.

### 6.2 Gestionar vacantes (RH/Admin)
- **Aprobar**: la vacante pasa a **Buscando**.
- **Crear vacante**: desde `/rh/reclutamiento`.
- **Cerrar / Cancelar**: finaliza la vacante.

### 6.3 Candidatos (Kanban)
1. En el detalle de la vacante (`/reclutamiento/vacantes/[id]`), registra candidatos con CV y pruebas.
2. Usa el tablero para moverlos entre:
   - **En revisión**.
   - **Seleccionado** (visto bueno).
   - **Descartado** (no seleccionado).
3. El **solicitante** vota (like/dislike); RH/Admin pueden devolver a revisión.

### 6.4 Selección
- Selecciona al candidato para iniciar la contratación.

## 7. Módulo Compras

### 7.1 Solicitud de compra (empleado)
1. Entra a "Mis Compras" (`/compras/mis-solicitudes`).
2. Crea una solicitud con productos, cantidades y justificación.

### 7.2 Gestión de compras (COMPRAS/Admin)
- Agrega **cotizaciones** y selecciona la ganadora.
- Si el monto supera **$50,000 MXN**, la solicitud pasa a **autorización gerencial** (ADMIN).
- Genera la **orden de compra** y marca la **entrega**.

### 7.3 Papelería
- Solicitudes de papelería + inventario de papelería.

### 7.4 Uniformes
- Inventario de uniformes (tipo, talla, género).
- Registra **entregas** a empleados y genera el **acta imprimible**.

### 7.5 Inventario (kardex y ajustes)
- **Restock**: agrega existencias (producto existente o nuevo).
- **Ajuste**: COMPRAS *solicita* un ajuste; RH/Admin lo **aprueban o rechazan** en "Aprobaciones de Inventario".
- **Kardex**: consulta todos los movimientos (entradas/salidas/ajustes) en "Movimientos de Inventario".

## 8. Módulo Incidencias (Asistencia)

1. Entra a `/rh/incidencias`.
2. **Sube el CSV** del reloj checador (ZKTeco).
3. El sistema procesa las checadas y genera el **reporte de incidencias** (faltas, retardos).
4. Filtra por rango de fechas y empleado para consultar.

## 9. Módulo Configuración

### 9.1 Gestión de Accesos (`/dashboard/accesos`)
- **Asignar/retirar módulos**: expande un usuario y marca/desmarca módulos.
- **Aplicar preset** (solo ADMIN): asigna los módulos típicos de un rol (cambia rol + módulos, con confirmación).
- **Roles personalizados** (solo ADMIN): crea, edita o elimina roles.

### 9.2 Gestión de Usuarios (`/dashboard/usuarios`)
- **Crear usuario**: nombre, correo, contraseña y rol.
- **Editar usuario**: cambia nombre, correo, rol, estado y contraseña.
- **Eliminar usuario**: borra la cuenta.
- **Restablecer contraseña**: ADMIN y RH.

> ⚠️ No puedes modificar tus **propios** permisos (para evitar bloquearte).

## 10. Preguntas frecuentes

**¿Puedo reutilizar el correo de un empleado que se dio de baja?**
Sí. Al dar de baja se libera automáticamente el correo institucional; puedes asignarlo a la siguiente persona del puesto.

**¿La baja borra el historial del empleado?**
No. La baja es lógica (el expediente se conserva como "Inactivo"). Solo la eliminación permanente borra el registro.

**¿Quién puede cambiar el rol de un usuario?**
Solo ADMIN (operación crítica de Nivel C).

**¿El Dashboard se puede quitar a un usuario?**
No, el Dashboard está siempre activo para todos.

## 11. Documentación relacionada

- **Manuales por módulo**: `docs/modules/`
- **Flujos de negocio** (con diagramas): `docs/flujos/`
- **Estado del proyecto**: `docs/ESTADO_DEL_PROYECTO.md`
- **Pruebas**: `docs/TESTING.md`
- **Deuda técnica**: `docs/DEUDA_TECNICA.md`
