/**
 * uploadsAccess.service.js
 * ─────────────────────────────────────────────────────────────
 * Hallazgo de seguridad #1 (docs/PROJECT_CONTEXT.md §13): /uploads se
 * servía públicamente vía express.static, sin autenticación ni control
 * de propiedad — cualquiera con la URL exacta descargaba cualquier
 * archivo. Este servicio decide, carpeta por carpeta, quién puede leer
 * un archivo ya subido, reutilizando las mismas reglas de autorización
 * que ya protegen esos recursos en el resto de la API (no se reinventa
 * ninguna regla nueva, salvo la de "photos", justificada abajo).
 *
 * Carpeta desconocida → se niega siempre (fail-closed). Esto incluye
 * "temp", que hoy ningún controlador expone como URL descargable.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { canAccessEmployeeDocuments } = require('../controllers/employeeDocument.controller');
const { canAccessCandidateFile } = require('../controllers/candidate.controller');
const { canViewPurchaseRequest } = require('./purchases/purchase.service')._helpers;
const { canManage: canManageDisciplinaryIncident } = require('./disciplinaryIncident.service');

const RULES = {
  // Fotos de perfil: se muestran en el expediente y en avatares de
  // comentarios de compras vistos por personas de otros departamentos —
  // no hay una noción real de "dueño exclusivo". Cualquier usuario
  // autenticado puede verlas; no requiere lookup en BD.
  photos: {
    authorize: async () => true
  },

  'employee-documents': {
    authorize: async (req, fullPath) => {
      const doc = await prisma.employeeDocument.findFirst({ where: { url_archivo: fullPath } });
      if (!doc) return false;
      return canAccessEmployeeDocuments(req, doc.employee_id);
    }
  },

  cvs: {
    authorize: async (req, fullPath) => {
      const candidate = await prisma.candidateRH.findFirst({
        where: { cv_url: fullPath },
        include: { vacancy: { select: { solicitanteId: true } } }
      });
      if (!candidate) return false;
      return canAccessCandidateFile(req, candidate.vacancy.solicitanteId);
    }
  },

  'psych-tests': {
    authorize: async (req, fullPath) => {
      const candidate = await prisma.candidateRH.findFirst({
        where: { psych_test_url: fullPath },
        include: { vacancy: { select: { solicitanteId: true } } }
      });
      if (!candidate) return false;
      return canAccessCandidateFile(req, candidate.vacancy.solicitanteId);
    }
  },

  'purchase-quotes': {
    authorize: async (req, fullPath) => {
      const quote = await prisma.purchaseQuote.findFirst({ where: { archivoUrl: fullPath } });
      if (!quote) return false;
      return canViewPurchaseRequest(req.user.id, req.user.role, quote.requestId);
    }
  },

  'purchase-orders': {
    authorize: async (req, fullPath) => {
      const order = await prisma.purchaseOrder.findFirst({ where: { pdfUrl: fullPath } });
      if (!order) return false;
      return canViewPurchaseRequest(req.user.id, req.user.role, order.purchaseRequestId);
    }
  },

  'disciplinary-incidents': {
    authorize: async (req, fullPath) => {
      const incident = await prisma.disciplinaryIncident.findFirst({ where: { archivoUrl: fullPath } });
      if (!incident) return false;
      return canManageDisciplinaryIncident(req.user, incident.empleadoId);
    }
  },

  // Uploads en tránsito de formularios multi-paso; ningún controlador
  // expone hoy una URL pública hacia esta carpeta. Se niega a propósito.
  temp: {
    authorize: async () => false
  }
};

/**
 * @param {import('express').Request} req - con req.user ya inyectado por verifyToken
 * @param {string} folder - primer segmento de la ruta bajo /uploads (ej. "purchase-quotes")
 * @param {string} fullPath - forma completa tal como se guarda en BD (ej. "/uploads/purchase-quotes/x.pdf")
 * @returns {Promise<boolean>}
 */
async function resolveUploadAccess(req, folder, fullPath) {
  const rule = RULES[folder];
  if (!rule) return false;
  return rule.authorize(req, fullPath);
}

module.exports = { resolveUploadAccess, RULES };
