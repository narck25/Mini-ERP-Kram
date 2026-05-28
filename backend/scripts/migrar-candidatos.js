/**
 * Script de Migración: Candidate (legacy) → CandidateRH (nuevo)
 * 
 * Propósito: Migrar los registros del modelo legacy Candidate
 * al nuevo modelo CandidateRH mapeando los campos correctamente.
 * 
 * Uso: node backend/scripts/migrar-candidatos.js
 * 
 * IMPORTANTE: Solo escribe en CandidateRH. NO modifica el schema.prisma.
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('\n============================================');
  console.log('   MIGRACIÓN: Candidate → CandidateRH');
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
    // ─── 1. OBTENER REGISTROS LEGACY ──────────────────────
    console.log('─── 1. LEYENDO REGISTROS LEGACY ──────────────\n');

    const legacyCandidates = await prisma.candidate.findMany({
      include: {
        vacancy: {
          select: {
            id: true,
            titulo: true
          }
        }
      }
    });

    const totalLegacy = legacyCandidates.length;
    console.log(`📊 Total de candidatos legacy encontrados: ${totalLegacy}`);

    if (totalLegacy === 0) {
      console.log('\nℹ️  No hay registros para migrar. La tabla Candidate está vacía.');
      console.log('   No se requiere ninguna acción.');
      await prisma.$disconnect();
      return;
    }

    // ─── 2. MOSTRAR VISTA PREVIA ──────────────────────────
    console.log('\n─── 2. VISTA PREVIA DE LA MIGRACIÓN ──────────\n');

    const previewData = legacyCandidates.map((c, i) => ({
      '#': i + 1,
      'Nombre Legacy': `${c.firstName} ${c.lastName}`,
      'Email': c.email,
      'Estatus': c.status,
      'Vacante': c.vacancy?.titulo || '(sin vacante)',
      '→ nombre (nuevo)': `${c.firstName} ${c.lastName}`,
      '→ vacancy_id': c.vacancyId
    }));
    console.table(previewData);

    console.log('\n⚠️  ¿Continuar con la migración? (S/N)');
    console.log('   Presiona Ctrl+C para cancelar, o espera 5 segundos...\n');

    // Pequeña pausa para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ─── 3. EJECUTAR MIGRACIÓN ────────────────────────────
    console.log('─── 3. MIGRANDO REGISTROS ────────────────────\n');

    let migrados = 0;
    let errores = 0;

    for (const candidate of legacyCandidates) {
      try {
        const nuevoRegistro = await prisma.candidateRH.create({
          data: {
            vacancy_id: candidate.vacancyId,
            nombre: `${candidate.firstName} ${candidate.lastName}`.trim(),
            cv_url: candidate.cvUrl || null,
            psych_test_url: candidate.psychTestUrl || null,
            estatus: mapEstatus(candidate.status),
            comentarios_rh: buildComentarios(candidate),
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt
          }
        });

        console.log(`✅ ${candidate.firstName} ${candidate.lastName} migrado con éxito → ID: ${nuevoRegistro.id.substring(0, 8)}...`);
        migrados++;
      } catch (error) {
        console.error(`❌ Error al migrar ${candidate.firstName} ${candidate.lastName}: ${error.message}`);
        errores++;
      }
    }

    // ─── 4. RESUMEN FINAL ─────────────────────────────────
    console.log('\n─── 4. RESUMEN DE MIGRACIÓN ──────────────────\n');
    console.log(`📊 Total procesados: ${totalLegacy}`);
    console.log(`✅ Migrados exitosamente: ${migrados}`);
    console.log(`❌ Errores: ${errores}`);

    if (errores === 0) {
      console.log('\n🎉 Migración completada sin errores.');
      console.log('   Los datos legacy ahora están disponibles en CandidateRH.');
      console.log('   Puedes proceder a eliminar el modelo Candidate del schema.prisma');
      console.log('   cuando estés listo para la limpieza final.');
    } else {
      console.log(`\n⚠️  Hubo ${errores} errores durante la migración.`);
      console.log('   Revisa los mensajes de error arriba y corrige antes de reintentar.');
    }

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión a base de datos cerrada.\n');
  }
}

/**
 * Mapea el estatus del modelo legacy al nuevo modelo.
 * Candidate usa strings como "PENDIENTE", "SELECCIONADO", etc.
 * CandidateRH usa el enum CandidateStatus.
 */
function mapEstatus(legacyStatus) {
  if (!legacyStatus) return 'En_Revision';

  const statusMap = {
    'PENDIENTE': 'En_Revision',
    'EN_REVISION': 'En_Revision',
    'En_Revision': 'En_Revision',
    'REVISADO': 'En_Revision',
    'SELECCIONADO': 'Seleccionado',
    'SELECCIONADO': 'Seleccionado',
    'DESCARTADO': 'Descartado',
    'DESCARTADO': 'Descartado',
    'RECHAZADO': 'Descartado',
    'ACEPTADO': 'Seleccionado',
    'CONTRATADO': 'Seleccionado'
  };

  return statusMap[legacyStatus.toUpperCase()] || 'En_Revision';
}

/**
 * Construye el campo comentarios_rh concatenando notas legacy
 * y otros datos relevantes.
 */
function buildComentarios(candidate) {
  const partes = [];

  if (candidate.notes) {
    partes.push(`📝 Notas legacy: ${candidate.notes}`);
  }

  if (candidate.phone) {
    partes.push(`📞 Teléfono: ${candidate.phone}`);
  }

  if (candidate.interviewDate) {
    partes.push(`📅 Entrevista agendada: ${candidate.interviewDate.toISOString().split('T')[0]}`);
  }

  return partes.length > 0 ? partes.join(' | ') : null;
}

main();
