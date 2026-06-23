-- CreateEnum
CREATE TYPE "StationeryStatus" AS ENUM ('PENDIENTE', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "stationery_requests" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "estatus" "StationeryStatus" NOT NULL DEFAULT 'PENDIENTE',
    "justificacion" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),
    "entregadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stationery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stationery_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'pzas',

    CONSTRAINT "stationery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stationery_inventory" (
    "id" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'PAPELERIA',
    "cantidadActual" INTEGER NOT NULL DEFAULT 0,
    "cantidadMinima" INTEGER NOT NULL DEFAULT 5,
    "unidad" TEXT NOT NULL DEFAULT 'pzas',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stationery_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniform_inventory" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "genero" TEXT,
    "cantidadActual" INTEGER NOT NULL DEFAULT 0,
    "cantidadMinima" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uniform_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniform_deliveries" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entregadoPorId" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uniform_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stationery_inventory_producto_key" ON "stationery_inventory"("producto");

-- CreateIndex
CREATE UNIQUE INDEX "uniform_inventory_tipo_talla_genero_key" ON "uniform_inventory"("tipo", "talla", "genero");

-- AddForeignKey
ALTER TABLE "stationery_requests" ADD CONSTRAINT "stationery_requests_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stationery_requests" ADD CONSTRAINT "stationery_requests_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stationery_requests" ADD CONSTRAINT "stationery_requests_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stationery_items" ADD CONSTRAINT "stationery_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "stationery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniform_deliveries" ADD CONSTRAINT "uniform_deliveries_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniform_deliveries" ADD CONSTRAINT "uniform_deliveries_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
