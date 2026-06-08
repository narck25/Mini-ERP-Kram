-- CreateTable
CREATE TABLE "factores_integracion" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "diasAguinaldo" INTEGER NOT NULL,
    "diasVacaciones" INTEGER NOT NULL,
    "primaVacacional" DOUBLE PRECISION NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "factores_integracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_history" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salarioAnterior" DOUBLE PRECISION,
    "salarioNuevo" DOUBLE PRECISION NOT NULL,
    "sdAnterior" DOUBLE PRECISION,
    "sdNuevo" DOUBLE PRECISION NOT NULL,
    "sdiAnterior" DOUBLE PRECISION,
    "sdiNuevo" DOUBLE PRECISION NOT NULL,
    "factorUsado" DOUBLE PRECISION,
    "tipoCambio" TEXT NOT NULL,
    "motivo" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,

    CONSTRAINT "salary_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "factores_integracion_anio_key" ON "factores_integracion"("anio");

-- CreateIndex
CREATE INDEX "salary_history_employeeId_idx" ON "salary_history"("employeeId");

-- CreateIndex
CREATE INDEX "salary_history_fechaCambio_idx" ON "salary_history"("fechaCambio");

-- AddForeignKey
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
