/*
  Warnings:

  - You are about to drop the column `puesto` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'Activo';

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "puesto",
ADD COLUMN     "puestoId" TEXT;

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "nivelJerarquico" "NivelJerarquico" NOT NULL DEFAULT 'OPERATIVO',
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "departamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_nombre_departamentoId_key" ON "job_positions"("nombre", "departamentoId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
