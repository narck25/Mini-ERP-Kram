-- AlterTable
ALTER TABLE "incapacidades" ADD COLUMN     "documentoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "incapacidades_documentoId_key" ON "incapacidades"("documentoId");

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "employee_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
