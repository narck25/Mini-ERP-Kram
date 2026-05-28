/**
 * Script de Auditoría: Analizar Modelos Legacy de Candidatos
 * 
 * Propósito: Comparar la tabla Candidate (legacy) vs CandidateRH (nuevo)
 * para decidir si migramos o destruimos los datos legacy.
 * 
 * Uso: node backend/scripts/analizar-legacy-candidatos.js
 * 
 * IMPORTANTE: Solo lectura - NO modifica la base de datos.
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('\n============================================');
  console.log('   AUDITORÍA DE MODELOS DE CANDIDATOS');
  console.log('============================================\n');

  let prisma;
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Conexión a base de datos establecida.\n');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }

  try {
    // ─── 1. CONTAR REGISTROS EN AMBAS TABLAS ───────────────
    console.log('─── 1. CONTEO DE REGISTROS ───────────────────\n');

    const countLegacy = await prisma.candidate.count();
    console.log(`📊 Total en modelo viejo (Candidate - tabla "candidates"): ${countLegacy}`);

    const countNew = await prisma.candidateRH.count();
    console.log(`📊 Total en modelo nuevo (CandidateRH - tabla "candidates_rh"): ${countNew}`);

    const total = countLegacy + countNew;
    console.log(`\n📈 Total combinado: ${total} registros de candidatos.`);

    // ─── 2. ANALIZAR REGISTROS LEGACY (si existen) ─────────
    console.log('\n─── 2. MUESTRA DE DATOS LEGACY (Candidate) ────\n');

    if (countLegacy > 0) {
      // Obtener los 5 más recientes
      const recentLegacy = await prisma.candidate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          vacancy: {
            select: {
              id: true,
              titulo: true,
              estatus: true
            }
          }
        }
      });

      console.log(`📋 Mostrando los ${Math.min(5, countLegacy)} registros más recientes de Candidate:\n`);

      // Preparar datos para tabla
      const tableData = recentLegacy.map((c, i) => ({
        '#': i + 1,
        ID: c.id.substring(0, 8) + '...',
        Nombre: `${c.firstName} ${c.lastName}`,
        Email: c.email,
        Teléfono: c.phone || '(sin teléfono)',
        Estatus: c.status,
        Vacante: c.vacancy?.titulo || '(sin vacante)',
        Creado: c.createdAt.toISOString().split('T')[0],
        CV: c.cvUrl ? '✅' : '❌',
        Psicometría: c.psychTestUrl ? '✅' : '❌',
        Notas: c.notes ? (c.notes.length > 30 ? c.notes.substring(0, 30) + '...' : c.notes) : '(sin notas)',
        Entrevista: c.interviewDate ? c.interviewDate.toISOString().split('T')[0] : '(no agendada)'
      }));

      console.table(tableData);

      // Análisis de campos llenos
      console.log('\n─── ANÁLISIS DE CAMPOS ───────────────────────\n');

      const totalLegacy = countLegacy;
      const withPhone = await prisma.candidate.count({ where: { NOT: { phone: null } } });
      const withNotes = await prisma.candidate.count({ where: { NOT: { notes: null } } });
      const withInterview = await prisma.candidate.count({ where: { NOT: { interviewDate: null } } });
      const withCv = await prisma.candidate.count({ where: { NOT: { cvUrl: null } } });
      const withPsych = await prisma.candidate.count({ where: { NOT: { psychTestUrl: null } } });

      console.log(`📞 Con teléfono:     ${withPhone}/${totalLegacy} (${((withPhone / totalLegacy) * 100).toFixed(1)}%)`);
      console.log(`📝 Con notas:        ${withNotes}/${totalLegacy} (${((withNotes / totalLegacy) * 100).toFixed(1)}%)`);
      console.log(`📅 Con fecha entrev.: ${withInterview}/${totalLegacy} (${((withInterview / totalLegacy) * 100).toFixed(1)}%)`);
      console.log(`📄 Con CV:           ${withCv}/${totalLegacy} (${((withCv / totalLegacy) * 100).toFixed(1)}%)`);
      console.log(`🧪 Con psicometría:  ${withPsych}/${totalLegacy} (${((withPsych / totalLegacy) * 100).toFixed(1)}%)`);

      // Distribución de estatus
      console.log('\n─── DISTRIBUCIÓN POR ESTATUS ─────────────────\n');
      const statusDistribution = await prisma.candidate.groupBy({
        by: ['status'],
        _count: { id: true }
      });
      console.table(statusDistribution.map(s => ({
        Estatus: s.status,
        Cantidad: s._count.id
      })));

      // Verificar si hay candidatos vinculados a vacantes que aún existen
      const withValidVacancy = await prisma.candidate.count({
        where: { vacancy: { isNot: null } }
      });
      const orphaned = totalLegacy - withValidVacancy;
      console.log(`\n🔗 Con vacante válida: ${withValidVacancy}`);
      console.log(`⚠️  Huérfanos (vacante eliminada): ${orphaned}`);

    } else {
      console.log('ℹ️  No hay registros en la tabla Candidate (legacy).');
      console.log('   La tabla está vacía y puede eliminarse sin pérdida de datos.');
    }

    // ─── 3. RESUMEN Y RECOMENDACIÓN ────────────────────────
    console.log('\n─── 3. RESUMEN Y RECOMENDACIÓN ────────────────\n');

    if (countLegacy === 0) {
      console.log('✅ RECOMENDACIÓN: La tabla Candidate está VACÍA.');
      console.log('   → Puedes eliminar el modelo Candidate del schema.prisma');
      console.log('   → No hay datos que migrar.');
      console.log('   → La tabla "candidates" puede eliminarse en la siguiente migración.');
    } else if (countLegacy < 10) {
      console.log('⚠️  RECOMENDACIÓN: Hay pocos registros legacy.');
      console.log('   → Revisa la muestra impresa arriba.');
      console.log('   → Si son datos de prueba, puedes eliminarlos.');
      console.log('   → Si son reales, considera migrarlos manualmente a CandidateRH.');
    } else {
      console.log('⚠️  RECOMENDACIÓN: Hay una cantidad significativa de registros legacy.');
      console.log('   → Revisa la muestra impresa arriba para determinar si son datos reales.');
      console.log('   → Si son reales, se necesita un script de migración.');
      console.log('   → Si son de prueba, pueden eliminarse.');
    }

    console.log('\n============================================');
    console.log('   AUDITORÍA COMPLETADA');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ Error durante la auditoría:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión a base de datos cerrada.\n');
  }
}

main();
