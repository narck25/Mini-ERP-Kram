-- CreateEnum
CREATE TYPE "ProbationEvaluationType" AS ENUM ('DIA_30', 'DIA_60', 'DIA_90');

-- CreateEnum
CREATE TYPE "ProbationEvaluationResult" AS ENUM ('PENDIENTE', 'APROBADO', 'NO_APROBADO', 'EXTENDIDO');

-- CreateEnum
CREATE TYPE "DisciplinaryIncidentType" AS ENUM ('RETARDO_FALTA_INJUSTIFICADA', 'ACTA_ADMINISTRATIVA');

-- AlterEnum
ALTER TYPE "ModuleType" ADD VALUE 'DISCIPLINA';

-- CreateTable
CREATE TABLE "hr_audit_logs" (
    "id" TEXT NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probation_evaluations" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" "ProbationEvaluationType" NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "resultado" "ProbationEvaluationResult" NOT NULL DEFAULT 'PENDIENTE',
    "evaluadorId" TEXT,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinary_incidents" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" "DisciplinaryIncidentType" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinary_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_audit_logs_entidadTipo_entidadId_idx" ON "hr_audit_logs"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "hr_audit_logs_userId_idx" ON "hr_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "hr_audit_logs_accion_idx" ON "hr_audit_logs"("accion");

-- CreateIndex
CREATE INDEX "hr_audit_logs_createdAt_idx" ON "hr_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "probation_evaluations_empleadoId_idx" ON "probation_evaluations"("empleadoId");

-- CreateIndex
CREATE INDEX "probation_evaluations_resultado_idx" ON "probation_evaluations"("resultado");

-- CreateIndex
CREATE UNIQUE INDEX "probation_evaluations_empleadoId_tipo_key" ON "probation_evaluations"("empleadoId", "tipo");

-- CreateIndex
CREATE INDEX "disciplinary_incidents_empleadoId_idx" ON "disciplinary_incidents"("empleadoId");

-- CreateIndex
CREATE INDEX "disciplinary_incidents_tipo_idx" ON "disciplinary_incidents"("tipo");

-- CreateIndex
CREATE INDEX "disciplinary_incidents_fecha_idx" ON "disciplinary_incidents"("fecha");

-- AddForeignKey
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinary_incidents" ADD CONSTRAINT "disciplinary_incidents_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinary_incidents" ADD CONSTRAINT "disciplinary_incidents_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
