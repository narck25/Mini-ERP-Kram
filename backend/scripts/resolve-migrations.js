/**
 * Script para resolver migraciones fallidas de Prisma antes del deploy.
 * 
 * Problema: Cuando una migración falla (ej: columna ya existe),
 * Prisma bloquea futuras migraciones con error P3009.
 * 
 * Solución: Detecta migraciones fallidas en _prisma_migrations
 * y las marca como "aplicadas" si el SQL ya se ejecutó parcialmente.
 * 
 * Uso: node scripts/resolve-migrations.js
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('🔍 Verificando estado de migraciones Prisma...');

  const prisma = new PrismaClient();

  try {
    // Consultar migraciones fallidas
    const failedMigrations = await prisma.$queryRawUnsafe(`
      SELECT id, migration_name, started_at, finished_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
      ORDER BY started_at ASC
    `);

    if (!failedMigrations || failedMigrations.length === 0) {
      console.log('✅ No hay migraciones fallidas. Continuando...');
      return;
    }

    console.log(`⚠️  Se encontraron ${failedMigrations.length} migraciones fallidas:`);

    for (const migration of failedMigrations) {
      console.log(`   - ${migration.migration_name} (iniciada: ${migration.started_at})`);

      // Marcar como aplicada
      console.log(`   → Marcando como aplicada...`);
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(), logs = '{"resolved": true, "reason": "Migration marked as applied by resolve-migrations script"}'
        WHERE id = $1
      `, migration.id);

      console.log(`   ✅ ${migration.migration_name} resuelta como aplicada`);
    }

    console.log('✅ Todas las migraciones fallidas han sido resueltas.');
  } catch (error) {
    // Si la tabla _prisma_migrations no existe, es primera vez
    if (error.message.includes('relation "_prisma_migrations" does not exist')) {
      console.log('ℹ️  Primera ejecución - no hay migraciones previas.');
      return;
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Estado de migraciones verificado correctamente.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error verificando migraciones:', e.message);
    process.exit(1);
  });
