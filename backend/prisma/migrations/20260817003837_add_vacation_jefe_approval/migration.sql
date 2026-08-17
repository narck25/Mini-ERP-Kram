-- AlterEnum
ALTER TYPE "VacationStatus" ADD VALUE 'AUTORIZADA';

-- AlterTable
ALTER TABLE "vacation_requests" ADD COLUMN     "comentarioJefe" TEXT,
ADD COLUMN     "jefeAutorizadoAt" TIMESTAMP(3),
ADD COLUMN     "jefeAutorizadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_jefeAutorizadoPorId_fkey" FOREIGN KEY ("jefeAutorizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
