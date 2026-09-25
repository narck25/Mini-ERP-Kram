-- CreateEnum
CREATE TYPE "OperationalEvaluationResult" AS ENUM ('PENDIENTE', 'APROBADO_DISTINCION', 'EN_DESARROLLO', 'NO_APROBADO');

-- CreateTable
CREATE TABLE "operational_evaluations" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "periodo" INTEGER NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "evaluadorId" TEXT,
    "resultado" "OperationalEvaluationResult" NOT NULL DEFAULT 'PENDIENTE',
    "criterios" JSONB,
    "subtotalRH" DOUBLE PRECISION,
    "subtotalActitud" DOUBLE PRECISION,
    "subtotalDesempeno" DOUBLE PRECISION,
    "calificacionFinal" DOUBLE PRECISION,
    "fortalezas" TEXT,
    "areasMejora" TEXT,
    "compromisos" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operational_evaluations_empleadoId_idx" ON "operational_evaluations"("empleadoId");

-- CreateIndex
CREATE INDEX "operational_evaluations_resultado_idx" ON "operational_evaluations"("resultado");

-- CreateIndex
CREATE UNIQUE INDEX "operational_evaluations_empleadoId_periodo_key" ON "operational_evaluations"("empleadoId", "periodo");

-- AddForeignKey
ALTER TABLE "operational_evaluations" ADD CONSTRAINT "operational_evaluations_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_evaluations" ADD CONSTRAINT "operational_evaluations_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
