-- CreateEnum
CREATE TYPE "NivelJerarquico" AS ENUM ('GERENTE', 'SUPERVISOR', 'OPERATIVO', 'COORDINADOR', 'DIRECTOR');

-- AlterEnum
ALTER TYPE "RoleType" ADD VALUE 'EMPLEADO_BASICO';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "nivelJerarquico" "NivelJerarquico" DEFAULT 'OPERATIVO',
ADD COLUMN     "reportaAId" TEXT;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportaAId_fkey" FOREIGN KEY ("reportaAId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
