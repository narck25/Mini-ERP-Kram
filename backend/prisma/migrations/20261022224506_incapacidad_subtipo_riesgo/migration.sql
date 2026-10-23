-- CreateEnum
CREATE TYPE "SubtipoRiesgoTrabajo" AS ENUM ('ACCIDENTE_TRABAJO', 'ACCIDENTE_TRAYECTO', 'ENFERMEDAD_TRABAJO');

-- AlterTable
ALTER TABLE "incapacidades" ADD COLUMN     "subtipoRiesgo" "SubtipoRiesgoTrabajo";
