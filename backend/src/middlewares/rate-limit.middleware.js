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

// Reseteo de base de datos: ya requiere ADMIN + ALLOW_SEED_RESET=true, pero
// es tan destructivo (borra toda la BD) que además se limita a 3 intentos
// por IP cada hora — sobre todo para frenar un script/automatización que
// lo dispare en bucle por error, no un ataque de fuerza bruta clásico.
const seedResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.SEED_RESET_RATE_LIMIT_MAX || '3', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isDisabled,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados intentos de reseteo de base de datos. Intenta de nuevo en 1 hora.'
    });
  }
});

// Restablecimiento de contraseña por ADMIN/RH: 20 por IP cada hora — permite
// una jornada normal de altas/restablecimientos en lote sin bloquear, mientras
// sigue acotando un uso automatizado/abusivo de la cuenta.
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.RESET_PASSWORD_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isDisabled,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados restablecimientos de contraseña desde esta red. Intenta de nuevo en 1 hora.'
    });
  }
});

module.exports = { loginLimiter, seedResetLimiter, resetPasswordLimiter };
