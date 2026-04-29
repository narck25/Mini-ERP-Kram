const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

      const users = await prisma.user.findMany({
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
        }
      });

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
        users: formattedUsers
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
      const { accessibleModules } = req.body;

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

      // Validar que los módulos sean válidos
      const validModules = ['EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'DASHBOARD', 'REPORTES', 'COMPRAS'];
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

      // Actualizar el usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          accessibleModules: modulesToSet
        },
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
        message: 'Permisos actualizados correctamente',
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
      const modules = [
        { id: 'EMPLEADOS', name: 'Empleados', description: 'Gestión de empleados y expedientes' },
        { id: 'RECLUTAMIENTO', name: 'Reclutamiento', description: 'Gestión de vacantes y candidatos' },
        { id: 'VACACIONES', name: 'Vacaciones', description: 'Solicitud y aprobación de vacaciones' },
        { id: 'INCIDENCIAS', name: 'Incidencias', description: 'Reporte y seguimiento de incidencias' },
        { id: 'CONFIGURACION', name: 'Configuración', description: 'Configuración del sistema' },
        { id: 'DASHBOARD', name: 'Dashboard', description: 'Panel principal de control', required: true },
        { id: 'REPORTES', name: 'Reportes', description: 'Generación de reportes y estadísticas' },
        { id: 'COMPRAS', name: 'Compras', description: 'Solicitud y gestión de compras' }
      ];

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