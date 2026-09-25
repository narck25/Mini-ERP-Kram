/**
 * Unit Tests: RateLimit Middleware (P1-1)
 * Pruebas unitarias para el middleware de rate limiting.
 */
const express = require('express');
const request = require('supertest');

function buildLoginApp(limiter) {
  const app = express();
  app.use(express.json());
  app.post('/login', limiter, (req, res) => res.status(401).json({ error: 'Invalid credentials' }));
  return app;
}

function buildApp(path, limiter, status = 200) {
  const app = express();
  app.use(express.json());
  app.post(path, limiter, (req, res) => res.status(status).json({ ok: true }));
  return app;
}

// Recarga el módulo para obtener una instancia fresca del limiter
// (con su store en memoria limpio) bajo las variables de entorno actuales.
function loadFreshMiddleware() {
  jest.resetModules();
  return require('../../../src/middlewares/rate-limit.middleware');
}

describe('🛡️ RateLimit Middleware - Pruebas Unitarias', () => {
  const OLD_ENV = process.env.NODE_ENV;
  const OLD_DISABLED = process.env.RATE_LIMIT_DISABLED;

  afterEach(() => {
    if (OLD_ENV === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = OLD_ENV;

    if (OLD_DISABLED === undefined) delete process.env.RATE_LIMIT_DISABLED;
    else process.env.RATE_LIMIT_DISABLED = OLD_DISABLED;

    delete process.env.SEED_RESET_RATE_LIMIT_MAX;
    delete process.env.RESET_PASSWORD_RATE_LIMIT_MAX;
  });

  test('exporta loginLimiter como middleware', () => {
    // registerLimiter se eliminó junto con POST /api/auth/register
    // (hallazgo #2, docs/PROJECT_CONTEXT.md §13) — el registro público
    // no se usa: las cuentas las crean RH/TI vía importación CSV.
    const { loginLimiter } = loadFreshMiddleware();
    expect(typeof loginLimiter).toBe('function');
  });

  test('loginLimiter bloquea con 429 tras exceder el límite (10 intentos)', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_DISABLED;

    const { loginLimiter } = loadFreshMiddleware();
    const app = buildLoginApp(loginLimiter);

    let last;
    for (let i = 0; i < 11; i++) {
      last = await request(app).post('/login').send({ email: 'a@a.com', password: 'x' });
    }

    expect(last.status).toBe(429);
    expect(last.body).toHaveProperty('error');
  });

  test('loginLimiter se desactiva cuando NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.RATE_LIMIT_DISABLED;

    const { loginLimiter } = loadFreshMiddleware();
    const app = buildLoginApp(loginLimiter);

    let last;
    for (let i = 0; i < 20; i++) {
      last = await request(app).post('/login').send({ email: 'a@a.com', password: 'x' });
    }

    expect(last.status).toBe(401); // nunca bloquea
  });

  // Hallazgo #10 (docs/PROJECT_CONTEXT.md §13): /api/seed/reset y
  // /api/users/:id/reset-password no tenían ningún límite de intentos.
  test('seedResetLimiter bloquea con 429 tras exceder el límite (3 intentos/hora)', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_DISABLED;
    process.env.SEED_RESET_RATE_LIMIT_MAX = '3';

    const { seedResetLimiter } = loadFreshMiddleware();
    const app = buildApp('/seed/reset', seedResetLimiter);

    let last;
    for (let i = 0; i < 4; i++) {
      last = await request(app).post('/seed/reset').send({ confirm: true });
    }

    expect(last.status).toBe(429);
    delete process.env.SEED_RESET_RATE_LIMIT_MAX;
  });

  test('resetPasswordLimiter bloquea con 429 tras exceder el límite (20 intentos/hora)', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_DISABLED;
    process.env.RESET_PASSWORD_RATE_LIMIT_MAX = '5';

    const { resetPasswordLimiter } = loadFreshMiddleware();
    const app = buildApp('/reset-password', resetPasswordLimiter);

    let last;
    for (let i = 0; i < 6; i++) {
      last = await request(app).post('/reset-password').send({});
    }

    expect(last.status).toBe(429);
    delete process.env.RESET_PASSWORD_RATE_LIMIT_MAX;
  });

  test('seedResetLimiter y resetPasswordLimiter se desactivan cuando NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.RATE_LIMIT_DISABLED;

    const { seedResetLimiter, resetPasswordLimiter } = loadFreshMiddleware();
    const seedApp = buildApp('/seed/reset', seedResetLimiter);
    const resetApp = buildApp('/reset-password', resetPasswordLimiter);

    let lastSeed, lastReset;
    for (let i = 0; i < 5; i++) {
      lastSeed = await request(seedApp).post('/seed/reset').send({});
      lastReset = await request(resetApp).post('/reset-password').send({});
    }

    expect(lastSeed.status).toBe(200);
    expect(lastReset.status).toBe(200);
  });
});
