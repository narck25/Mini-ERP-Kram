-- CreateEnum
CREATE TYPE "TicketCategoria" AS ENUM ('PROBLEMA_TECNICO', 'SOLICITUD_INFORME', 'SOLICITUD_ACCESO', 'SOLICITUD_EQUIPO', 'OTRO');

-- CreateEnum
CREATE TYPE "TicketPrioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TicketEstatus" AS ENUM ('ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO', 'CANCELADO');

-- AlterEnum
ALTER TYPE "ModuleType" ADD VALUE 'TICKETS';

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "TicketCategoria" NOT NULL,
    "prioridad" "TicketPrioridad" NOT NULL DEFAULT 'MEDIA',
    "estatus" "TicketEstatus" NOT NULL DEFAULT 'ABIERTO',
    "asignadoId" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_audit_logs" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_solicitanteId_idx" ON "tickets"("solicitanteId");

-- CreateIndex
CREATE INDEX "tickets_estatus_idx" ON "tickets"("estatus");

-- CreateIndex
CREATE INDEX "tickets_asignadoId_idx" ON "tickets"("asignadoId");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticketId_idx" ON "ticket_attachments"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_comments_ticketId_idx" ON "ticket_comments"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_audit_logs_ticketId_idx" ON "ticket_audit_logs"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_audit_logs_userId_idx" ON "ticket_audit_logs"("userId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
