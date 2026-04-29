/*
  Warnings:

  - You are about to drop the column `department` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `hireDate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rfc]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[curp]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nss]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `curp` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departamento_id` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_ingreso` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nss` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `puesto` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfc` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('Solicitada', 'Aprobada', 'Buscando', 'Cerrada');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('En_Revision', 'Descartado', 'Seleccionado');

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_userId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "department",
DROP COLUMN "hireDate",
DROP COLUMN "isActive",
DROP COLUMN "position",
ADD COLUMN     "curp" TEXT NOT NULL,
ADD COLUMN     "departamento_id" TEXT NOT NULL,
ADD COLUMN     "estatus" "EmployeeStatus" NOT NULL DEFAULT 'Activo',
ADD COLUMN     "fecha_ingreso" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "nss" TEXT NOT NULL,
ADD COLUMN     "puesto" TEXT NOT NULL,
ADD COLUMN     "rfc" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_vacancies_rh" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "estatus" "VacancyStatus" NOT NULL DEFAULT 'Solicitada',
    "requerimientos_tecnicos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_vacancies_rh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancy_comments" (
    "id" TEXT NOT NULL,
    "vacancy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancy_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates_rh" (
    "id" TEXT NOT NULL,
    "vacancy_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cv_url" TEXT,
    "estatus" "CandidateStatus" NOT NULL DEFAULT 'En_Revision',
    "comentarios_rh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_rh_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_nombre_key" ON "departments"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "employees_rfc_key" ON "employees"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "employees_curp_key" ON "employees"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nss_key" ON "employees"("nss");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies_rh" ADD CONSTRAINT "job_vacancies_rh_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies_rh" ADD CONSTRAINT "job_vacancies_rh_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_comments" ADD CONSTRAINT "vacancy_comments_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "job_vacancies_rh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_comments" ADD CONSTRAINT "vacancy_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates_rh" ADD CONSTRAINT "candidates_rh_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "job_vacancies_rh"("id") ON DELETE CASCADE ON UPDATE CASCADE;
