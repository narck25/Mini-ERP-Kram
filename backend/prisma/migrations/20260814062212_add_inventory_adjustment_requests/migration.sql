-- CreateTable
CREATE TABLE "inventory_adjustment_requests" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "itemId" TEXT,
    "detalle" JSONB NOT NULL,
    "motivo" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "solicitanteId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "aprobadoAt" TIMESTAMP(3),
    "comentarioAprobacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_adjustment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_adjustment_requests_estatus_tipo_idx" ON "inventory_adjustment_requests"("estatus", "tipo");

-- CreateIndex
CREATE INDEX "employees_departamento_id_estatus_idx" ON "employees"("departamento_id", "estatus");

-- CreateIndex
CREATE INDEX "job_vacancies_estatus_fechaSolicitud_idx" ON "job_vacancies"("estatus", "fechaSolicitud");

-- CreateIndex
CREATE INDEX "purchase_requests_estatus_fechaSolicitud_idx" ON "purchase_requests"("estatus", "fechaSolicitud");

-- AddForeignKey
ALTER TABLE "inventory_adjustment_requests" ADD CONSTRAINT "inventory_adjustment_requests_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustment_requests" ADD CONSTRAINT "inventory_adjustment_requests_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
