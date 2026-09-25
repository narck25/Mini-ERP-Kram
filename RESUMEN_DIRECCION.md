# ERP KRAM — Resumen para Dirección

> Documento de presentación ejecutiva. Basado en el análisis técnico completo del sistema (`PROJECT_CONTEXT.md`), traducido a lenguaje de negocio.

---

## 1. ¿Qué es el ERP KRAM?

Es el sistema interno de gestión que **Comercializadora KRAM** usa para administrar personal, compras e inventario desde un solo lugar, reemplazando procesos que antes vivían en hojas de cálculo, formatos impresos y correos sueltos.

Hoy centraliza:

- El expediente completo de cada empleado.
- Las solicitudes de compra, desde que se piden hasta que se entregan.
- El control de inventario de papelería y uniformes.
- El control de asistencia (conectado al checador biométrico).
- Vacaciones, incapacidades, disciplina y evaluaciones de periodo de prueba.
- Reclutamiento de nuevas vacantes.

Es una aplicación web privada: solo personal de KRAM con cuenta y permisos puede entrar, desde cualquier navegador.

---

## 2. ¿Qué problema resuelve?

| Antes | Con el ERP |
|---|---|
| Expedientes de empleados dispersos en Excel/papel | Un solo expediente digital por empleado, con historial |
| Compras autorizadas por WhatsApp/correo, sin rastro | Flujo con folio, cotizaciones, aprobación y orden de compra trazable |
| Inventario de papelería/uniformes sin control de stock | Kardex con entradas/salidas y alertas de stock bajo |
| Checadas del reloj biométrico procesadas manualmente | Importación automática con reportes de asistencia e incidencias |
| Vacaciones aprobadas "de palabra" | Solicitud, aprobación en dos niveles (jefe → RH) y saldo calculado según ley |
| Acceso a la información sin control por rol | Cada usuario ve solo lo que su rol y departamento le permiten |

---

## 3. Módulos disponibles hoy

Todos los módulos siguientes están **funcionando en producción**, no son un prototipo:

- **Empleados** — expediente completo, documentos, historial salarial, organigrama, altas/bajas.
- **Reclutamiento** — solicitud de vacante → búsqueda de candidatos → selección, con tablero visual (kanban).
- **Compras** — solicitud → cotizaciones de proveedores → autorización → orden de compra en PDF → entrega.
- **Papelería y Uniformes** — solicitud, inventario y entregas con acta imprimible.
- **Inventario** — control de stock con historial de movimientos (kardex).
- **Vacaciones** — solicitud y aprobación con cálculo automático de días según antigüedad (Ley Federal del Trabajo).
- **Incidencias / Asistencia** — importación del checador biométrico y reportes de asistencia, incluido autoservicio para que cada empleado vea su propio historial.
- **Incapacidades** — registro y seguimiento de incapacidades médicas.
- **Disciplina** — registro de faltas, retardos y actas administrativas por empleado.
- **Periodo de prueba** — recordatorios automáticos y evaluación a los 30/60/90 días.
- **Evaluación operativa trimestral** — para 6 puestos operativos (Ayudante General, Chofer, Almacenista, Preventista, Promotor, Degustador), con criterios y pesos propios por puesto; la calificación y el resultado se calculan automáticamente.
- **Auditoría de RH** — bitácora de cambios sobre expedientes, para trazabilidad.
- **Reportes** — 5 reportes exportables a Excel (empleados, compras, inventario, asistencia, vacaciones).
- **Configuración y usuarios** — administración de cuentas, roles y permisos por módulo.

---

## 4. Beneficios concretos para la empresa

- **Trazabilidad**: toda compra, entrega o cambio de expediente queda registrado con fecha, usuario y detalle — útil para auditorías internas y para resolver disputas ("¿quién autorizó esto y cuándo?").
- **Control de acceso por rol**: un empleado de Producción no puede ver nóminas; un jefe de área solo ve a su equipo. Reduce el riesgo de que información sensible circule de más.
- **Menos trabajo manual repetitivo**: importar asistencia, generar reportes y calcular vacaciones ya no se hace a mano.
- **Autoservicio**: los empleados consultan su propia asistencia y solicitan vacaciones sin pasar siempre por RH.
- **Cumplimiento normativo**: el cálculo de vacaciones sigue la tabla oficial de la Ley Federal del Trabajo por antigüedad.
- **Escalable**: nuevos módulos (Disciplina, Periodo de Prueba, Auditoría) se han agregado sin rehacer el sistema, señal de que la base técnica es sólida.

---

## 5. Estado actual del proyecto

**Madurez: alta.** No es un piloto — es el sistema operativo diario de RH y Compras.

- Todos los módulos listados en la sección 3 están completos en backend y frontend.
- Hay pruebas automatizadas (más de 20 archivos de prueba) que validan que el sistema funciona antes de publicar cambios, y un flujo de revisión automática en cada actualización de código.
- El sistema corre en un servidor propio (VPS), con respaldo de base de datos y despliegue automatizado.

**Pendiente / en evolución** (trabajo normal de mantenimiento, no bloqueante):

- El módulo de Incapacidades aún no tiene pruebas automatizadas dedicadas, aunque sí está en uso (Disciplina, Auditoría de RH y Proveedores ya las tienen).
- Documentación interna antigua (manuales) desactualizada en algunos puntos frente al sistema real — se está corrigiendo.
- Homogeneizar el estilo de los formularios internos (no afecta el funcionamiento, es limpieza de código).

---

## 6. Seguridad — trabajo reciente

En las últimas semanas se hizo una **revisión de seguridad completa** del sistema y se corrigieron los hallazgos de mayor riesgo detectados:

- Se **eliminó el registro público de cuentas** — ahora solo RH/TI pueden crear un acceso, vinculado siempre a un expediente real de empleado. Antes, cualquiera podía crear una cuenta usando el correo de otra persona sin verificarlo.
- Se **cerró una vía alterna de acceso** que permitía usar un token de sesión de forma menos segura (por URL en vez del método estándar).
- Se **corrigió un caso donde un empleado podía consultar el detalle de una solicitud de compra ajena** sin haber sido invitado a autorizarla.
- Se **reforzó el control de acceso a los archivos adjuntos** (CVs, expedientes, cotizaciones, órdenes de compra): antes se podían abrir con solo conocer la dirección del archivo; ahora exigen sesión iniciada y el mismo permiso que ya aplicaba el resto del sistema.
- Se **corrigió que cerrar sesión o cambiar la contraseña no cortaba el acceso de inmediato** — un acceso robado seguía funcionando hasta 7 días aunque la persona ya hubiera cerrado sesión o cambiado su contraseña. Ahora ambas acciones cortan el acceso al instante.
- Se **agregó verificación del contenido real de los archivos subidos** (CVs, documentos, cotizaciones, actas): antes solo se revisaba la extensión declarada (ej. ".pdf"), ahora se confirma que el contenido corresponda a ese tipo de archivo antes de aceptarlo.
- Se **agregó límite de intentos** al reseteo de base de datos y al restablecimiento de contraseñas por un administrador — antes solo el inicio de sesión tenía ese control.
- Se **agregaron pruebas automatizadas** a Disciplina, Auditoría de RH y Proveedores, los tres módulos nuevos que todavía no las tenían.
- Se **bloqueó la autoaprobación de compras** — se decidió que quien solicita una compra nunca puede ser asignado como su propio aprobador, sin excepción; ya no aparece siquiera como opción al elegir aprobadores.
- Se documentaron formalmente los puntos que aún requieren atención, priorizados por severidad, para atenderlos en próximas iteraciones.

En resumen: el sistema recibe mantenimiento de seguridad activo, no solo mantenimiento de funcionalidad — es una práctica que vale la pena mantener con revisiones periódicas.

---

## 7. Próximos pasos sugeridos

1. Agregar pruebas automatizadas al módulo de Incapacidades, el único de los nuevos que aún no las tiene.
2. Actualizar la documentación interna para que refleje el estado real del sistema.

---

## 8. Nota técnica (breve)

Para quien necesite el detalle: el sistema usa tecnología web estándar y ampliamente probada en la industria (Node.js/Express en el servidor, Next.js/React en el navegador, PostgreSQL como base de datos), corre en contenedores Docker y se despliega de forma automatizada. El detalle técnico completo está en `PROJECT_CONTEXT.md`, en la raíz del repositorio.
