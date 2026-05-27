-- AlterTable: Replace nombresPadres with esPadre
ALTER TABLE "employees" DROP COLUMN IF EXISTS "nombresPadres",
ADD COLUMN     "esPadre" BOOLEAN NOT NULL DEFAULT false;
