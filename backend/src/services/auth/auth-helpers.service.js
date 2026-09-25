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
 * Registra en base de datos el JWT recién emitido para un login, para que
 * verifyToken pueda revocarlo (logout / cambio de contraseña) sin esperar
 * a que expire por sí solo. La fecha de expiración de la sesión se deriva
 * del propio JWT (claim `exp`), para no desincronizarse de JWT_EXPIRES_IN.
 *
 * De paso, limpia las sesiones ya vencidas de ese usuario para que la
 * tabla no crezca sin límite (no hay otro mecanismo de limpieza).
 *
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT ya firmado (el mismo que se devuelve al cliente)
 */
const createSession = async (userId, token) => {
  const { exp } = require('jsonwebtoken').decode(token);
  const expiresAt = new Date(exp * 1000);

  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
};

/**
 * Verifica que el JWT presentado corresponda a una sesión activa (no
 * cerrada por logout ni invalidada por un cambio de contraseña) y que no
 * haya expirado. Usado por verifyToken y verifyTokenFromQuery.
 *
 * @param {string} token - JWT a validar
 * @returns {Promise<boolean>}
 */
const isSessionActive = async (token) => {
  const session = await prisma.session.findUnique({ where: { token } });
  return !!session && session.expiresAt > new Date();
};

module.exports = {
  sanitizeUserData,
  createSession,
  isSessionActive,
};