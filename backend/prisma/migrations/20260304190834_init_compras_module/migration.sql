-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('NUEVO', 'PENDIENTE', 'EN_AUTORIZACION', 'APROBADO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "estatus" "PurchaseStatus" NOT NULL DEFAULT 'NUEVO',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justificacion" TEXT,
    "requiereAutorizacion" BOOLEAN NOT NULL DEFAULT false,
    "autorizadoPorId" TEXT,
    "fechaAutorizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productoServicio" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaCotizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivoUrl" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "purchase_quotes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotes" ADD CONSTRAINT "purchase_quotes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
