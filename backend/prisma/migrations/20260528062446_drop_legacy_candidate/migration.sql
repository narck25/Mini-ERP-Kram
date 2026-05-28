/*
  Warnings:

  - You are about to drop the column `esPadre` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `fotoUrl` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `numeroHijos` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the `candidates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_vacancyId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "esPadre",
DROP COLUMN "fotoUrl",
DROP COLUMN "numeroHijos";

-- DropTable
DROP TABLE "candidates";
