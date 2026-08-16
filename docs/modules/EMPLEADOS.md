# Módulo Empleados

## 1. Cómo funciona

Gestiona el expediente completo de cada empleado (~50 campos organizados en secciones: personales, laborales, contacto, legales, financieros, uniformes, beneficiarios y familiares).

Funcionalidades principales:

- **Alta, edición y baja** de empleados.
- **Expediente por secciones** en `/rh/empleados/[id]`.
- **Baja lógica** con motivo, fecha automática y liberación del correo institucional (para reutilizarlo con la siguiente persona del puesto).
- **Documentos** del empleado (tipos permitidos, subida y descarga).
- **Foto de perfil**.
- **Historial de sueldos** con cálculo de SD/SDI.
- **Departamentos, puestos y jefes** (organización).
- **Importación/exportación CSV**.
- Validación de unicidad: RFC, CURP, NSS y clave.

## 2. Quiénes pueden usarlo

| Rol | Qué puede hacer |
|-----|-----------------|
| **ADMIN / RH** | Gestión total: alta, edición, baja, eliminación permanente, documentos, importación, organización. |
| **Jefes (scoping Nivel B)** | Solo ven a los empleados de **su departamento** (vista "Mi Equipo"). |
| **Empleado** | Consulta su propio expediente (autoservicio). |

> La eliminación permanente se **bloquea** si el empleado tiene documentos o vacantes asociadas.

## 3. Manual del administrador

- **Dar de alta**: en `/rh/empleados` → "Nuevo Empleado". Completa el formulario por secciones. El sistema calcula SD/SDI automáticamente.
- **Editar**: abre el expediente y edita por secciones.
- **Dar de baja**: botón "Baja" → se abre un modal donde eliges **motivo** (Renuncia, Despido, Fin de contrato, Abandono, Otro + nota) y **fecha**. Al confirmar, el empleado queda `Inactivo`, se guarda el motivo y se **libera el correo institucional**.
- **Eliminar permanentemente**: solo si no tiene documentos ni vacantes (borra empleado + usuario).
- **Importar/Exportar CSV**: botones "Importar CSV" y "Exportar CSV". La plantilla descargable indica los campos.
- **Organización**: gestiona departamentos, puestos y jefes en `/dashboard/organizacion`.

## 4. Manual del usuario

- **Ver mi expediente**: desde "Mi Espacio" o "Mi Equipo" accede a tu ficha para consultar tus datos.
- No puedes editar tu propio expediente (eso corresponde a RH/Admin).
