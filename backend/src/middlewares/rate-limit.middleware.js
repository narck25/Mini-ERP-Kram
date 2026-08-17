const rateLimit = require('express-rate-limit');

/**
 * Rate limiting para endpoints sensibles (P1-1).
 * Mitiga ataques de fuerza bruta en login y registro.
 *
 * NOTA: depende de `app.set('trust proxy', ...)` correctamente configurado
 * (ya se hace en index.js vía TRUST_PROXY). Detrás de Coolify/Traefik debe
 * ser `1` (o el nivel de proxies real); de lo contrario, todos los usuarios
 * compartirían la IP del proxy y se bloquearían entre sí.
 */

// Desactiva el rate limiting en entornos de prueba.
const isDisabled = () =>
  process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_DISABLED === 'true';

// Login: 10 intentos por IP cada 15 minutos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: isDisabled,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
    });
  }
});

// Registro: 5 solicitudes por IP cada hora.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '5', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isDisabled,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiadas solicitudes de registro. Intenta de nuevo más tarde.'
    });
  }
});

module.exports = { loginLimiter, registerLimiter };
