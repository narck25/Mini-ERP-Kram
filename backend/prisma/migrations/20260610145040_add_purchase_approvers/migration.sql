-- CreateTable
CREATE TABLE "purchase_approvers" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaRespuesta" TIMESTAMP(3),
    "comentarios" TEXT,

    CONSTRAINT "purchase_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_approvers_requestId_employeeId_key" ON "purchase_approvers"("requestId", "employeeId");

-- AddForeignKey
ALTER TABLE "purchase_approvers" ADD CONSTRAINT "purchase_approvers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approvers" ADD CONSTRAINT "purchase_approvers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
