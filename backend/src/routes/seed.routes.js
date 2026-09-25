const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/auth.middleware');
const { seedResetLimiter } = require('../middlewares/rate-limit.middleware');
const bcrypt = require('bcryptjs');

/**
 * POST /api/seed/reset
 * Resetear completamente la base de datos y ejecutar seed de producción
 * SOLO ADMIN puede ejecutar esto
 * 
 * Útil para limpiar la BD en Coolify cuando SEED_RESET no funciona
 * Se puede llamar con: curl -X POST https://apierp.kramhub.site/api/seed/reset
 *   -H "Authorization: Bearer <token_admin>"
 *   -H "Content-Type: application/json"
 *   -d '{"confirm": true}'
 */
router.post('/seed/reset',
  seedResetLimiter,
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ADMIN']),
  async (req, res) => {
    try {
      // Deshabilitado por default: borra TODA la base de datos. Una vez que hay datos
      // reales/de demo cargados, este endpoint queda apagado salvo que se habilite a
      // propósito (ej. en un ambiente de staging vacío) con ALLOW_SEED_RESET=true.
      if (process.env.ALLOW_SEED_RESET !== 'true') {
        return res.status(403).json({
          error: 'Endpoint deshabilitado',
          message: 'El reseteo de base de datos está deshabilitado en este ambiente. Define ALLOW_SEED_RESET=true para habilitarlo temporalmente.'
        });
      }

      const { confirm } = req.body;

      if (confirm !== true) {
        return res.status(400).json({
          error: 'Debes enviar {"confirm": true} para confirmar el reseteo de la base de datos'
        });
      }

      console.log('⚠️  ═══════════════════════════════════════════');
      console.log('⚠️  RESETEANDO BASE DE DATOS POR ENDPOINT API');
      console.log(`⚠️  Solicitado por: ${req.user.email} (${req.user.role})`);
      console.log('⚠️  ═══════════════════════════════════════════');

      // Eliminar en orden inverso de dependencias (hijos antes que padres).
      // Lista completa contra el schema actual (38 modelos) — antes solo
      // cubría 12 y dejaba huérfanas/sin tocar las tablas agregadas después
      // (vacaciones, incapacidades, disciplina, periodo de prueba, auditoría,
      // proveedores, órdenes de compra, papelería/uniformes e inventario),
      // lo que podía violar llaves foráneas o dejar datos "fantasma" tras el
      // reset. Deliberadamente NO se borra `FactorIntegracion`: es tabla de
      // referencia legal (factores LFT), la siembra un script aparte
      // (prisma/seed-factores.js), no este endpoint.

      // Wave 1 — hojas: no las referencia ninguna otra tabla que sigamos
      // conservando después de esta ola.
      await prisma.notificationLog.deleteMany();
      await prisma.salaryHistory.deleteMany();
      await prisma.employeeDocument.deleteMany();
      await prisma.vacancyComment.deleteMany();
      await prisma.jobActivity.deleteMany();
      await prisma.candidateRH.deleteMany();
      await prisma.purchaseItem.deleteMany();
      await prisma.purchaseResponsiva.deleteMany();
      await prisma.purchaseQuote.deleteMany();
      await prisma.purchaseComment.deleteMany();
      await prisma.purchaseOrderItem.deleteMany();
      await prisma.purchaseApprover.deleteMany();
      await prisma.stationeryItem.deleteMany();
      await prisma.stationeryComment.deleteMany();
      await prisma.uniformDelivery.deleteMany();
      await prisma.inventoryAdjustmentRequest.deleteMany();
      await prisma.inventoryMovement.deleteMany();
      await prisma.vacationRequest.deleteMany();
      await prisma.incapacidad.deleteMany();
      await prisma.probationEvaluation.deleteMany();
      await prisma.disciplinaryIncident.deleteMany();
      await prisma.purchaseAuditLog.deleteMany(); // sin FK real, pero queda huérfano si no se limpia
      await prisma.hrAuditLog.deleteMany();       // ídem
      await prisma.attendanceRecord.deleteMany();
      await prisma.session.deleteMany();

      // Wave 2 — ya sin hijos pendientes (justo lo que Wave 1 acaba de vaciar).
      await prisma.purchaseOrder.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.jobVacancy.deleteMany();
      await prisma.stationeryRequest.deleteMany();
      await prisma.purchaseRequest.deleteMany();

      // Wave 3 — Employee, ahora que nada que sigue vivo lo referencia.
      await prisma.employee.deleteMany();

      // Wave 4 — dependen de Employee/JobVacancy (ya vacíos) o de User.
      await prisma.jobPosition.deleteMany();
      await prisma.user.deleteMany();

      // Wave 5 — Department, el padre más alto de la cadena de RH/Compras.
      await prisma.department.deleteMany();

      // Wave 6 — catálogos y configuración independientes (se recrean o
      // quedan vacíos a propósito hasta el próximo seed).
      await prisma.role.deleteMany();
      await prisma.stationeryInventory.deleteMany();
      await prisma.uniformInventory.deleteMany();
      await prisma.systemSetting.deleteMany();

      console.log('✅ Base de datos limpiada');

      // Crear roles del sistema
      const roles = [
        { name: 'ADMIN', description: 'Administrador del sistema', color: 'bg-purple-100 text-purple-800', icon: '👑', isCustom: false },
        { name: 'RH', description: 'Recursos Humanos', color: 'bg-blue-100 text-blue-800', icon: '👥', isCustom: false },
        { name: 'SISTEMAS', description: 'Departamento de Sistemas', color: 'bg-green-100 text-green-800', icon: '💻', isCustom: false },
        { name: 'COMPRAS', description: 'Departamento de Compras', color: 'bg-yellow-100 text-yellow-800', icon: '🛒', isCustom: false },
        { name: 'PRODUCCION', description: 'Departamento de Producción', color: 'bg-red-100 text-red-800', icon: '🏭', isCustom: false },
        { name: 'EMPLEADO_BASICO', description: 'Empleado sin permisos administrativos', color: 'bg-gray-100 text-gray-800', icon: '👤', isCustom: false }
      ];

      for (const roleData of roles) {
        await prisma.role.create({ data: roleData });
      }

      // Crear admin
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@kram.com',
          password: hashedPassword,
          name: 'Administrador Principal',
          role: 'ADMIN',
          accessibleModules: [
            'DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO',
            'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'REPORTES'
          ],
          isActive: true
        }
      });

      console.log('✅ Seed completado exitosamente');

      res.json({
        message: '✅ Base de datos reseteada exitosamente',
        data: {
          roles: roles.length,
          admin: 'admin@kram.com / password123',
          note: 'Todos los datos anteriores fueron eliminados'
        }
      });

    } catch (error) {
      console.error('❌ Error en reset de BD:', error);
      res.status(500).json({
        error: 'Error al resetear la base de datos',
        details: error.message
      });
    }
  }
);

module.exports = router;
