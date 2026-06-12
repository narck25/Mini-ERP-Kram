# Plan de Cambios - PurchaseOrderModal + Backend

## Completado:
- [x] 1. Migración Prisma: Agregar `precioUnitario` e `importe` a `PurchaseOrderItem`, y `subtotal`, `iva`, `ivaRate` a `PurchaseOrder`
- [x] 2. Actualizar `purchase-order.service.js`:
  - [x] Aceptar items personalizados con precioUnitario en `generateOrder()`
  - [x] Actualizar PDF para incluir columnas Precio Unitario e Importe
  - [x] Calcular subtotal, IVA y total desde los items
- [x] 3. Actualizar `audit.service.js`: Agregar constantes `ORDEN_COMPRA_GENERADA` y `ORDEN_COMPRA_REGENERADA`
- [x] 4. Actualizar `purchase.controller.js`:
  - [x] `generatePurchaseOrder` usar `audit.ACCIONES.ORDEN_COMPRA_GENERADA`
  - [x] `regeneratePurchaseOrder` usar `audit.ACCIONES.ORDEN_COMPRA_REGENERADA`
  - [x] Pasar `items` del body a `generateOrder()`
- [x] 5. `PurchaseOrderModal.js` ya envía items con precioUnitario al backend
- [x] 6. Migración aplicada y Prisma Client regenerado
