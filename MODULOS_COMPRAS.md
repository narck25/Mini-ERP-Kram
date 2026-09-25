# ERP KRAM — Módulo de Compras (detalle completo)

> Documento de presentación ejecutiva. Detalla todo lo que hace hoy el sistema en el área de Compras: solicitudes, cotizaciones, autorización, órdenes de compra, papelería, uniformes, inventario y proveedores. Basado en el análisis técnico verificado del código (`PROJECT_CONTEXT.md`).

---

## Índice

1. [Solicitudes de compra, cotizaciones y autorización](#1-solicitudes-de-compra-cotizaciones-y-autorización)
2. [Orden de compra y entrega](#2-orden-de-compra-y-entrega)
3. [Papelería](#3-papelería)
4. [Uniformes](#4-uniformes)
5. [Inventario y kardex](#5-inventario-y-kardex)
6. [Proveedores](#6-proveedores)
7. [Comentarios y trazabilidad en tiempo real](#7-comentarios-y-trazabilidad-en-tiempo-real)
8. [Reportes de Compras](#8-reportes-de-compras)
9. [Quién puede ver y hacer qué](#9-quién-puede-ver-y-hacer-qué)
10. [Estado y pendientes del área](#10-estado-y-pendientes-del-área)

---

## 1. Solicitudes de compra, cotizaciones y autorización

**Qué es:** el flujo central de Compras — desde que alguien necesita algo hasta que queda formalmente aprobado para comprarse, con folio y rastro completo de quién hizo qué.

**Proceso paso a paso:**

1. **Creación de la solicitud** — cualquier usuario con acceso al módulo crea una solicitud: productos o servicios necesarios, cantidades y justificación. Queda en estado `NUEVO` y de inmediato pasa a `PENDIENTE`.
2. **Cotizaciones** — se agregan una o varias cotizaciones de proveedores a la solicitud (con el archivo de la cotización adjunto).
3. **Selección de la cotización ganadora** — se elige cuál cotización se usará para comprar.
4. **Regla de autorización por monto**:
   - Si el monto de la cotización seleccionada es **igual o menor a $50,000 MXN**, la solicitud pasa directo a `APROBADO`.
   - Si el monto es **mayor a $50,000 MXN**, la solicitud pasa a `EN_AUTORIZACION` y requiere que un **Administrador** (o la persona designada como aprobador) la autorice formalmente antes de continuar.
5. **Autorización** — el aprobador designado revisa y autoriza (o rechaza) la solicitud. Una vez autorizada, pasa a `APROBADO`.

**Autorización sin necesidad de tener acceso al módulo de Compras:** existe una pantalla pública de autorización (`/autorizar-compra/[id]`) para que un jefe de área que no maneja el sistema de Compras en su día a día pueda, aun así, autorizar una solicitud que se le asignó — sin tener que darle de alta acceso completo al módulo. Solo puede ver y autorizar la solicitud para la que fue designado aprobador; no puede ver las de los demás.

**Aprobadores designados:** cada solicitud puede tener uno o varios aprobadores asignados explícitamente (por ejemplo, el gerente del área que solicita). Solo esas personas — o un Administrador — pueden autorizar esa solicitud en particular.

**Folio y auditoría:** cada solicitud tiene un número de folio consecutivo. Cada acción relevante (creación, cotización agregada, autorización, entrega, cancelación) queda registrada en una **bitácora de auditoría de compras** con fecha, usuario, IP y el detalle del cambio (qué valor tenía antes y qué valor quedó después) — este registro no se puede editar ni borrar, es un histórico permanente.

**Cancelación:** una solicitud puede cancelarse (`CANCELADO`) si ya no procede.

**Estados posibles de una solicitud:**

| Estado | Significado |
|---|---|
| `BORRADOR` | Aún no se envía formalmente |
| `NUEVO` | Recién creada |
| `PENDIENTE` | Esperando cotización/decisión |
| `EN_AUTORIZACION` | Monto mayor a $50,000 MXN, esperando autorización gerencial |
| `APROBADO` | Lista para generar orden de compra |
| `ENTREGADO` | La mercancía o servicio ya se entregó |
| `CANCELADO` | Cancelada, no procede |

---

## 2. Orden de compra y entrega

**Qué es:** el documento formal que se genera una vez aprobada la solicitud, y el registro de que lo comprado efectivamente llegó.

**Generación de la orden de compra (OC):**
- Se genera automáticamente un **PDF profesional** con: logo de KRAM, datos de la empresa y contacto de compras, número de folio de la OC, datos del proveedor, lugar de entrega, tabla de partidas (cantidad, precio unitario, importe), subtotal, IVA (16%) y total, observaciones, y un espacio para firma física de autorización.
- Cada OC tiene un número único con formato `OC-AAAA-000001`.
- La OC puede regenerarse si es necesario (por ejemplo, si se corrigió algo en la solicitud).

**Entrega:**
- Al recibir la mercancía o completarse el servicio, se marca la solicitud como **entregada**.
- Para los artículos que son **productos físicos** (no servicios), el sistema genera automáticamente un registro de **responsiva de entrega**: una "fotografía" exacta de qué se entregó, en qué cantidad y a quién — queda guardado permanentemente como respaldo, aunque después el inventario cambie. Los servicios no generan este registro porque no hay un bien físico que resguardar.

**Estado:** completo y en uso, incluyendo la mejora reciente de mostrar el gasto acumulado por proveedor.

---

## 3. Papelería

**Qué es:** solicitud y control de insumos de oficina, con su propio inventario independiente del de uniformes.

**Proceso:**
1. Se crea una **solicitud de papelería** con los artículos y cantidades necesarias (`PENDIENTE`).
2. El responsable de Compras marca la solicitud como **entregada** — total o **parcialmente** (por ejemplo, si algunos artículos no había en stock ese día, se puede entregar el resto después).
3. Cada entrega descuenta del **inventario de papelería**, que tiene su propio catálogo de productos con una **cantidad mínima configurada**: cuando el stock baja de ese mínimo, el sistema puede alertar para reabastecer a tiempo.

**Estados de una solicitud de papelería:**

| Estado | Significado |
|---|---|
| `PENDIENTE` | Esperando entrega |
| `ENTREGADO_PARCIAL` | Se entregó parte de lo solicitado |
| `ENTREGADO` | Entrega completa |
| `CANCELADO` | No procede |

**Estado del módulo:** completo y en uso.

---

## 4. Uniformes

**Qué es:** control de inventario y entregas de uniformes, con acta de entrega imprimible con espacio para firmas.

**Proceso:**
1. Se administra el **inventario de uniformes**, organizado por tipo de prenda, talla y género (cada combinación es única en el catálogo), con su existencia actual.
2. Se registra la **entrega** de uniformes a un empleado (qué prendas, tallas y cantidades recibió).
3. El sistema genera un **acta de entrega imprimible** directamente desde el navegador, con dos copias en la misma página — **"Original · Empresa"** y **"Copia · Empleado"** — cada una con los datos del empleado, la tabla de artículos entregados con sus importes, observaciones, y un renglón para la firma de quien entrega y de quien recibe. Se imprime con un solo botón y queda lista para cortar en dos y archivar cada copia por separado.

> Nota honesta sobre el acta: hoy es un documento **para firmar a mano sobre papel impreso** — el sistema no captura una firma digital ni genera un PDF firmado electrónicamente. Si en el futuro se quisiera una firma 100% digital, sería una mejora a evaluar por separado.

**Estado:** completo y en uso.

---

## 5. Inventario y kardex

**Qué es:** el control de existencias que respalda tanto a Papelería como a Uniformes, con un historial de movimientos que nunca se borra (kardex).

**Ajuste de inventario (altas, ediciones o bajas de stock):**
1. Compras solicita un ajuste (agregar un producto nuevo, actualizar cantidades, o dar de baja algo) indicando el **motivo** — queda `PENDIENTE`.
2. Un Administrador o RH **aprueba o rechaza** el ajuste desde la pantalla de "Aprobaciones de Inventario" — ningún ajuste se aplica solo, siempre pasa por una segunda persona.
3. Si se aprueba, el cambio se aplica al inventario real.

**Kardex (histórico de movimientos):**
- Cada entrada, salida o ajuste de inventario genera un **movimiento** que registra: el stock que había antes, el stock que quedó después, el tipo de movimiento (entrada/salida/ajuste) y quién lo realizó.
- Este historial **no se edita ni se borra** — es la fuente confiable para responder "¿cuándo y por qué cambió el stock de este producto?".

**Modo estricto de inventario (configurable):**
- El sistema tiene un interruptor de configuración: en **modo permisivo** (el que está activo por defecto), se puede entregar un artículo aunque no haya stock suficiente, y el inventario puede quedar en números negativos (para no bloquear operaciones urgentes).
- En **modo estricto**, el sistema **bloquea** la entrega si no hay stock suficiente.
- Este interruptor lo cambia un Administrador, y aplica a toda la empresa — es una decisión de política interna, no una limitación técnica.

**Estado:** completo y en uso.

---

## 6. Proveedores

**Qué es:** catálogo de proveedores con los que trabaja KRAM, para no tener que escribir sus datos cada vez que se cotiza o se genera una orden de compra.

**Qué hace:**
- Permite dar de alta proveedores con sus datos de contacto.
- Detecta automáticamente **posibles duplicados** al dar de alta uno nuevo (comparando el nombre sin importar mayúsculas/minúsculas o acentos), para evitar tener el mismo proveedor registrado varias veces con el nombre escrito distinto.
- Se puede marcar un proveedor como **activo/inactivo** sin necesidad de borrarlo del catálogo (para conservar el historial de compras hechas con él).
- Se puede dar de alta un proveedor nuevo directamente **desde el momento de cotizar**, sin salir de la pantalla de la solicitud.
- El panel de Compras muestra el **gasto acumulado por proveedor**, útil para negociar volumen o detectar concentración de compras en pocos proveedores.

**Estado:** completo y en uso — es una de las incorporaciones más recientes del módulo.

---

## 7. Comentarios y trazabilidad en tiempo real

**Qué es:** cada solicitud de compra y de papelería tiene su propio hilo de comentarios, visible para todos los involucrados, que se actualiza **en tiempo real** (sin necesidad de recargar la página) — útil para negociar con el proveedor, aclarar dudas de la solicitud o dejar constancia de una decisión, todo dentro del mismo registro que ya tiene folio, cotizaciones y estado.

**Estado:** completo y en uso.

---

## 8. Reportes de Compras

Desde la sección de Reportes se pueden exportar a Excel:

| Reporte | Contenido |
|---|---|
| **Compras** | Solicitudes, montos, estados y proveedores |
| **Inventario** | Papelería y uniformes combinados, con columna que distingue el tipo |

(Los reportes de RH se detallan en el documento de RH.)

---

## 9. Quién puede ver y hacer qué

- **Acceso al módulo**: cualquier usuario con el módulo `COMPRAS` habilitado puede crear solicitudes de compra/papelería y consultar el inventario. Administradores y RH tienen acceso automático.
- **Autorización de montos altos (>$50,000 MXN)**: exclusiva de Administradores o de la persona explícitamente designada como aprobador de esa solicitud — nadie más puede autorizarla, ni siquiera otro usuario del módulo de Compras.
- **Autorización pública sin acceso al módulo**: un jefe de área puede autorizar la solicitud para la que fue designado aprobador, sin necesidad de tener el módulo de Compras habilitado — pero **solo esa solicitud específica**, no puede ver ninguna otra.
- **Aprobaciones de ajustes de inventario**: exclusiva de Administradores y RH.
- **Configuración del modo estricto de inventario**: exclusiva de Administradores.
- **Proveedores**: gestión disponible para cualquier usuario con el módulo `COMPRAS`.

> Nota de control interno (pendiente de decisión de negocio, no un tema técnico): hoy el sistema permite, técnicamente, que la misma persona que solicita una compra sea también designada como su propio aprobador. Si se quiere exigir que siempre sea alguien distinto (separación de funciones), es una regla de negocio a definir y aplicar — se documentó como pendiente en la revisión de seguridad.

---

## 10. Estado y pendientes del área

**Lo que ya está sólido:** el flujo completo de Solicitud → Cotización → Autorización → Orden de Compra → Entrega, y el inventario con su kardex, llevan más tiempo en producción y tienen buena cobertura de pruebas automatizadas.

**Lo que es más nuevo:** el catálogo de Proveedores y las Aprobaciones de ajuste de inventario funcionan correctamente según la revisión del código, pero todavía no tienen pruebas automatizadas dedicadas — no es un defecto, es simplemente trabajo de calidad pendiente de agregar.

**Pendiente de decisión de negocio (no técnico):** definir si debe existir separación obligatoria entre quien solicita una compra y quien la autoriza (ver nota de la sección 9).
