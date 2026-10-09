/**
 * Backfill de un solo uso: otorga el módulo ASISTENCIA a todos los usuarios
 * que no lo tengan todavía.
 *
 * Necesario porque el preset de rol (roles.config.js) no se re-aplica solo a
 * usuarios ya existentes — solo a los que se creen de ahora en adelante.
 * Sin este backfill, al desplegar el gate requireModule('ASISTENCIA') en
 * GET /incidencias/my, todo el mundo perdería acceso a "Mi Asistencia" de
 * golpe hasta que un admin lo reactive uno por uno.
 *
 * Uso (desde backend/): node backfill_modulo_asistencia.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "users"
    SET "accessibleModules" = array_append("accessibleModules", 'ASISTENCIA')
    WHERE NOT ('ASISTENCIA' = ANY("accessibleModules"))
  `);
  console.log(`Usuarios actualizados: ${result}`);
}

main()
  .catch((err) => {
    console.error('Error en backfill:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
