-- CreateEnum
CREATE TYPE "TipoIncapacidad" AS ENUM ('ENFERMEDAD_GENERAL', 'RIESGO_TRABAJO', 'MATERNIDAD');

-- CreateEnum
CREATE TYPE "IncapacidadStatus" AS ENUM ('ACTIVA', 'REINCORPORADO');

-- CreateTable
CREATE TABLE "incapacidades" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tipo" "TipoIncapacidad" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "folioIncapacidad" TEXT,
    "estatus" "IncapacidadStatus" NOT NULL DEFAULT 'ACTIVA',
    "observaciones" TEXT,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incapacidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incapacidades_estatus_fechaInicio_idx" ON "incapacidades"("estatus", "fechaInicio");

-- CreateIndex
CREATE INDEX "incapacidades_employeeId_idx" ON "incapacidades"("employeeId");

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
