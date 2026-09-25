-- AlterTable
ALTER TABLE "probation_evaluations" ADD COLUMN     "areasMejora" JSONB,
ADD COLUMN     "autoevaluacion" JSONB,
ADD COLUMN     "autoevaluacionCompletadaAt" TIMESTAMP(3),
ADD COLUMN     "competencias" JSONB,
ADD COLUMN     "fortalezas" JSONB,
ADD COLUMN     "habitos" JSONB,
ADD COLUMN     "minutaRetroalimentacion" TEXT,
ADD COLUMN     "objetivos" JSONB,
ADD COLUMN     "planAccion" JSONB;
