-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enviadoA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatus" TEXT NOT NULL,
    "errorMsg" TEXT,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_employeeId_idx" ON "notification_logs"("employeeId");

-- CreateIndex
CREATE INDEX "notification_logs_tipo_idx" ON "notification_logs"("tipo");

-- CreateIndex
CREATE INDEX "notification_logs_enviadoA_idx" ON "notification_logs"("enviadoA");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
