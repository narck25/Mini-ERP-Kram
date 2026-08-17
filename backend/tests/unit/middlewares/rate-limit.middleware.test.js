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
  });

  test('exporta loginLimiter y registerLimiter como middlewares', () => {
    const { loginLimiter, registerLimiter } = loadFreshMiddleware();
    expect(typeof loginLimiter).toBe('function');
    expect(typeof registerLimiter).toBe('function');
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
});
