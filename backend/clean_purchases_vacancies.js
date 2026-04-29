// Script para limpiar registros de compras y vacantes
// y restablecer contadores a 0

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🚀 Iniciando limpieza de base de datos...');
  
  try {
    // 1. Primero limpiar tablas relacionadas con compras (en orden correcto por relaciones)
    console.log('🧹 Limpiando tablas de compras...');
    
    // Primero eliminar cotizaciones (dependen de purchase_requests)
    const deletedQuotes = await prisma.purchaseQuote.deleteMany({});
    console.log(`✅ Eliminadas ${deletedQuotes.count} cotizaciones`);
    
    // Luego eliminar ítems (dependen de purchase_requests)
    const deletedItems = await prisma.purchaseItem.deleteMany({});
    console.log(`✅ Eliminados ${deletedItems.count} ítems de compra`);
    
    // Finalmente eliminar solicitudes de compra
    const deletedRequests = await prisma.purchaseRequest.deleteMany({});
    console.log(`✅ Eliminadas ${deletedRequests.count} solicitudes de compra`);
    
    // 2. Limpiar tablas relacionadas con vacantes (en orden correcto por relaciones)
    console.log('🧹 Limpiando tablas de vacantes...');
    
    // Primero eliminar comentarios de vacantes (dependen de job_vacancies)
    const deletedComments = await prisma.vacancyComment.deleteMany({});
    console.log(`✅ Eliminados ${deletedComments.count} comentarios de vacantes`);
    
    // Eliminar actividades de vacantes (dependen de job_vacancies)
    const deletedActivities = await prisma.jobActivity.deleteMany({});
    console.log(`✅ Eliminadas ${deletedActivities.count} actividades de vacantes`);
    
    // Eliminar candidatos RH (dependen de job_vacancies)
    const deletedCandidatesRH = await prisma.candidateRH.deleteMany({});
    console.log(`✅ Eliminados ${deletedCandidatesRH.count} candidatos RH`);
    
    // Eliminar candidatos (dependen de job_vacancies)
    const deletedCandidates = await prisma.candidate.deleteMany({});
    console.log(`✅ Eliminados ${deletedCandidates.count} candidatos`);
    
    // Finalmente eliminar vacantes
    const deletedVacancies = await prisma.jobVacancy.deleteMany({});
    console.log(`✅ Eliminadas ${deletedVacancies.count} vacantes`);
    
    // 3. Restablecer secuencias/auto-incrementos (solo para PostgreSQL)
    console.log('🔄 Restableciendo secuencias...');
    
    try {
      // Restablecer secuencia de folio en purchase_requests
      await prisma.$executeRaw`ALTER SEQUENCE "purchase_requests_folio_seq" RESTART WITH 1;`;
      console.log('✅ Secuencia de folio restablecida a 1');
    } catch (seqError) {
      console.log('⚠ No se pudo restablecer secuencia (puede ser normal si no existe)');
    }
    
    console.log('🎉 ¡Limpieza completada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Solicitudes de compra eliminadas: ${deletedRequests.count}`);
    console.log(`   - Ítems de compra eliminados: ${deletedItems.count}`);
    console.log(`   - Cotizaciones eliminadas: ${deletedQuotes.count}`);
    console.log(`   - Vacantes eliminadas: ${deletedVacancies.count}`);
    console.log(`   - Candidatos eliminados: ${deletedCandidates.count}`);
    console.log(`   - Candidatos RH eliminados: ${deletedCandidatesRH.count}`);
    console.log(`   - Actividades eliminadas: ${deletedActivities.count}`);
    console.log(`   - Comentarios eliminados: ${deletedComments.count}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
cleanDatabase()
  .then(() => {
    console.log('✨ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });