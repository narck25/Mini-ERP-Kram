const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getEnabledModuleKeys, getModulesArray } = require('../config/modules.config');
const { getAllPresets } = require('../config/roles.config');

class PermissionController {
  /**
   * Obtener todos los usuarios con sus módulos accesibles
   */
  static async getAllUsersWithPermissions(req, res) {
    try {
      // Verificar que el usuario tenga permisos de ADMIN o RH
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'RH')) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo ADMIN y RH pueden gestionar permisos'
        });
      }

      const { search, role, isActive, page = '1', limit = '20' } = req.query;
      const where = {};

      if (role) where.role = role;
      if (isActive === 'true') where.isActive = true;
      if (isActive === 'false') where.isActive = false;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            accessibleModules: true,
            employee: {
              select: {
                puesto: true,
                departamento: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          },
          orderBy: {
            name: 'asc'
          },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      // Formatear la respuesta
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        accessibleModules: user.accessibleModules || [],
        puesto: user.employee?.puesto || 'No asignado',
        departamento: user.employee?.departamento?.nombre || 'No asignado'
      }));

      res.json({
        success: true,
        users: formattedUsers,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
      });
    } catch (error) {
      console.error('Error al obtener usuarios con permisos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los usuarios'
      });
    }
  }

  /**
   * Actualizar los módulos accesibles de un usuario
   */
  static async updateUserPermissions(req, res) {
    try {
      const { id } = req.params;
      const { accessibleModules, role } = req.body;

      // Validar que el usuario tenga permisos de ADMIN o RH
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'RH')) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo ADMIN y RH pueden actualizar permisos'
        });
      }

      // Validar que accessibleModules sea un array
      if (!Array.isArray(accessibleModules)) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'accessibleModules debe ser un array'
        });
      }

      // Validar que los módulos sean válidos usando la configuración centralizada
      const validModules = [...getEnabledModuleKeys(), 'DASHBOARD'];
      const invalidModules = accessibleModules.filter(module => !validModules.includes(module));
      
      if (invalidModules.length > 0) {
        return res.status(400).json({
          error: 'Módulos inválidos',
          message: `Los siguientes módulos no son válidos: ${invalidModules.join(', ')}`,
          validModules
        });
      }

      // Asegurar que DASHBOARD siempre esté incluido
      const modulesToSet = [...new Set([...accessibleModules, 'DASHBOARD'])];

      // Preparar datos de actualización
      const updateData = {
        accessibleModules: modulesToSet
      };

      // Si se proporciona un rol, validar permisos y el rol
      if (role && role.trim().length > 0) {
        // Solo ADMIN puede cambiar el rol de un usuario (Nivel C)
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Solo ADMIN puede cambiar el rol de un usuario'
          });
        }

        // Validar que el rol sea válido (sistema + personalizados)
        const systemRoleIds = Object.keys(getAllPresets());
        const customRoles = await prisma.role.findMany({ where: { isCustom: true }, select: { name: true } });
        const validRoles = [...systemRoleIds, ...customRoles.map(r => r.name)];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            error: 'Rol inválido',
            message: `El rol "${role}" no es válido`
          });
        }

        updateData.role = role;
      }

      // Actualizar el usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          accessibleModules: true
        }
      });

      res.json({
        success: true,
        message: role && role !== updatedUser.role 
          ? `Permisos y rol actualizados correctamente` 
          : 'Permisos actualizados correctamente',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron actualizar los permisos'
      });
    }
  }

  /**
   * Obtener los módulos disponibles
   */
  static async getAvailableModules(req, res) {
    try {
      const modules = getModulesArray();

      res.json({
        success: true,
        modules
      });
    } catch (error) {
      console.error('Error al obtener módulos disponibles:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los módulos disponibles'
      });
    }
  }

  /**
   * Obtener permisos del usuario actual
   */
  static async getCurrentUserPermissions(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debe iniciar sesión para ver sus permisos'
        });
      }

      res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          accessibleModules: req.user.accessibleModules || ['DASHBOARD']
        }
      });
    } catch (error) {
      console.error('Error al obtener permisos del usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los permisos'
      });
    }
  }
}

module.exports = PermissionController;
