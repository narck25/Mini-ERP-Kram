# Flujos del Módulo Compras

## Flujo 1: Solicitud de compra

1. El usuario crea una solicitud con productos, cantidades y justificación (`NUEVO`).
2. Pasa a estado `PENDIENTE`.
3. Se agregan **cotizaciones** de proveedores.

## Flujo 2: Selección de cotización y autorización

1. Se selecciona la **cotización ganadora** (`POST /purchases/:id/select-quote`).
2. Si el monto es **> $50,000 MXN**, la solicitud pasa a `EN_AUTORIZACION` (autorización gerencial).
3. Un ADMIN **autoriza** (`POST /purchases/:id/authorize`).
4. La solicitud queda `APROBADO`.

## Flujo 3: Orden de compra y entrega

1. Desde una solicitud aprobada se genera la **orden de compra** (OC) con partidas.
2. Al recibir la mercancía, se marca como **entregada** (`ENTREGADO`).

## Flujo 4: Papelería

1. El usuario crea una **solicitud de papelería** (`PENDIENTE`).
2. El administrador la marca como **entregada** (`ENTREGADO`).
3. El inventario de papelería se gestiona con altas y restock.

## Flujo 5: Uniformes

1. Se gestiona el **inventario de uniformes** (tipo, talla, género, existencias).
2. Se registra una **entrega** a un empleado.
3. Se genera el **acta imprimible** de entrega con firmas.

## Flujo 6: Ajuste de inventario (solicitud → aprobación)

1. `COMPRAS` crea una **solicitud de ajuste** (agregar/actualizar/eliminar) con motivo (`PENDIENTE`).
2. ADMIN/RH la **aprueban** o **rechazan** en "Aprobaciones de Inventario".
3. Al aprobarse, se aplica el cambio al inventario.

## Flujo 7: Kardex de movimientos

1. Cada alta, edición, entrega o ajuste genera un **movimiento de inventario** (`ENTRADA`/`SALIDA`/`AJUSTE`).
2. El movimiento registra `stockAnterior`, `stockNuevo` y el responsable.
3. Se consulta en "Movimientos de Inventario".

## Flujo 8: Comentarios (tiempo real)

1. Los usuarios comentan en una solicitud.
2. Los comentarios se actualizan en tiempo real (SSE).
