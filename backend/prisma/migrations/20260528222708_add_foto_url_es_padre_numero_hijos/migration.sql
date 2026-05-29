-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "esPadre" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "numeroHijos" INTEGER NOT NULL DEFAULT 0;
