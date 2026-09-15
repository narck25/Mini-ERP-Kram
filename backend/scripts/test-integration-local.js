#!/usr/bin/env node
/**
 * test-integration-local.js
 * ─────────────────────────────────────────────────────────────
 * Levanta un entorno de pruebas de integración LOCAL, aislado de la
 * base de desarrollo (kram_erp), replicando los mismos pasos que
 * .github/workflows/backend-ci.yml (migrar, seed, arrancar el
 * backend, correr Jest contra ese servidor), pero usando el Postgres
 * local de docker-compose.test.yml en vez del servicio efímero de
 * GitHub Actions.
 *
 * Pasos:
 *   1. Carga backend/.env.test (override de cualquier env var previa).
 *   2. Salvaguarda: aborta si DATABASE_URL no contiene "kram_test".
 *   3. `prisma migrate deploy` sobre kram_test.
 *   4. `node prisma/seed.js` sobre kram_test.
 *   5. Arranca `node src/index.js` en background, en el PORT de .env.test.
 *   6. Espera a GET /api/health.
 *   7. Corre Jest (suite de integración) con TEST_BASE_URL apuntando a
 *      ese servidor.
 *   8. Apaga el servidor (siempre, incluso si Jest falla) y propaga el
 *      código de salida de Jest.
 *
 * Uso: npm run test:integration:local
 *      (requiere el Postgres de prueba arriba: ver docs/TESTING.md)
 * ─────────────────────────────────────────────────────────────
 */

const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const BACKEND_ROOT = path.join(__dirname, '..'); // backend/
const ENV_TEST_PATH = path.join(BACKEND_ROOT, '.env.test');

// ── 1. Cargar backend/.env.test (con override, para que siempre gane
//      sobre cualquier variable ya presente en el entorno) ──
require('dotenv').config({ path: ENV_TEST_PATH, override: true });

function redactDatabaseUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//<credenciales ocultas>@${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '(vacío o no parseable)';
  }
}

// ── 2. Salvaguarda: nunca correr esto contra algo que no sea kram_test ──
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('kram_test')) {
  console.error('❌ Abortado: DATABASE_URL no contiene "kram_test".');
  console.error('   Este script SOLO puede correr contra la base de pruebas aislada');
  console.error('   (docker-compose.test.yml, puerto 5433) — nunca contra kram_erp.');
  console.error(`   ¿Existe backend/.env.test? Cópialo desde backend/.env.test.example.`);
  console.error(`   DATABASE_URL actual: ${redactDatabaseUrl(dbUrl)}`);
  process.exit(1);
}

const PORT = process.env.PORT || '3002';
const TEST_BASE_URL = `http://localhost:${PORT}`;
// El resto de los procesos hijos (prisma, seed, servidor, jest) heredan
// el entorno ya cargado desde .env.test, más TEST_BASE_URL para Jest.
const childEnv = { ...process.env, TEST_BASE_URL };

function runSync(cmd, args) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: BACKEND_ROOT,
    env: childEnv,
    stdio: 'inherit',
    shell: process.platform === 'win32' // npx/node en Windows son .cmd
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Comando falló (código ${result.status}): ${cmd} ${args.join(' ')}`);
  }
}

function waitForHealth(baseUrl, { retries = 30, delayMs = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryOnce = () => {
      attempts++;
      const req = http.get(`${baseUrl}/api/health`, (res) => {
        res.resume(); // liberar el socket
        if (res.statusCode === 200) return resolve();
        scheduleRetry();
      });
      req.on('error', scheduleRetry);
    };
    const scheduleRetry = () => {
      if (attempts >= retries) {
        return reject(new Error(`El servidor de pruebas no respondió en ${baseUrl}/api/health tras ${retries} intentos`));
      }
      setTimeout(tryOnce, delayMs);
    };
    tryOnce();
  });
}

async function main() {
  console.log('🧪 Entorno de integración LOCAL (aislado de desarrollo)');
  console.log(`   DATABASE_URL: ${redactDatabaseUrl(dbUrl)}`);
  console.log(`   Servidor de pruebas: ${TEST_BASE_URL}`);

  // ── 3. Migraciones sobre kram_test ──
  runSync('npx', ['prisma', 'migrate', 'deploy']);

  // ── 4. Seed sobre kram_test ──
  runSync('node', ['prisma/seed.js']);

  // ── 5. Arrancar el servidor en background ──
  console.log(`\n▶ Iniciando servidor de pruebas en ${TEST_BASE_URL} ...`);
  const server = spawn('node', ['src/index.js'], {
    cwd: BACKEND_ROOT,
    env: childEnv,
    stdio: 'inherit'
  });

  let serverExited = false;
  server.on('exit', () => { serverExited = true; });

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (!serverExited) {
      console.log('\n▶ Deteniendo servidor de pruebas...');
      server.kill();
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });
  process.on('SIGTERM', () => { cleanup(); process.exit(1); });

  try {
    // ── 6. Esperar a que el servidor esté listo ──
    await waitForHealth(TEST_BASE_URL);
    console.log('✅ Servidor de pruebas listo.');

    // ── 7. Correr Jest (suite de integración) contra ese servidor ──
    // Se reenvían argumentos extra: p. ej. `npm run test:integration:local -- --coverage`
    runSync('npx', ['jest', '--ci', ...process.argv.slice(2)]);

    console.log('\n✅ Suite de integración local completada.');
  } finally {
    // ── 8. Apagar el servidor siempre, haya pasado o fallado Jest ──
    cleanup();
  }
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exitCode = 1;
});
