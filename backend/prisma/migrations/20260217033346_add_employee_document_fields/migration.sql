/*
  Warnings:

  - Added the required column `nombre_archivo` to the `employee_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employee_documents" ADD COLUMN     "mime_type" TEXT NOT NULL DEFAULT 'application/octet-stream',
ADD COLUMN     "nombre_archivo" TEXT NOT NULL,
ADD COLUMN     "size_bytes" INTEGER,
ADD COLUMN     "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploaded_by" TEXT;
