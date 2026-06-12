const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/auth.middleware');
const { getModulesArray } = require('../config/modules.config');
const { getAllPresets } = require('../config/roles.config');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// ============================================================
// Roles predefinidos del sistema (enum RoleType)
// ============================================================
const SYSTEM_ROLES = [
  { id: 'EMPLEADO_BASICO', name: 'Empleado', description: 'Acceso básico al sistema', color: 'bg-gray-100 text-gray-800', icon: '👤', isCustom: false },
  { id: 'ADMIN', name: 'Administrador', description: 'Administrador del sistema', color: 'bg-purple-100 text-purple-800', icon: '👑', isCustom: false },
  { id: 'RH', name: 'Recursos Humanos', description: 'Gestión de personal y reclutamiento', color: 'bg-blue-100 text-blue-800', icon: '👥', isCustom: false },
  { id: 'SISTEMAS', name: 'Sistemas', description: 'Soporte técnico y sistemas', color: 'bg-green-100 text-green-800', icon: '💻', isCustom: false },
  { id: 'COMPRAS', name: 'Compras', description: 'Gestión de compras y proveedores', color: 'bg-yellow-100 text-yellow-800', icon: '🛒', isCustom: false },
  { id: 'PRODUCCION', name: 'Producción', description: 'Gestión de producción', color: 'bg-red-100 text-red-800', icon: '🏭', isCustom: false },
];

/**
 * GET /api/roles
 * Obtener todos los roles disponibles (sistema + personalizados)
 */
router.get('/roles', async (req, res) => {
  try {
    // Intentar obtener roles personalizados desde la BD
    let customRoles = [];
    try {
      customRoles = await prisma.role.findMany({
        where: { isCustom: true },
        orderBy: { name: 'asc' }
      });
    } catch (dbError) {
      // Si la tabla roles no existe o tiene estructura diferente,
      // continuar solo con roles del sistema
      console.warn('⚠️ No se pudieron obtener roles personalizados de la BD:', dbError.message);
    }

    // Combinar roles del sistema + personalizados
    const allRoles = [
      ...SYSTEM_ROLES,
      ...customRoles.map(r => ({
        id: r.name,
        name: r.name,
        description: r.description || '',
        color: r.color,
        icon: r.icon,
        isCustom: true,
        dbId: r.id
      }))
    ];

    res.json({
      roles: allRoles,
      total: allRoles.length,
      system: SYSTEM_ROLES.length,
      custom: customRoles.length
    });
  } catch (error) {
    console.error('❌ Error getting roles:', error);
    res.status(500).json({ error: 'Error al obtener roles', details: error.message });
  }
});

/**
 * POST /api/roles
 * Crear un nuevo rol personalizado (solo ADMIN)
 */
router.post('/roles', 
  authMiddleware.requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { name, description, color, icon } = req.body;

      // Validar campos requeridos
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre del rol es requerido' });
      }

      // Normalizar nombre: mayúsculas, sin espacios
      const roleName = name.trim().toUpperCase().replace(/\s+/g, '_');

      // Verificar que no exista ya (ni en sistema ni en custom)
      const systemExists = SYSTEM_ROLES.some(r => r.id === roleName);
      if (systemExists) {
        return res.status(400).json({ error: `El rol '${roleName}' ya existe como rol del sistema` });
      }

      const existingCustom = await prisma.role.findUnique({ where: { name: roleName } });
      if (existingCustom) {
        return res.status(400).json({ error: `El rol '${roleName}' ya existe` });
      }

      // Crear el rol personalizado
      const newRole = await prisma.role.create({
        data: {
          name: roleName,
          description: description || '',
          color: color || 'bg-gray-100 text-gray-800',
          icon: icon || '👤',
          isCustom: true
        }
      });

      res.status(201).json({
        message: `Rol '${roleName}' creado exitosamente`,
        role: {
          id: newRole.name,
          name: newRole.name,
          description: newRole.description,
          color: newRole.color,
          icon: newRole.icon,
          isCustom: true,
          dbId: newRole.id
        }
      });
    } catch (error) {
      console.error('❌ Error creating role:', error);
      res.status(500).json({ error: 'Error al crear rol', details: error.message });
    }
  }
);

/**
 * PUT /api/roles/:id
 * Actualizar un rol personalizado (solo ADMIN)
 */
router.put('/roles/:id',
  authMiddleware.requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { description, color, icon } = req.body;

      // Buscar el rol en la BD
      const role = await prisma.role.findUnique({ where: { name: id } });
      if (!role) {
        return res.status(404).json({ error: `Rol '${id}' no encontrado o es un rol del sistema` });
      }

      // Actualizar solo los campos permitidos
      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;

      const updatedRole = await prisma.role.update({
        where: { name: id },
        data: updateData
      });

      res.json({
        message: `Rol '${id}' actualizado exitosamente`,
        role: {
          id: updatedRole.name,
          name: updatedRole.name,
          description: updatedRole.description,
          color: updatedRole.color,
          icon: updatedRole.icon,
          isCustom: true,
          dbId: updatedRole.id
        }
      });
    } catch (error) {
      console.error('❌ Error updating role:', error);
      res.status(500).json({ error: 'Error al actualizar rol', details: error.message });
    }
  }
);

/**
 * DELETE /api/roles/:id
 * Eliminar un rol personalizado (solo ADMIN)
 */
router.delete('/roles/:id',
  authMiddleware.requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que no sea un rol del sistema
      const isSystemRole = SYSTEM_ROLES.some(r => r.id === id);
      if (isSystemRole) {
        return res.status(400).json({ error: `No se puede eliminar el rol del sistema '${id}'` });
      }

      // Buscar el rol en la BD
      const role = await prisma.role.findUnique({ where: { name: id } });
      if (!role) {
        return res.status(404).json({ error: `Rol '${id}' no encontrado` });
      }

      // Actualizar usuarios que tengan este rol a EMPLEADO_BASICO
      await prisma.user.updateMany({
        where: { role: id },
        data: { role: 'EMPLEADO_BASICO' }
      });

      // Eliminar el rol
      await prisma.role.delete({ where: { name: id } });

      res.json({
        message: `Rol '${id}' eliminado exitosamente. Los usuarios con este rol fueron reasignados a 'EMPLEADO_BASICO'`,
        reasignedUsers: true
      });
    } catch (error) {
      console.error('❌ Error deleting role:', error);
      res.status(500).json({ error: 'Error al eliminar rol', details: error.message });
    }
  }
);

/**
 * GET /api/modules
 * Obtener todos los módulos disponibles del sistema
 */
router.get('/modules', async (req, res) => {
  try {
    const modules = getModulesArray();

    res.json({
      modules,
      total: modules.length
    });
  } catch (error) {
    console.error('❌ Error getting modules:', error);
    res.status(500).json({ error: 'Error al obtener módulos', details: error.message });
  }
});

/**
 * GET /api/roles/presets
 * Obtener los presets de módulos por rol
 */
router.get('/roles/presets', async (req, res) => {
  try {
    const presets = getAllPresets();
    const modules = getModulesArray();

    res.json({
      presets,
      availableModules: modules,
      totalPresets: Object.keys(presets).length
    });
  } catch (error) {
    console.error('❌ Error getting role presets:', error);
    res.status(500).json({ error: 'Error al obtener presets de roles', details: error.message });
  }
});

module.exports = router;
