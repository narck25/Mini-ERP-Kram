const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/auth.middleware');
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

      // Eliminar en orden inverso de dependencias
      await prisma.notificationLog.deleteMany();
      await prisma.vacancyComment.deleteMany();
      await prisma.jobActivity.deleteMany();
      await prisma.candidateRH.deleteMany();
      await prisma.jobVacancy.deleteMany();
      await prisma.purchaseQuote.deleteMany();
      await prisma.purchaseItem.deleteMany();
      await prisma.purchaseRequest.deleteMany();
      await prisma.attendanceRecord.deleteMany();
      await prisma.salaryHistory.deleteMany();
      await prisma.employeeDocument.deleteMany();
      await prisma.employee.deleteMany();
      await prisma.jobPosition.deleteMany();
      await prisma.department.deleteMany();
      await prisma.session.deleteMany();
      await prisma.user.deleteMany();
      await prisma.role.deleteMany();

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
