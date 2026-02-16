const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
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
   * Generate random session token
   * @returns {string} Random token
   */
  static generateSessionToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Check if user has required role
   * @param {string} userRole - User's role
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {boolean} True if user has required role
   */
  static hasRole(userRole, allowedRoles) {
    return allowedRoles.includes(userRole);
  }
}

module.exports = AuthUtils;