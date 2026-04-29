const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

class UserController {
  // Obtener todos los usuarios (solo ADMIN)
  static async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              id: true,
              nombre: true,
              puesto: {
                select: {
                  nombre: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        success: true,
        data: users,
        message: 'Usuarios obtenidos exitosamente',
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener usuarios',
      });
    }
  }

  // Obtener un usuario por ID (solo ADMIN)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Usuario obtenido exitosamente',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener usuario',
      });
    }
  }

  // Crear un nuevo usuario (solo ADMIN)
  static async createUser(req, res) {
    try {
      const { name, email, password, role, accessibleModules } = req.body;

      // Validar campos requeridos
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, email, password, role',
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { name },
            { email },
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de usuario o correo electrónico ya está en uso',
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          accessibleModules: accessibleModules || [],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: newUser,
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al crear usuario',
      });
    }
  }

  // Actualizar usuario (solo ADMIN)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, password, role, accessibleModules, isActive } = req.body;

      // Verificar si el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      // Verificar si el nuevo name o email ya están en uso por otro usuario
      if (name || email) {
        const duplicateUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  name ? { name } : undefined,
                  email ? { email } : undefined,
                ].filter(Boolean),
              },
            ],
          },
        });

        if (duplicateUser) {
          return res.status(400).json({
            success: false,
            error: 'El nombre de usuario o correo electrónico ya está en uso',
          });
        }
      }

      // Preparar datos de actualización
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (accessibleModules !== undefined) updateData.accessibleModules = accessibleModules;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Si se proporciona una nueva contraseña, hacer hash
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar usuario',
      });
    }
  }

  // Eliminar usuario (solo ADMIN)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar si el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      // No permitir eliminar al propio usuario
      if (existingUser.id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'No puedes eliminar tu propia cuenta',
        });
      }

      // Eliminar usuario
      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario',
      });
    }
  }

  // Obtener estadísticas de usuarios (solo ADMIN)
  static async getUserStats(req, res) {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true },
      });
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          usersByRole: usersByRole.map(item => ({
            role: item.role,
            count: item._count,
          })),
        },
        message: 'Estadísticas de usuarios obtenidas exitosamente',
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas de usuarios',
      });
    }
  }
}

module.exports = UserController;