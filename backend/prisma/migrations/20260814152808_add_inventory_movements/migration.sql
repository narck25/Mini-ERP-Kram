-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "itemId" TEXT,
    "itemDescripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockAnterior" INTEGER NOT NULL,
    "stockNuevo" INTEGER NOT NULL,
    "referencia" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_movements_tipo_createdAt_idx" ON "inventory_movements"("tipo", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_movements_tipoMovimiento_idx" ON "inventory_movements"("tipoMovimiento");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
