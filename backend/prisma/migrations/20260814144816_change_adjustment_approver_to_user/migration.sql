-- DropForeignKey
ALTER TABLE "inventory_adjustment_requests" DROP CONSTRAINT "inventory_adjustment_requests_aprobadoPorId_fkey";

-- AddForeignKey
ALTER TABLE "inventory_adjustment_requests" ADD CONSTRAINT "inventory_adjustment_requests_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
