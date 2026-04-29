/*
  Warnings:

  - You are about to drop the column `resumeUrl` on the `candidates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "candidates" DROP COLUMN "resumeUrl",
ADD COLUMN     "cvUrl" TEXT,
ADD COLUMN     "psychTestUrl" TEXT;

-- AlterTable
ALTER TABLE "candidates_rh" ADD COLUMN     "psych_test_url" TEXT;
