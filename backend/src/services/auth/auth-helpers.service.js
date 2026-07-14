/**
 * auth-helpers.service.js
 * ─────────────────────────────────────────────────────────────
 * Helpers para AuthController — extraídos para mantener el
 * controller delgado.
 *
 * Responsabilidad: sanitización de datos de usuario,
 *                  creación de sesión, funciones reutilizables.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AuthUtils = require('../../utils/auth.utils');

/**
 * Sanitiza el objeto user removiendo el password y normalizando
 * accessibleModules para la respuesta al frontend.
 *
 * @param {Object} user - Objeto user de Prisma
 * @returns {Object} UserData sin campos sensibles
 */
const sanitizeUserData = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  accessibleModules: user.accessibleModules || ['DASHBOARD'],
  createdAt: user.createdAt,
});

/**
 * Crea una sesión en base de datos con token y fecha de expiración.
 *
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} sessionToken generado
 */
const createSession = async (userId) => {
  const sessionToken = AuthUtils.generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      expiresAt,
    },
  });

  return sessionToken;
};

module.exports = {
  sanitizeUserData,
  createSession,
};