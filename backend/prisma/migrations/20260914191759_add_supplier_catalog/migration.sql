-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "proveedorId" TEXT;

-- AlterTable
ALTER TABLE "purchase_quotes" ADD COLUMN     "proveedorId" TEXT;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_quotes" ADD CONSTRAINT "purchase_quotes_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
