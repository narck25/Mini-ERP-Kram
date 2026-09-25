const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthUtils {
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @param {object} payload - Token payload
   * @param {string} expiresIn - Token expiration (default: 7d)
   * @returns {string} JWT token
   */
  static generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
    // `jwtid` garantiza que el token firmado sea único incluso si el mismo
    // usuario inicia sesión dos veces con el mismo payload dentro del mismo
    // segundo (iat idéntico) — necesario porque Session.token es @unique.
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn, jwtid: crypto.randomUUID() });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   */
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header
   * @returns {string|null} Token or null
   */
  static extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  /**
   * Check if user has required role
   * @param {string} userRole - User's role
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {boolean} True if user has required role
   */
  static hasRole(userRole, allowedRoles) {
    // Convert both to uppercase for case-insensitive comparison
    const userRoleUpper = userRole.toUpperCase();
    return allowedRoles.some(role => role.toUpperCase() === userRoleUpper);
  }
}

module.exports = AuthUtils;