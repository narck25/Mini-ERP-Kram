-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MotivoVacante" ADD VALUE 'REEMPLAZO_DEFINITIVO';
ALTER TYPE "MotivoVacante" ADD VALUE 'REEMPLAZO_TEMPORAL';
ALTER TYPE "MotivoVacante" ADD VALUE 'RENUNCIA';
ALTER TYPE "MotivoVacante" ADD VALUE 'TERMINACION_CONTRATO';
ALTER TYPE "MotivoVacante" ADD VALUE 'LICENCIA';
ALTER TYPE "MotivoVacante" ADD VALUE 'INCAPACIDAD';
ALTER TYPE "MotivoVacante" ADD VALUE 'JUBILACION';
ALTER TYPE "MotivoVacante" ADD VALUE 'MATERNIDAD';
