const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVoteFunctionality() {
  try {
    console.log('=== Test de Funcionalidad de Votación ===\n');

    // 1. Obtener una vacante con candidatos
    const vacancy = await prisma.jobVacancy.findFirst({
      where: {
        estatus: 'Buscando',
        candidatesRH: {
          some: {}
        }
      },
      include: {
        solicitante: true,
        candidatesRH: {
          take: 1
        }
      }
    });

    if (!vacancy) {
      console.log('❌ No se encontró una vacante en estado "Buscando" con candidatos');
      return;
    }

    console.log('✅ Vacante encontrada:');
    console.log(`   ID: ${vacancy.id}`);
    console.log(`   Título: ${vacancy.titulo}`);
    console.log(`   Solicitante ID: ${vacancy.solicitanteId}`);
    console.log(`   Solicitante Nombre: ${vacancy.solicitante?.nombre}`);
    console.log(`   Candidatos: ${vacancy.candidatesRH.length}`);

    if (vacancy.candidatesRH.length > 0) {
      const candidate = vacancy.candidatesRH[0];
      console.log('\n✅ Candidato encontrado:');
      console.log(`   ID: ${candidate.id}`);
      console.log(`   Nombre: ${candidate.nombre}`);
      console.log(`   Estatus actual: ${candidate.estatus}`);
    }

    // 2. Verificar la relación entre usuario y empleado
    console.log('\n=== Verificación de Relaciones ===');
    
    // Buscar un usuario que sea el solicitante
    const user = await prisma.user.findFirst({
      where: {
        employee: {
          id: vacancy.solicitanteId
        }
      },
      include: {
        employee: true
      }
    });

    if (user) {
      console.log('✅ Usuario encontrado que es el solicitante:');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Employee ID: ${user.employee?.id}`);
      console.log(`   Employee Nombre: ${user.employee?.nombre}`);
    } else {
      console.log('⚠️  No se encontró un usuario asociado al empleado solicitante');
      
      // Mostrar todos los empleados para debug
      const allEmployees = await prisma.employee.findMany({
        take: 5,
        include: {
          user: true
        }
      });
      
      console.log('\nPrimeros 5 empleados:');
      allEmployees.forEach(emp => {
        console.log(`   - ${emp.nombre} (ID: ${emp.id}) - User: ${emp.user ? emp.user.name : 'No asociado'}`);
      });
    }

    // 3. Verificar la lógica de comparación
    console.log('\n=== Verificación de Lógica ===');
    console.log(`Vacancy.solicitanteId: ${vacancy.solicitanteId}`);
    console.log(`Tipo de solicitanteId: ${typeof vacancy.solicitanteId}`);
    
    if (user?.employee) {
      console.log(`Employee.id: ${user.employee.id}`);
      console.log(`Tipo de employee.id: ${typeof user.employee.id}`);
      console.log(`¿Coinciden? ${vacancy.solicitanteId === user.employee.id}`);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVoteFunctionality();