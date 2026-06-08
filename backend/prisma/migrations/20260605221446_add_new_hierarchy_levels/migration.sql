-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NivelJerarquico" ADD VALUE 'PRESIDENTE';
ALTER TYPE "NivelJerarquico" ADD VALUE 'JEFE';
ALTER TYPE "NivelJerarquico" ADD VALUE 'ANALISTA';
ALTER TYPE "NivelJerarquico" ADD VALUE 'AUX_ADMINISTRATIVO';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLEADO_BASICO';
