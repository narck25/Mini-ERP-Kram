-- AlterEnum
ALTER TYPE "StationeryStatus" ADD VALUE 'ENTREGADO_PARCIAL';

-- AlterTable
ALTER TABLE "stationery_items" ADD COLUMN     "cantidadEntregada" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stationery_comments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stationery_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stationery_comments" ADD CONSTRAINT "stationery_comments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "stationery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stationery_comments" ADD CONSTRAINT "stationery_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
