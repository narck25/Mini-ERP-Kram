-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "numeroEmpleado" TEXT NOT NULL,
    "nombreEmpleado" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "dispositivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_records_numeroEmpleado_idx" ON "attendance_records"("numeroEmpleado");

-- CreateIndex
CREATE INDEX "attendance_records_fechaHora_idx" ON "attendance_records"("fechaHora");
