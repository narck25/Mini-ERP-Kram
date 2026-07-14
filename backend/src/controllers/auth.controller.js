const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const AuthUtils = require('../utils/auth.utils');
const { sanitizeUserData, createSession } = require('../services/auth/auth-helpers.service');

const prisma = new PrismaClient();

class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Buscar empleado con el mismo correo
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { correoElectronico: email },
            { correoEmpresa: email }
          ]
        }
      });

      const hashedPassword = await AuthUtils.hashPassword(password);

      const userData = {
        email,
        password: hashedPassword,
        name,
        role: 'EMPLEADO_BASICO',
        accessibleModules: []
      };

      // Vincular empleado si existe
      if (employee) {
        userData.employee = {
          connect: { id: employee.id }
        };
        console.log(`✅ Usuario vinculado automáticamente al empleado: ${employee.nombres || employee.nombre || 'Sin nombre'} (ID: ${employee.id})`);
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              nombres: true,
              clave: true,
              puesto: true
            }
          }
        }
      });

      const token = AuthUtils.generateToken({ userId: user.id, role: user.role });

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          password: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      const isValidPassword = await AuthUtils.comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token with accessibleModules
      const token = AuthUtils.generateToken({
        userId: user.id,
        role: user.role,
        accessibleModules: user.accessibleModules || ['DASHBOARD']
      });

      const sessionToken = await createSession(user.id);

      res.json({
        message: 'Login successful',
        user: sanitizeUserData(user),
        token,
        sessionToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * Logout user (invalidate session)
   */
  static async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractToken(authHeader);

      if (token) {
        await prisma.session.deleteMany({
          where: { token }
        });
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await AuthUtils.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Invalidate all sessions
      await prisma.session.deleteMany({
        where: { userId }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}

module.exports = AuthController;