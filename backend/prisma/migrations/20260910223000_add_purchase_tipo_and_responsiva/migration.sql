-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'PRODUCTO',
ADD COLUMN     "cantidadEntregada" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "purchase_responsivas" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "entregadoAId" TEXT NOT NULL,
    "entregadoPorId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_responsivas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_responsivas" ADD CONSTRAINT "purchase_responsivas_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_responsivas" ADD CONSTRAINT "purchase_responsivas_entregadoAId_fkey" FOREIGN KEY ("entregadoAId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_responsivas" ADD CONSTRAINT "purchase_responsivas_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_responsivas" ADD CONSTRAINT "purchase_responsivas_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
