-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_audit_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_purchaseRequestId_key" ON "purchase_orders"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_numero_key" ON "purchase_orders"("numero");

-- CreateIndex
CREATE INDEX "purchase_audit_logs_requestId_idx" ON "purchase_audit_logs"("requestId");

-- CreateIndex
CREATE INDEX "purchase_audit_logs_userId_idx" ON "purchase_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "purchase_audit_logs_accion_idx" ON "purchase_audit_logs"("accion");

-- CreateIndex
CREATE INDEX "purchase_audit_logs_createdAt_idx" ON "purchase_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
