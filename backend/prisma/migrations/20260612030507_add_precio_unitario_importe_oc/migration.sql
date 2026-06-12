-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "importe" DOUBLE PRECISION,
ADD COLUMN     "precioUnitario" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "iva" DOUBLE PRECISION,
ADD COLUMN     "ivaRate" DOUBLE PRECISION,
ADD COLUMN     "subtotal" DOUBLE PRECISION;
