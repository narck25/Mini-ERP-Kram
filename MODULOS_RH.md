# ERP KRAM — Módulo de Recursos Humanos (detalle completo)

> Documento de presentación ejecutiva. Detalla todo lo que hace hoy el sistema en el área de RH: qué módulos incluye, qué proceso sigue cada uno, quién participa y qué controla. Basado en el análisis técnico verificado del código (`PROJECT_CONTEXT.md`).

---

## Índice

1. [Empleados y catálogos organizacionales](#1-empleados-y-catálogos-organizacionales)
2. [Reclutamiento](#2-reclutamiento)
3. [Vacaciones](#3-vacaciones)
4. [Incidencias / Asistencia](#4-incidencias--asistencia)
5. [Incapacidades](#5-incapacidades)
6. [Disciplina](#6-disciplina-incidencias-disciplinarias)
7. [Periodo de prueba](#7-periodo-de-prueba-evaluaciones-306090-días)
8. [Auditoría de RH](#8-auditoría-de-rh)
9. [Reportes de RH](#9-reportes-de-rh)
10. [Quién puede ver y hacer qué](#10-quién-puede-ver-y-hacer-qué)
11. [Estado y pendientes del área](#11-estado-y-pendientes-del-área)

---

## 1. Empleados y catálogos organizacionales

**Qué es:** el expediente digital completo de cada colaborador — el corazón de todo el módulo de RH. Todo lo demás (vacaciones, incapacidades, disciplina, evaluaciones) se cuelga de este registro.

**Qué contiene el expediente** (~55 campos, organizados por secciones):
- Identidad legal: RFC, CURP, NSS, nombre completo, fecha de nacimiento.
- Datos de contacto: domicilio, teléfonos, correo personal y correo institucional.
- Datos laborales: puesto, departamento, fecha de ingreso, jefe directo (jerarquía), tipo de contratación.
- Datos financieros: salario, salario diario (SD) y salario diario integrado (SDI) — calculados automáticamente.
- Datos bancarios (para nómina).
- Beneficiarios y familiares.
- Tallas de uniforme.
- Documentos adjuntos (identificación, comprobantes, contratos).
- Foto de perfil.
- Historial completo de cambios de sueldo.

**Proceso de alta:**
1. RH/Admin captura el formulario por secciones.
2. El sistema valida que RFC, CURP y NSS sean únicos (no puede haber dos empleados con el mismo).
3. Calcula automáticamente el salario diario y el salario diario integrado a partir del sueldo y la fecha de ingreso.
4. Guarda el registro y, si se indica, crea también la cuenta de acceso al sistema con el correo institucional.
5. Registra el alta en el historial de sueldos.

**Proceso de baja:**
1. Se pulsa "Baja" sobre el empleado.
2. Se captura: motivo (renuncia, despido, fin de contrato, abandono, otro), una nota y la fecha de baja.
3. El sistema marca al empleado como `Inactivo`, guarda el motivo y la fecha, **desactiva su cuenta de acceso** y **libera su correo institucional** (lo renombra a `baja.<rfc>@kram.mx`) para poder reasignarlo a un futuro empleado sin conflicto.
4. El expediente **no se borra** — queda como histórico, disponible para consulta.

**Eliminación permanente (poco común):** solo se permite si el empleado no tiene documentos ni vacantes de reclutamiento asociadas; si los tiene, el sistema bloquea la eliminación para no perder trazabilidad.

**Importación y exportación masiva (CSV):**
- **Importar**: RH sube un archivo con la información de varios empleados a la vez (útil para altas masivas o para actualizar datos existentes). El sistema valida formato de RFC/CURP/NSS, fechas, salarios y detecta duplicados antes de aplicar los cambios. Permite elegir qué hacer si un empleado ya existe: rechazar, omitir o actualizar. Opcionalmente crea también la cuenta de acceso.
- **Exportar**: descarga de toda la plantilla de personal en un archivo CSV.
- **Plantilla**: se puede descargar un archivo de ejemplo con las columnas exactas que el sistema espera, para facilitar la carga.

**Organigrama y jerarquía:** cada empleado puede tener un jefe directo asignado (`reportaA`), lo que permite construir el organigrama y que el sistema sepa a quién avisar cuando, por ejemplo, alguien de su equipo pide vacaciones.

**Historial salarial:** cada cambio de sueldo (alta, incremento, decremento o ajuste) queda registrado permanentemente, con fecha — es un historial que nunca se borra ni se sobrescribe, útil para auditorías de nómina.

**Reporte individual:** desde el expediente se puede generar un PDF de resumen del empleado (datos generales, contacto, legales, financieros, uniformes, beneficiarios y tabla de historial salarial) directamente desde el navegador.

**Estado:** completo y en uso activo.

---

## 2. Reclutamiento

**Qué es:** el proceso para pedir personal nuevo, buscar candidatos y seleccionar a quien se contrata — hoy corre sobre una versión digital del formato de requisición que antes era físico.

**Proceso completo:**

1. **Solicitud de vacante** — cualquier empleado con acceso al módulo llena una solicitud: perfil buscado, justificación de la contratación, requisitos técnicos y físicos del puesto, actividades a realizar, y si es promoción interna. La vacante queda como `Solicitada`.
2. **Aprobación de RH** — RH revisa la solicitud y la aprueba. El estado pasa a `Aprobada` y luego a `Buscando` (búsqueda activa de candidatos).
3. **Gestión de candidatos (tablero visual tipo Kanban)** — se registran candidatos con su CV y, si aplica, su prueba psicométrica. Aparecen en un tablero con tres columnas: **En revisión**, **Seleccionado**, **Descartado**.
   - Solo **quien solicitó la vacante** puede votar a favor (mover a Seleccionado) o en contra (mover a Descartado) de un candidato — es su decisión, no de cualquiera.
   - RH/Admin puede regresar un candidato a "En revisión" si es necesario reconsiderarlo.
4. **Selección final** — se marca al candidato ganador; con eso puede iniciarse la contratación (que ya se resuelve en el módulo de Empleados, dando de alta a la persona).
5. **Cierre o cancelación** — RH/Admin cierra la vacante cuando se llena la posición, o la cancela si ya no se necesita.

**Comunicación durante el proceso:** cada vacante tiene su propio hilo de comentarios, donde los involucrados (solicitante, RH) pueden discutir avances sin salir del sistema.

**Motivos de vacante:** el sistema contempla 19 motivos distintos (renuncia, jubilación, promoción, incremento de plantilla, licencias, etc.), lo que permite después sacar estadísticas de rotación por motivo real.

**Estado:** completo y en uso — contradice una nota antigua en la documentación de la raíz del repositorio que lo marcaba como "sin implementar"; en realidad ya está operando.

---

## 3. Vacaciones

**Qué es:** solicitud y aprobación de vacaciones, con el cálculo de días hecho automáticamente según la ley, sin depender de que alguien lo calcule a mano.

**Proceso con doble aprobación:**

1. El empleado solicita sus vacaciones (fechas y días).
2. **Si tiene jefe directo asignado**: la solicitud queda `PENDIENTE` y se envía un correo automático al jefe para que autorice.
3. **Si no tiene jefe directo**: pasa directo a `AUTORIZADA` y se avisa a RH.
4. El jefe autoriza o rechaza:
   - Si **autoriza** → pasa a `AUTORIZADA` y se notifica a RH para la aprobación final.
   - Si **rechaza** → pasa a `RECHAZADA` y se avisa al empleado.
5. RH da la aprobación final:
   - Si **aprueba** → `APROBADA`, se descuentan los días del saldo disponible del empleado, y se le notifica.
   - Si **rechaza** → `RECHAZADA`, se le notifica.
6. El empleado puede **cancelar** una solicitud propia mientras no haya sido aprobada.

**Cálculo del saldo (automático, según la Ley Federal del Trabajo):**
- El sistema calcula cuántos días le corresponden a cada empleado según su antigüedad (tabla oficial de la LFT).
- Resta los días ya usados en solicitudes aprobadas dentro del periodo vigente.
- El resultado es el **saldo disponible**, visible para el empleado y para RH.
- **Regla de negocio importante**: si un empleado tiene menos de 6 meses de antigüedad, su saldo disponible es 0 — no puede pedir vacaciones aún.
- El sistema **rechaza automáticamente** cualquier solicitud que exceda el saldo disponible — no depende de que alguien lo revise a mano.

**Notificaciones automáticas por correo** en cada paso: al jefe cuando hay una solicitud pendiente, a RH cuando el jefe ya autorizó (o no había jefe), y al empleado cuando hay una decisión final.

**Vista de RH:** panel para ver y aprobar las solicitudes de todo el personal; los jefes de área ven y aprueban solo las de su equipo directo.

**Estado:** completo y en uso — también contradice la misma nota desactualizada del README que lo daba como "sin implementar".

---

## 4. Incidencias / Asistencia

**Qué es:** el puente entre el reloj checador biométrico (ZKTeco) y reportes de asistencia utilizables, sin procesar nada a mano.

**Proceso:**

1. RH exporta el archivo CSV del reloj checador y lo sube al sistema.
2. El sistema **procesa automáticamente** las checadas:
   - Agrupa por empleado y por día.
   - Ordena las checadas por hora.
   - Aplica un **filtro anti-rebote**: ignora checadas repetidas en menos de 5 minutos (evita que una persona que checa dos veces por error genere un registro duplicado o un error de cálculo).
   - Calcula entrada, salida y duración de la jornada de cada día.
3. El sistema evita duplicar información si el mismo archivo se vuelve a subir por error — cada checada (empleado + fecha/hora + tipo) es única, así que reimportar el mismo CSV no genera registros repetidos.
4. RH consulta reportes de asistencia e incidencias (faltas, retardos) por rango de fechas, con capacidad de limpiar registros si es necesario (función reservada a Administradores, para evitar borrados accidentales).

**Autoservicio para empleados:** cada persona puede entrar a "Mi Asistencia" y ver su propio historial de checadas y un reporte detallado, sin depender de pedirlo a RH.

**Detalle técnico relevante para la operación:** el sistema tiene configurada la zona horaria de Ciudad de México para evitar que la hora de las checadas se recorra por diferencias de huso horario del servidor — un ajuste ya corregido y en producción.

**Estado:** funcional, con mejoras recientes (reporte detallado de autoservicio y botón de limpieza para Administradores).

---

## 5. Incapacidades

**Qué es:** control de incapacidades médicas del personal y su reincorporación.

**Qué registra:**
- Tipo de incapacidad: enfermedad general, riesgo de trabajo o maternidad.
- Fecha de inicio y fecha de fin (el sistema exige que la fecha de fin no sea anterior a la de inicio).
- Estado: `Activa` o `Reincorporado`.

**Proceso:**
1. RH/Admin registra la incapacidad del empleado con sus fechas.
2. Cuando la persona regresa a laborar, se marca como **reincorporado** — el sistema no permite reincorporar dos veces la misma incapacidad, evitando registros duplicados o inconsistentes.
3. Cada registro y cambio queda anotado en la bitácora de auditoría de RH (ver sección 8).

**Acceso:** exclusivo de RH/Admin — es información médica sensible, no visible para jefes de área ni para el resto del personal.

**Dónde se ve:** integrado directamente en el expediente del empleado, sin necesidad de una pantalla aparte.

**Estado:** completo y en uso.

---

## 6. Disciplina (incidencias disciplinarias)

**Qué es:** registro formal de retardos, faltas injustificadas y actas administrativas por empleado — un historial disciplinario centralizado.

**Qué registra:**
- Tipo de incidente: retardo/falta injustificada, o acta administrativa formal.
- Puede adjuntarse un archivo (por ejemplo, el acta firmada escaneada).
- El sistema calcula automáticamente un **resumen de incidencias de los últimos 6 meses** por empleado, útil para decisiones de recursos humanos (llamadas de atención, procesos de rescisión, etc.).

**Quién puede gestionarlo:** Administradores, RH, o el **jefe directo** del empleado en cuestión — no cualquier persona con acceso al sistema.

**Dónde se ve:** integrado en el expediente del empleado (pestaña de disciplina), sin pantalla propia independiente.

**Trazabilidad:** cada incidente registrado queda también en la bitácora de auditoría de RH.

**Estado:** completo y en uso, aunque todavía no aparece mencionado en los manuales de usuario más antiguos del proyecto — es una funcionalidad relativamente nueva.

---

## 7. Periodo de prueba (evaluaciones 30/60/90 días)

**Qué es:** seguimiento automático del periodo de prueba legal de un nuevo empleado, con recordatorios para que nadie se olvide de evaluar a tiempo.

**Cómo funciona (100% automatizado, sin que nadie tenga que llevar el calendario a mano):**
- Todos los días a las 8:00 a.m., el sistema revisa automáticamente a los empleados en periodo de prueba.
- A los **20, 50 y 80 días** de antigüedad, envía un **recordatorio por correo a RH y al jefe directo** avisando que se acerca la evaluación.
- A los **30, 60 y 90 días**, crea automáticamente el registro de evaluación pendiente de capturar.
- El sistema evita crear el mismo recordatorio dos veces aunque el proceso se ejecute más de una vez.

**Captura del resultado:** RH, Admin o el jefe directo capturan el resultado de la evaluación: **aprobado**, **no aprobado** o **extendido** (si se necesita más tiempo de evaluación).

**Vista dedicada:** pantalla propia donde RH ve todas las evaluaciones pendientes y su estado; los jefes de área ven las pendientes de su propio equipo.

**Estado:** completo y en uso, funcionando de forma desatendida (no requiere que nadie lo dispare manualmente). Es otra funcionalidad nueva que aún no está reflejada en los manuales antiguos.

---

## 8. Auditoría de RH

**Qué es:** una bitácora central que registra los cambios importantes hechos sobre expedientes, vacaciones, incapacidades, disciplina y evaluaciones de periodo de prueba — responde a la pregunta "¿quién cambió esto y cuándo?".

**Quién puede consultarla:** Administradores, RH, o el jefe directo del empleado en cuestión. **El propio empleado no puede ver su bitácora de auditoría** — es una herramienta de control interno, no de autoservicio.

**Dónde se ve:** integrada en el expediente del empleado, sin pantalla independiente.

**Estado:** completa y en uso, es otra de las funcionalidades más nuevas del sistema, aún sin mención en los manuales antiguos.

---

## 9. Reportes de RH

Desde la sección de Reportes se pueden exportar a Excel:

| Reporte | Contenido |
|---|---|
| **Empleados** | Plantilla completa de personal con sus datos principales |
| **Asistencia** | Checadas y resumen de incidencias por periodo |
| **Vacaciones** | Solicitudes, estados y saldos por empleado |

(Los reportes de Compras/Inventario se detallan en el documento de Compras.)

---

## 10. Quién puede ver y hacer qué

El sistema controla el acceso en tres niveles:

- **Nivel A — ¿Puede entrar al módulo?** Depende de si el módulo (Empleados, Reclutamiento, Vacaciones, Incidencias, Disciplina) está habilitado para su rol. Administradores y RH tienen acceso a todos los módulos de RH automáticamente.
- **Nivel B — ¿Qué datos ve dentro del módulo?** Por ejemplo, un jefe de área ve las vacaciones y evaluaciones de periodo de prueba **solo de su equipo directo**, no de toda la empresa.
- **Nivel C — Operaciones sensibles.** Dar de alta/baja empleados, aprobar vacaciones, gestionar incapacidades y capturar disciplina están reservados explícitamente a Administradores y RH (con la excepción ya mencionada del jefe directo en disciplina y periodo de prueba).

**Resumen por rol:**

| Rol | Empleados | Reclutamiento | Vacaciones | Incidencias | Disciplina |
|---|---|---|---|---|---|
| ADMIN | Todo | Todo | Todo | Todo | Todo |
| RH | Todo | Todo | Todo | Todo | Todo |
| Jefe de área (cualquier rol) | Su equipo (organigrama) | Solicitar/ver | Aprobar de su equipo | Autoservicio | Ver/gestionar de su equipo |
| Empleado base | Su propio expediente | Solicitar/ver sus vacantes | Solicitar propias | Autoservicio propio | Sin acceso |

---

## 11. Estado y pendientes del área

**Lo que ya está sólido:** Empleados, Reclutamiento y Vacaciones tienen la mayor cantidad de uso, pruebas automatizadas y tiempo en producción.

**Lo que es más nuevo y funciona, pero con menos "blindaje" de pruebas automatizadas todavía:** Incapacidades, Disciplina, Periodo de Prueba y Auditoría de RH — están operando correctamente según la revisión del código, pero no cuentan aún con pruebas automatizadas dedicadas (sí las tienen los módulos más antiguos). Esto no significa que fallen; significa que, si se modifican en el futuro, conviene probarlos manualmente con más cuidado hasta que se les agregue esa cobertura.

**Documentación interna:** los manuales de usuario más antiguos de RH no mencionan todavía Disciplina, Periodo de Prueba ni Auditoría de RH como módulos — es trabajo de documentación pendiente, no un problema del sistema en sí.
