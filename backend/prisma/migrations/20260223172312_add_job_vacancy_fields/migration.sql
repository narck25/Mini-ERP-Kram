/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `responsibilities` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `salaryRange` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `job_vacancies` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MotivoVacante" AS ENUM ('NUEVA_CREACION', 'REEMPLAZO_DEFINITIVO', 'REEMPLAZO_TEMPORAL', 'INCREMENTO_PLANTILLA', 'INCREMENTO_PRODUCCION', 'RENUNCIA', 'TERMINACION_CONTRATO', 'LICENCIA', 'INCAPACIDAD', 'JUBILACION', 'PROMOCION', 'REESTRUCTURACION', 'MATERNIDAD', 'VACACIONES');

-- CreateEnum
CREATE TYPE "TipoContratacion" AS ENUM ('ADMINISTRATIVO', 'TEMPORAL', 'SINDICALIZADO', 'TIEMPO_COMPLETO', 'PERMANENTE', 'BECARIO', 'ROL_TURNOS');

-- DropForeignKey
ALTER TABLE "job_vacancies" DROP CONSTRAINT "job_vacancies_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "job_vacancies" DROP CONSTRAINT "job_vacancies_createdById_fkey";

-- AlterTable
ALTER TABLE "job_vacancies" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "createdById",
DROP COLUMN "department",
DROP COLUMN "description",
DROP COLUMN "position",
DROP COLUMN "requirements",
DROP COLUMN "responsibilities",
DROP COLUMN "salaryRange",
DROP COLUMN "title",
ADD COLUMN     "autorizadoPorId" TEXT,
ADD COLUMN     "candidatoPromocion" TEXT,
ADD COLUMN     "cargoPromocion" TEXT,
ADD COLUMN     "conocimientosExtra" TEXT,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "entrevistadorRespaldo" TEXT,
ADD COLUMN     "entrevistadorTecnico" TEXT,
ADD COLUMN     "fechaAutorizacion" TIMESTAMP(3),
ADD COLUMN     "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "motivoSolicitud" "MotivoVacante",
ADD COLUMN     "nombrePuesto" TEXT,
ADD COLUMN     "numeroVacantes" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "otrosRequerimientos" TEXT,
ADD COLUMN     "personaAReemplazar" TEXT,
ADD COLUMN     "reportaA" TEXT,
ADD COLUMN     "requiereExtension" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiereLaptop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiereMovil" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requierePC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "solicitanteId" TEXT,
ADD COLUMN     "tipoContratacion" "TipoContratacion",
ADD COLUMN     "ubicacionFisica" TEXT,
ADD COLUMN     "voBoPorId" TEXT;

-- Update existing rows with default values
UPDATE "job_vacancies" SET 
  "departamento" = 'Sin departamento',
  "entrevistadorTecnico" = 'Sin entrevistador',
  "motivoSolicitud" = 'NUEVA_CREACION',
  "nombrePuesto" = 'Sin puesto',
  "reportaA" = 'Sin reporte',
  "solicitanteId" = (SELECT "id" FROM "employees" LIMIT 1),
  "tipoContratacion" = 'ADMINISTRATIVO';

-- Now make the columns NOT NULL
ALTER TABLE "job_vacancies" ALTER COLUMN "departamento" SET NOT NULL,
ALTER COLUMN "entrevistadorTecnico" SET NOT NULL,
ALTER COLUMN "motivoSolicitud" SET NOT NULL,
ALTER COLUMN "nombrePuesto" SET NOT NULL,
ALTER COLUMN "reportaA" SET NOT NULL,
ALTER COLUMN "solicitanteId" SET NOT NULL,
ALTER COLUMN "tipoContratacion" SET NOT NULL;
