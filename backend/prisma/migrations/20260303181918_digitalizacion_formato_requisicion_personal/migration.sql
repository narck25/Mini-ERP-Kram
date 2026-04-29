/*
  Warnings:

  - The values [REEMPLAZO_DEFINITIVO,REEMPLAZO_TEMPORAL,RENUNCIA,TERMINACION_CONTRATO,LICENCIA,INCAPACIDAD,JUBILACION,MATERNIDAD] on the enum `MotivoVacante` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `nombrePuesto` on the `job_vacancies` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MotivoVacante_new" AS ENUM ('NUEVA_CREACION', 'REEMPLAZO_RENUNCIA', 'REEMPLAZO_TERMINACION_CONTRATO', 'LICENCIA_TEMPORAL', 'INCREMENTO_PRODUCCION', 'INCREMENTO_PLANTILLA', 'JUBILACION_RETIRO', 'PROMOCION', 'REESTRUCTURACION', 'LICENCIA_MATERNIDAD', 'VACACIONES');
ALTER TABLE "job_vacancies" ALTER COLUMN "motivoSolicitud" TYPE "MotivoVacante_new" USING ("motivoSolicitud"::text::"MotivoVacante_new");
ALTER TYPE "MotivoVacante" RENAME TO "MotivoVacante_old";
ALTER TYPE "MotivoVacante_new" RENAME TO "MotivoVacante";
DROP TYPE "MotivoVacante_old";
COMMIT;

-- AlterTable
ALTER TABLE "job_vacancies" DROP COLUMN "nombrePuesto",
ADD COLUMN     "candidatos_internos_propuestos" JSONB,
ADD COLUMN     "conocimientos_adicionales" TEXT,
ADD COLUMN     "consideraPromocionInterna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobPositionId" TEXT,
ADD COLUMN     "noAceptanReingresos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "observaciones_promocion" TEXT,
ADD COLUMN     "otros_requerimientos_fisicos" TEXT,
ADD COLUMN     "personaAReemplazarCargo" TEXT,
ADD COLUMN     "personaAReemplazarNombre" TEXT,
ADD COLUMN     "reqComputadoraEscritorio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reqExtensionTelefonica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reqLaptop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reqTelefonoMovil" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
